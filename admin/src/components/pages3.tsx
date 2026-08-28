/**
 * 后台通用组件（从 App.tsx 拆分）
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type {  AdminUser, ManagedContent, ReviewTask, Region, Api } from '../types'
import {  REVIEW_COMMENT_TEMPLATES, REGION_LEVEL_OPTIONS, DISPLAY_MODE_OPTIONS, MAP_MODE_OPTIONS } from '../constants'
import {  contentTypeLabel, regionLevelLabel, displayModeLabel, mapModeLabel, formatTime } from '../utils'
import { buildRegionTreeRows, RegionBindingSelect, OptionCardSelect } from './bindings'
import { Input, QuickTemplateButtons, ReturnStepChoiceField } from './fields'
import { CompactReviewSignals, ContentDetailPanel } from './panels'
import { useConfirm } from './confirm'

export const emptyRegionForm = {
  parentId: '',
  level: 'town',
  name: '',
  fullName: '',
  code: '',
  description: '',
  displayMode: 'current',
  mapMode: 'single',
  sortOrder: '0',
  isDefault: false,
  isActive: true,
}

export function RegionsPage({ api }: { api: Api }) {
  const { confirm, confirmDialog } = useConfirm()
  const [regions, setRegions] = useState<Region[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [form, setForm] = useState(emptyRegionForm)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    const rows = await api<Region[]>('/admin/regions')
    setRegions(rows)
    if (selectedId && !rows.some(item => item.id === selectedId)) {
      setSelectedId('')
      setMode('create')
      setForm(emptyRegionForm)
    }
  }, [api, selectedId])

  useEffect(() => {
    load().catch(err => setError(err instanceof Error ? err.message : '加载失败'))
  }, [load])

  const defaultRegion = regions.find(item => item.isDefault)
  const treeRows = useMemo(() => buildRegionTreeRows(regions), [regions])
  const selected = regions.find(item => item.id === selectedId) || null

  const selectRegion = (region: Region) => {
    setSelectedId(region.id)
    setMode('edit')
    setNotice('')
    setError('')
    setForm({
      parentId: region.parentId || '',
      level: region.level,
      name: region.name,
      fullName: region.fullName,
      code: region.code || '',
      description: region.description || '',
      displayMode: region.displayMode,
      mapMode: region.mapMode,
      sortOrder: String(region.sortOrder || 0),
      isDefault: region.isDefault,
      isActive: region.isActive,
    })
  }

  const startCreate = (parentId = '') => {
    setSelectedId('')
    setMode('create')
    setNotice('')
    setError('')
    setForm({ ...emptyRegionForm, parentId })
  }

  const saveRegion = async (event: FormEvent) => {
    event.preventDefault()
    setBusy('save')
    setError('')
    setNotice('')
    try {
      const payload = {
        parentId: form.parentId || null,
        level: form.level,
        name: form.name,
        fullName: form.fullName,
        code: form.code,
        description: form.description,
        displayMode: form.displayMode,
        mapMode: form.mapMode,
        sortOrder: Number(form.sortOrder || 0),
        isDefault: form.isDefault,
        isActive: form.isActive,
      }
      if (mode === 'edit' && selectedId) {
        await api<Region>(`/admin/regions/${selectedId}`, { method: 'PUT', body: JSON.stringify(payload) })
        setNotice('地区信息已更新。')
      } else {
        const created = await api<Region>('/admin/regions', { method: 'POST', body: JSON.stringify(payload) })
        setSelectedId(created.id)
        setMode('edit')
        setNotice('地区已创建。')
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setBusy('')
    }
  }

  const deleteRegion = async () => {
    if (!selected) return
    if (!await confirm(`确认删除“${selected.name}”吗？此操作不可恢复。`)) return
    setBusy('delete')
    setError('')
    setNotice('')
    try {
      await api<void>(`/admin/regions/${selected.id}`, { method: 'DELETE' })
      setSelectedId('')
      setMode('create')
      setForm(emptyRegionForm)
      setNotice('地区已删除。')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    } finally {
      setBusy('')
    }
  }

  return (
    <section className="panel region-panel">
      {confirmDialog}
      <div className="panel-head">
        <div>
          <h2>地区项目</h2>
          <p>{regions.length} 个地区节点，当前默认项目：{defaultRegion?.fullName || '未设置'}</p>
        </div>
        <button onClick={() => startCreate()}>新建地区</button>
      </div>
      {error && <div className="error">{error}</div>}
      {notice && <div className="success">{notice}</div>}

      <div className="region-layout">
        <div className="region-list">
          <div className="region-summary">
            <article>
              <span>当前展示</span>
              <strong>{displayModeLabel(defaultRegion?.displayMode || 'current')}</strong>
            </article>
            <article>
              <span>地图模式</span>
              <strong>{mapModeLabel(defaultRegion?.mapMode || 'single')}</strong>
            </article>
            <article>
              <span>启用节点</span>
              <strong>{regions.filter(item => item.isActive).length}</strong>
            </article>
          </div>

          <div className="table-wrap">
            <table className="region-table">
              <thead>
                <tr>
                  <th>地区</th>
                  <th>层级</th>
                  <th>展示方式</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {treeRows.map(({ region, depth }) => (
                  <tr key={region.id} className={selectedId === region.id ? 'selected-row' : ''}>
                    <td>
                      <button className="text-button" onClick={() => selectRegion(region)} style={{ paddingLeft: depth * 18 }}>
                        {region.name}
                      </button>
                      <span className="muted-line">{region.fullName}</span>
                    </td>
                    <td>{regionLevelLabel(region.level)}</td>
                    <td>{displayModeLabel(region.displayMode)} / {mapModeLabel(region.mapMode)}</td>
                    <td>
                      <span className={region.isActive ? 'status-pill active' : 'status-pill muted'}>{region.isActive ? '启用' : '停用'}</span>
                      {region.isDefault && <span className="status-pill primary">默认</span>}
                    </td>
                    <td className="actions-cell">
                      <button className="secondary" onClick={() => selectRegion(region)}>编辑</button>
                      <button className="secondary" onClick={() => startCreate(region.id)}>添加子级</button>
                    </td>
                  </tr>
                ))}
                {!treeRows.length && (
                  <tr>
                    <td colSpan={5}>暂无地区，请先创建默认项目地区。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <form className="region-form" onSubmit={saveRegion}>
          <div className="region-form-head">
            <div>
              <h3>{mode === 'edit' ? '编辑地区' : '新建地区'}</h3>
              <p>{mode === 'edit' ? selected?.fullName || selected?.name : '创建后可作为内容、地图与大屏展示的归属地区。'}</p>
            </div>
            {mode === 'edit' && selected && !selected.isDefault && (
              <button type="button" className="secondary" onClick={deleteRegion} disabled={busy === 'delete'}>
                {busy === 'delete' ? '删除中...' : '删除'}
              </button>
            )}
          </div>

          <RegionBindingSelect
            label="上级地区"
            value={form.parentId}
            regions={regions}
            onChange={parentId => setForm({ ...form, parentId })}
            placeholder="无上级，作为顶层地区"
            excludedIds={selectedId ? [selectedId] : []}
          />

          <div className="region-form-grid">
            <OptionCardSelect
              label="地区层级"
              value={form.level}
              options={REGION_LEVEL_OPTIONS}
              onChange={level => setForm({ ...form, level })}
            />
            <Input label="地区名称" value={form.name} onChange={name => setForm({ ...form, name })} />
            <Input label="地区简称代码（选填）" value={form.code} onChange={code => setForm({ ...form, code })} placeholder="例如：suqu" />
            <Input label="排序" type="number" value={form.sortOrder} onChange={sortOrder => setForm({ ...form, sortOrder })} />
            <p className="form-hint wide-field">简称代码用于地图边界和数据归类，拿不准可以先留空，由运维人员补齐。</p>
          </div>

          <Input label="完整名称" value={form.fullName} onChange={fullName => setForm({ ...form, fullName })} />

          <div className="region-form-grid">
            <OptionCardSelect
              label="公开展示方式"
              value={form.displayMode}
              options={DISPLAY_MODE_OPTIONS}
              onChange={displayMode => setForm({ ...form, displayMode })}
            />
            <OptionCardSelect
              label="地图展示方式"
              value={form.mapMode}
              options={MAP_MODE_OPTIONS}
              onChange={mapMode => setForm({ ...form, mapMode })}
            />
          </div>

          <label>
            <span>说明</span>
            <textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} />
          </label>

          <div className="region-checks">
            <label className="check-row">
              <input type="checkbox" checked={form.isActive} onChange={event => setForm({ ...form, isActive: event.target.checked })} />
              <span>启用该地区</span>
            </label>
            <label className="check-row">
              <input type="checkbox" checked={form.isDefault} onChange={event => setForm({ ...form, isDefault: event.target.checked })} />
              <span>设为默认项目</span>
            </label>
          </div>

          <button type="submit" disabled={busy === 'save'}>{busy === 'save' ? '保存中...' : mode === 'edit' ? '保存地区' : '创建地区'}</button>
        </form>
      </div>
    </section>
  )
}

export function ReviewsPage({ api, currentUser }: { api: Api; currentUser: AdminUser }) {
  const [tasks, setTasks] = useState<ReviewTask[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [archiveOptions, setArchiveOptions] = useState<ManagedContent[]>([])
  const [selected, setSelected] = useState<ManagedContent | null>(null)
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({})
  const [returnStepIds, setReturnStepIds] = useState<Record<string, string>>({})
  const [exportFile, setExportFile] = useState<{ url: string; name: string } | null>(null)
  const [exportText, setExportText] = useState('')
  const [detailLoading, setDetailLoading] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const canUploadMedia = currentUser.permissions?.includes('media.manage')
  const canEditContent = currentUser.permissions?.includes('content.edit')

  const load = useCallback(async () => {
    const [rows, regionRows, archivePayload] = await Promise.all([
      api<ReviewTask[]>('/admin/review-tasks'),
      canEditContent ? api<Region[]>('/admin/region-options') : Promise.resolve([]),
      canEditContent ? api<{ items: ManagedContent[] }>('/admin/contents?moduleKey=archive&pageSize=100') : Promise.resolve({ items: [] }),
    ])
    setTasks(rows)
    setRegions(regionRows)
    setArchiveOptions(archivePayload.items.filter(item => item.status !== 'deleted'))
  }, [api, canEditContent])

  useEffect(() => {
    load().catch(err => setError(err instanceof Error ? err.message : '加载失败'))
  }, [load])

  useEffect(() => {
    return () => {
      if (exportFile) URL.revokeObjectURL(exportFile.url)
    }
  }, [exportFile])

  const setReviewComment = (contentId: string, comment: string) => {
    setReviewComments(current => ({ ...current, [contentId]: comment }))
  }

  const review = async (contentId: string, decision: 'approve' | 'reject') => {
    const comment = (reviewComments[contentId] || '').trim()
    const returnStepId = returnStepIds[contentId] || ''
    setError('')
    setNotice('')
    if (decision === 'reject' && !comment) {
      setError('驳回前必须填写审核意见。')
      return
    }
    setBusy(`${decision}:${contentId}`)
    try {
      await api<ManagedContent>(`/admin/contents/${contentId}/review`, {
        method: 'POST',
        body: JSON.stringify({ decision, comment, returnStepId }),
      })
      setReviewComments(current => {
        const next = { ...current }
        delete next[contentId]
        return next
      })
      setReturnStepIds(current => {
        const next = { ...current }
        delete next[contentId]
        return next
      })
      setSelected(null)
      await load()
      setNotice(decision === 'approve' ? '审核通过，已进入下一节点或发布。' : '已驳回并记录原因。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '审核失败')
    } finally {
      setBusy('')
    }
  }

  const exportReviewRecords = async () => {
    setError('')
    setNotice('')
    setBusy('export')
    try {
      const payload = await api<Record<string, unknown>>('/admin/review-records/export')
      const text = JSON.stringify(payload, null, 2)
      const blob = new Blob([text], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const fileName = `suqu-review-records-${new Date().toISOString().slice(0, 10)}.json`
      if (exportFile) URL.revokeObjectURL(exportFile.url)
      setExportFile({ url, name: fileName })
      setExportText(text)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      setNotice('审核记录包已生成。如浏览器没有自动下载，请点击下方链接保存。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '审核记录包生成失败')
    } finally {
      setBusy('')
    }
  }

  const copyExportText = async () => {
    if (!exportText) return
    try {
      await navigator.clipboard.writeText(exportText)
      setNotice('审核记录快照已复制到剪贴板。')
    } catch {
      setNotice('浏览器不允许直接复制，请展开下方审核记录预览后手动复制。')
    }
  }

  const showDetail = async (contentId: string) => {
    setError('')
    setDetailLoading(contentId)
    try {
      const detail = await api<ManagedContent>(`/admin/contents/${contentId}`)
      setSelected(detail)
    } catch (err) {
      setError(err instanceof Error ? err.message : '详情加载失败')
    } finally {
      setDetailLoading('')
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>待审核任务</h2>
          <p>当前共有 {tasks.length} 条待处理任务</p>
        </div>
        <button className="secondary" onClick={exportReviewRecords} disabled={busy === 'export'}>
          {busy === 'export' ? '生成中...' : '生成审核记录包'}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {notice && <div className="success">{notice}</div>}
      {exportFile && (
        <div className="export-fallback">
          <a className="download-link" href={exportFile.url} download={exportFile.name}>
            下载审核记录：{exportFile.name}
          </a>
          <button type="button" className="secondary" onClick={copyExportText}>复制审核记录快照</button>
          <details>
            <summary>查看审核记录预览（仅管理员）</summary>
            <textarea readOnly value={exportText} />
          </details>
        </div>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>内容</th>
              <th>内容类型</th>
              <th>节点</th>
              <th>角色</th>
              <th>风险信号</th>
              <th>审核意见</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(item => (
              <tr key={item.id}>
                <td>{item.contentTitle}</td>
                <td>{contentTypeLabel(item.moduleKey)}</td>
                <td>{item.stepName}</td>
                <td>{item.assigneeRoleName || '-'}</td>
                <td><CompactReviewSignals signals={item.reviewSignals} /></td>
                <td>
                  <div className="review-comment-box">
                    <QuickTemplateButtons
                      label="常用意见模板"
                      templates={REVIEW_COMMENT_TEMPLATES}
                      onPick={template => setReviewComment(item.contentId, template)}
                    />
                    <textarea
                      value={reviewComments[item.contentId] || ''}
                      placeholder="通过可选填，驳回必须填写原因。"
                      onChange={event => setReviewComment(item.contentId, event.target.value)}
                    />
                    <ReturnStepChoiceField
                      value={returnStepIds[item.contentId] || ''}
                      steps={item.returnSteps || []}
                      onChange={nextValue => setReturnStepIds(current => ({ ...current, [item.contentId]: nextValue }))}
                    />
                  </div>
                </td>
                <td>{formatTime(item.createdAt)}</td>
                <td className="actions-cell">
                  <button className="secondary" onClick={() => showDetail(item.contentId)}>
                    {detailLoading === item.contentId ? '加载中...' : '详情'}
                  </button>
                  <button className="secondary" disabled={busy === `approve:${item.contentId}`} onClick={() => review(item.contentId, 'approve')}>通过</button>
                  <button className="secondary" disabled={busy === `reject:${item.contentId}`} onClick={() => review(item.contentId, 'reject')}>驳回</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <ContentDetailPanel
          api={api}
          content={selected}
          regions={regions}
          archiveOptions={archiveOptions}
          canUploadMedia={Boolean(canUploadMedia)}
          canEditContent={Boolean(canEditContent)}
          onClose={() => setSelected(null)}
          onUpdated={async updated => {
            setSelected(updated)
            await load()
          }}
        />
      )}
    </section>
  )
}

