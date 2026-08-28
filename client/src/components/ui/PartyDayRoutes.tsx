import React, { useEffect, useState } from 'react'
import { X, MapPin, Clock, Users, Play, Flag, BookOpen, Heart, Stars, Shield } from 'lucide-react'
import { asStringArray, asText, fetchPublishedContents, type PublicContentItem } from '@/lib/cmsContent'
import { useAppStore } from '@/store'

interface Route {
  id: string
  title: string
  subtitle: string
  target: string
  duration: string
  icon: React.ReactNode
  color: string
  pois: string[]
  description: string
  opening: string
}

export const PartyDayRoutes: React.FC<{ onClose: () => void; onStartRoute: (poiIds: string[], opening: string) => void }> = ({ onClose, onStartRoute }) => {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
  const getAllArchives = useAppStore(state => state.getAllArchives)

  useEffect(() => {
    let cancelled = false
    async function loadRoutes() {
      setLoading(true)
      try {
        const items = await fetchPublishedContents('party_route', 100)
        const cmsRoutes = items.map(contentToPartyRoute).filter(Boolean) as Route[]
        if (!cancelled) setRoutes(cmsRoutes)
      } catch {
        if (!cancelled) setRoutes([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadRoutes()
    return () => { cancelled = true }
  }, [])

  const route = routes.find(r => r.id === selectedRoute)
  const archiveList = getAllArchives()
  const archiveTitle = (poiId: string) => archiveList.find(archive => archive.id === poiId)?.title || poiId

  if (route) {
    return (
      <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8DFD5] p-6 animate-in zoom-in-95 duration-400">
          <button onClick={() => setSelectedRoute(null)} className="absolute top-4 left-4 p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FEFAF6] text-[#5C5C5C] transition-all flex items-center justify-center" aria-label="返回">
            ← 返回
          </button>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭">
            <X size={20} />
          </button>
          
          <div className="mt-8 text-center mb-6">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: route.color + '15', color: route.color }}>
              {route.icon}
            </div>
            <h2 className="text-xl font-bold text-[#1A1A1A] font-serif">{route.title}</h2>
            <p className="text-sm text-[#5C5C5C]">{route.subtitle}</p>
          </div>

          <div className="flex items-center gap-4 mb-4 text-sm text-[#5C5C5C]">
            <span className="flex items-center gap-1"><Clock size={14} /> {route.duration}</span>
            <span className="flex items-center gap-1"><Users size={14} /> {route.target}</span>
            <span className="flex items-center gap-1"><MapPin size={14} /> {route.pois.length}个点位</span>
          </div>

          <p className="text-sm text-[#5C5C5C] leading-relaxed mb-5 font-serif">{route.description}</p>

          <div className="space-y-2 mb-6">
            {route.pois.map((poiId, idx) => (
              <div key={poiId} className="flex items-center gap-3 p-3 rounded-xl bg-[#FEFAF6] border border-[#E8DFD5]">
                <span className="w-6 h-6 rounded-full bg-[#C41E3A] text-white text-xs flex items-center justify-center font-bold">{idx + 1}</span>
                <span className="text-sm font-medium text-[#1A1A1A]">
                  {archiveTitle(poiId)}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => onStartRoute(route.pois, route.opening)}
            className="w-full py-3.5 rounded-xl bg-[#C41E3A] text-white font-bold hover:bg-[#C41E3A]/90 transition-all flex items-center justify-center gap-2"
          >
            <Play size={18} /> 开始{route.title}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#E8DFD5] p-6 animate-in zoom-in-95 duration-400">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-[#1A1A1A] font-serif mb-1 flex items-center gap-2">
          <Flag size={18} className="text-[#C41E3A]" />
          主题党日活动路线
        </h2>
        <p className="text-sm text-[#5C5C5C] mb-6">选择一条学习路线，系统将自动导航讲解</p>
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-10 h-10 rounded-full border-2 border-[#E8DFD5] border-t-[#C41E3A] animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#5C5C5C]">正在读取已发布的党日路线</p>
          </div>
        ) : routes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E8DFD5] bg-[#FEFAF6] p-4 text-sm leading-relaxed text-[#5C5C5C]">
            当前暂无已审核发布的主题党日路线。
          </div>
        ) : (
          <div className="space-y-3">
            {routes.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRoute(r.id)}
              className="w-full p-4 rounded-2xl border border-[#E8DFD5] hover:border-[#C41E3A]/30 transition-all text-left hover:shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: r.color + '15', color: r.color }}>
                  {r.icon}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[#1A1A1A] text-sm">{r.title}</div>
                  <div className="text-xs text-[#5C5C5C]">{r.subtitle} · {r.duration}</div>
                </div>
                <div className="flex -space-x-1">
                  {r.pois.map((_, i) => (
                    <div key={i} className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: r.color, opacity: 0.3 + i * 0.2 }} />
                  ))}
                </div>
              </div>
            </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function contentToPartyRoute(item: PublicContentItem): Route | null {
  const data = item.data || {}
  const id = asText(data.id) || item.id || item.title
  const title = asText(data.title) || item.title
  const pois = asStringArray(data.pois)
  const description = asText(data.description) || item.body || item.summary || ''
  const opening = asText(data.opening)
  const subtitle = asText(data.subtitle) || item.summary || ''
  const target = asText(data.target)
  const duration = asText(data.duration)

  if (!id || !title || !subtitle || !target || !duration || !description || !opening || pois.length === 0) return null
  return {
    id,
    title,
    subtitle,
    target,
    duration,
    icon: routeIcon(asText(data.iconKey) || item.category || title),
    color: asText(data.color) || '#C41E3A',
    pois,
    description,
    opening,
  }
}

function routeIcon(value: string) {
  if (value.includes('book') || value.includes('theory')) return <BookOpen size={18} />
  if (value.includes('star') || value.includes('youth')) return <Stars size={18} />
  if (value.includes('shield') || value.includes('secret')) return <Shield size={18} />
  if (value.includes('people') || value.includes('mass')) return <Users size={18} />
  return <Heart size={18} />
}
