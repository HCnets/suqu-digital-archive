import React, { useEffect, useState, useCallback } from 'react'
import { HeartHandshake, Sparkles, Users, MessageSquareHeart, Flower2, Send, X } from 'lucide-react'

const API_BASE = 'http://localhost:3001/api'

interface Message {
  id: string
  name: string
  identity: string
  text: string
  createdAt: number
}

export const RightDataPanel: React.FC = () => {
  const [tributeCount, setTributeCount] = useState(11990821)
  const [messages, setMessages] = useState<Message[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formIdentity, setFormIdentity] = useState('群众')
  const [formText, setFormText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/tributes`)
      .then(r => r.json())
      .then(d => setTributeCount(d.count))
      .catch(() => {})
    
    fetch(`${API_BASE}/messages`)
      .then(r => r.json())
      .then(d => setMessages(d))
      .catch(() => {})
  }, [])

  const handleTribute = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/tributes`, { method: 'POST' })
      const d = await r.json()
      setTributeCount(d.count)
    } catch {
      setTributeCount(prev => prev + 1)
    }
  }, [])

  const handleSubmitMessage = useCallback(async () => {
    if (!formText.trim() || submitting) return
    setSubmitting(true)
    try {
      const r = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, identity: formIdentity, text: formText })
      })
      const newMsg = await r.json()
      setMessages(prev => [newMsg, ...prev])
      setFormText('')
      setFormName('')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    } catch (e) {
      const fallbackMsg: Message = {
        id: `local-${Date.now()}`,
        name: formName || '匿名群众',
        identity: formIdentity,
        text: formText.trim(),
        createdAt: Date.now()
      }
      setMessages(prev => [fallbackMsg, ...prev])
      setFormText('')
      setFormName('')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    }
    setSubmitting(false)
  }, [formName, formIdentity, formText, submitting])

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return `${Math.floor(diff / 86400000)}天前`
  }

  return (
    <div className="absolute top-24 right-20 w-80 flex flex-col gap-4 pointer-events-auto z-40">
      
      {/* 模块一：线上参与致敬 */}
      <div className="museum-card p-5 rounded-2xl relative overflow-hidden flex-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C41E3A] to-[#8B6914]" />
        
        <h3 className="font-bold flex items-center gap-2 text-base mb-4 text-[#1A1A1A] font-serif tracking-wider">
          <HeartHandshake size={20} className="text-[#C41E3A]" />
          人民的缅怀
        </h3>

        <div className="bg-[#FEFAF6] p-4 rounded-2xl border border-[#E8DFD5] flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer">
          <Sparkles className="absolute top-2 right-2 text-[#8B6914]/30 group-hover:text-[#8B6914]/50 transition-colors duration-300" size={20} />
          <div className="text-xs text-[#5C5C5C] mb-2 font-medium">从小小红船到巍巍巨轮 · 群众云端致敬</div>
          <div className="text-4xl font-black text-[#C41E3A] font-serif">
            {tributeCount.toLocaleString()}
          </div>
          <div className="mt-3 text-xs text-[#5C5C5C]/60 flex items-center gap-1">
            <Users size={12}/> 来自全国 34 个省市自治区的群众
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

      {/* 模块二：学习感言留言板 */}
      <div className="museum-card p-5 rounded-2xl relative flex-1 flex flex-col overflow-hidden">
        <h3 className="font-bold flex items-center gap-2 text-base mb-4 text-[#1A1A1A] font-serif tracking-wider">
          <MessageSquareHeart size={20} className="text-[#C41E3A]" />
          薪火相传 · 群众心声
        </h3>
        
        <div className="flex-1 overflow-hidden relative min-h-[200px]">
          <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
          
          <div className="absolute inset-0 overflow-y-auto custom-scrollbar pt-2 pb-8 space-y-3 pr-2">
            {messages.map((msg) => (
              <div key={msg.id} className="bg-[#FEFAF6] p-3.5 rounded-xl border border-[#E8DFD5] hover:border-[#C41E3A]/20 transition-colors duration-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-[#1A1A1A]">{msg.name}</span>
                  <span className="text-[10px] text-[#5C5C5C]/50">{formatTime(msg.createdAt)}</span>
                </div>
                <p className="text-sm text-[#5C5C5C] leading-relaxed font-serif">
                  "{msg.text}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {submitted && (
          <div className="mt-2 p-2 rounded-lg bg-[#FDE8EC] border border-[#C41E3A]/30 text-[#C41E3A] text-xs text-center font-medium">
            感言已提交，感谢您的参与！
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
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-[#E8DFD5] text-sm bg-[#FEFAF6] text-[#1A1A1A] placeholder:text-[#D4C5B2] focus:border-[#C41E3A]/40 focus:outline-none"
                maxLength={20}
              />
              <select
                value={formIdentity}
                onChange={e => setFormIdentity(e.target.value)}
                className="px-2 py-2 rounded-lg border border-[#E8DFD5] text-sm bg-[#FEFAF6] text-[#1A1A1A] focus:border-[#C41E3A]/40 focus:outline-none"
              >
                <option value="群众">群众</option>
                <option value="党员">党员</option>
                <option value="团员">团员</option>
                <option value="少先队员">少先队员</option>
              </select>
            </div>
            <textarea
              placeholder="写下您的学习感悟..."
              value={formText}
              onChange={e => setFormText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] text-sm bg-[#FEFAF6] text-[#1A1A1A] placeholder:text-[#D4C5B2] focus:border-[#C41E3A]/40 focus:outline-none resize-none"
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
                onClick={() => { setShowForm(false); setFormText(''); setFormName('') }}
                className="px-4 min-h-[44px] rounded-lg border border-[#E8DFD5] text-[#5C5C5C] hover:bg-[#FEFAF6] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
