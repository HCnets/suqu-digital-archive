import React, { useCallback, useEffect, useState } from 'react'
import { ChevronUp, Flower2, HeartHandshake, MessageSquareHeart, Send, Sparkles, Users, X } from 'lucide-react'
import { API_BASE, shouldUseBackend } from '@/lib/env'

interface Message {
  id: string
  name: string
  identity: string
  text: string
  createdAt: number
}

type NoticeState = {
  kind: 'success' | 'error'
  text: string
}

const asMessage = (value: unknown): Message | null => {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `msg-${Date.now()}`
  const name = typeof item.name === 'string' && item.name.trim() ? item.name.trim() : '匿名群众'
  const identity = typeof item.identity === 'string' && item.identity.trim() ? item.identity.trim() : '群众'
  const text = typeof item.text === 'string' ? item.text.trim() : ''
  const createdAt = Number(item.createdAt)

  return {
    id,
    name,
    identity,
    text,
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
  }
}

const normalizeMessagesPayload = (payload: unknown): Message[] => {
  if (Array.isArray(payload)) {
    return payload.map(asMessage).filter((item): item is Message => Boolean(item))
  }

  if (payload && typeof payload === 'object') {
    const items = (payload as { items?: unknown[] }).items
    if (Array.isArray(items)) {
      return items.map(asMessage).filter((item): item is Message => Boolean(item))
    }
  }

  return []
}

