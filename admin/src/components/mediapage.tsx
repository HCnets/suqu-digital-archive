/**
 * 后台通用组件（从 App.tsx 拆分）
 */
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type {  AdminUser, MediaAsset, Api } from '../types'
import {  MEDIA_TYPE_FILTER_OPTIONS, MEDIA_DELETED_FILTER_OPTIONS, MEDIA_AUTO_COMPRESS_BATCH_OPTIONS } from '../constants'
import { mediaTypeLabel, mediaProcessingText, formatTime, formatBytes, formatDuration } from '../utils'
import { Input, ChoiceChipField } from './fields'
import { MediaAssetPreview } from './media'
import { useConfirm } from './confirm'

export function MediaPage({ api, currentUser }: { api: Api; currentUser: AdminUser }) {
  const { confirm, confirmDialog } = useConfirm()
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [filter, setFilter] = useState({ q: '', mediaType: '', category: '', deleted: '' })
  const [form, setForm] = useState({ category: '', altText: '', caption: '', watermarkText: '', autoCompress: true })
  const [editingId, setEditingId] = useState('')
  const [editForm, setEditForm] = useState({ category: '', altText: '', caption: '', watermarkText: '', autoCompress: false })
  const [mediaSelectedIds, setMediaSelectedIds] = useState<string[]>([])
  const [mediaBatchForm, setMediaBatchForm] = useState({ category: '', altText: '', caption: '', watermarkText: '', autoCompress: '' })
  const canPurge = currentUser.permissions?.includes('trash.purge')
  const canBatch = currentUser.permissions?.includes('batch.manage')

  const load = useCallback(async () => {
    const search = new URLSearchParams()
    if (filter.q) search.set('q', filter.q)
    if (filter.mediaType) search.set('mediaType', filter.mediaType)
    if (filter.category) search.set('category', filter.category)
    if (filter.deleted) search.set('deleted', filter.deleted)
    const payload = await api<{ items: MediaAsset[]; total: number }>(`/admin/media-assets${search.toString() ? `?${search}` : ''}`)
    setAssets(payload.items)
    setTotal(payload.total)
    setMediaSelectedIds(prev => prev.filter(id => payload.items.some(item => item.id === id)))
  }, [api, filter])

  useEffect(() => {
    load().catch(err => setError(err instanceof Error ? err.message : '加载失败'))
  }, [load])

  const upload = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!file) {
      setError('请选择文件')
      return
    }
    setUploading(true)
    try {
      await api<MediaAsset>('/admin/media-assets/upload', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'X-File-Name': encodeURIComponent(file.name),
          'X-Media-Category': encodeURIComponent(form.category),
          'X-Alt-Text': encodeURIComponent(form.altText),
          'X-Caption': encodeURIComponent(form.caption),
          'X-Watermark-Text': encodeURIComponent(form.watermarkText),
          'X-Auto-Compress': String(form.autoCompress),
        },
        body: file,
      })
      setFile(null)
      setForm({ category: '', altText: '', caption: '', watermarkText: '', autoCompress: true })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const beginEdit = (asset: MediaAsset) => {
    setEditingId(asset.id)
    setEditForm({
      category: asset.category,
      altText: asset.altText,
      caption: asset.caption,
      watermarkText: asset.watermarkText,
      autoCompress: asset.autoCompress,
    })
  }

  const saveEdit = async (id: string) => {
    setError('')
    try {
      await api<MediaAsset>(`/admin/media-assets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      })
      setEditingId('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    }
  }

  const remove = async (id: string) => {
    setError('')
    if (!await confirm('确认删除这条媒体文件记录吗？')) return
    try {
      await api<MediaAsset>(`/admin/media-assets/${id}`, { method: 'DELETE' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }

  const restore = async (id: string) => {
    setError('')
    try {
      await api<MediaAsset>(`/admin/media-assets/${id}/restore`, { method: 'POST' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '恢复失败')
    }
  }

  const purge = async (id: string) => {
    setError('')
    if (!await confirm('确认永久删除这个媒体文件吗？此操作不可恢复。')) return
    try {
      await api<void>(`/admin/media-assets/${id}/permanent`, { method: 'DELETE' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '永久删除失败')
    }
  }


  const toggleMediaSelection = (id: string, checked: boolean) => {
    setMediaSelectedIds(prev => (checked ? Array.from(new Set([...prev, id])) : prev.filter(item => item !== id)))
  }

  const toggleAllMediaSelection = (checked: boolean) => {
    setMediaSelectedIds(checked ? assets.map(item => item.id) : [])
  }

  const applyMediaBatch = async () => {
    setError('')
    if (!mediaSelectedIds.length) {
      setError('请至少选择一个媒体文件。')
      return
    }
    const patch: Record<string, unknown> = {}
    if (mediaBatchForm.category) patch.category = mediaBatchForm.category
    if (mediaBatchForm.altText) patch.altText = mediaBatchForm.altText
    if (mediaBatchForm.caption) patch.caption = mediaBatchForm.caption
    if (mediaBatchForm.watermarkText) patch.watermarkText = mediaBatchForm.watermarkText
    if (mediaBatchForm.autoCompress) patch.autoCompress = mediaBatchForm.autoCompress === 'true'
    if (!Object.keys(patch).length) {
      setError('请至少填写一个要批量更新的字段。')
      return
    }
    try {
      await api<{ items: MediaAsset[]; total: number }>('/admin/media-assets/actions/batch', {
        method: 'PUT',
        body: JSON.stringify({ ids: mediaSelectedIds, patch }),
      })
      setMediaSelectedIds([])
      setMediaBatchForm({ category: '', altText: '', caption: '', watermarkText: '', autoCompress: '' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量更新失败')
    }
  }

  return (
    <section className="panel">
      {confirmDialog}
      <div className="panel-head">
        <div>
          <h2>媒体库</h2>
          <p>{total} 个文件</p>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      <form className="inline-form media-form" onSubmit={upload}>
        <label className="wide-field">
          <span>文件</span>
          <input
            type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/quicktime,video/webm,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/mp4,audio/m4a,audio/x-m4a,audio/aac,audio/webm,application/pdf"
            onChange={event => setFile(event.currentTarget.files?.[0] || null)}
          />
        </label>
        <Input label="分类" value={form.category} onChange={category => setForm({ ...form, category })} />
        <Input label="替代文本" value={form.altText} onChange={altText => setForm({ ...form, altText })} />
        <Input label="说明" value={form.caption} onChange={caption => setForm({ ...form, caption })} />
        <Input label="水印文字" value={form.watermarkText} onChange={watermarkText => setForm({ ...form, watermarkText })} />
        <label className="check-row">
          <input type="checkbox" checked={form.autoCompress} onChange={event => setForm({ ...form, autoCompress: event.target.checked })} />
          <span>自动压缩</span>
        </label>
        <button disabled={uploading}>{uploading ? '上传中...' : '上传'}</button>
      </form>
      <div className="inline-form media-filter">
        <Input label="搜索" value={filter.q} onChange={q => setFilter({ ...filter, q })} />
        <ChoiceChipField
          label="类型"
          value={filter.mediaType}
          options={MEDIA_TYPE_FILTER_OPTIONS}
          onChange={mediaType => setFilter({ ...filter, mediaType })}
        />
        <Input label="分类" value={filter.category} onChange={category => setFilter({ ...filter, category })} />
        <ChoiceChipField
          label="状态"
          value={filter.deleted}
          options={MEDIA_DELETED_FILTER_OPTIONS}
          onChange={deleted => setFilter({ ...filter, deleted })}
        />
      </div>
      {canBatch && (
        <form className="inline-form batch-form media-batch-form" onSubmit={event => { event.preventDefault(); void applyMediaBatch() }}>
          <label className="check-row">
            <input type="checkbox" checked={assets.length > 0 && mediaSelectedIds.length === assets.length} onChange={event => toggleAllMediaSelection(event.target.checked)} />
            <span>已选择 {mediaSelectedIds.length} 项</span>
          </label>
          <Input label="分类" value={mediaBatchForm.category} onChange={category => setMediaBatchForm({ ...mediaBatchForm, category })} />
          <Input label="替代文本" value={mediaBatchForm.altText} onChange={altText => setMediaBatchForm({ ...mediaBatchForm, altText })} />
          <Input label="说明" value={mediaBatchForm.caption} onChange={caption => setMediaBatchForm({ ...mediaBatchForm, caption })} />
          <Input label="水印" value={mediaBatchForm.watermarkText} onChange={watermarkText => setMediaBatchForm({ ...mediaBatchForm, watermarkText })} />
          <ChoiceChipField
            label="自动压缩"
            value={mediaBatchForm.autoCompress}
            options={MEDIA_AUTO_COMPRESS_BATCH_OPTIONS}
            onChange={autoCompress => setMediaBatchForm({ ...mediaBatchForm, autoCompress })}
          />
          <button type="submit" disabled={!mediaSelectedIds.length}>应用</button>
          <button type="button" className="secondary" onClick={() => { setMediaSelectedIds([]); setMediaBatchForm({ category: "", altText: "", caption: "", watermarkText: "", autoCompress: "" }) }}>清空选择</button>
        </form>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {canBatch && <th><input type="checkbox" checked={assets.length > 0 && mediaSelectedIds.length === assets.length} onChange={event => toggleAllMediaSelection(event.target.checked)} /></th>}
              <th>预览</th>
              <th>文件</th>
              <th>分类</th>
              <th>大小</th>
              <th>处理状态</th>
              <th>状态</th>
              <th>上传人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {assets.map(asset => (
              <tr key={asset.id}>
                {canBatch && <td><input type="checkbox" checked={mediaSelectedIds.includes(asset.id)} onChange={event => toggleMediaSelection(asset.id, event.target.checked)} /></td>}
                <td>
                  <MediaAssetPreview asset={asset} />
                </td>
                <td>
                  <strong>{asset.originalName}</strong>
                  <small className="muted-line">
                    {mediaTypeLabel(asset.mediaType)} · {asset.width && asset.height ? `${asset.width}x${asset.height}` : '尺寸未记录'}
                    {asset.durationSeconds ? ` · ${formatDuration(asset.durationSeconds)}` : ''}
                  </small>
                  <a className="muted-line" href={asset.url} target="_blank" rel="noreferrer">打开素材</a>
                  {editingId === asset.id && (
                    <div className="media-edit-fields">
                      <Input label="替代文本" value={editForm.altText} onChange={altText => setEditForm({ ...editForm, altText })} />
                      <Input label="说明" value={editForm.caption} onChange={caption => setEditForm({ ...editForm, caption })} />
                      <Input label="水印文字" value={editForm.watermarkText} onChange={watermarkText => setEditForm({ ...editForm, watermarkText })} />
                      <label className="check-row">
                        <input type="checkbox" checked={editForm.autoCompress} onChange={event => setEditForm({ ...editForm, autoCompress: event.target.checked })} />
                        <span>自动压缩</span>
                      </label>
                    </div>
                  )}
                </td>
                <td>
                  {editingId === asset.id
                    ? <Input label="分类" value={editForm.category} onChange={category => setEditForm({ ...editForm, category })} />
                    : (asset.category || '-')}
                </td>
                <td>{formatBytes(asset.sizeBytes)}</td>
                <td>{asset.autoCompress ? '压缩开启' : '原样保存'}<small className="muted-line">{mediaProcessingText(asset)}</small></td>
                <td>{asset.deletedAt ? `已删除 ${formatTime(asset.deletedAt)}` : '正常'}</td>
                <td>{asset.uploadedByUsername || '-'}</td>
                <td className="actions-cell">
                  {asset.deletedAt ? (
                    <>
                      <button className="secondary" type="button" onClick={() => restore(asset.id)}>恢复</button>
                      {canPurge && <button className="secondary" type="button" onClick={() => purge(asset.id)}>永久删除</button>}
                    </>
                  ) : editingId === asset.id ? (
                    <>
                      <button className="secondary" type="button" onClick={() => saveEdit(asset.id)}>保存</button>
                      <button className="secondary" type="button" onClick={() => setEditingId('')}>取消</button>
                    </>
                  ) : (
                    <>
                      <button className="secondary" type="button" onClick={() => beginEdit(asset)}>编辑</button>
                      <button className="secondary" type="button" onClick={() => remove(asset.id)}>删除</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

