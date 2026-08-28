import React, { useState, useCallback, useEffect } from 'react'
import { X, Star, Sparkles, Download } from 'lucide-react'
import { asRecordArray, asText, fetchPublishedContents } from '@/lib/cmsContent'

type OathSegment = {
  text: string
  key: number
}

type OathConfig = {
  title: string
  description: string
  oathText: string
  segments: OathSegment[]
  completionTitle: string
  completionText: string
  certificateTitle: string
  certificateText: string
}

function normalizeSegments(value: unknown, oathText: string) {
  const fromCms = asRecordArray(value)
    .map((item, index) => ({ text: asText(item.text) || asText(item.title), key: index }))
    .filter(item => item.text)
  if (fromCms.length) return fromCms
  return oathText
    .split(/[，,。；;\n\r]+/)
    .map(text => text.trim())
    .filter(Boolean)
    .map((text, key) => ({ text, key }))
}

async function fetchOathConfig() {
  const items = await fetchPublishedContents('party_oath', 1)
  const item = items[0]
  if (!item) return null

  const data = item.data || {}
  const oathText = asText(data.oathText) || asText(data.oath_text) || item.body || ''
  const segments = normalizeSegments(data.segments || data.oathSegments || data.oath_segments, oathText)
  const config: OathConfig = {
    title: asText(data.title) || item.title,
    description: asText(data.description) || item.summary || '',
    oathText,
    segments,
    completionTitle: asText(data.completionTitle) || asText(data.completion_title),
    completionText: asText(data.completionText) || asText(data.completion_text),
    certificateTitle: asText(data.certificateTitle) || asText(data.certificate_title),
    certificateText: asText(data.certificateText) || asText(data.certificate_text),
  }

  if (!config.title || !config.description || !config.oathText || !config.segments.length) return null
  if (!config.completionTitle || !config.completionText || !config.certificateTitle || !config.certificateText) return null
  return config
}

