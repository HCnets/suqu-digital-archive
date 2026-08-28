import React, { useState, useEffect, useCallback } from 'react'
import { X, Play, Pause, Volume2, User, Quote } from 'lucide-react'
import { asText, fetchPublishedContents, type PublicContentItem } from '@/lib/cmsContent'

interface OralRecord {
  id: string
  narrator: string
  age: number
  identity: string
  title: string
  content: string
  date: string
  emotion: string
  collectionLocation: string
  interviewer: string
  aiSummary: string
  audioUrl: string
  videoUrl: string
  relatedArchiveId: string
}

export const OralHistory: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [records, setRecords] = useState<OralRecord[]>([])
  const [activeRecord, setActiveRecord] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(true)

  const record = records[activeRecord] || records[0] || null

  useEffect(() => {
    let cancelled = false
    async function loadRecords() {
      setLoading(true)
      try {
        const items = await fetchPublishedContents('oral_history', 100)
        const cmsRecords = items.map(contentToOralRecord).filter(Boolean) as OralRecord[]
        if (!cancelled) {
          setRecords(cmsRecords)
          setActiveRecord(0)
        }
      } catch {
        if (!cancelled) setRecords([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadRecords()
    return () => { cancelled = true }
  }, [])

  const handlePlay = useCallback(() => {
    if (!record) return
    if (isPlaying) {
      setIsPlaying(false)
      if (window.speechSynthesis) window.speechSynthesis.cancel()
    } else {
      setIsPlaying(true)
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(record.content)
        u.lang = 'zh-CN'
        u.rate = 0.8
        u.onend = () => setIsPlaying(false)
        window.speechSynthesis.speak(u)
      }
    }
  }, [isPlaying, record])

  const handleSelectRecord = useCallback((idx: number) => {
    setIsPlaying(false)
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setActiveRecord(idx)
  }, [])

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[85] pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white border-l border-[#E8DFD5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-400 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-[#E8DFD5] bg-[#FEFAF6]">
          <div className="flex items-center gap-2">
            <Volume2 size={18} className="text-[#C41E3A]" />
            <h2 className="text-lg font-bold text-[#1A1A1A] font-serif">红色口述历史录音室</h2>
          </div>
          <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-[#E8DFD5] border-t-[#C41E3A] animate-spin mx-auto mb-4" />
              <p className="text-sm text-[#5C5C5C]">正在读取已审核发布的口述历史</p>
            </div>
          ) : !record ? (
            <div className="rounded-xl border border-dashed border-[#E8DFD5] bg-[#FEFAF6] p-5 text-sm leading-relaxed text-[#5C5C5C]">
              当前暂无已审核发布的口述历史记录。
            </div>
          ) : (
            <>
              <div className="museum-card p-5 rounded-2xl border border-[#E8DFD5] mb-6">
                <Quote size={24} className="text-[#C41E3A] mb-3 opacity-50" />

                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#FDE8EC] flex items-center justify-center">
                    <User size={18} className="text-[#C41E3A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1A1A] text-sm font-serif">{record.narrator}</h3>
                    <p className="text-xs text-[#5C5C5C]">
                      {[record.age > 0 ? `${record.age}岁` : '', record.identity, record.date].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#FDE8EC] text-[#C41E3A] font-medium">{record.emotion}</span>
                </div>

                <h4 className="text-base font-bold text-[#1A1A1A] mb-3 font-serif">{record.title}</h4>
                <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#5C5C5C]">
                  {record.collectionLocation && <span className="rounded-lg bg-[#FEFAF6] border border-[#E8DFD5] px-3 py-2">采集地点：{record.collectionLocation}</span>}
                  {record.interviewer && <span className="rounded-lg bg-[#FEFAF6] border border-[#E8DFD5] px-3 py-2">采访人：{record.interviewer}</span>}
                  {record.relatedArchiveId && <span className="rounded-lg bg-[#FEFAF6] border border-[#E8DFD5] px-3 py-2">关联点位：{record.relatedArchiveId}</span>}
                </div>

                {record.aiSummary && (
                  <div className="mb-3 rounded-xl border border-[#E8DFD5] bg-[#FEFAF6] p-3">
                    <div className="mb-1 text-xs font-bold text-[#8B6914]">AI 摘要（已审核）</div>
                    <p className="text-xs leading-relaxed text-[#5C5C5C]">{record.aiSummary}</p>
                  </div>
                )}

                <p className="text-sm text-[#5C5C5C] leading-relaxed font-serif whitespace-pre-line">
                  {record.content}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {record.audioUrl && (
                    <audio controls src={record.audioUrl} className="min-h-[44px] max-w-full" />
                  )}
                  {record.videoUrl && (
                    <a href={record.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center min-h-[44px] px-4 rounded-xl bg-white border border-[#E8DFD5] text-sm font-semibold text-[#C41E3A]">
                      查看视频
                    </a>
                  )}
                  <button
                    onClick={handlePlay}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl party-btn-primary"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    {isPlaying ? '暂停朗读' : '朗读公开文本'}
                  </button>
                </div>
              </div>

              <h4 className="text-sm font-bold text-[#1A1A1A] mb-3 font-serif">更多口述记录</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {records.map((r, i) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRecord(i)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      i === activeRecord
                        ? 'bg-[#FDE8EC] border-[#C41E3A]/40 shadow-sm'
                        : 'bg-white border-[#E8DFD5] hover:bg-[#FEFAF6] hover:border-[#C41E3A]/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User size={12} className={i === activeRecord ? 'text-[#C41E3A]' : 'text-[#5C5C5C]'} />
                      <span className={`text-xs font-bold font-serif ${i === activeRecord ? 'text-[#C41E3A]' : 'text-[#1A1A1A]'}`}>{r.narrator}</span>
                    </div>
                    <p className="text-xs text-[#5C5C5C] mt-1 line-clamp-2">{r.title}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function contentToOralRecord(item: PublicContentItem): OralRecord | null {
  const data = item.data || {}
  const narrator = asText(data.narrator) || asText(data.name)
  const title = asText(data.title) || item.title
  const content = asText(data.publicTranscript) || asText(data.public_transcript) || asText(data.transcript) || asText(data.content) || item.body || item.summary || ''
  const date = asText(data.date) || asText(data.recordedAt) || asText(data.recorded_at) || ''
  const emotion = asText(data.emotion) || item.category || ''
  const age = Number(data.age || 0)
  const identity = asText(data.identity) || asText(data.role)
  const collectionLocation = asText(data.collectionLocation) || asText(data.collection_location)
  const interviewer = asText(data.interviewer) || asText(data.collector)
  const aiSummary = asText(data.aiSummary) || asText(data.ai_summary)
  const audioUrl = asText(data.audioUrl) || asText(data.audio_url)
  const videoUrl = asText(data.videoUrl) || asText(data.video_url)
  const relatedArchiveId = asText(data.relatedArchiveId) || asText(data.related_archive_id)

  if (!narrator || !title || !content || !date || !emotion) return null
  return {
    id: item.id || title,
    narrator,
    age: Number.isFinite(age) ? age : 0,
    identity,
    title,
    content,
    date,
    emotion,
    collectionLocation,
    interviewer,
    aiSummary,
    audioUrl,
    videoUrl,
    relatedArchiveId,
  }
}
