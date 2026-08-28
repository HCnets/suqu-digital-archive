/**
 * 后台通用组件（从 panels.tsx 拆分）
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Api, DraftAutoSaveFrequency, DraftSaveState, MediaAsset, OralAssetTarget, StoredDraftSnapshot } from '../types'
import { formatDraftSavedAt } from '../utils'

export function readStoredEnum<T extends string>(key: string, allowed: T[], fallback: T): T {
  if (typeof window === 'undefined') return fallback
  const value = window.localStorage.getItem(key)
  return allowed.includes(value as T) ? (value as T) : fallback
}

export const DRAFT_AUTOSAVE_STORAGE_KEY = 'suqu-admin-draft-autosave-frequency'

export function useDraftAutosave<T>({
  storageKey,
  enabled,
  value,
  setValue,
  frequency,
}: {
  storageKey: string
  enabled: boolean
  value: T
  setValue: Dispatch<SetStateAction<T>>
  frequency: DraftAutoSaveFrequency
}) {
  const [status, setStatus] = useState<DraftSaveState>('idle')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const restoredRef = useRef(false)
  const mountedRef = useRef(false)
  const baselineRef = useRef('')
  const delayMs = draftAutoSaveDelay(frequency)

  useEffect(() => {
    mountedRef.current = false
    restoredRef.current = false
    setStatus('idle')
    setSavedAt(null)
    if (!enabled) return
    const snapshot = readStoredDraftSnapshot<T>(storageKey)
    if (snapshot) {
      restoredRef.current = true
      baselineRef.current = JSON.stringify(snapshot.value)
      setValue(snapshot.value)
      setSavedAt(snapshot.savedAt)
      setStatus('restored')
    } else {
      baselineRef.current = JSON.stringify(value)
    }
    mountedRef.current = true
  }, [enabled, setValue, storageKey])

  useEffect(() => {
    if (!enabled || !mountedRef.current || !delayMs) return
    if (restoredRef.current) {
      restoredRef.current = false
      return
    }
    const serialized = JSON.stringify(value)
    if (serialized === baselineRef.current) return
    setStatus('saving')
    const timer = window.setTimeout(() => {
      writeStoredDraftSnapshot(storageKey, value)
      baselineRef.current = serialized
      setSavedAt(Date.now())
      setStatus('saved')
    }, delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs, enabled, storageKey, value])

  const clearDraft = useCallback(() => {
    clearStoredDraftSnapshot(storageKey)
    restoredRef.current = false
    baselineRef.current = JSON.stringify(value)
    setSavedAt(null)
    setStatus('idle')
  }, [storageKey, value])

  return {
    clearDraft,
    statusLabel: draftStatusLabel(status, savedAt, frequency),
  }
}

export function oralAssetCategory(target: OralAssetTarget) {
  const labels: Record<OralAssetTarget, string> = {
    audio: '口述历史音频',
    video: '口述历史视频',
    authorization: '授权文件',
  }
  return labels[target]
}

export function oralAssetCaption(target: OralAssetTarget) {
  const labels: Record<OralAssetTarget, string> = {
    audio: '口述历史公开音频',
    video: '口述历史公开视频',
    authorization: '口述历史授权文件',
  }
  return labels[target]
}

export function draftAutoSaveDelay(frequency: DraftAutoSaveFrequency) {
  if (frequency === '5s') return 5000
  if (frequency === '30s') return 30000
  if (frequency === 'off') return 0
  return 15000
}

export function readStoredDraftSnapshot<T>(key: string) {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(key)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as StoredDraftSnapshot<T>
    if (!parsed || typeof parsed !== 'object' || typeof parsed.savedAt !== 'number' || !('value' in parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function writeStoredDraftSnapshot<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), value } satisfies StoredDraftSnapshot<T>))
}

export function clearStoredDraftSnapshot(key: string) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(key)
}

export function draftStatusLabel(state: DraftSaveState, savedAt: number | null, frequency: DraftAutoSaveFrequency) {
  if (frequency === 'off') return '自动保存已关闭'
  if (state === 'restored') return savedAt ? `已恢复上次草稿（${formatDraftSavedAt(savedAt)}）` : '已恢复上次草稿'
  if (state === 'saving') return '正在自动保存...'
  if (state === 'saved') return savedAt ? `已自动保存于 ${formatDraftSavedAt(savedAt)}` : '已自动保存'
  return '填写过程中会自动保存草稿'
}

export async function uploadMediaAsset(api: Api, file: File, category: string, caption: string) {
  return api<MediaAsset>('/admin/media-assets/upload', {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'X-File-Name': encodeURIComponent(file.name),
      'X-Media-Category': encodeURIComponent(category),
      'X-Alt-Text': encodeURIComponent(caption),
      'X-Caption': encodeURIComponent(caption),
      'X-Auto-Compress': 'true',
    },
    body: file,
  })
}
