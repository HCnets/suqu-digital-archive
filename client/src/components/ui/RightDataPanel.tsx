import React, { useEffect, useState, useCallback } from 'react'
import { HeartHandshake, Sparkles, Users, MessageSquareHeart, Flower2, Send, X, ChevronUp } from 'lucide-react'

const API_BASE = 'http://localhost:3001/api'

interface Message {
  id: string
  name: string
  identity: string
  text: string
  createdAt: number
}

const MOCK_MESSAGES: Message[] = [
  { id: 'mock-1', name: '紫金县实验中学 少先队', identity: '少先队员', text: '我们是共产主义接班人！请党放心，强国有我！', createdAt: Date.now() - 120000 },
  { id: 'mock-2', name: '老党员 张建国', identity: '党员', text: '看到血田遗址的介绍，老泪纵横。江山就是人民，人民就是江山。', createdAt: Date.now() - 900000 },
  { id: 'mock-3', name: '群众 138****9921', identity: '群众', text: '重走红军路，才知道今天的幸福生活多么来之不易。向先烈致敬！', createdAt: Date.now() - 1800000 },
  { id: 'mock-4', name: '河源市青年学习小组', identity: '团员', text: '走好新时代的长征路，把群众路线坚持到底。', createdAt: Date.now() - 3600000 },
  { id: 'mock-5', name: '大埔围村 党员小队', identity: '党员', text: '看了红屋的介绍，更加坚定了为人民服务的初心使命。', createdAt: Date.now() - 7200000 },
  { id: 'mock-6', name: '外地游客 李先生', identity: '群众', text: '数字大屏做得太震撼了，这些真实的历史让人肃然起敬。', createdAt: Date.now() - 10800000 },
]

export const RightDataPanel: React.FC = () => {
  const [tributeCount, setTributeCount] = useState(11990821)
  const [apiMessages, setApiMessages] = useState<Message[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formIdentity, setFormIdentity] = useState('群众')
  const [formText, setFormText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' && window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const allMessages = apiMessages.length > 0 ? apiMessages : MOCK_MESSAGES

  useEffect(() => {
    fetch(`${API_BASE}/tributes`)
      .then(r => r.json())
      .then(d => setTributeCount(d.count))
      .catch(() => {})
    
    fetch(`${API_BASE}/messages`)
      .then(r => r.json())
      .then(d => { if (d && d.length > 0) setApiMessages(d) })
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
      setApiMessages(prev => [newMsg, ...prev])
      setFormText('')
      setFormName('')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    } catch (_e) {
      const fallbackMsg: Message = {
        id: `local-${Date.now()}`,
        name: formName || '匿名群众',
        identity: formIdentity,
        text: formText.trim(),
        createdAt: Date.now()
      }
      setApiMessages(prev => [fallbackMsg, ...prev])
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

  const panelContent = (
    <div className="flex flex-col gap-4 pointer-events-auto max-h-[calc(100vh-130px)] overflow-y-auto custom-scrollbar pr-1 pb-4 w-full">      {/* 模块一：线上参与致敬 */}
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
            {allMessages.map((msg) => (
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
                aria-label="您的称呼"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-[#E8DFD5] text-sm bg-[#FEFAF6] text-[#1A1A1A] placeholder:text-[#D4C5B2] focus:border-[#C41E3A]/40 focus:outline-none"
                maxLength={20}
              />
              <select
                aria-label="选择身份"
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
              aria-label="写下您的学习感悟"
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

  return (
    <>
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-[45] pointer-events-auto md:hidden" onClick={() => setMobileOpen(false)} />
      )}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="absolute bottom-28 right-4 z-[50] md:hidden min-w-[48px] min-h-[48px] rounded-full bg-[#C41E3A] text-white shadow-lg flex items-center justify-center gap-1.5 px-4 font-medium text-sm pointer-events-auto touch-manipulation"
          aria-label="打开群众互动面板"
        >
          <HeartHandshake size={18} />
          {!mobileOpen && <span className="text-xs whitespace-nowrap">群众互动</span>}
          <ChevronUp size={16} className={`transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
        </button>
      )}
      {isMobile ? (
        mobileOpen && (
          <div className="fixed inset-x-4 top-16 bottom-4 z-[50] md:hidden pointer-events-auto bg-white rounded-2xl shadow-2xl border border-[#E8DFD5] overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-[#E8DFD5]">
              <h2 className="text-sm font-bold text-[#1A1A1A] font-serif flex items-center gap-2">
                <MessageSquareHeart size={16} className="text-[#C41E3A]" /> 群众互动与致敬
              </h2>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-[#FEFAF6] text-[#5C5C5C] min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="关闭">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-56px)]">
              {panelContent}
            </div>
          </div>
        )
      ) : (
        <div className="absolute top-24 right-20 w-80 z-40">
          {panelContent}
        </div>
      )}
    </>
  )
}
