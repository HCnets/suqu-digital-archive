/**
 * 后台通用组件（从 panels.tsx 拆分）
 */
import { useEffect, useState } from 'react'
import type { Api, ArchiveDetailBlock, ArchiveEditForm, ArchivePreviewDevice, ContentVersion, DraftAutoSaveFrequency, ManagedContent, Region } from '../types'
import { asRecord, parseStringArrayJson, readBoolean, readText, readTextArray } from '../utils'
import { DraftStatusNotice, Input } from './fields'
import { OptionCardSelect, PublishPositionField, RegionBindingSelect } from './bindings'
import { ARCHIVE_DETAIL_BLOCK_OPTIONS, ARCHIVE_TYPE_OPTIONS, SENSITIVE_LEVEL_OPTIONS, SOURCE_TYPE_OPTIONS, TRUST_LEVEL_OPTIONS } from '../constants'
import { MediaPickerField } from './media'
import { JsonRowsEditor, StringArrayEditor } from './editors'
import { useDraftAutosave } from './panels-autosave'
import { archiveDetailBlockTitle, createDefaultArchiveDetailBlocks } from './panels-base'
import { SubmissionChecklistCard } from './panels-help'

export function ArchiveContentEditPanel({
  api,
  content,
  version,
  regions,
  canUploadMedia,
  draftAutoSaveFrequency,
  onUpdated,
}: {
  api: Api
  content: ManagedContent
  version: ContentVersion
  regions: Region[]
  canUploadMedia: boolean
  draftAutoSaveFrequency: DraftAutoSaveFrequency
  onUpdated: (content: ManagedContent) => Promise<void> | void
}) {
  const [form, setForm] = useState<ArchiveEditForm>(() => createArchiveEditForm(content, version))
  const [draggedType, setDraggedType] = useState<string | null>(null)
  const [previewDevice, setPreviewDevice] = useState<ArchivePreviewDevice>('pc')
  const [showTechnicalFields, setShowTechnicalFields] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitReviewBusy, setSubmitReviewBusy] = useState(false)
  const enabledBlocks = form.detailBlocks.filter(block => block.enabled)
  const reviewChecklist = [
    { label: '已填写标题', done: Boolean(form.title.trim()) },
    { label: '已附来源依据', done: Boolean(form.sourceTitle.trim() && (form.archiveRef.trim() || form.sourceUrl.trim() || form.sourceAttachmentUrl.trim())) },
    { label: '已填写摘要或正文', done: Boolean(form.summary.trim() || form.body.trim()) },
    { label: '已补充位置说明或坐标', done: Boolean(form.address.trim() || (form.longitude.trim() && form.latitude.trim())) },
  ]
  const canSubmitReview = reviewChecklist.every(item => item.done)
  const draftAutosave = useDraftAutosave({
    storageKey: `suqu-admin-content-draft-archive-edit:${content.id}`,
    enabled: true,
    value: form,
    setValue: setForm,
    frequency: draftAutoSaveFrequency,
  })

  useEffect(() => {
    setForm(createArchiveEditForm(content, version))
    setShowTechnicalFields(false)
    setError('')
    setNotice('')
  }, [content.id, version.id])

  const updateBlocks = (updater: (blocks: ArchiveDetailBlock[]) => ArchiveDetailBlock[]) => {
    setForm(current => ({
      ...current,
      detailBlocks: updater(current.detailBlocks).map((block, index) => ({ ...block, order: index + 1 })),
    }))
  }

  const updateBlock = (type: string, patch: Partial<ArchiveDetailBlock>) => {
    updateBlocks(blocks => blocks.map(block => block.type === type ? { ...block, ...patch } : block))
  }

  const moveBlock = (type: string, direction: -1 | 1) => {
    updateBlocks((blocks) => {
      const next = [...blocks]
      const index = next.findIndex(block => block.type === type)
      const target = index + direction
      if (index < 0 || target < 0 || target >= next.length) return next
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  const moveBlockTo = (sourceType: string, targetType: string) => {
    if (sourceType === targetType) return
    updateBlocks((blocks) => {
      const next = [...blocks]
      const sourceIndex = next.findIndex(block => block.type === sourceType)
      const targetIndex = next.findIndex(block => block.type === targetType)
      if (sourceIndex < 0 || targetIndex < 0) return next
      const [item] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, item)
      return next
    })
  }

  const submit = async (submitForReview = false) => {
    setError('')
    setNotice('')
    if (submitForReview) setSubmitReviewBusy(true)
    else setSaving(true)
    try {
      if (submitForReview && !canSubmitReview) throw new Error('提交审核前请先完成下方提交前检查。')
      if (submitForReview && !form.sourceTitle.trim()) throw new Error('提交审核前请先补充来源标题或采集依据。')
      if (submitForReview && !form.archiveRef.trim() && !form.sourceUrl.trim() && !form.sourceAttachmentUrl.trim()) {
        throw new Error('提交审核前请至少补充档案编号、来源链接或佐证附件之一。')
      }
      const parsedExtraData = form.dataJson.trim() ? JSON.parse(form.dataJson) : {}
      const parsedMedia = form.mediaJson.trim() ? JSON.parse(form.mediaJson) : []
      const parsedTimeline = form.archiveTimelineJson.trim() ? JSON.parse(form.archiveTimelineJson) : []
      const relatedPeople = parseStringArrayJson(form.relatedPeople)
      const relatedEvents = parseStringArrayJson(form.relatedEvents)
      const detailBlocks = form.detailBlocks.map((block, index) => ({
        type: block.type,
        title: block.title.trim(),
        order: index + 1,
        enabled: block.enabled,
      }))
      const updated = await api<ManagedContent>(`/admin/contents/${content.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          moduleKey: 'archive',
          title: form.title,
          summary: form.summary,
          body: form.body,
          category: form.archiveType,
          sensitiveLevel: form.sensitiveLevel,
          sources: form.sourceTitle ? [{
            sourceType: form.sourceType,
            sourceTitle: form.sourceTitle,
            archiveRef: form.archiveRef,
            pageRef: form.sourcePageRef,
            collector: form.sourceCollector,
            collectedAt: form.sourceCollectedAt,
            trustLevel: form.sourceTrustLevel,
            sourceUrl: form.sourceUrl || form.sourceAttachmentUrl,
            notes: [form.sourceNotes.trim(), form.sourceAttachmentUrl.trim() ? `佐证附件：${form.sourceAttachmentUrl.trim()}` : ''].filter(Boolean).join('\n'),
            attachmentMediaId: form.sourceAttachmentMediaId,
          }] : [],
          data: {
            ...parsedExtraData,
            regionId: form.regionId,
            archiveType: form.archiveType,
            type: form.archiveType,
            year: Number(form.year),
            longitude: Number(form.longitude),
            latitude: Number(form.latitude),
            address: form.address,
            historyPeriod: form.historyPeriod,
            relatedPeople,
            relatedEvents,
            publishPositions: {
              map: form.publishOnMap,
              list: form.publishInList,
              home: form.publishOnHome,
              topic: form.publishInTopic,
              guide: form.publishInGuide,
            },
            detailBlocks,
            coverImage: form.coverImage,
            media: parsedMedia,
            displayTimeline: parsedTimeline,
          },
        }),
      })
      let nextContent = updated
      if (submitForReview) {
        nextContent = await api<ManagedContent>(`/admin/contents/${content.id}/submit`, { method: 'POST' })
      }
      draftAutosave.clearDraft()
      setNotice(submitForReview ? '档案点位已保存并提交审核。' : '档案点位已保存为草稿，请重新提交审核后发布。')
      await onUpdated(nextContent)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      if (submitForReview) setSubmitReviewBusy(false)
      else setSaving(false)
    }
  }

  return (
    <section className="detail-section archive-edit-section">
      <div className="detail-section-head">
        <div>
          <h4>档案点位编辑</h4>
          <p>保存后会回到草稿状态，需要重新提交审核。</p>
          <DraftStatusNotice text={draftAutosave.statusLabel} />
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {notice && <div className="success" aria-live="polite">{notice}</div>}
      <form className="archive-edit-form" onSubmit={event => { event.preventDefault(); void submit(false) }}>
        <Input label="标题" value={form.title} onChange={title => setForm({ ...form, title })} />
        <Input label="摘要" value={form.summary} onChange={summary => setForm({ ...form, summary })} />
        <OptionCardSelect
          label="敏感等级"
          value={form.sensitiveLevel}
          options={SENSITIVE_LEVEL_OPTIONS}
          onChange={sensitiveLevel => setForm({ ...form, sensitiveLevel })}
        />
        <RegionBindingSelect
          label="所属地区"
          value={form.regionId}
          regions={regions}
          onChange={regionId => setForm({ ...form, regionId })}
          placeholder="请选择地区"
        />
        <OptionCardSelect
          label="档案类型"
          value={form.archiveType}
          options={ARCHIVE_TYPE_OPTIONS}
          onChange={archiveType => setForm({ ...form, archiveType })}
        />
        <Input label="年份" type="number" value={form.year} onChange={year => setForm({ ...form, year })} />
        <Input label="经度" type="number" value={form.longitude} onChange={longitude => setForm({ ...form, longitude })} />
        <Input label="纬度" type="number" value={form.latitude} onChange={latitude => setForm({ ...form, latitude })} />
        <Input label="地址/位置说明" value={form.address} onChange={address => setForm({ ...form, address })} />
        <Input label="历史时期" value={form.historyPeriod} onChange={historyPeriod => setForm({ ...form, historyPeriod })} />
        <MediaPickerField
          api={api}
          label="封面图片"
          value={form.coverImage}
          onChange={coverImage => setForm({ ...form, coverImage })}
          mediaTypes={['image']}
          canUseLibrary={canUploadMedia}
          pickerTitle="选择档案封面图片"
        />
        <StringArrayEditor
          title="相关人物"
          hint="维护与该点位直接相关的人物名单，按展示顺序排列。"
          value={form.relatedPeople}
          onChange={relatedPeople => setForm({ ...form, relatedPeople })}
          placeholder="例如：彭湃"
          itemLabel="人物名称"
        />
        <StringArrayEditor
          title="相关事件"
          hint="维护与该点位直接相关的关键事件，按展示顺序排列。"
          value={form.relatedEvents}
          onChange={relatedEvents => setForm({ ...form, relatedEvents })}
          placeholder="例如：农民运动讲习会旧址启用"
          itemLabel="事件名称"
        />
        <div className="archive-fields wide-field">
          <OptionCardSelect
            label="来源类型"
            value={form.sourceType}
            options={SOURCE_TYPE_OPTIONS}
            onChange={sourceType => setForm({ ...form, sourceType })}
          />
          <Input label="来源标题" value={form.sourceTitle} onChange={sourceTitle => setForm({ ...form, sourceTitle })} />
          <Input label="档案编号" value={form.archiveRef} onChange={archiveRef => setForm({ ...form, archiveRef })} />
          <Input label="页码 / 段落" value={form.sourcePageRef} onChange={sourcePageRef => setForm({ ...form, sourcePageRef })} />
          <Input label="采集人 / 整理人" value={form.sourceCollector} onChange={sourceCollector => setForm({ ...form, sourceCollector })} />
          <Input label="采集时间" type="date" value={form.sourceCollectedAt} onChange={sourceCollectedAt => setForm({ ...form, sourceCollectedAt })} />
          <OptionCardSelect
            label="可信度"
            value={form.sourceTrustLevel}
            options={TRUST_LEVEL_OPTIONS}
            onChange={sourceTrustLevel => setForm({ ...form, sourceTrustLevel })}
          />
          <Input label="来源链接" value={form.sourceUrl} onChange={sourceUrl => setForm({ ...form, sourceUrl })} />
          <MediaPickerField
            api={api}
            label="佐证附件"
            value={form.sourceAttachmentUrl}
            onChange={sourceAttachmentUrl => setForm({ ...form, sourceAttachmentUrl, sourceAttachmentMediaId: sourceAttachmentUrl ? form.sourceAttachmentMediaId : '' })}
            mediaTypes={['document', 'image', 'audio', 'video']}
            canUseLibrary={Boolean(canUploadMedia)}
            pickerTitle="选择来源佐证附件"
          />
          {!canUploadMedia && <p className="form-hint wide-field">当前账号不能上传媒体，可先填写来源链接或档案编号。</p>}
          <label className="wide-field">
            <span>来源说明</span>
            <textarea
              value={form.sourceNotes}
              placeholder="例如：第 12 页记载苏区镇交通站位置，已与口述历史交叉核对。"
              onChange={event => setForm({ ...form, sourceNotes: event.target.value })}
            />
          </label>
        </div>
        <PublishPositionField
          values={{
            map: form.publishOnMap,
            list: form.publishInList,
            home: form.publishOnHome,
            topic: form.publishInTopic,
            guide: form.publishInGuide,
          }}
          onChange={patch => setForm({
            ...form,
            publishOnMap: patch.map ?? form.publishOnMap,
            publishInList: patch.list ?? form.publishInList,
            publishOnHome: patch.home ?? form.publishOnHome,
            publishInTopic: patch.topic ?? form.publishInTopic,
            publishInGuide: patch.guide ?? form.publishInGuide,
          })}
        />
        <div className="wide-field detail-block-editor">
          <div className="detail-block-head">
            <div>
              <strong>详情页展示安排</strong>
              <small>可回填编辑当前版本板块，保存后进入草稿重新审核。</small>
            </div>
            <button type="button" className="secondary" onClick={() => setForm({ ...form, detailBlocks: createDefaultArchiveDetailBlocks() })}>恢复默认</button>
          </div>
          <div className="detail-block-layout">
            <div className="detail-block-list" aria-label="详情板块编辑排序列表">
              {form.detailBlocks.map((block, index) => (
                <article
                  key={block.type}
                  className={`detail-block-row${block.enabled ? '' : ' disabled'}${draggedType === block.type ? ' dragging' : ''}`}
                  draggable
                  onDragStart={() => setDraggedType(block.type)}
                  onDragOver={event => event.preventDefault()}
                  onDrop={() => {
                    if (draggedType) moveBlockTo(draggedType, block.type)
                    setDraggedType(null)
                  }}
                  onDragEnd={() => setDraggedType(null)}
                >
                  <div className="drag-handle" aria-hidden="true">⋮⋮</div>
                  <label className="check-row">
                    <input type="checkbox" checked={block.enabled} onChange={event => updateBlock(block.type, { enabled: event.target.checked })} />
                    <span>{index + 1}</span>
                  </label>
                  <div className="detail-block-main">
                    <span>{archiveDetailBlockTitle(block.type)}</span>
                    <input value={block.title} aria-label={`${archiveDetailBlockTitle(block.type)}板块标题`} onChange={event => updateBlock(block.type, { title: event.target.value })} />
                  </div>
                  <div className="detail-block-actions">
                    <button type="button" className="secondary" disabled={index === 0} onClick={() => moveBlock(block.type, -1)}>上移</button>
                    <button type="button" className="secondary" disabled={index === form.detailBlocks.length - 1} onClick={() => moveBlock(block.type, 1)}>下移</button>
                  </div>
                </article>
              ))}
            </div>
            <div className="detail-preview-panel">
              <div className="detail-preview-head">
                <strong>编辑预览</strong>
                <div className="device-switch" role="group" aria-label="编辑预览设备">
                  <button type="button" className={previewDevice === 'pc' ? 'active' : ''} onClick={() => setPreviewDevice('pc')}>PC</button>
                  <button type="button" className={previewDevice === 'mobile' ? 'active' : ''} onClick={() => setPreviewDevice('mobile')}>移动</button>
                  <button type="button" className={previewDevice === 'screen' ? 'active' : ''} onClick={() => setPreviewDevice('screen')}>大屏</button>
                </div>
              </div>
              <div className={`archive-detail-preview ${previewDevice}`}>
                <div className="preview-title">{form.title || '档案标题待填写'}</div>
                <div className="preview-meta">
                  <span>{form.year || '年份'}</span>
                  <span>{form.historyPeriod || '历史时期'}</span>
                  <span>{form.address || '位置说明'}</span>
                </div>
                <div className="preview-blocks">
                  {enabledBlocks.length ? enabledBlocks.map((block, index) => (
                    <section key={block.type}>
                      <span>{index + 1}</span>
                      <strong>{block.title || archiveDetailBlockTitle(block.type)}</strong>
                      <small>详情页板块</small>
                    </section>
                  )) : (
                    <p>请至少启用一个详情板块。</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <StringArrayEditor
          title="补充媒体列表"
          hint="维护档案详情页补充展示的图片、视频或音频素材，支持直接从素材库选择并调整顺序。"
          value={form.mediaJson}
          onChange={mediaJson => setForm({ ...form, mediaJson })}
          api={api}
          canUseLibrary={Boolean(canUploadMedia)}
          mediaTypes={['image', 'video', 'audio']}
          pickerTitle="选择补充媒体"
          placeholder="/uploads/example.webp"
        />
        <JsonRowsEditor
          title="展陈时间线"
          hint="维护档案详情页展示的关键时间节点，保存后会进入草稿并重新审核。"
          value={form.archiveTimelineJson}
          onChange={archiveTimelineJson => setForm({ ...form, archiveTimelineJson })}
          newItem={{ label: '', value: '' }}
          fields={[
            { key: 'label', label: '标签', placeholder: '历史年份' },
            { key: 'value', label: '内容', type: 'textarea', placeholder: '1927年，发生了什么' },
          ]}
        />
        <details className="wide-field json-raw-details" open={showTechnicalFields}>
          <summary onClick={event => { event.preventDefault(); setShowTechnicalFields(current => !current) }}>
            {showTechnicalFields ? '收起补充信息' : '显示补充信息'}
          </summary>
          <div className="advanced-raw-grid">
            <details className="wide-field json-raw-details">
              <summary>其他补充明细（仅管理员）</summary>
              <textarea value={form.dataJson} onChange={event => setForm({ ...form, dataJson: event.target.value })} />
            </details>
          </div>
        </details>
        <label className="wide-field">
          <span>正文</span>
          <textarea value={form.body} onChange={event => setForm({ ...form, body: event.target.value })} />
        </label>
        <SubmissionChecklistCard title="提交前检查" items={reviewChecklist} />
        <div className="create-form-footer">
          <button disabled={saving || submitReviewBusy}>{saving ? '保存中...' : '保存为草稿版本'}</button>
          <button type="button" disabled={saving || submitReviewBusy || !canSubmitReview} onClick={() => void submit(true)}>{submitReviewBusy ? '提交中...' : '保存并提交审核'}</button>
        </div>
      </form>
    </section>
  )
}

export function createArchiveEditForm(content: ManagedContent, version: ContentVersion): ArchiveEditForm {
  const data = asRecord(version.data)
  const publishPositions = asRecord(data.publishPositions || data.publish_positions)
  const firstSource = content.sources?.[0]
  const sourceNotes = firstSource?.notes || ''
  const sourceAttachmentMatch = sourceNotes.match(/佐证附件：([^\r\n]+)/)
  return {
    title: version.title || content.title || '',
    summary: version.summary || content.summary || '',
    body: version.body || '',
    sensitiveLevel: content.sensitiveLevel || 'normal',
    regionId: readText(data, 'regionId', 'region_id') || content.regionId || '',
    archiveType: readText(data, 'archiveType', 'archive_type', 'type') || content.category || 'revolution',
    year: readText(data, 'year'),
    longitude: readText(data, 'longitude'),
    latitude: readText(data, 'latitude'),
    address: readText(data, 'address', 'location'),
    historyPeriod: readText(data, 'historyPeriod', 'history_period'),
    coverImage: readText(data, 'coverImage', 'cover_image'),
    relatedPeople: JSON.stringify(readTextArray(data.relatedPeople || data.related_people), null, 2),
    relatedEvents: JSON.stringify(readTextArray(data.relatedEvents || data.related_events), null, 2),
    publishOnMap: readBoolean(publishPositions.map, true),
    publishInList: readBoolean(publishPositions.list, true),
    publishOnHome: readBoolean(publishPositions.home, false),
    publishInTopic: readBoolean(publishPositions.topic, false),
    publishInGuide: readBoolean(publishPositions.guide, false),
    detailBlocks: mergeArchiveDetailBlocks(data.detailBlocks || data.detail_blocks),
    mediaJson: JSON.stringify(Array.isArray(data.media) ? data.media : [], null, 2),
    archiveTimelineJson: JSON.stringify(Array.isArray(data.displayTimeline) ? data.displayTimeline : Array.isArray(data.display_timeline) ? data.display_timeline : [], null, 2),
    dataJson: JSON.stringify(extractArchiveExtraData(data), null, 2),
    sourceType: firstSource?.sourceType || '',
    sourceTitle: firstSource?.sourceTitle || '',
    archiveRef: firstSource?.archiveRef || '',
    sourcePageRef: firstSource?.pageRef || '',
    sourceCollector: firstSource?.collector || '',
    sourceCollectedAt: firstSource?.collectedAt || '',
    sourceTrustLevel: firstSource?.trustLevel || 'high',
    sourceUrl: firstSource?.sourceUrl || '',
    sourceNotes: sourceNotes.replace(/(?:^|\r?\n)佐证附件：[^\r\n]+/g, '').trim(),
    sourceAttachmentMediaId: firstSource?.attachmentMediaId || '',
    sourceAttachmentUrl: sourceAttachmentMatch?.[1]?.trim() || '',
  }
}

export function mergeArchiveDetailBlocks(value: unknown) {
  const configured = Array.isArray(value) ? value.map((entry, index) => {
    const row = asRecord(entry)
    const type = readText(row, 'type', 'key')
    const fallback = ARCHIVE_DETAIL_BLOCK_OPTIONS.find(item => item.type === type)
    if (!type || !fallback) return null
    return {
      type,
      title: readText(row, 'title') || fallback.title,
      order: Number(row.order || index + 1),
      enabled: readBoolean(row.enabled, true),
    }
  }).filter((item): item is ArchiveDetailBlock => Boolean(item)) : []
  const seen = new Set(configured.map(item => item.type))
  const missing = ARCHIVE_DETAIL_BLOCK_OPTIONS.filter(item => !seen.has(item.type)).map(item => ({ ...item, enabled: false }))
  return [...configured, ...missing].sort((a, b) => a.order - b.order).map((item, index) => ({ ...item, order: index + 1 }))
}

export function extractArchiveExtraData(data: Record<string, unknown>) {
  const excluded = new Set([
    'regionId', 'region_id', 'regionName', 'region_name',
    'archiveType', 'archive_type', 'type', 'year', 'longitude', 'latitude',
    'address', 'location', 'historyPeriod', 'history_period',
    'relatedPeople', 'related_people', 'relatedEvents', 'related_events',
    'publishPositions', 'publish_positions', 'detailBlocks', 'detail_blocks',
    'coverImage', 'cover_image', 'media', 'displayTimeline', 'display_timeline',
  ])
  return Object.fromEntries(Object.entries(data).filter(([key]) => !excluded.has(key)))
}
