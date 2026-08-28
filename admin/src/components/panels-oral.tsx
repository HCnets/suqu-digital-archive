/**
 * 后台通用组件（从 panels.tsx 拆分）
 */
import { useEffect, useState } from 'react'
import type { Api, ContentVersion, DraftAutoSaveFrequency, ManagedContent, OralHistoryEditForm, OralHistoryFormSetter, Region } from '../types'
import { DraftStatusNotice, Input } from './fields'
import { ArchiveBindingSelect, OptionCardSelect, RegionBindingSelect } from './bindings'
import { AI_SUMMARY_STATUS_OPTIONS, AUTHORIZATION_STATUS_OPTIONS, SENSITIVE_LEVEL_OPTIONS, SOURCE_TYPE_OPTIONS, TRANSCRIPT_REVIEW_STATUS_OPTIONS, TRUST_LEVEL_OPTIONS } from '../constants'
import { MediaPickerField } from './media'
import { aiSummaryStatusLabel, asRecord, authorizationStatusLabel, countChineseText, formatDuration, formatReadableTimeValue, readText, readTextArray, transcriptStatusLabel, transcriptionSourceLabel } from '../utils'
import { SensitiveSegmentsEditor } from './editors'
import { oralAssetCaption, oralAssetCategory, uploadMediaAsset, useDraftAutosave } from './panels-autosave'
import { SubmissionChecklistCard } from './panels-help'

