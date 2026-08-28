/**
 * 后台通用组件（从 App.tsx 拆分）
 */
import {  useEffect, useMemo, useState } from 'react'
import type {  MediaPickerType, MediaAsset, Api } from '../types'
import { mediaTypeLabel, mediaProcessingText, formatBytes } from '../utils'
import { Input } from './fields'

export function MediaAssetPreview({ asset }: { asset: MediaAsset }) {
  if (asset.mediaType === 'image') {
    return <img className="media-thumb" src={asset.thumbnailUrl || asset.url} alt={asset.altText || asset.originalName} />
  }
  if (asset.mediaType === 'video') {
    return <video className="media-thumb" src={asset.url} muted />
  }
  if (asset.mediaType === 'audio') {
    return <audio className="media-audio-preview" src={asset.url} controls preload="metadata" />
  }
  return (
    <a className="media-doc-preview" href={asset.url} target="_blank" rel="noreferrer">
      <strong>PDF</strong>
      <span>打开文件</span>
    </a>
  )
}

export function MediaPickerField({
  api,
  label,
  value,
  onChange,
  mediaTypes,
  canUseLibrary,
  pickerTitle,
}: {
  api: Api
  label: string
  value: string
  onChange: (value: string) => void
  mediaTypes: MediaPickerType[]
  canUseLibrary: boolean
  pickerTitle?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <label className="media-picker-field">
        <span>{label}</span>
        <div className="media-picker-input-row">
          <input value={value} onChange={event => onChange(event.target.value)} />
          <button type="button" className="secondary" disabled={!canUseLibrary} onClick={() => setOpen(true)}>
            从素材库选择
          </button>
          {value && <button type="button" className="secondary" onClick={() => onChange('')}>清空</button>}
        </div>
        {!canUseLibrary && <small className="muted-line">当前账号不能打开素材库，可先填写已有素材地址。</small>}
      </label>
      {open && (
        <MediaPickerDialog
          api={api}
          title={pickerTitle || label}
          mediaTypes={mediaTypes}
          currentValue={value}
          onSelect={(asset) => {
            onChange(asset.url)
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

export function MediaPickerDialog({
  api,
  title,
  mediaTypes,
  currentValue,
  onSelect,
  onClose,
}: {
  api: Api
  title: string
  mediaTypes: MediaPickerType[]
  currentValue: string
  onSelect: (asset: MediaAsset) => void
  onClose: () => void
}) {
  const [items, setItems] = useState<MediaAsset[]>([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setBusy(true)
      setError('')
      try {
        const search = new URLSearchParams()
        if (mediaTypes.length === 1) search.set('mediaType', mediaTypes[0])
        const payload = await api<{ items: MediaAsset[]; total: number }>(`/admin/media-assets${search.toString() ? `?${search}` : ''}`)
        if (!cancelled) {
          const filtered = payload.items.filter(item => mediaTypes.includes(item.mediaType) && !item.deletedAt)
          setItems(filtered)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '素材加载失败')
      } finally {
        if (!cancelled) setBusy(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [api, mediaTypes])

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase()
    if (!keyword) return items
    return items.filter(item => `${item.originalName} ${item.category} ${item.altText} ${item.caption} ${item.url}`.toLowerCase().includes(keyword))
  }, [items, q])

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="media-picker-dialog" role="dialog" aria-modal="true" aria-label={title} onClick={event => event.stopPropagation()}>
        <div className="media-picker-head">
          <div>
            <h3>{title}</h3>
            <p>从素材库直接选择，不再手动复制文件地址。</p>
          </div>
          <button type="button" className="secondary" onClick={onClose}>关闭</button>
        </div>
        <div className="media-picker-toolbar">
          <Input label="搜索素材" value={q} onChange={setQ} placeholder="输入文件名、分类或说明" />
        </div>
        {error && <div className="error">{error}</div>}
        {busy ? (
          <div className="media-picker-empty">正在加载素材...</div>
        ) : filtered.length ? (
          <div className="media-picker-grid">
            {filtered.map((asset) => (
              <article key={asset.id} className={`media-picker-card${currentValue === asset.url ? ' active' : ''}`}>
                <div className="media-picker-preview">
                  <MediaAssetPreview asset={asset} />
                </div>
                <div className="media-picker-body">
                  <strong>{asset.originalName}</strong>
                  <span>{asset.category || mediaTypeLabel(asset.mediaType)}</span>
                  <small>{formatBytes(asset.sizeBytes)} · {mediaProcessingText(asset)}</small>
                </div>
                <div className="media-picker-actions">
                  <a className="secondary action-link" href={asset.url} target="_blank" rel="noreferrer">预览</a>
                  <button type="button" onClick={() => onSelect(asset)}>使用这个素材</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="media-picker-empty">没有找到可用素材。</div>
        )}
      </section>
    </div>
  )
}

