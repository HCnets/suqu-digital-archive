import React, { useEffect, useState } from 'react'
import { X, BookOpen, Music, ScrollText, Library, MapPin, BookHeart, Camera, Heart, Flower2 } from 'lucide-react'
import { asRecordArray, asStringArray, asText, fetchPublishedContents, type PublicContentItem } from '@/lib/cmsContent'

type Tab = 'letters' | 'songs' | 'slogans' | 'decrees' | 'martyrs' | 'women' | 'origin' | 'history' | 'relics'

type ResourceItem = {
  id: string
  title: string
  subtitle: string
  text: string
  image?: string
}

type ResourceSection = {
  title: string
  items: ResourceItem[]
}

const TABS: { id: Tab; label: string; icon: React.ReactNode; subtitle: string }[] = [
  { id: 'letters', label: '家书文献', icon: <BookOpen size={14} />, subtitle: '后台审核资料' },
  { id: 'songs', label: '歌谣资料', icon: <Music size={14} />, subtitle: '后台审核资料' },
  { id: 'slogans', label: '标语资料', icon: <ScrollText size={14} />, subtitle: '后台审核资料' },
  { id: 'decrees', label: '法令文献', icon: <Library size={14} />, subtitle: '后台审核资料' },
  { id: 'martyrs', label: '英烈资料', icon: <Heart size={14} />, subtitle: '后台审核资料' },
  { id: 'women', label: '妇女专题', icon: <Flower2 size={14} />, subtitle: '后台审核资料' },
  { id: 'origin', label: '地名资料', icon: <MapPin size={14} />, subtitle: '后台审核资料' },
  { id: 'history', label: '历史资料', icon: <BookHeart size={14} />, subtitle: '后台审核资料' },
  { id: 'relics', label: '文物资料', icon: <Camera size={14} />, subtitle: '后台审核资料' },
]

const TAB_MODULE_KEYS: Record<Tab, string> = {
  letters: 'letters',
  songs: 'song',
  slogans: 'slogans',
  decrees: 'decrees',
  martyrs: 'martyrs',
  women: 'women',
  origin: 'origin',
  history: 'history',
  relics: 'relics',
}

const EMPTY_CONTENT = TABS.reduce((acc, tab) => {
  acc[tab.id] = { title: tab.label, items: [] }
  return acc
}, {} as Record<Tab, ResourceSection>)

function mapResourceSection(tab: Tab, moduleKey: string, items: PublicContentItem[]) {
  const mappedItems = items.flatMap(item => mapResourceItemsFromContent(item, moduleKey))
  const first = items[0]
  const fallbackTitle = TABS.find(item => item.id === tab)?.label || ''
  const title = asText(first?.data?.pageTitle) || asText(first?.data?.page_title) || asText(first?.data?.title) || asText(first?.title) || fallbackTitle
  return {
    title,
    items: mappedItems,
  }
}

function mapResourceItemsFromContent(item: PublicContentItem, moduleKey: string) {
  const data = item.data || {}
  const nested = asRecordArray(data.items).map((entry, index) => {
    const title = asText(entry.title) || asText(entry.name)
    const subtitle = asText(entry.subtitle) || asText(entry.time) || asText(entry.date) || asText(entry.source)
    const text = asText(entry.text) || asText(entry.description) || asText(entry.body) || asText(entry.content)
    const image = asText(entry.image) || ''
    return title && subtitle && text ? { id: `${item.id || item.title}-${index}`, title, subtitle, text, image } : null
  }).filter(Boolean) as ResourceItem[]

  if (nested.length > 0) return nested

  const title = asText(data.title) || item.title
  const subtitle = buildResourceSubtitle(item)
  const text = buildResourceText(item, moduleKey)
  const image = asText(data.image) || ''
  return title && subtitle && text ? [{ id: item.id || title, title, subtitle, text, image }] : []
}

function buildResourceSubtitle(item: PublicContentItem) {
  const data = item.data || {}
  const year = asText(data.year) || asText(data.years)
  const source = asText(data.source) || asText(data.origin)
  return asText(data.subtitle)
    || asText(data.time)
    || asText(data.date)
    || [source, year].filter(Boolean).join(' · ')
    || item.summary
    || item.category
    || ''
}

