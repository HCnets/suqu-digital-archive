/**
 * 统一的后台内容加载 hook：收敛各面板重复的「加载 + 取消保护 + 空态 + 加载态」样板。
 * 用法：const { items, loading } = usePublishedContents('song', 100)
 */
import { useEffect, useState } from 'react'
import { fetchPublishedContents, type PublicContentItem } from '@/lib/cmsContent'

export function usePublishedContents(moduleKey: string, pageSize = 100) {
  const [items, setItems] = useState<PublicContentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchPublishedContents(moduleKey, pageSize)
      .then(next => {
        if (!cancelled) setItems(next)
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [moduleKey, pageSize])

  return { items, loading }
}