export function OralHistoryContentEditPanel({
  api,
  content,
  version,
  regions,
  archiveOptions,
  canUploadMedia,
  draftAutoSaveFrequency,
  onUpdated,
}: {
  api: Api
  content: ManagedContent
  version: ContentVersion
  regions: Region[]
  archiveOptions: ManagedContent[]
  canUploadMedia: boolean
  draftAutoSaveFrequency: DraftAutoSaveFrequency
  onUpdated: (content: ManagedContent) => Promise<void> | void
}) {
  const [form, setForm] = useState<OralHistoryEditForm>(() => createOralHistoryEditForm(content, version))
  const [showTechnicalFields, setShowTechnicalFields] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadBusy, setUploadBusy] = useState('')
  const [submitReviewBusy, setSubmitReviewBusy] = useState(false)
  const reviewChecklist = [
    { label: '已填写标题', done: Boolean(form.title.trim()) },
    { label: '已附来源依据', done: Boolean(form.sourceTitle.trim() && (form.archiveRef.trim() || form.sourceUrl.trim() || form.sourceAttachmentUrl.trim())) },
    { label: '已填写讲述人', done: Boolean(form.narrator.trim()) },
    { label: '已填写公开稿或正文', done: Boolean(form.publicTranscript.trim() || form.rawTranscript.trim()) },
    { label: '已补充授权状态或文件', done: Boolean(form.authorizationStatus || form.authorizationFile.trim()) },
  ]
  const canSubmitReview = reviewChecklist.every(item => item.done)
  const draftAutosave = useDraftAutosave({
    storageKey: `suqu-admin-content-draft-oral-edit:${content.id}`,
    enabled: true,
    value: form,
    setValue: setForm,
    frequency: draftAutoSaveFrequency,
  })

  useEffect(() => {
    setForm(createOralHistoryEditForm(content, version))
    setShowTechnicalFields(false)
    setError('')
    setNotice('')
  }, [content.id, version.id])

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
      const sensitiveSegments = form.sensitiveSegments.split(/\r?\n/).map(item => item.trim()).filter(Boolean)
      const updated = await api<ManagedContent>(`/admin/contents/${content.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          moduleKey: 'oral_history',
          title: form.title,
          summary: form.summary,
          body: form.publicTranscript,
          category: form.emotion,
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
            narrator: form.narrator,
            age: form.age ? Number(form.age) : '',
            identity: form.identity,
            collectionLocation: form.collectionLocation,
            interviewer: form.interviewer,
            date: form.date,
            emotion: form.emotion,
            audioUrl: form.audioUrl,
            videoUrl: form.videoUrl,
            relatedArchiveId: form.relatedArchiveId,
            authorizationStatus: form.authorizationStatus,
            authorizationFile: form.authorizationFile,
            authorizationScope: form.authorizationScope,
            authorizationExpiresAt: form.authorizationExpiresAt,
            authorizationNote: form.authorizationNote,
            transcriptReviewStatus: form.transcriptReviewStatus,
            aiSummaryStatus: form.aiSummaryStatus,
            aiTranscriptionTaskId: form.aiTranscriptionTaskId,
            aiTranscriptionAppliedAt: form.aiTranscriptionAppliedAt,
            aiTranscriptionProviderName: form.aiTranscriptionProviderName,
            transcriptionSource: form.transcriptionSource,
            transcriptionSourceMediaUrl: form.transcriptionSourceMediaUrl,
            transcriptionFileUrl: form.transcriptionFileUrl,
            transcriptionLanguage: form.transcriptionLanguage,
            transcriptionDurationSeconds: form.transcriptionDurationSeconds ? Number(form.transcriptionDurationSeconds) : '',
            rawTranscript: form.rawTranscript,
            publicTranscript: form.publicTranscript,
            aiSummary: form.aiSummary,
            sensitiveSegments,
            transcript: form.publicTranscript,
          },
        }),
      })
      let nextContent = updated
      if (submitForReview) {
        nextContent = await api<ManagedContent>(`/admin/contents/${content.id}/submit`, { method: 'POST' })
      }
      draftAutosave.clearDraft()
      setNotice(submitForReview ? '口述历史已保存并提交审核。' : '口述历史已保存为草稿，请重新提交审核后发布。')
      await onUpdated(nextContent)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      if (submitForReview) setSubmitReviewBusy(false)
      else setSaving(false)
    }
  }

  const uploadAsset = async (file: File | null, target: 'audio' | 'video' | 'authorization') => {
    if (!file) return
    setError('')
    setUploadBusy(target)
    try {
      const asset = await uploadMediaAsset(api, file, oralAssetCategory(target), oralAssetCaption(target))
      if (target === 'audio') setForm(current => ({ ...current, audioUrl: asset.url }))
      if (target === 'video') setForm(current => ({ ...current, videoUrl: asset.url }))
      if (target === 'authorization') setForm(current => ({ ...current, authorizationFile: asset.url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploadBusy('')
    }
  }

  return (
    <section className="detail-section archive-edit-section">
      <div className="detail-section-head">
        <div>
          <h4>口述历史编辑</h4>
          <p>维护采访素材、可公开版本、授权与敏感片段；保存后需要重新审核。</p>
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
        <Input label="讲述人" value={form.narrator} onChange={narrator => setForm({ ...form, narrator })} />
        <Input label="年龄" type="number" value={form.age} onChange={age => setForm({ ...form, age })} />
        <Input label="身份说明" value={form.identity} onChange={identity => setForm({ ...form, identity })} />
        <Input label="采集地点" value={form.collectionLocation} onChange={collectionLocation => setForm({ ...form, collectionLocation })} />
        <Input label="采访人" value={form.interviewer} onChange={interviewer => setForm({ ...form, interviewer })} />
        <Input label="采集时间" value={form.date} onChange={date => setForm({ ...form, date })} />
        <Input label="情感标签" value={form.emotion} onChange={emotion => setForm({ ...form, emotion })} />
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
          <Input label="来源采集时间" type="date" value={form.sourceCollectedAt} onChange={sourceCollectedAt => setForm({ ...form, sourceCollectedAt })} />
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
              placeholder="例如：采访录音与授权书已交叉核对，相关描述已由项目组复核。"
              onChange={event => setForm({ ...form, sourceNotes: event.target.value })}
            />
          </label>
        </div>
        <MediaPickerField
          api={api}
          label="音频素材"
          value={form.audioUrl}
          onChange={audioUrl => setForm({ ...form, audioUrl })}
          mediaTypes={['audio']}
          canUseLibrary={canUploadMedia}
          pickerTitle="选择口述历史音频"
        />
        <label>
          <span>上传音频</span>
          <input
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/mp4,audio/m4a,audio/x-m4a,audio/aac,audio/webm"
            disabled={!canUploadMedia || uploadBusy === 'audio'}
            onChange={event => {
              const selectedFile = event.target.files?.[0] || null
              void uploadAsset(selectedFile, 'audio')
              event.currentTarget.value = ''
            }}
          />
        </label>
        <MediaPickerField
          api={api}
          label="视频素材"
          value={form.videoUrl}
          onChange={videoUrl => setForm({ ...form, videoUrl })}
          mediaTypes={['video']}
          canUseLibrary={canUploadMedia}
          pickerTitle="选择口述历史视频"
        />
        <label>
          <span>上传视频</span>
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            disabled={!canUploadMedia || uploadBusy === 'video'}
            onChange={event => {
              const selectedFile = event.target.files?.[0] || null
              void uploadAsset(selectedFile, 'video')
              event.currentTarget.value = ''
            }}
          />
        </label>
        <ArchiveBindingSelect
          label="关联档案点位"
          value={form.relatedArchiveId}
          options={archiveOptions}
          onChange={relatedArchiveId => setForm({ ...form, relatedArchiveId })}
          placeholder="暂不关联"
        />
        <OptionCardSelect
          label="授权状态"
          value={form.authorizationStatus}
          options={AUTHORIZATION_STATUS_OPTIONS}
          onChange={authorizationStatus => setForm({ ...form, authorizationStatus })}
        />
        <MediaPickerField
          api={api}
          label="授权文件"
          value={form.authorizationFile}
          onChange={authorizationFile => setForm({ ...form, authorizationFile })}
          mediaTypes={['document', 'image']}
          canUseLibrary={canUploadMedia}
          pickerTitle="选择授权文件"
        />
        <label>
          <span>上传授权扫描件</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            disabled={!canUploadMedia || uploadBusy === 'authorization'}
            onChange={event => {
              const selectedFile = event.target.files?.[0] || null
              void uploadAsset(selectedFile, 'authorization')
              event.currentTarget.value = ''
            }}
          />
        </label>
        {!canUploadMedia && <p className="form-hint wide-field">当前账号不能上传媒体，可先填写已有素材地址。</p>}
        <OralHistoryMaterialWorkbench
          form={form}
          setForm={setForm}
          canUploadMedia={canUploadMedia}
          uploadBusy={uploadBusy}
          uploadAsset={uploadAsset}
        />
        <details className="wide-field json-raw-details" open={showTechnicalFields}>
          <summary onClick={event => { event.preventDefault(); setShowTechnicalFields(current => !current) }}>
            {showTechnicalFields ? '收起补充信息' : '显示补充信息'}
          </summary>
          <div className="advanced-raw-grid">
            <label className="wide-field">
              <span>其他补充明细（仅管理员）</span>
              <textarea value={form.dataJson} onChange={event => setForm({ ...form, dataJson: event.target.value })} />
            </label>
          </div>
        </details>
        <SubmissionChecklistCard title="提交前检查" items={reviewChecklist} />
        <div className="create-form-footer">
          <button disabled={saving || submitReviewBusy}>{saving ? '保存中...' : '保存为草稿版本'}</button>
          <button type="button" disabled={saving || submitReviewBusy || !canSubmitReview} onClick={() => void submit(true)}>{submitReviewBusy ? '提交中...' : '保存并提交审核'}</button>
        </div>
      </form>
    </section>
  )
}

export function OralHistoryMaterialWorkbench({
  form,
  setForm,
  canUploadMedia,
  uploadBusy,
  uploadAsset,
}: {
  form: OralHistoryEditForm
  setForm: OralHistoryFormSetter
  canUploadMedia: boolean
  uploadBusy: string
  uploadAsset: (file: File | null, target: 'audio' | 'video' | 'authorization') => Promise<void>
}) {
  const sensitiveRows = form.sensitiveSegments.split(/\r?\n/).map(item => item.trim()).filter(Boolean)
  const rawCount = countChineseText(form.rawTranscript)
  const publicCount = countChineseText(form.publicTranscript)
  const mediaItems = [
    { label: '音频', value: form.audioUrl, type: 'audio' },
    { label: '视频', value: form.videoUrl, type: 'video' },
    { label: '授权文件', value: form.authorizationFile, type: 'file' },
  ]
  const update = (patch: Partial<OralHistoryEditForm>) => setForm(current => ({ ...current, ...patch }))
  const appendSensitiveTemplate = () => {
    const line = '[00:00-00:00][待分级] 片段摘要 -> 处理意见'
    update({ sensitiveSegments: [form.sensitiveSegments.trim(), line].filter(Boolean).join('\n') })
  }

  return (
    <section className="wide-field oral-workbench">
      <div className="oral-workbench-head">
        <div>
          <h5>口述历史素材工作台</h5>
          <p>{rawCount} 字完整转写 · {publicCount} 字公开版本 · {sensitiveRows.length} 条敏感片段</p>
        </div>
        <div className="status-strip">
          <span>{authorizationStatusLabel(form.authorizationStatus)}</span>
          <span>{transcriptStatusLabel(form.transcriptReviewStatus)}</span>
          <span>{aiSummaryStatusLabel(form.aiSummaryStatus)}</span>
        </div>
      </div>
      {(form.aiTranscriptionTaskId || form.transcriptionSourceMediaUrl || form.transcriptionFileUrl) && (
        <div className="oral-transcription-source">
          <strong>最近 AI 转写</strong>
          <span>任务：{form.aiTranscriptionTaskId || '-'}</span>
          <span>来源：{transcriptionSourceLabel(form.transcriptionSource)}</span>
          <span>供应商：{form.aiTranscriptionProviderName || '-'}</span>
          <span>时间：{formatReadableTimeValue(form.aiTranscriptionAppliedAt) || '-'}</span>
          {form.transcriptionLanguage && <span>语言：{form.transcriptionLanguage}</span>}
          {form.transcriptionDurationSeconds && <span>时长：{formatDuration(Number(form.transcriptionDurationSeconds))}</span>}
          {form.transcriptionSourceMediaUrl && <a href={form.transcriptionSourceMediaUrl} target="_blank" rel="noreferrer">查看源音视频</a>}
          {form.transcriptionFileUrl && <a href={form.transcriptionFileUrl} target="_blank" rel="noreferrer">查看转写文件</a>}
        </div>
      )}

      <div className="oral-workbench-grid">
        <section className="oral-tool-card">
          <h6>素材</h6>
          <div className="oral-media-list">
            {mediaItems.map(item => (
              <article key={item.label}>
                <strong>{item.label}</strong>
                {item.value ? <a href={item.value} target="_blank" rel="noreferrer">{item.value}</a> : <span>未上传</span>}
              </article>
            ))}
          </div>
          <div className="oral-upload-row">
            <label>
              <span>补充音频</span>
              <input
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/mp4,audio/m4a,audio/x-m4a,audio/aac,audio/webm"
                disabled={!canUploadMedia || uploadBusy === 'audio'}
                onChange={event => {
                  const selectedFile = event.target.files?.[0] || null
                  void uploadAsset(selectedFile, 'audio')
                  event.currentTarget.value = ''
                }}
              />
            </label>
            <label>
              <span>补充授权</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                disabled={!canUploadMedia || uploadBusy === 'authorization'}
                onChange={event => {
                  const selectedFile = event.target.files?.[0] || null
                  void uploadAsset(selectedFile, 'authorization')
                  event.currentTarget.value = ''
                }}
              />
            </label>
          </div>
        </section>

        <section className="oral-tool-card">
          <h6>授权</h6>
          <label>
            <span>授权范围</span>
            <textarea value={form.authorizationScope} onChange={event => update({ authorizationScope: event.target.value })} />
          </label>
          <Input label="授权有效期" value={form.authorizationExpiresAt} onChange={authorizationExpiresAt => update({ authorizationExpiresAt })} />
          <label>
            <span>限制/撤回说明</span>
            <textarea value={form.authorizationNote} onChange={event => update({ authorizationNote: event.target.value })} />
          </label>
        </section>

        <section className="oral-tool-card">
          <h6>审校状态</h6>
          <OptionCardSelect
            label="转写审校"
            value={form.transcriptReviewStatus}
            options={TRANSCRIPT_REVIEW_STATUS_OPTIONS}
            onChange={transcriptReviewStatus => update({ transcriptReviewStatus })}
          />
          <OptionCardSelect
            label="AI 摘要状态"
            value={form.aiSummaryStatus}
            options={AI_SUMMARY_STATUS_OPTIONS}
            onChange={aiSummaryStatus => update({ aiSummaryStatus })}
          />
          <button type="button" className="secondary" disabled={!form.rawTranscript.trim()} onClick={() => update({ publicTranscript: form.rawTranscript })}>用完整转写填充公开版</button>
          <button type="button" className="secondary" onClick={appendSensitiveTemplate}>新增敏感片段</button>
        </section>
      </div>

      <div className="oral-transcript-grid">
        <label>
          <span>采访完整转写</span>
          <textarea value={form.rawTranscript} onChange={event => update({ rawTranscript: event.target.value })} />
        </label>
        <label>
          <span>可公开版本</span>
          <textarea value={form.publicTranscript} onChange={event => update({ publicTranscript: event.target.value })} />
        </label>
      </div>

      <div className="oral-transcript-grid compact">
        <label>
          <span>AI 摘要</span>
          <textarea value={form.aiSummary} onChange={event => update({ aiSummary: event.target.value })} />
        </label>
      </div>
      <SensitiveSegmentsEditor
        title="敏感片段时间轴"
        hint="拆分时间、风险等级、片段摘要与公开处理方式；保存时会同步旧版文本。"
        value={form.sensitiveSegments}
        onChange={sensitiveSegments => update({ sensitiveSegments })}
      />
    </section>
  )
}

export function createOralHistoryEditForm(content: ManagedContent, version: ContentVersion): OralHistoryEditForm {
  const data = asRecord(version.data)
  const firstSource = content.sources?.[0]
  const sourceNotes = firstSource?.notes || ''
  const sourceAttachmentMatch = sourceNotes.match(/佐证附件：([^\r\n]+)/)
  return {
    title: version.title || content.title || '',
    summary: version.summary || content.summary || '',
    sensitiveLevel: content.sensitiveLevel || 'normal',
    regionId: readText(data, 'regionId', 'region_id') || content.regionId || '',
    narrator: readText(data, 'narrator', 'name'),
    age: readText(data, 'age'),
    identity: readText(data, 'identity', 'role'),
    collectionLocation: readText(data, 'collectionLocation', 'collection_location', 'location'),
    interviewer: readText(data, 'interviewer', 'collector'),
    date: readText(data, 'date', 'recordedAt', 'recorded_at'),
    emotion: readText(data, 'emotion') || content.category || '',
    audioUrl: readText(data, 'audioUrl', 'audio_url'),
    videoUrl: readText(data, 'videoUrl', 'video_url'),
    relatedArchiveId: readText(data, 'relatedArchiveId', 'related_archive_id', 'archiveId', 'archive_id'),
    authorizationStatus: readText(data, 'authorizationStatus', 'authorization_status') || 'pending',
    authorizationFile: readText(data, 'authorizationFile', 'authorization_file', 'consentFile', 'consent_file'),
    authorizationScope: readText(data, 'authorizationScope', 'authorization_scope'),
    authorizationExpiresAt: readText(data, 'authorizationExpiresAt', 'authorization_expires_at'),
    authorizationNote: readText(data, 'authorizationNote', 'authorization_note', 'revocationReason', 'revocation_reason'),
    transcriptReviewStatus: readText(data, 'transcriptReviewStatus', 'transcript_review_status') || 'raw_imported',
    aiSummaryStatus: readText(data, 'aiSummaryStatus', 'ai_summary_status') || (readText(data, 'aiSummary', 'ai_summary') ? 'manual_imported' : 'none'),
    aiTranscriptionTaskId: readText(data, 'aiTranscriptionTaskId', 'ai_transcription_task_id'),
    aiTranscriptionAppliedAt: readText(data, 'aiTranscriptionAppliedAt', 'ai_transcription_applied_at'),
    aiTranscriptionProviderName: readText(data, 'aiTranscriptionProviderName', 'ai_transcription_provider_name'),
    transcriptionSource: readText(data, 'transcriptionSource', 'transcription_source'),
    transcriptionSourceMediaUrl: readText(data, 'transcriptionSourceMediaUrl', 'transcription_source_media_url'),
    transcriptionFileUrl: readText(data, 'transcriptionFileUrl', 'transcription_file_url'),
    transcriptionLanguage: readText(data, 'transcriptionLanguage', 'transcription_language'),
    transcriptionDurationSeconds: readText(data, 'transcriptionDurationSeconds', 'transcription_duration_seconds'),
    rawTranscript: readText(data, 'rawTranscript', 'raw_transcript', 'originalTranscript', 'original_transcript', 'transcript', 'content') || version.body || '',
    publicTranscript: readText(data, 'publicTranscript', 'public_transcript', 'publicVersion', 'public_version', 'transcript', 'content') || version.body || '',
    aiSummary: readText(data, 'aiSummary', 'ai_summary'),
    sensitiveSegments: readTextArray(data.sensitiveSegments || data.sensitive_segments).join('\n'),
    dataJson: JSON.stringify(extractOralHistoryExtraData(data), null, 2),
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

export function extractOralHistoryExtraData(data: Record<string, unknown>) {
  const excluded = new Set([
    'regionId', 'region_id', 'regionName', 'region_name',
    'narrator', 'name', 'age', 'identity', 'role',
    'collectionLocation', 'collection_location', 'location',
    'interviewer', 'collector', 'date', 'recordedAt', 'recorded_at',
    'emotion', 'audioUrl', 'audio_url', 'videoUrl', 'video_url',
    'relatedArchiveId', 'related_archive_id', 'archiveId', 'archive_id',
    'authorizationStatus', 'authorization_status',
    'authorizationFile', 'authorization_file', 'consentFile', 'consent_file',
    'authorizationScope', 'authorization_scope',
    'authorizationExpiresAt', 'authorization_expires_at',
    'authorizationNote', 'authorization_note', 'revocationReason', 'revocation_reason',
    'transcriptReviewStatus', 'transcript_review_status',
    'aiSummaryStatus', 'ai_summary_status',
    'aiTranscriptionTaskId', 'ai_transcription_task_id',
    'aiTranscriptionTaskType', 'ai_transcription_task_type',
    'aiTranscriptionAppliedAt', 'ai_transcription_applied_at',
    'aiTranscriptionProviderId', 'ai_transcription_provider_id',
    'aiTranscriptionProviderName', 'ai_transcription_provider_name',
    'aiTranscriptionResultJson', 'ai_transcription_result_json',
    'transcriptionSource', 'transcription_source',
    'transcriptionSegments', 'transcription_segments',
    'transcriptionLanguage', 'transcription_language',
    'transcriptionDurationSeconds', 'transcription_duration_seconds',
    'transcriptionSourceMediaUrl', 'transcription_source_media_url',
    'transcriptionFileUrl', 'transcription_file_url',
    'rawTranscript', 'raw_transcript', 'originalTranscript', 'original_transcript',
    'publicTranscript', 'public_transcript', 'publicVersion', 'public_version',
    'transcript', 'content', 'aiSummary', 'ai_summary',
    'sensitiveSegments', 'sensitive_segments',
  ])
  return Object.fromEntries(Object.entries(data).filter(([key]) => !excluded.has(key)))
}