export const PartyOathWall: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [config, setConfig] = useState<OathConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [completed, setCompleted] = useState<number[]>([])
  const [finished, setFinished] = useState(false)
  const [userName, setUserName] = useState('')
  const [certReady, setCertReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchOathConfig()
      .then(next => {
        if (!cancelled) {
          setConfig(next)
          setCompleted([])
          setFinished(false)
          setCertReady(false)
        }
      })
      .catch(() => {
        if (!cancelled) setConfig(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleSegmentClick = useCallback((key: number) => {
    if (!config || completed.includes(key)) return
    const next = [...completed, key]
    setCompleted(next)
    if (next.length === config.segments.length) {
      setTimeout(() => setFinished(true), 600)
    }
  }, [completed, config])

  const handleGenerateCert = () => {
    setCertReady(true)
  }

  if (isLoading || !config) {
    return (
      <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
        <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E8DFD5] p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-400">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center z-10" aria-label="关闭">
            <X size={20} />
          </button>

          <div className="text-center py-14">
            <Star size={36} className="text-[#C41E3A] mx-auto mb-3" />
            <h2 className="text-xl font-bold text-[#1A1A1A] font-serif">入党誓词互动墙</h2>
            {isLoading ? (
              <>
                <p className="text-sm text-[#5C5C5C] mt-2">正在读取已审核发布的入党誓词资料</p>
                <p className="text-xs text-[#8C7A68] mt-2">公开端不会展示未经后台审核的本地誓词内容。</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-[#1A1A1A] mt-4">暂无已审核发布的入党誓词资料</p>
                <p className="text-xs text-[#8C7A68] mt-2 px-6 leading-relaxed">
                  请先在后台创建并终审发布“入党誓词墙”内容，公开端才会开放逐句诵读和证书生成。
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (finished && certReady) {
    return (
      <div className="fixed inset-0 z-[86] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-[#C41E3A] p-8 text-center animate-in zoom-in-95 duration-500">
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="text-2xl font-black text-[#C41E3A] font-serif mb-2">入党誓词完整诵读</h2>
          <h3 className="text-lg font-bold text-[#1A1A1A] font-serif mb-1">{config.certificateTitle}</h3>
          <div className="w-24 h-px bg-[#C41E3A] mx-auto my-4" />
          <p className="text-sm text-[#5C5C5C] leading-relaxed mb-2 font-serif">
            兹证明 <span className="font-bold text-[#1A1A1A]">{userName || '匿名同志'}</span> {config.certificateText}
          </p>
          <div className="mt-4 p-4 rounded-xl bg-[#FDE8EC] border border-[#C41E3A]/30">
            <p className="text-xs text-[#C41E3A] leading-relaxed font-serif">{config.oathText}</p>
          </div>
          <p className="text-[10px] text-[#5C5C5C] mt-3">
            数字化档案系统 · 自动生成 · {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white border border-[#E8DFD5] text-[#5C5C5C] text-sm font-medium hover:bg-[#FEFAF6] transition-all">
              完成
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="fixed inset-0 z-[86] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-[#C41E3A] p-8 text-center animate-in zoom-in-95 duration-500">
          <Sparkles className="mx-auto text-[#C41E3A] mb-4" size={48} />
          <h2 className="text-2xl font-black text-[#C41E3A] font-serif mb-3">{config.completionTitle}</h2>
          <p className="text-sm text-[#5C5C5C] leading-relaxed mb-6 font-serif">
            {config.completionText}
          </p>
          <div className="mb-4">
            <input
              type="text"
              placeholder="请留下您的姓名以生成证书"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#E8DFD5] text-sm bg-[#FEFAF6] text-[#1A1A1A] placeholder:text-[#D4C5B2] focus:border-[#C41E3A]/40 focus:outline-none text-center"
              maxLength={20}
            />
          </div>
          <button
            onClick={handleGenerateCert}
            className="px-6 py-3 rounded-xl bg-[#C41E3A] text-white font-bold shadow-lg hover:bg-[#A01830] transition-all"
          >
            <Download size={16} className="inline mr-2" />生成宣誓证书
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E8DFD5] p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-400">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center z-10" aria-label="关闭">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <Star size={36} className="text-[#C41E3A] mx-auto mb-3" />
          <h2 className="text-xl font-bold text-[#1A1A1A] font-serif">{config.title}</h2>
          <p className="text-sm text-[#5C5C5C] mt-1">{config.description}</p>
          <div className="mt-3 text-xs text-[#C41E3A] font-medium">
            已完成 {completed.length} / {config.segments.length} 句
          </div>
          <div className="w-full bg-[#FEFAF6] h-2 rounded-full mt-2 overflow-hidden border border-[#E8DFD5]">
            <div
              className="h-full bg-gradient-to-r from-[#C41E3A] to-[#8B6914] rounded-full transition-all duration-500"
              style={{ width: `${(completed.length / config.segments.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {config.segments.map((segment) => {
            const isDone = completed.includes(segment.key)
            return (
              <button
                key={segment.key}
                onClick={() => handleSegmentClick(segment.key)}
                className={`px-4 py-3 rounded-xl border transition-all duration-300 min-w-[44px] min-h-[44px] text-sm font-medium font-serif ${
                  isDone
                    ? 'bg-[#C41E3A] text-white border-[#C41E3A] shadow-md scale-95'
                    : 'bg-white border-[#E8DFD5] text-[#5C5C5C] hover:border-[#C41E3A]/40 hover:bg-[#FEFAF6] hover:text-[#C41E3A] hover:-translate-y-0.5'
                }`}
              >
                {isDone ? '✓ ' : ''}{segment.text}
              </button>
            )
          })}
        </div>

        {completed.length > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-[#FDE8EC] border border-[#C41E3A]/20">
            <h4 className="text-sm font-bold text-[#C41E3A] mb-2 font-serif">已诵读誓言</h4>
            <p className="text-sm text-[#1A1A1A] leading-relaxed font-serif">
              {completed.map(k => config.segments.find(s => s.key === k)?.text).filter(Boolean).join('，')}。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
