import React, { useEffect, useState } from 'react'
import { X, Flag, MapPin, Clock } from 'lucide-react'
import { asRecordArray, asText, fetchPublishedContents, type PublicContentItem } from '@/lib/cmsContent'

interface Stage {
  id: string
  year: string
  title: string
  location: string
  description: string
  lng?: number | null
  lat?: number | null
}

interface LongMarchContent {
  title: string
  description: string
  stages: Stage[]
  spiritText: string
  timeRange: string
}

export const LongMarchRoute: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeStage, setActiveStage] = useState<number | null>(null)
  const [route, setRoute] = useState<LongMarchContent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadRoute() {
      setLoading(true)
      try {
        const items = await fetchPublishedContents('long_march', 10)
        const nextRoute = items.map(contentToLongMarch).find(Boolean) || null
        if (!cancelled) {
          setRoute(nextRoute)
          setActiveStage(null)
        }
      } catch {
        if (!cancelled) setRoute(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadRoute()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="fixed inset-0 z-[85] pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white border-l border-[#E8DFD5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-400 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-[#E8DFD5] bg-[#FEFAF6]">
          <div className="flex items-center gap-2">
            <Flag size={18} className="text-[#C41E3A]" />
            <h2 className="text-lg font-bold text-[#1A1A1A] font-serif tracking-wider">长征路线交互沙盘</h2>
          </div>
          <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-[#E8DFD5] border-t-[#C41E3A] animate-spin mx-auto mb-4" />
              <p className="text-sm text-[#5C5C5C]">正在读取已审核发布的长征路线沙盘</p>
            </div>
          ) : !route ? (
            <div className="rounded-xl border border-dashed border-[#E8DFD5] bg-[#FEFAF6] p-5 text-sm leading-relaxed text-[#5C5C5C]">
              当前暂无已审核发布的长征路线沙盘。
            </div>
          ) : (
            <>
              <div className="museum-card p-5 rounded-2xl border border-[#E8DFD5] mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C41E3A] to-[#8B6914]" />
                <h3 className="text-base font-bold text-[#1A1A1A] font-serif mb-2">{route.title}</h3>
                <p className="text-sm text-[#5C5C5C] leading-relaxed font-serif mt-1">
                  {route.description}
                </p>
              </div>

              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#E8DFD5]" />
                <div className="absolute left-6 top-0 w-0.5 bg-[#C41E3A] transition-all duration-700 rounded-full" style={{ height: activeStage !== null ? `${((activeStage + 1) / route.stages.length) * 100}%` : '0%' }} />

                <div className="space-y-2">
                  {route.stages.map((stage, idx) => {
                    const isActive = activeStage === idx
                    const isPassed = activeStage !== null && idx <= activeStage
                    return (
                      <div key={stage.id} className="relative pl-14">
                        <button
                          onClick={() => setActiveStage(isActive ? null : idx)}
                          className={`absolute left-4 top-4 w-5 h-5 rounded-full border-2 transition-all duration-300 z-10 ${
                            isPassed
                              ? 'bg-[#C41E3A] border-[#C41E3A] shadow-sm'
                              : 'bg-white border-[#E8DFD5] hover:border-[#C41E3A]/50'
                          }`}
                          aria-label={`查看${stage.title}`}
                        />

                        <div
                          className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                            isActive
                              ? 'bg-[#FDE8EC] border-[#C41E3A]/40 shadow-sm'
                              : isPassed
                              ? 'bg-[#FEFAF6] border-[#E8DFD5]'
                              : 'bg-white border-[#E8DFD5] hover:border-[#C41E3A]/20 hover:bg-[#FEFAF6]'
                          }`}
                          onClick={() => setActiveStage(isActive ? null : idx)}
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-mono font-bold text-[#C41E3A] bg-[#FDE8EC] px-2 py-0.5 rounded">{stage.year}</span>
                            <h3 className="font-bold text-[#1A1A1A] text-sm font-serif">{stage.title}</h3>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#5C5C5C] mb-2">
                            <MapPin size={11} />
                            <span>{stage.location}</span>
                          </div>
                          {isActive && (
                            <p className="text-sm text-[#5C5C5C] leading-relaxed font-serif mt-2 pt-2 border-t border-[#E8DFD5] animate-in slide-in-from-top-2 duration-300">
                              {stage.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {(route.spiritText || route.timeRange) && (
                <div className="mt-6 p-4 rounded-xl bg-[#FEFAF6] border border-[#E8DFD5] text-center">
                  {route.spiritText && (
                    <p className="text-sm text-[#5C5C5C] font-serif leading-relaxed">
                      <span className="font-bold text-[#C41E3A]">长征精神：</span>
                      {route.spiritText}
                    </p>
                  )}
                  {route.timeRange && (
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Clock size={12} className="text-[#5C5C5C]" />
                      <span className="text-xs text-[#5C5C5C]">{route.timeRange}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function contentToLongMarch(item: PublicContentItem): LongMarchContent | null {
  const data = item.data || {}
  const stages = asRecordArray(data.stages || data.items).map((entry, index) => {
    const year = asText(entry.year) || asText(entry.time)
    const title = asText(entry.title) || asText(entry.name)
    const location = asText(entry.location) || asText(entry.duration)
    const description = asText(entry.description) || asText(entry.body) || asText(entry.text)
    const lat = Number(entry.lat ?? entry.latitude)
    const lng = Number(entry.lng ?? entry.longitude)
    if (!year || !title || !location || !description) return null
    return {
      id: asText(entry.id) || `${item.id || item.title}-${index}`,
      year,
      title,
      location,
      description,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
    }
  }).filter(Boolean) as Stage[]
  const title = asText(data.title) || asText(data.name) || item.title
  const description = asText(data.description) || asText(data.desc) || item.summary || item.body || ''
  const spiritText = asText(data.spiritText) || asText(data.spirit_text) || asText(data.spirit)
  const timeRange = asText(data.timeRange) || asText(data.time_range)

  if (!title || !description || stages.length === 0) return null
  return { title, description, stages, spiritText, timeRange }
}
