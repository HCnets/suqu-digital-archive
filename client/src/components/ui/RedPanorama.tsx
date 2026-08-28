import React, { useState, useRef, useCallback, useEffect } from 'react'
import { X, Rotate3D, MapPin, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import { asStringArray, asText, fetchPublishedContents, type PublicContentItem } from '@/lib/cmsContent'

interface Panorama {
  id: string
  title: string
  description: string
  bgColor: string
  accentColor: string
  features: string[]
  lat: number
  lng: number
  /** 真实场景图（后台可配置；缺省时降级为示意插画） */
  image: string
}

export const RedPanorama: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [panoramas, setPanoramas] = useState<Panorama[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [loading, setLoading] = useState(true)
  const isDragging = useRef(false)
  const lastX = useRef(0)

  const panorama = panoramas[currentIdx] || null

  useEffect(() => {
    let cancelled = false
    async function loadPanoramas() {
      setLoading(true)
      try {
        const items = await fetchPublishedContents('panorama', 100)
        const cmsPanoramas = items.map(contentToPanorama).filter(Boolean) as Panorama[]
        if (!cancelled) {
          setPanoramas(cmsPanoramas)
          setCurrentIdx(0)
          setRotation(0)
        }
      } catch {
        if (!cancelled) setPanoramas([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadPanoramas()
    return () => { cancelled = true }
  }, [])

  const handlePrev = () => {
    if (panoramas.length === 0) return
    setCurrentIdx(prev => (prev - 1 + panoramas.length) % panoramas.length)
  }

  const handleNext = () => {
    if (panoramas.length === 0) return
    setCurrentIdx(prev => (prev + 1) % panoramas.length)
  }

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!panorama) return
    isDragging.current = true
    lastX.current = e.clientX
  }, [panorama])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !panorama) return
    const dx = e.clientX - lastX.current
    setRotation(prev => (prev + dx * 0.3) % 360)
    lastX.current = e.clientX
  }, [panorama])

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative bg-white rounded-3xl shadow-2xl border border-[#E8DFD5] overflow-hidden animate-in zoom-in-95 duration-400 ${isFullscreen ? 'w-full h-full max-w-[95vw] max-h-[95vh]' : 'w-full max-w-2xl'}`}>
        <div className="flex items-center justify-between p-4 border-b border-[#E8DFD5] bg-[#FEFAF6]">
          <div className="flex items-center gap-2">
            <Rotate3D size={18} className="text-[#C41E3A]" />
            <h2 className="text-sm font-bold text-[#1A1A1A] font-serif">红色遗址360°全景</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="切换全屏">
              <Maximize2 size={16} />
            </button>
            <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭全景">
              <X size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-10 py-20 text-center bg-[#FEFAF6]">
            <div className="w-10 h-10 rounded-full border-2 border-[#E8DFD5] border-t-[#C41E3A] animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#5C5C5C]">正在读取已审核发布的全景点位</p>
          </div>
        ) : !panorama ? (
          <div className="p-10 py-20 text-center bg-[#FEFAF6]">
            <p className="text-sm text-[#5C5C5C] leading-relaxed">
              当前暂无已审核发布的全景点位。
            </p>
          </div>
        ) : (
          <>
            <div className="relative" style={{ background: `linear-gradient(135deg, ${panorama.bgColor} 0%, #FEFAF6 50%, ${panorama.bgColor}90 100%)` }}>
              <div
                className="w-full h-64 md:h-80 cursor-grab active:cursor-grabbing select-none flex items-center justify-center relative overflow-hidden"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                {panorama.image ? (
                  // 真实实景：大图铺底 + 拖拽平移查看细节
                  <img
                    src={panorama.image}
                    alt={panorama.title}
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover select-none"
                    style={{ transform: `scale(1.25) translateX(${rotation * 0.5}px)`, transition: 'transform 80ms linear' }}
                  />
                ) : (
                  // 无实景时的示意插画（诚实降级）
                  <div className="text-center px-8 z-10">
                    <div
                      className="text-8xl mb-4 transition-transform duration-100"
                      style={{ transform: `rotateY(${rotation}deg)` }}
                    >
                      🏛️
                    </div>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-5 pt-20 text-white pointer-events-none">
                  <h3 className="text-xl md:text-2xl font-black font-serif mb-1 drop-shadow">{panorama.title}</h3>
                  <p className="text-xs md:text-sm text-white/90 leading-relaxed max-w-md font-serif line-clamp-2">
                    {panorama.description}
                  </p>
                </div>

                <div className="absolute bottom-2 right-2 z-20 bg-black/50 text-white/85 text-[10px] px-2 py-1 rounded-full pointer-events-none">
                  {panorama.image ? '← 拖拽平移查看实景 →' : '影像示意 · 全景采集完善中'}
                </div>

                <div className="absolute inset-0 opacity-10">
                  <svg width="100%" height="100%">
                    <defs>
                      <pattern id="compass" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                        <circle cx="30" cy="30" r="28" fill="none" stroke={panorama.accentColor} strokeWidth="0.5" />
                        <line x1="30" y1="2" x2="30" y2="58" stroke={panorama.accentColor} strokeWidth="0.5" />
                        <line x1="2" y1="30" x2="58" y2="30" stroke={panorama.accentColor} strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#compass)" />
                  </svg>
                </div>

                <div className="absolute top-4 left-4 bg-white/90 px-3 py-1.5 rounded-full text-xs font-medium text-[#5C5C5C]">
                  ← 拖拽旋转 →
                </div>

                <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-[#E8DFD5] shadow-sm flex items-center justify-center text-[#5C5C5C] hover:text-[#C41E3A] hover:bg-white transition-all" aria-label="上一个全景">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-[#E8DFD5] shadow-sm flex items-center justify-center text-[#5C5C5C] hover:text-[#C41E3A] hover:bg-white transition-all" aria-label="下一个全景">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={14} className="text-[#C41E3A]" />
                <span className="text-xs text-[#5C5C5C] font-mono">
                  {panorama.lng.toFixed(4)}, {panorama.lat.toFixed(4)}
                </span>
                <span className="text-xs text-[#C41E3A] font-medium ml-auto">{currentIdx + 1} / {panoramas.length}</span>
              </div>

              <h4 className="text-sm font-bold text-[#1A1A1A] mb-2 font-serif">场景特色</h4>
              <div className="grid grid-cols-2 gap-2">
                {panorama.features.map((feature, index) => (
                  <div key={`${panorama.id}-${index}`} className="flex items-center gap-2 p-2 rounded-lg bg-[#FEFAF6] border border-[#E8DFD5] text-xs text-[#5C5C5C]">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: panorama.accentColor }} />
                    {feature}
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-2 mt-4">
                {panoramas.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentIdx(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      index === currentIdx ? 'bg-[#C41E3A] scale-125 shadow-sm' : 'bg-[#E8DFD5] hover:bg-[#D4C5B2]'
                    }`}
                    aria-label={`查看第 ${index + 1} 个全景`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function contentToPanorama(item: PublicContentItem): Panorama | null {
  const data = item.data || {}
  const lat = Number(data.lat ?? data.latitude)
  const lng = Number(data.lng ?? data.longitude)
  const title = asText(data.title) || item.title
  const description = asText(data.description) || item.body || item.summary || ''
  const features = asStringArray(data.features)
  if (!title || !description || features.length === 0 || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return {
    id: asText(data.id) || item.id || title,
    title,
    description,
    bgColor: asText(data.bgColor) || asText(data.bg_color) || '#FEFAF6',
    accentColor: asText(data.accentColor) || asText(data.accent_color) || '#C41E3A',
    features,
    lat,
    lng,
    image: asText(data.image) || asText(data.coverImage) || asText(data.cover_image) || '',
  }
}
