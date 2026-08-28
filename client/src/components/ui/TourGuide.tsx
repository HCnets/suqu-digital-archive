import React, { useEffect, useState } from 'react'
import { X, Clock, Route, Download, Footprints, Map } from 'lucide-react'
import { asRecordArray, asText, fetchPublishedContents, type PublicContentItem } from '@/lib/cmsContent'
import { useAppStore } from '@/store'

interface TourItem {
  id: string
  name: string
  time: string
  duration: string
  description: string
}

interface TourRoute {
  name: string
  items: TourItem[]
  color: string
  icon: string
  desc: string
}

export const TourGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeRoute, setActiveRoute] = useState<number>(0)
  const [cmsRoutes, setCmsRoutes] = useState<TourRoute[]>([])
  const [loading, setLoading] = useState(true)
  const regionName = useAppStore(state => state.regionConfig.defaultRegion?.name || state.regionConfig.defaultRegion?.fullName || '')
  const guideTitle = regionName ? `${regionName}红色文旅导览` : '红色文旅导览'
  const systemName = regionName ? `${regionName}数字化红色档案系统` : '数字化红色档案系统'

  useEffect(() => {
    let cancelled = false
    async function loadRoutes() {
      setLoading(true)
      try {
        const items = await fetchPublishedContents('tour_route', 100)
        const nextRoutes = items.map(contentToTourRoute).filter(Boolean) as TourRoute[]
        if (!cancelled) {
          setCmsRoutes(nextRoutes)
          setActiveRoute(0)
        }
      } catch {
        if (!cancelled) setCmsRoutes([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadRoutes()
    return () => { cancelled = true }
  }, [])

  const displayRoutes: TourRoute[] = cmsRoutes
  const curr = displayRoutes[activeRoute] || displayRoutes[0]

  const generateTourText = () => {
    if (!curr) return ''
    let text = '═══════════════════════════\n'
    text += `  ${guideTitle}手册\n`
    text += `  ${curr.name}\n`
    text += `  ${curr.desc}\n`
    text += '═══════════════════════════\n\n'
    curr.items.forEach((item, i) => {
      text += `${i + 1}. ${item.time}  ${item.name}\n`
      text += `   预计时间: ${item.duration}\n`
      text += `   ${item.description}\n\n`
    })
    text += '═══════════════════════════\n'
    text += `  ${systemName} 出品\n`
    text += `  生成日期: ${new Date().toLocaleDateString('zh-CN')}\n`
    text += '═══════════════════════════\n'
    return text
  }

  const handleDownload = () => {
    if (!curr) return
    const blob = new Blob([generateTourText()], { type: 'text/plain;charset=UTF-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${guideTitle}_${curr.name}_${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-[85] pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white border-l border-[#E8DFD5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-400 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-[#E8DFD5] bg-[#FEFAF6]">
          <div className="flex items-center gap-2">
            <Map size={18} className="text-[#C41E3A]" />
            <h2 className="text-lg font-bold text-[#1A1A1A] font-serif">{guideTitle}</h2>
          </div>
          <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-[#E8DFD5] border-t-[#C41E3A] animate-spin mx-auto mb-4" />
              <p className="text-sm text-[#5C5C5C]">正在读取已审核发布的文旅导览路线</p>
            </div>
          ) : !curr ? (
            <div className="rounded-xl border border-dashed border-[#E8DFD5] bg-[#FEFAF6] p-5 text-sm leading-relaxed text-[#5C5C5C]">
              当前暂无已审核发布的文旅导览路线。
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
                {displayRoutes.map((r, i) => (
                  <button
                    key={r.name}
                    onClick={() => setActiveRoute(i)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      i === activeRoute
                        ? 'bg-[#FDE8EC] border-[#C41E3A]/40 shadow-sm'
                        : 'bg-white border-[#E8DFD5] hover:bg-[#FEFAF6] hover:border-[#C41E3A]/20'
                    }`}
                  >
                    <div className="text-2xl mb-1">{r.icon || <Map size={20} className="mx-auto" />}</div>
                    <div className={`text-xs font-bold font-serif ${i === activeRoute ? 'text-[#C41E3A]' : 'text-[#5C5C5C]'}`}>
                      {r.name}
                    </div>
                  </button>
                ))}
              </div>

              <div className="museum-card p-5 rounded-2xl border border-[#E8DFD5] mb-6" style={{ borderTopColor: curr.color, borderTopWidth: '3px' }}>
                <h3 className="text-lg font-bold font-serif mb-2" style={{ color: curr.color }}>{curr.name}</h3>
                <p className="text-sm text-[#5C5C5C] mb-4">{curr.desc}</p>

                <div className="flex items-center gap-2 text-xs text-[#5C5C5C] mb-3">
                  <Clock size={12} />
                  <span>站点数量：{curr.items.length}</span>
                  <span className="mx-2">|</span>
                  <Footprints size={12} />
                  <span>路线来自后台审核发布</span>
                </div>

                <div className="space-y-2">
                  {curr.items.map((item, i) => (
                    <div key={item.id} className="flex gap-3 p-3 rounded-lg bg-[#FEFAF6] border border-[#E8DFD5]">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: curr.color }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#1A1A1A] font-serif">{item.name}</h4>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-mono text-[#5C5C5C] bg-white px-2 py-0.5 rounded border border-[#E8DFD5]">⏰ {item.time}</span>
                          <span className="text-[10px] text-[#5C5C5C]">⏱ {item.duration}</span>
                        </div>
                        <p className="text-xs text-[#5C5C5C] mt-1.5 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FDE8EC] border border-[#C41E3A]/20 text-center">
                <Route size={20} className="text-[#C41E3A] mx-auto mb-2" />
                <p className="text-xs text-[#5C5C5C] mb-3">
                  以上路线来自后台审核发布，可根据实际需求在后台调整后重新发布。
                </p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-lg bg-[#C41E3A] text-white text-sm font-medium hover:bg-[#A01830] transition-all flex items-center gap-2 mx-auto"
                >
                  <Download size={14} />
                  下载导览手册
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function contentToTourRoute(item: PublicContentItem): TourRoute | null {
  const data = item.data || {}
  const routeItems = asRecordArray(data.items).map((entry, index) => ({
    id: asText(entry.id) || String(index + 1),
    name: asText(entry.name) || asText(entry.title),
    time: asText(entry.time),
    duration: asText(entry.duration),
    description: asText(entry.description) || asText(entry.body),
  })).filter(entry => entry.name && entry.time && entry.duration && entry.description)

  const name = asText(data.name) || asText(data.title) || item.title
  const desc = asText(data.desc) || asText(data.description) || item.summary || ''
  if (!name || !desc || routeItems.length === 0) return null

  return {
    name,
    items: routeItems,
    color: asText(data.color) || '#C41E3A',
    icon: asText(data.icon) || asText(data.iconChar) || '',
    desc,
  }
}
