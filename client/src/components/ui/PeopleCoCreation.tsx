import React, { useState, useEffect, useCallback } from 'react'
import { X, Heart, Send, MessageCircle, ScrollText, User, RefreshCw } from 'lucide-react'
import { asRecordArray, asText, fetchPublishedContents, type PublicContentItem } from '@/lib/cmsContent'
import { API_BASE } from '@/lib/env'

interface Letter {
  author: string
  role: string
  excerpt: string
  fullText: string
  avatar: string
}

type Message = {
  id: string
  author: string
  text: string
  time: string
  inReplyTo: string
  pending?: boolean
}

type ApiMessage = {
  id: string
  name: string
  identity: string
  text: string
  createdAt: number
  inReplyTo?: string
}

function toDisplayMessage(item: ApiMessage, pending = false): Message {
  return {
    id: item.id,
    author: item.name,
    text: item.text,
    time: new Date(item.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    inReplyTo: item.inReplyTo || '',
    pending,
  }
}

export const PeopleCoCreation: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [letters, setLetters] = useState<Letter[]>([])
  const [selectedLetter, setSelectedLetter] = useState<number>(0)
  const [isLoadingLetters, setIsLoadingLetters] = useState(true)
  const [userName, setUserName] = useState('')
  const [userText, setUserText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [pendingMessages, setPendingMessages] = useState<Message[]>([])
  const [showWall, setShowWall] = useState(false)
  const displayMessages = [...pendingMessages, ...messages]
  const activeLetter = letters[selectedLetter] || letters[0] || null

  useEffect(() => {
    let cancelled = false
    async function loadPrompts() {
      try {
        const items = await fetchPublishedContents('cocreation', 100)
        const cmsLetters = items.flatMap(contentToLetters)
        if (!cancelled) {
          setLetters(cmsLetters)
          setSelectedLetter(0)
        }
      } catch {
        if (!cancelled) setLetters([])
      } finally {
        if (!cancelled) setIsLoadingLetters(false)
      }
    }
    loadPrompts()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadMessages() {
      try {
        const response = await fetch(`${API_BASE}/messages?pageSize=100`)
        if (!response.ok) return
        const payload = await response.json() as { items?: ApiMessage[] }
        const items = Array.isArray(payload.items) ? payload.items : []
        if (!cancelled) {
          setMessages(items.map(item => toDisplayMessage(item)))
          setPendingMessages(prev => prev.filter(pending => !items.some(item => item.id === pending.id)))
        }
      } catch {
        // Keep the wall usable when the API is unavailable.
      }
    }
    loadMessages()
    return () => { cancelled = true }
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!userText.trim() || !activeLetter) return
    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName.trim() || '匿名同志',
          identity: '共创留言',
          text: userText.trim(),
          inReplyTo: activeLetter.author,
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error?.message || '提交失败')
      const submitted = payload?.message ? toDisplayMessage({
        id: payload.message.id,
        name: payload.message.name,
        identity: payload.message.identity,
        text: payload.message.text,
        createdAt: payload.message.createdAt,
        inReplyTo: payload.message.inReplyTo,
      }, true) : null
      if (submitted) setPendingMessages(prev => [submitted, ...prev])
      setUserText('')
    } catch {
      // Keep the composer responsive even if the backend request fails.
    }
  }, [userName, userText, activeLetter])

  return (
    <div className="fixed inset-0 z-[85] pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white border-l border-[#E8DFD5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-400 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-[#E8DFD5] bg-[#FEFAF6]">
          <div className="flex items-center gap-2">
            <ScrollText size={18} className="text-[#C41E3A]" />
            <h2 className="text-lg font-bold text-[#1A1A1A] font-serif">红色家书 — 薪火相传</h2>
          </div>
          <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        {!showWall ? (
          <div className="p-6 flex-1">
            <div className="museum-card p-5 rounded-2xl border border-[#E8DFD5] mb-6">
              <Heart size={20} className="text-[#C41E3A] mb-3" />
              <h3 className="text-sm font-bold text-[#1A1A1A] mb-2 font-serif">续写先烈家书</h3>
              <p className="text-xs text-[#5C5C5C] leading-relaxed">
                阅读革命先烈的绝笔家书，感受他们的信念与温度。选择一封触动你的信，写下你想对先烈说的话。精选留言将展示在"薪火相传"墙上。每一次书写，都是跨越时空的对话。
              </p>
            </div>

            {isLoadingLetters ? (
              <div className="py-12 text-center rounded-xl border border-[#E8DFD5] bg-[#FEFAF6]">
                <div className="text-sm font-bold text-[#1A1A1A] font-serif">正在读取已审核发布的共创素材</div>
                <p className="text-xs text-[#8C7A68] mt-2">公开端不会展示未经后台审核的本地家书。</p>
              </div>
            ) : !activeLetter ? (
              <div className="py-12 text-center rounded-xl border border-[#E8DFD5] bg-[#FEFAF6]">
                <div className="text-4xl mb-3">📮</div>
                <div className="text-sm font-bold text-[#1A1A1A] font-serif">暂无已审核发布的共创素材</div>
                <p className="text-xs text-[#8C7A68] mt-2 px-6 leading-relaxed">
                  请先在后台创建并终审发布“群众共创”内容，公开端才会开放续写入口。
                </p>
                <button
                  onClick={() => setShowWall(true)}
                  className="mt-5 text-xs text-[#C41E3A] hover:underline inline-flex items-center gap-1 justify-center"
                >
                  <MessageCircle size={12} />
                  查看薪火相传墙 ({displayMessages.length} 封续信)
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {letters.map((l, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedLetter(i)}
                      className={`flex-shrink-0 p-3 rounded-xl border min-w-[120px] text-center transition-all ${
                        i === selectedLetter
                          ? 'bg-[#FDE8EC] border-[#C41E3A]/40 shadow-sm'
                          : 'bg-white border-[#E8DFD5] hover:bg-[#FEFAF6]'
                      }`}
                    >
                      <div className="text-xl mb-1">{l.avatar}</div>
                      <div className="text-xs font-bold font-serif">{l.author}</div>
                    </button>
                  ))}
                </div>

                <div className="p-5 rounded-2xl border-2 border-[#E8DFD5] bg-[#FEFAF6] mb-6">
                  <div className="text-center mb-3">
                    <div className="text-3xl mb-2">{activeLetter.avatar}</div>
                    <h3 className="text-lg font-black font-serif text-[#C41E3A]">{activeLetter.author}</h3>
                    <p className="text-[10px] text-[#5C5C5C]">{activeLetter.role}</p>
                  </div>
                  <div className="w-12 h-px bg-[#C41E3A] mx-auto my-3 opacity-30" />
                  <blockquote className="text-sm text-[#1A1A1A] leading-relaxed font-serif text-center italic px-4 mb-4">
                    "——{activeLetter.excerpt}——"
                  </blockquote>
                  <p className="text-xs text-[#5C5C5C] leading-relaxed whitespace-pre-line border-t border-[#E8DFD5] pt-3 mt-3">
                    {activeLetter.fullText.split('\n\n')[1] || activeLetter.fullText}
                  </p>
                </div>

                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="你的名字（选填）"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#E8DFD5] text-sm bg-white text-[#1A1A1A] placeholder:text-[#D4C5B2] focus:border-[#C41E3A]/40 focus:outline-none"
                    maxLength={12}
                  />
                </div>
                <div className="mb-3">
                  <textarea
                    placeholder={`写一封给 ${activeLetter.author} 同志的回信...`}
                    value={userText}
                    onChange={e => setUserText(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#E8DFD5] text-sm bg-white text-[#1A1A1A] placeholder:text-[#D4C5B2] focus:border-[#C41E3A]/40 focus:outline-none resize-none h-28"
                    maxLength={500}
                  />
                  <p className="text-[10px] text-[#D4C5B2] text-right mt-1">{userText.length}/500</p>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!userText.trim()}
                  className="w-full py-3 min-h-[44px] rounded-xl party-btn-primary disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  寄出这封信
                </button>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowWall(true)}
                    className="text-xs text-[#C41E3A] hover:underline flex items-center gap-1 justify-center"
                  >
                    <MessageCircle size={12} />
                    查看薪火相传墙 ({displayMessages.length} 封续信)
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="p-6 flex-1">
            <button
              onClick={() => setShowWall(false)}
              className="mb-4 text-xs text-[#C41E3A] hover:underline flex items-center gap-1"
            >
              ← 返回写信
            </button>

            <h3 className="text-lg font-bold font-serif text-[#1A1A1A] mb-4 flex items-center gap-2">
              <Heart size={16} className="text-[#C41E3A]" />
              薪火相传墙
            </h3>

            {displayMessages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📮</div>
                <p className="text-sm text-[#5C5C5C] font-serif">还未有人寄出回信</p>
                <p className="text-xs text-[#D4C5B2] mt-1">成为第一位续写家书的同志</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayMessages.map(msg => (
                  <div key={msg.id} className="p-4 rounded-xl bg-[#FEFAF6] border border-[#E8DFD5]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-[#FDE8EC] flex items-center justify-center text-xs">
                        <User size={10} className="text-[#C41E3A]" />
                      </div>
                      <span className="font-bold text-xs text-[#1A1A1A] font-serif">{msg.author}</span>
                      <span className="text-[10px] text-[#D4C5B2]">回复 {msg.inReplyTo}</span>
                      {msg.pending && <span className="text-[10px] text-[#C41E3A]">待审核</span>}
                      <span className="ml-auto text-[10px] text-[#D4C5B2]">{msg.time}</span>
                    </div>
                    <p className="text-sm text-[#5C5C5C] leading-relaxed font-serif">{msg.text}</p>
                  </div>
                ))}
              </div>
            )}

            {pendingMessages.length > 0 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setPendingMessages([])}
                  className="text-xs text-[#D4C5B2] hover:text-[#C41E3A] transition-all flex items-center gap-1 mx-auto"
                >
                  <RefreshCw size={10} />
                  清空待审留言
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function contentToLetters(item: PublicContentItem): Letter[] {
  const data = item.data || {}
  const entries = asRecordArray(data.prompts).length > 0
    ? asRecordArray(data.prompts)
    : asRecordArray(data.letters).length > 0
      ? asRecordArray(data.letters)
      : [data]

  return entries.map(entry => {
    const author = asText(entry.author) || asText(entry.name)
    const fullText = asText(entry.fullText) || asText(entry.full_text) || asText(entry.text) || item.body || ''
    if (!author || !fullText) return null
    return {
      author,
      role: asText(entry.role) || asText(entry.subtitle) || item.summary || '',
      excerpt: asText(entry.excerpt) || asText(entry.summary) || fullText.slice(0, 80),
      fullText,
      avatar: asText(entry.avatar) || '✦',
    }
  }).filter(Boolean) as Letter[]
}