export const RightDataPanel: React.FC = () => {
  const [tributeCount, setTributeCount] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formIdentity, setFormIdentity] = useState('群众')
  const [formText, setFormText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<NoticeState | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' && window.innerWidth < 768)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!shouldUseBackend()) {
      return
    }

    let cancelled = false

    const loadRemoteData = async () => {
      try {
        const tributeResponse = await fetch(`${API_BASE}/tributes`)
        if (tributeResponse.ok) {
          const tributeData = await tributeResponse.json()
          if (!cancelled && typeof tributeData.count === 'number') {
            setTributeCount(tributeData.count)
          }
        }
      } catch {
        if (!cancelled) setTributeCount(null)
      }

      try {
        const messageResponse = await fetch(`${API_BASE}/messages`)
        if (!messageResponse.ok) throw new Error(`HTTP ${messageResponse.status}`)
        const payload = await messageResponse.json()
        if (!cancelled) {
          setMessages(normalizeMessagesPayload(payload))
        }
      } catch {
        if (!cancelled) setMessages([])
      }
    }

    void loadRemoteData()
    return () => {
      cancelled = true
    }
  }, [])

  const visibleMessages = messages

  const formatTime = (ts: number) => {
    const diff = now - ts
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return `${Math.floor(diff / 86400000)}天前`
  }

  const handleTribute = useCallback(async () => {
    if (!shouldUseBackend()) {
      setNotice({ kind: 'error', text: '当前未连接后端，暂不记录致敬计数。' })
      window.setTimeout(() => setNotice(null), 3000)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/tributes`, { method: 'POST' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      if (typeof data.count === 'number') {
        setTributeCount(data.count)
        return
      }
      throw new Error('Invalid tribute response')
    } catch {
      setNotice({ kind: 'error', text: '致敬计数暂未同步，请稍后再试。' })
      window.setTimeout(() => setNotice(null), 3000)
    }
  }, [])

  const handleSubmitMessage = useCallback(async () => {
    if (!formText.trim() || submitting) return
    setSubmitting(true)

    try {
      if (!shouldUseBackend()) {
        setNotice({ kind: 'error', text: '当前为离线兜底模式，留言仅可查看，暂不支持提交。' })
        return
      }

      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, identity: formIdentity, text: formText }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const result = await response.json()
      setNotice({
        kind: 'success',
        text: result?.pendingReview ? '留言已提交，正在等待审核。' : '留言已提交。',
      })
      setFormText('')
      setFormName('')
      setShowForm(false)
    } catch {
      setNotice({ kind: 'error', text: '留言暂未提交成功，请稍后再试。' })
    } finally {
      setSubmitting(false)
      window.setTimeout(() => setNotice(null), 3000)
    }
  }, [formName, formIdentity, formText, submitting])

  const panelContent = (
    <div className="flex h-full w-full flex-col gap-4 overflow-y-auto custom-scrollbar pr-1 pb-4 pointer-events-auto md:max-h-full">
      <div className="museum-card p-5 rounded-2xl relative overflow-hidden flex-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-party-red to-party-gold" />

        <h3 className="font-bold flex items-center gap-2 text-base mb-4 text-party-ink font-serif tracking-wider">
          <HeartHandshake size={20} className="text-party-red" />
          人民的缅怀
        </h3>

        <div className="bg-museum-bg p-4 rounded-2xl border border-museum-border flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer">
          <Sparkles className="absolute top-2 right-2 text-party-gold group-hover:text-party-gold transition-colors duration-300" size={20} />
          <div className="text-xs text-party-ink-light mb-2 font-medium">从小小红船到巍巍巨轮 · 群众云端致敬</div>
          <div className="text-4xl font-black text-party-red font-serif">
            {tributeCount === null ? '待同步' : tributeCount.toLocaleString()}
          </div>
          <div className="mt-3 text-xs text-party-ink-light flex items-center gap-1">
            <Users size={12} /> {tributeCount === null ? '后端计数暂未同步' : '来自全国各地的群众参与'}
          </div>

          <button
            onClick={handleTribute}
            className="mt-4 w-full min-h-[44px] party-btn-primary flex items-center justify-center gap-2"
            aria-label="点击参与线上致敬"
          >
            <Flower2 size={18} />
            参与线上致敬
          </button>
        </div>
      </div>

      <div className="museum-card p-5 rounded-2xl relative flex-1 flex flex-col overflow-hidden">
        <h3 className="font-bold flex items-center gap-2 text-base mb-4 text-party-ink font-serif tracking-wider">
          <MessageSquareHeart size={20} className="text-party-red" />
          学习感言 · 群众心声
        </h3>

        <div className="flex-1 overflow-hidden relative min-h-[200px]">
          <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

          <div className="absolute inset-0 overflow-y-auto custom-scrollbar pt-2 pb-8 space-y-3 pr-2">
            {visibleMessages.length > 0 ? (
              visibleMessages.map((msg) => (
                <div key={msg.id} className="bg-museum-bg p-3.5 rounded-xl border border-museum-border hover:border-party-red transition-colors duration-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-party-ink">{msg.name}</span>
                    <span className="text-[10px] text-party-ink-light">{formatTime(msg.createdAt)}</span>
                  </div>
                  <p className="text-sm text-party-ink-light leading-relaxed font-serif">
                    "{msg.text}"
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-museum-border bg-museum-bg p-4 text-xs text-party-ink-light">
                当前暂无已审核发布留言。
              </div>
            )}
          </div>
        </div>

        {notice && (
          <div
            className={`mt-2 p-2 rounded-lg text-xs text-center font-medium border ${
              notice.kind === 'success'
                ? 'bg-[#F2FAF5] border-[#8BC48A]/40 text-[#2F6B35]'
                : 'bg-party-red-light border-party-red text-party-red'
            }`}
          >
            {notice.text}
          </div>
        )}

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 w-full min-h-[44px] party-btn-gold text-sm font-medium"
          >
            留下学习感言
          </button>
        ) : (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="您的称呼"
                aria-label="您的称呼"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-museum-border text-sm bg-museum-bg text-party-ink placeholder:text-[#D4C5B2] focus:border-party-red focus:outline-none"
                maxLength={20}
              />
              <select
                aria-label="选择身份"
                value={formIdentity}
                onChange={(e) => setFormIdentity(e.target.value)}
                className="px-2 py-2 rounded-lg border border-museum-border text-sm bg-museum-bg text-party-ink focus:border-party-red focus:outline-none"
              >
                <option value="群众">群众</option>
                <option value="党员">党员</option>
                <option value="团员">团员</option>
                <option value="少先队员">少先队员</option>
              </select>
            </div>
            <textarea
              placeholder="写下您的学习感悟..."
              aria-label="写下您的学习感悟"
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-museum-border text-sm bg-museum-bg text-party-ink placeholder:text-[#D4C5B2] focus:border-party-red focus:outline-none resize-none"
              rows={2}
              maxLength={200}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSubmitMessage}
                disabled={!formText.trim() || submitting}
                className="flex-1 min-h-[44px] party-btn-primary flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={14} />
                {submitting ? '提交中...' : '发表感言'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false)
                  setFormText('')
                  setFormName('')
                }}
                className="px-4 min-h-[44px] rounded-lg border border-museum-border text-party-ink-light hover:bg-museum-bg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-[45] pointer-events-auto md:hidden" onClick={() => setMobileOpen(false)} />
      )}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="fixed bottom-4 right-4 z-[70] md:hidden min-w-[48px] min-h-[48px] rounded-full bg-party-red text-white shadow-lg flex items-center justify-center gap-1.5 px-4 font-medium text-sm pointer-events-auto touch-manipulation"
          aria-label="打开群众互动面板"
        >
          <HeartHandshake size={18} />
          {!mobileOpen && <span className="text-xs whitespace-nowrap">群众互动</span>}
          <ChevronUp size={16} className={`transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
        </button>
      )}
      {isMobile ? (
        mobileOpen && (
          <div className="fixed inset-x-4 bottom-20 top-24 z-[65] md:hidden pointer-events-auto bg-white rounded-2xl shadow-2xl border border-museum-border overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-museum-border">
              <h2 className="text-sm font-bold text-party-ink font-serif flex items-center gap-2">
                <MessageSquareHeart size={16} className="text-party-red" /> 群众互动与致敬
              </h2>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-museum-bg text-party-ink-light min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="关闭"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-56px)]">
              {panelContent}
            </div>
          </div>
        )
      ) : (
        <div className="fixed bottom-24 right-4 top-28 z-[41] w-80 overflow-hidden">
          {panelContent}
        </div>
      )}
    </>
  )
}
