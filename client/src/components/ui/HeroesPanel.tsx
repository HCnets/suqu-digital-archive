import React from 'react'
import { X, Star, Shield, BookOpen, Heart } from 'lucide-react'
import { asText, fetchPublishedContents, type PublicContentItem } from '@/lib/cmsContent'

interface Hero {
  id: string
  name: string
  role: string
  years: string
  category: 'leader' | 'soldier' | 'civilian'
  story: string
  legacy: string
}

const CATEGORY_CONFIG: Record<Hero['category'], { label: string, color: string, bg: string, icon: React.FC<{ size?: number, style?: React.CSSProperties, className?: string }> }> = {
  leader: { label: '革命领袖', color: '#C41E3A', bg: '#FDE8EC', icon: Star },
  soldier: { label: '红军战士', color: '#8B6914', bg: '#FFF8E1', icon: Shield },
  civilian: { label: '人民群众', color: '#2E7D32', bg: '#E8F5E9', icon: Heart }
}

interface HeroesPanelProps {
  onClose: () => void
}

export const HeroesPanel: React.FC<HeroesPanelProps> = ({ onClose }) => {
  const [heroes, setHeroes] = React.useState<Hero[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    async function loadHeroes() {
      setLoading(true)
      try {
        const items = await fetchPublishedContents('hero', 100)
        const cmsHeroes = items.map(contentToHero).filter(Boolean) as Hero[]
        if (!cancelled) setHeroes(cmsHeroes)
      } catch {
        if (!cancelled) setHeroes([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadHeroes()
    return () => { cancelled = true }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/55"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl animate-in zoom-in-95 fade-in duration-400 bg-museum-bg"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 p-2.5 rounded-full bg-white/95 border border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:bg-[#FDE8EC] hover:border-[#C41E3A]/30 transition-all min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation"
          aria-label="关闭英雄谱"
        >
          <X size={22} />
        </button>

        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#C41E3A] via-[#8B6914] to-[#C41E3A]" />

        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-px bg-party-red/30" />
              <span className="text-3xl">★</span>
              <div className="w-12 h-px bg-party-red/30" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-[#C41E3A] font-serif tracking-widest">
              革命先驱 · 英雄谱
            </h2>
            <p className="text-sm text-[#5C5C5C] mt-2 tracking-wider">
              当前收录 {heroes.length} 位已审核发布的英雄人物
            </p>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-[#E8DFD5] border-t-[#C41E3A] animate-spin mx-auto mb-4" />
              <p className="text-sm text-[#5C5C5C]">正在读取已审核发布的英雄谱资料</p>
            </div>
          ) : heroes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E8DFD5] bg-white/70 p-8 text-center">
              <p className="text-sm text-[#5C5C5C] leading-relaxed">
                当前暂无已审核发布的英雄谱资料。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {heroes.map((hero) => {
                const catConfig = CATEGORY_CONFIG[hero.category]
                const CatIcon = catConfig.icon
                return (
                  <div
                    key={hero.id}
                    className="relative p-5 rounded-2xl border transition-all duration-200 hover:shadow-md group"
                    style={{ backgroundColor: catConfig.bg, borderColor: `${catConfig.color}15` }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${catConfig.color}15` }}
                      >
                        <CatIcon size={20} style={{ color: catConfig.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-[#1A1A1A] font-serif tracking-wide">
                            {hero.name}
                          </h3>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium tracking-wider"
                            style={{ color: catConfig.color, backgroundColor: `${catConfig.color}10` }}
                          >
                            {catConfig.label}
                          </span>
                        </div>
                        <p className="text-xs font-medium mt-0.5" style={{ color: catConfig.color }}>
                          {hero.role}
                        </p>
                        <p className="text-xs text-[#5C5C5C]/60 mt-0.5">
                          {hero.years}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-[#1A1A1A] leading-relaxed font-serif">
                      {hero.story}
                    </p>

                    <div className="mt-3 pt-3 border-t" style={{ borderColor: `${catConfig.color}15` }}>
                      <p className="text-xs italic leading-relaxed" style={{ color: catConfig.color }}>
                        <BookOpen size={11} className="inline mr-1" style={{ color: catConfig.color, opacity: 0.5 }} />
                        {hero.legacy}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function contentToHero(item: PublicContentItem): Hero | null {
  const data = item.data || {}
  const name = asText(data.name) || item.title
  const role = asText(data.role) || item.summary || ''
  const years = asText(data.years) || asText(data.year) || ''
  const category = normalizeHeroCategory(asText(data.category) || item.category || '')
  const story = asText(data.story) || item.body || item.summary || ''
  const legacy = asText(data.legacy) || asText(data.quote) || ''

  if (!name || !role || !years || !category || !story || !legacy) return null
  return { id: item.id || name, name, role, years, category, story, legacy }
}

function normalizeHeroCategory(value: string): Hero['category'] | '' {
  if (value === 'leader' || value === 'soldier' || value === 'civilian') return value
  if (value.includes('领袖') || value.includes('领导')) return 'leader'
  if (value.includes('战士') || value.includes('红军')) return 'soldier'
  if (value.includes('群众') || value.includes('交通') || value.includes('讲解')) return 'civilian'
  return ''
}