function buildResourceText(item: PublicContentItem, moduleKey: string) {
  const data = item.data || {}
  const lyrics = moduleKey === 'song' ? asStringArray(data.lyrics) : []
  return asText(data.text)
    || asText(data.description)
    || item.body
    || (lyrics.length > 0 ? lyrics.join('。') : '')
}

export const RedResourceHub: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('letters')
  const [content, setContent] = useState<Record<Tab, ResourceSection>>(EMPTY_CONTENT)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadCmsContent() {
      setLoading(true)
      try {
        const entries = await Promise.all(
          (Object.entries(TAB_MODULE_KEYS) as Array<[Tab, string]>).map(async ([tab, moduleKey]) => [tab, moduleKey, await fetchPublishedContents(moduleKey, 100)] as const)
        )
        if (cancelled) return
        const next = { ...EMPTY_CONTENT }
        for (const [tab, moduleKey, items] of entries) {
          next[tab] = mapResourceSection(tab, moduleKey, items)
        }
        setContent(next)
      } catch {
        if (!cancelled) setContent(EMPTY_CONTENT)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadCmsContent()
    return () => { cancelled = true }
  }, [])

  const data = content[activeTab]

  return (
    <div className="fixed inset-0 z-[85] pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white border-l border-[#E8DFD5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-400">
        <div className="flex items-center justify-between p-5 border-b border-[#E8DFD5] bg-[#FEFAF6]">
          <h2 className="text-lg font-bold text-[#1A1A1A] font-serif tracking-wider flex items-center gap-2">
            <span className="w-1 h-5 bg-[#C41E3A] rounded-full" />
            红色资源文库
          </h2>
          <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭资源库">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="overflow-x-auto flex-shrink-0 border-b border-[#E8DFD5] bg-white">
            <div className="flex px-2 py-2 gap-0.5 min-w-max">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl min-w-[72px] transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-[#FDE8EC] text-[#C41E3A]'
                      : 'text-[#5C5C5C] hover:bg-[#FEFAF6]'
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs font-medium">
                    {tab.icon}
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </div>
                  <span className="text-[9px] opacity-50">{tab.subtitle}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-2xl font-bold text-[#1A1A1A] font-serif tracking-wide mb-1">{data.title}</h3>
            <p className="text-sm text-[#5C5C5C] mb-6">{TABS.find(t => t.id === activeTab)?.subtitle}</p>
            
            {loading ? (
              <div className="py-16 text-center">
                <div className="w-10 h-10 rounded-full border-2 border-[#E8DFD5] border-t-[#C41E3A] animate-spin mx-auto mb-4" />
                <p className="text-sm text-[#5C5C5C]">正在读取已审核发布的资源文库资料</p>
              </div>
            ) : data.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#E8DFD5] bg-[#FEFAF6] p-8 text-center">
                <p className="text-sm text-[#5C5C5C] leading-relaxed">
                  当前栏目暂无已审核发布的资源文库资料。
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {data.items.map((item, idx) => (
                  <div key={item.id} className="museum-card p-5 rounded-2xl border border-[#E8DFD5] hover:border-[#C41E3A]/20 transition-all">
                    {item.image ? (
                      <img src={item.image} alt={item.title} loading="lazy" className="w-full h-44 object-cover rounded-xl mb-4" />
                    ) : null}
                    <div className="flex items-start gap-3 mb-3">
                      <span className="w-7 h-7 rounded-lg bg-[#FDE8EC] text-[#C41E3A] flex items-center justify-center text-sm font-bold flex-shrink-0">{idx + 1}</span>
                      <div>
                        <h4 className="font-bold text-[#1A1A1A] font-serif leading-snug">{item.title}</h4>
                        <p className="text-xs text-[#C41E3A] font-medium mt-0.5">{item.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-sm text-[#5C5C5C] leading-relaxed font-serif ml-10">{item.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
