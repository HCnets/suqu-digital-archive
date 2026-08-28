import React, { useEffect, useState } from 'react'
import { X, Film, Tv, Clapperboard, Info } from 'lucide-react'
import { asText, fetchPublishedContents, type PublicContentItem } from '@/lib/cmsContent'

interface FilmItem {
  id: string
  title: string
  year: string
  type: '电影' | '电视剧' | '纪录片'
  description: string
  connection: string
  accent: string
}

export const RedFilmArchive: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [expanded, setExpanded] = useState<number | null>(null)
  const [films, setFilms] = useState<FilmItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadFilms() {
      setLoading(true)
      try {
        const items = await fetchPublishedContents('film', 100)
        const cmsFilms = items.map(contentToFilm).filter(Boolean) as FilmItem[]
        if (!cancelled) {
          setFilms(cmsFilms)
          setExpanded(null)
        }
      } catch {
        if (!cancelled) setFilms([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadFilms()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="fixed inset-0 z-[85] pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white border-l border-[#E8DFD5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-400 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-[#E8DFD5] bg-[#FEFAF6]">
          <div className="flex items-center gap-2">
            <Film size={18} className="text-[#C41E3A]" />
            <h2 className="text-lg font-bold text-[#1A1A1A] font-serif">红色影视资料库</h2>
          </div>
          <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1">
          <div className="museum-card p-5 rounded-2xl border border-[#E8DFD5] mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Clapperboard size={24} className="text-[#C41E3A]" />
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A] font-serif">影视中的苏区记忆</h3>
                <p className="text-xs text-[#5C5C5C] mt-1">
                  当前收录 {films.length} 部已审核发布的红色影视资料。每部作品均须附“与苏区的关联”说明。
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-[#E8DFD5] border-t-[#C41E3A] animate-spin mx-auto mb-4" />
              <p className="text-sm text-[#5C5C5C]">正在读取已审核发布的红色影视资料</p>
            </div>
          ) : films.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E8DFD5] bg-[#FEFAF6] p-5 text-sm leading-relaxed text-[#5C5C5C]">
              当前暂无已审核发布的红色影视资料。
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {films.map((film, i) => (
              <div
                key={film.id}
                className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                  expanded === i ? 'border-[#C41E3A]/40 shadow-sm' : 'border-[#E8DFD5]'
                }`}
              >
                <div
                  className="p-4 cursor-pointer hover:bg-[#FEFAF6] transition-all"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  style={{ borderLeft: `4px solid ${film.accent}` }}
                >
                  <div className="flex items-center gap-3">
                  {/* CSS 电影海报卡片 */}
                  <div className="w-14 h-20 rounded-lg flex-shrink-0 flex flex-col items-center justify-center relative overflow-hidden" style={{ backgroundColor: `${film.accent}15`, border: `1.5px solid ${film.accent}30` }}>
                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: film.accent, opacity: 0.6 }} />
                    <span className="text-[9px] font-black font-serif tracking-widest leading-tight text-center px-1" style={{ color: film.accent }}>
                      {film.title.length > 4 ? film.title.slice(0, 4) : film.title}
                    </span>
                    <span className="text-[7px] font-mono mt-0.5" style={{ color: film.accent, opacity: 0.5 }}>{film.year}</span>
                    <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: film.accent, opacity: 0.3 }} />
                      <div className="flex items-center gap-2 mt-1">
                        {film.type === '电影' && <Tv size={10} className="text-[#C41E3A]" />}
                        {film.type === '电视剧' && <Tv size={10} className="text-[#8B6914]" />}
                        {film.type === '纪录片' && <Film size={10} className="text-[#2E7D32]" />}
                        <span className="text-[10px] text-[#5C5C5C]">{film.type}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {expanded === i && (
                  <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-xs text-[#5C5C5C] leading-relaxed mb-3">{film.description}</p>
                    <div className="p-3 rounded-lg bg-[#FDE8EC] border border-[#C41E3A]/20">
                      <div className="flex items-center gap-1 mb-1">
                        <Info size={10} className="text-[#C41E3A]" />
                        <span className="text-[10px] font-bold text-[#C41E3A]">关联说明</span>
                      </div>
                      <p className="text-xs text-[#5C5C5C] leading-relaxed">{film.connection}</p>
                    </div>
                  </div>
                )}
              </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function contentToFilm(item: PublicContentItem): FilmItem | null {
  const data = item.data || {}
  const title = asText(data.title) || item.title
  const year = asText(data.year) || asText(data.years) || ''
  const type = normalizeFilmType(asText(data.type) || item.category || '')
  const description = asText(data.description) || item.summary || ''
  const connection = asText(data.connection) || asText(data.legacy) || item.body || ''
  const accent = asText(data.accent) || '#C41E3A'

  if (!title || !year || !type || !description || !connection) return null
  return { id: item.id || title, title, year, type, description, connection, accent }
}

function normalizeFilmType(value: string): FilmItem['type'] | '' {
  if (value === '电影' || value === '电视剧' || value === '纪录片') return value
  if (value.includes('纪录')) return '纪录片'
  if (value.includes('片') || value.includes('电影')) return '电影'
  return '电视剧'
}
