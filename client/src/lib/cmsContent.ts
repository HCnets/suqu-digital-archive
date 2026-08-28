export type PublicContentItem = {
  id?: string
  title: string
  summary?: string
  body?: string
  category?: string
  data?: Record<string, unknown>
}

type PublicContentList = {
  items?: PublicContentItem[]
}

import { API_BASE } from './env'

// 内容缓存：后台发布频率低，短 TTL 缓存 + 并发请求去重，显著减少重复请求
const CACHE_TTL = 30_000
const contentCache = new Map<string, { items: PublicContentItem[]; at: number }>()
const inflight = new Map<string, Promise<PublicContentItem[]>>()

export async function fetchPublishedContents(moduleKey: string, pageSize = 100) {
  const key = `${moduleKey}:${pageSize}`
  const cached = contentCache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.items
  const pending = inflight.get(key)
  if (pending) return pending
  const promise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/contents?moduleKey=${encodeURIComponent(moduleKey)}&pageSize=${pageSize}`)
      if (!response.ok) return []
      const payload = await response.json() as PublicContentList
      const items = Array.isArray(payload.items) ? payload.items : []
      contentCache.set(key, { items, at: Date.now() })
      return items
    } catch {
      return []
    } finally {
      inflight.delete(key)
    }
  })()
  inflight.set(key, promise)
  return promise
}

/** 后台发布/更新内容后调用以立即刷新缓存（不传 moduleKey 则清空全部） */
export function invalidatePublishedContents(moduleKey?: string) {
  if (moduleKey) {
    for (const key of contentCache.keys()) {
      if (key.startsWith(`${moduleKey}:`)) contentCache.delete(key)
    }
  } else {
    contentCache.clear()
  }
}

export function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map(item => asText(item)).filter(Boolean)
}

export function asRecordArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
}
