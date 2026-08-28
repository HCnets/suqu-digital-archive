import React from 'react'
import { useAppStore, type ArchiveData } from '@/store'
import { MapPin, Calendar, Image as ImageIcon, X, Volume2, Square, Layers, BookOpen, Landmark, Navigation, Mic2, Sparkles, HelpCircle, Route as RouteIcon, MessageSquare } from 'lucide-react'

const AUDIO_BARS = Array.from({ length: 16 }, (_, i) => ({
  height: `${18 + ((i * 17) % 38)}%`,
  animation: `pulse ${0.32 + (i % 5) * 0.08}s ease-in-out infinite alternate`
}))

const archiveTypeMeta = {
  revolution: { label: '革命遗址', tone: '#C41E3A' },
  government: { label: '红色政权', tone: '#5C5C5C' },
  culture: { label: '红色文化', tone: '#8B6914' },
} as const

const resolveAssetUrl = (url: string) => {
  const value = url.trim()
  if (!value) return ''
  if (/^(https?:|data:|blob:)/i.test(value)) return value
  if (value.startsWith('/')) return value
  return `${import.meta.env.BASE_URL}${value.replace(/^\/+/, '')}`
}

const unique = <T,>(items: T[]) => Array.from(new Set(items.filter(Boolean)))

const trustLabel = (value?: string) => {
  const text = (value || '').trim().toLowerCase()
  if (!text) return '待补充'
  if (['high', 'official', 'verified', '权威', '高'].includes(text)) return '高可信'
  if (['normal', 'medium', '基础资料'].includes(text)) return value || '基础资料'
  return value || '待补充'
}

const auditStatusLabel = (value?: string) => {
  if (value === 'published') return '已审核发布'
  if (value === 'legacy') return '基础资料库'
  return '公开展示'
}

const DEFAULT_DETAIL_BLOCKS = [
  { type: 'basic', title: '基本信息', order: 1, enabled: true },
  { type: 'history', title: '历史背景', order: 2, enabled: true },
  { type: 'oral_history', title: '口述历史', order: 3, enabled: true },
  { type: 'media', title: '图片/视频', order: 4, enabled: true },
  { type: 'ai_narration', title: 'AI 讲解', order: 5, enabled: true },
  { type: 'timeline', title: '展陈时间线', order: 6, enabled: true },
  { type: 'related_people', title: '相关人物', order: 7, enabled: true },
  { type: 'related_events', title: '相关事件', order: 8, enabled: true },
  { type: 'learning_questions', title: '学习问题', order: 9, enabled: true },
  { type: 'route', title: '参观路线', order: 10, enabled: true },
  { type: 'messages', title: '群众留言', order: 11, enabled: true },
  { type: 'sources', title: '来源依据', order: 12, enabled: true },
  { type: 'risk_note', title: '审校说明', order: 13, enabled: true },
]

const getDetailBlocks = (archive: ArchiveData) => {
  const configured = archive.detailBlocks?.length ? archive.detailBlocks : DEFAULT_DETAIL_BLOCKS
  return configured
    .filter(block => block.enabled !== false)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
}

const SectionShell: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode; tone?: 'default' | 'warm' }> = ({ title, icon, children, tone = 'default' }) => (
  <section className={`rounded-2xl border p-4 md:p-5 ${tone === 'warm' ? 'border-[#8B6914]/20 bg-[#FFF8E1]' : 'border-[#E8DFD5] bg-white'}`}>
    <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#C41E3A] font-serif tracking-wide">
      {icon || <span className="w-1.5 h-1.5 rounded-full bg-[#C41E3A]" />}
      {title}
    </h4>
    {children}
  </section>
)

const EmptyBlock: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-sm leading-relaxed text-[#5C5C5C]">{text}</p>
)

const MuseumPlaceholder: React.FC<{ archive: ArchiveData }> = ({ archive }) => {
  const bgColor = archive.type === 'revolution' ? '#FDE8EC' : archive.type === 'government' ? '#F5F0EB' : '#FFF8E1'
  const accentColor = archive.type === 'revolution' ? '#C41E3A' : archive.type === 'government' ? '#5C5C5C' : '#8B6914'
  const label = archive.type === 'revolution' ? '红色革命遗址' : archive.type === 'government' ? '党政服务点位' : '群众文化阵地'

  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden border border-[#E8DFD5] relative flex items-center justify-center group" style={{ background: `linear-gradient(135deg, ${bgColor} 20%, #FEFAF6 60%, ${bgColor}30 100%)` }}>
      {/* 装饰边框 */}
      <div className="absolute inset-3 rounded-xl border border-dashed opacity-20" style={{ borderColor: accentColor }} />
      
      {/* 建筑 SVG 插画 */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet">
        {/* 天空渐变背景 */}
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={bgColor} stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#FEFAF6" stopOpacity="0.9"/>
          </linearGradient>
          <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.05"/>
          </linearGradient>
        </defs>
        <rect width="800" height="450" fill="url(#skyGrad)"/>
        
        {/* 远山 */}
        <path d="M0 350 Q100 280 200 350 Q300 300 400 360 Q500 290 600 350 Q700 310 800 350 L800 450 L0 450Z" fill="#E8DFD5" opacity="0.5"/>
        
        <rect x="240" y="170" width="320" height="180" fill={accentColor} opacity="0.08" stroke={accentColor} strokeWidth="1.2" rx="4"/>
        <rect x="240" y="170" width="320" height="28" fill={accentColor} opacity="0.1"/>
        <rect x="285" y="235" width="58" height="76" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="0.6"/>
        <rect x="371" y="235" width="58" height="76" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="0.6"/>
        <rect x="457" y="235" width="58" height="76" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="0.6"/>
        <circle cx="400" cy="212" r="18" fill="none" stroke={accentColor} strokeWidth="1" opacity="0.25"/>
        <line x1="400" y1="194" x2="400" y2="230" stroke={accentColor} strokeWidth="0.8" opacity="0.25"/>
      </svg>

      {/* 文字叠加 */}
      <div className="absolute bottom-6 inset-x-0 text-center z-10">
        <div className="text-lg font-bold font-serif text-[#1A1A1A] tracking-wide drop-shadow-sm">{archive.title}</div>
        <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-serif tracking-wider" style={{ color: accentColor, backgroundColor: bgColor, border: `1px solid ${accentColor}30` }}>
          {archive.year}年 · {label} · 媒体待补充
        </div>
      </div>
    </div>
  )
}

export const ArchiveDetailModal: React.FC = () => {
  const { selectedPoiId, getArchiveData, isDetailModalOpen, setDetailModalOpen, setIndoorMode, setRelicMode, setSelectedPoiId, mainMapInstance } = useAppStore()
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [mediaUiState, setMediaUiState] = React.useState<{ archiveId: string; failedImageId: string | null; activeMediaIndex: number }>({
    archiveId: '',
    failedImageId: null,
    activeMediaIndex: 0,
  })
  if (!isDetailModalOpen || !selectedPoiId) return null
  
  const archive = getArchiveData(selectedPoiId)
  if (!archive) return null
  const isSameMediaArchive = mediaUiState.archiveId === selectedPoiId
  const activeMediaIndex = isSameMediaArchive ? mediaUiState.activeMediaIndex : 0
  const failedImageId = isSameMediaArchive ? mediaUiState.failedImageId : null
  const imgFailed = failedImageId === selectedPoiId
  const typeMeta = archiveTypeMeta[archive.type] || archiveTypeMeta.revolution
  const mediaItems = archive.media?.filter(item => item.url) || []
  const primaryMedia = mediaItems[activeMediaIndex] || mediaItems[0]
  const imageCandidates = unique([
    primaryMedia?.url ? resolveAssetUrl(primaryMedia.url) : '',
    archive.coverImage ? resolveAssetUrl(archive.coverImage) : '',
  ])
  const primaryImage = imageCandidates[0] || ''
  const fallbackImage = imageCandidates[1] || ''
  const regionText = archive.regionName || '未配置地区'
  const locationText = archive.address || archive.regionName || '位置待补充'
  const sources = archive.sources || []
  const timeline = archive.displayTimeline || []
  const detailBlocks = getDetailBlocks(archive)
  const blockTitle = (type: string, fallback: string) => detailBlocks.find(block => block.type === type)?.title || fallback

  const handleClose = () => {
    setDetailModalOpen(false)
    setSelectedPoiId(null)
  }

  const updateMediaUiState = (patch: Partial<{ failedImageId: string | null; activeMediaIndex: number }>) => {
    setMediaUiState((current) => ({
      archiveId: selectedPoiId,
      failedImageId: current.archiveId === selectedPoiId ? current.failedImageId : null,
      activeMediaIndex: current.archiveId === selectedPoiId ? current.activeMediaIndex : 0,
      ...patch,
    }))
  }

  const handleLearnCourse = () => {
    setDetailModalOpen(false)
    if (mainMapInstance) {
      mainMapInstance.flyTo({
        center: [archive.longitude, archive.latitude],
        zoom: 17,
        pitch: 65,
        bearing: -20,
        duration: 2000,
        essential: true
      })
    }
  }

  const handleToggleAudio = () => {
    if (isPlaying) {
      window.speechSynthesis?.cancel()
      setIsPlaying(false)
      return
    }
    const msg = new SpeechSynthesisUtterance()
    msg.text = `${archive.title}。${archive.year}年。${archive.description}`
    msg.lang = 'zh-CN'
    msg.rate = 0.85
    msg.pitch = 1.0
    msg.onend = () => setIsPlaying(false)
    window.speechSynthesis?.speak(msg)
    setIsPlaying(true)
  }

  const renderMediaBlock = (title: string) => (
    <SectionShell key="media" title={title} icon={<ImageIcon size={18} />}>
      {primaryImage && !imgFailed ? (
        <div className="w-full aspect-video rounded-2xl overflow-hidden bg-[#FEFAF6] border border-[#E8DFD5] relative group">
          <img
            src={primaryImage}
            alt={primaryMedia?.caption || archive.title}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const img = e.currentTarget
              if (fallbackImage && img.dataset.fallbackTried !== 'true') {
                img.dataset.fallbackTried = 'true'
                img.src = fallbackImage
              } else {
                updateMediaUiState({ failedImageId: selectedPoiId })
              }
            }}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-white/90 to-transparent">
            <p className="text-[#1A1A1A]/90 text-sm flex items-center gap-2 font-serif">
              <ImageIcon size={14} className="text-[#C41E3A]" /> {primaryMedia?.caption || archive.title}
            </p>
          </div>
        </div>
      ) : (
        <MuseumPlaceholder archive={archive} />
      )}

      {mediaItems.length > 1 && (
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
          {mediaItems.map((m, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                updateMediaUiState({ activeMediaIndex: idx, failedImageId: null })
              }}
              className={`w-32 aspect-video rounded-xl overflow-hidden bg-[#FEFAF6] border flex-shrink-0 cursor-pointer transition-all hover:shadow-sm duration-200 p-0 ${
                activeMediaIndex === idx ? 'border-[#C41E3A] ring-2 ring-[#C41E3A]/20' : 'border-[#E8DFD5] hover:border-[#C41E3A]/30'
              }`}
            >
              <img src={resolveAssetUrl(m.url)} alt={m.caption || archive.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </SectionShell>
  )

  const renderDetailBlock = (block: (typeof detailBlocks)[number]) => {
    const type = block.type
    const title = block.title || blockTitle(type, '档案板块')

    if (type === 'basic') {
      return (
        <SectionShell key={type} title={title} icon={<Landmark size={18} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#E8DFD5] bg-[#FEFAF6] p-3">
              <div className="text-xs text-[#8B6914] font-medium mb-1">所属地区</div>
              <div className="text-sm text-[#1A1A1A] font-semibold">{regionText}</div>
            </div>
            <div className="rounded-xl border border-[#E8DFD5] bg-[#FEFAF6] p-3">
              <div className="text-xs text-[#8B6914] font-medium mb-1">资源类型</div>
              <div className="text-sm text-[#1A1A1A] font-semibold">{typeMeta.label}</div>
            </div>
            <div className="rounded-xl border border-[#E8DFD5] bg-[#FEFAF6] p-3">
              <div className="text-xs text-[#8B6914] font-medium mb-1">历史时期</div>
              <div className="text-sm text-[#1A1A1A] font-semibold">{archive.historyPeriod || '待补充'}</div>
            </div>
            <div className="rounded-xl border border-[#E8DFD5] bg-[#FEFAF6] p-3">
              <div className="text-xs text-[#8B6914] font-medium mb-1">审核状态</div>
              <div className="text-sm text-[#1A1A1A] font-semibold">{auditStatusLabel(archive.auditStatus)}</div>
            </div>
            <div className="md:col-span-2 rounded-xl border border-[#E8DFD5] bg-white p-3">
              <div className="text-xs text-[#8B6914] font-medium mb-1 flex items-center gap-1">
                <Navigation size={12} />
                位置说明
              </div>
              <div className="text-sm text-[#1A1A1A] leading-relaxed">{locationText}</div>
              <div className="mt-2 text-xs text-[#5C5C5C]">
                地图定位已记录，可在总览地图中查看位置。
              </div>
            </div>
          </div>
        </SectionShell>
      )
    }

    if (type === 'history') {
      return (
        <SectionShell key={type} title={title} icon={<BookOpen size={18} />}>
          {archive.description ? (
            <p className="text-[#5C5C5C] leading-loose text-base md:text-lg font-serif">{archive.description}</p>
          ) : (
            <EmptyBlock text="暂无已审核发布的历史背景摘要。" />
          )}
          {archive.content && (
            <div className="mt-6 pt-5 border-t border-[#E8DFD5]">
              <div className="mb-3 text-sm font-bold text-[#1A1A1A] font-serif">深度历史文献档案</div>
              <div className="text-[#5C5C5C] whitespace-pre-wrap leading-loose font-serif">{archive.content}</div>
            </div>
          )}
        </SectionShell>
      )
    }

    if (type === 'oral_history') {
      return (
        <SectionShell key={type} title={title} icon={<Mic2 size={18} />}>
          {archive.oralHistories?.length ? (
            <div className="space-y-3">
              {archive.oralHistories.map((item, index) => (
                <article key={`${item.narrator}-${index}`} className="rounded-xl border border-[#E8DFD5] bg-[#FEFAF6] p-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <strong className="text-[#1A1A1A]">{item.title || item.narrator || '未命名口述记录'}</strong>
                    {item.date && <span className="text-xs text-[#8B6914]">{item.date}</span>}
                  </div>
                  {item.summary && <p className="mt-2 text-sm leading-relaxed text-[#5C5C5C]">{item.summary}</p>}
                  {item.transcript && <p className="mt-2 text-sm leading-relaxed text-[#5C5C5C] line-clamp-4">{item.transcript}</p>}
                  {(item.audioUrl || item.videoUrl) && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {item.audioUrl && <a className="font-semibold text-[#C41E3A] hover:underline" href={resolveAssetUrl(item.audioUrl)} target="_blank" rel="noreferrer">播放音频</a>}
                      {item.videoUrl && <a className="font-semibold text-[#C41E3A] hover:underline" href={resolveAssetUrl(item.videoUrl)} target="_blank" rel="noreferrer">查看视频</a>}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <EmptyBlock text="暂无关联到该点位且已审核公开的口述历史。" />
          )}
        </SectionShell>
      )
    }

    if (type === 'media') return renderMediaBlock(title)

    if (type === 'ai_narration') {
      const narration = archive.aiNarration
      return (
        <SectionShell key={type} title={title} icon={<Sparkles size={18} />}>
          {narration?.text || narration?.audioUrl ? (
            <div className="space-y-3">
              {narration.text && <p className="text-sm leading-loose text-[#5C5C5C] whitespace-pre-wrap">{narration.text}</p>}
              {narration.audioUrl && <a className="inline-flex text-sm font-semibold text-[#C41E3A] hover:underline" href={resolveAssetUrl(narration.audioUrl)} target="_blank" rel="noreferrer">播放已审核讲解音频</a>}
              {(narration.provider || narration.reviewedAt) && (
                <p className="text-xs text-[#8B6914]">
                  {[narration.provider && `模型：${narration.provider}`, narration.reviewedAt && `审核：${narration.reviewedAt}`].filter(Boolean).join('；')}
                </p>
              )}
            </div>
          ) : (
            <EmptyBlock text="暂无已审核发布的 AI 讲解稿或讲解音频。" />
          )}
        </SectionShell>
      )
    }

    if (type === 'timeline') {
      return (
        <SectionShell key={type} title={title} icon={<Calendar size={18} />}>
          {timeline.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {timeline.map(item => (
                <div key={item.label} className="border-l-2 border-[#C41E3A]/30 pl-3">
                  <div className="text-xs text-[#8B6914]">{item.label}</div>
                  <div className="mt-1 text-sm font-semibold text-[#1A1A1A]">{item.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyBlock text="暂无已审核展陈时间线。" />
          )}
        </SectionShell>
      )
    }

    if (type === 'related_people') {
      return (
        <SectionShell key={type} title={title}>
          {archive.relatedPeople?.length ? (
            <div className="flex flex-wrap gap-2">
              {archive.relatedPeople.map(person => (
                <span key={person} className="rounded-full border border-[#E8DFD5] bg-[#FEFAF6] px-3 py-1 text-sm text-[#5C5C5C]">{person}</span>
              ))}
            </div>
          ) : (
            <EmptyBlock text="暂无已审核相关人物。" />
          )}
        </SectionShell>
      )
    }

    if (type === 'related_events') {
      return (
        <SectionShell key={type} title={title}>
          {archive.relatedEvents?.length ? (
            <div className="space-y-2">
              {archive.relatedEvents.map(event => (
                <div key={event} className="rounded-xl border border-[#E8DFD5] bg-[#FEFAF6] px-4 py-2 text-sm text-[#5C5C5C]">{event}</div>
              ))}
            </div>
          ) : (
            <EmptyBlock text="暂无已审核相关事件。" />
          )}
        </SectionShell>
      )
    }

    if (type === 'learning_questions') {
      return (
        <SectionShell key={type} title={title} icon={<HelpCircle size={18} />}>
          {archive.learningQuestions?.length ? (
            <ol className="space-y-2">
              {archive.learningQuestions.map((question, index) => (
                <li key={question} className="rounded-xl border border-[#E8DFD5] bg-[#FEFAF6] px-4 py-3 text-sm text-[#5C5C5C]">
                  <span className="mr-2 font-semibold text-[#C41E3A]">{index + 1}.</span>{question}
                </li>
              ))}
            </ol>
          ) : (
            <EmptyBlock text="暂无已审核学习问题。" />
          )}
        </SectionShell>
      )
    }

    if (type === 'route') {
      return (
        <SectionShell key={type} title={title} icon={<RouteIcon size={18} />}>
          {archive.routeTips?.length ? (
            <div className="space-y-3">
              {archive.routeTips.map((tip, index) => (
                <article key={`${tip.title}-${index}`} className="rounded-xl border border-[#E8DFD5] bg-[#FEFAF6] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-[#1A1A1A]">{tip.title || `路线节点 ${index + 1}`}</strong>
                    {tip.duration && <span className="rounded-full bg-white px-2 py-1 text-xs text-[#8B6914] border border-[#E8DFD5]">{tip.duration}</span>}
                  </div>
                  {tip.description && <p className="mt-2 text-sm leading-relaxed text-[#5C5C5C]">{tip.description}</p>}
                </article>
              ))}
            </div>
          ) : (
            <EmptyBlock text="暂无已审核参观路线说明。" />
          )}
        </SectionShell>
      )
    }

    if (type === 'messages') {
      return (
        <SectionShell key={type} title={title} icon={<MessageSquare size={18} />}>
          {archive.publicMessages?.length ? (
            <div className="space-y-3">
              {archive.publicMessages.map((message, index) => (
                <article key={`${message.createdAt || index}-${message.text}`} className="rounded-xl border border-[#E8DFD5] bg-[#FEFAF6] p-4">
                  <div className="text-xs text-[#8B6914]">{message.name || '匿名留言'}</div>
                  <p className="mt-1 text-sm leading-relaxed text-[#5C5C5C]">{message.text}</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyBlock text="暂无已审核公开留言。" />
          )}
        </SectionShell>
      )
    }

    if (type === 'sources') {
      return (
        <SectionShell key={type} title={title}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="rounded-full bg-[#FEFAF6] px-3 py-1 text-xs text-[#8B6914] border border-[#E8DFD5]">
              可信度：{trustLabel(archive.trustLevel)}
            </span>
          </div>
          {sources.length ? (
            <div className="space-y-3">
              {sources.map((source, index) => (
                <article key={`${source.archiveRef}-${index}`} className="rounded-2xl border border-[#E8DFD5] bg-[#FEFAF6] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-sm text-[#1A1A1A]">{source.sourceTitle || source.archiveRef || '未命名来源'}</strong>
                    <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs text-[#8B6914] border border-[#E8DFD5]">
                      {trustLabel(source.trustLevel)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#5C5C5C]">
                    {[
                      source.sourceType && `类型：${source.sourceType}`,
                      source.archiveRef && `编号：${source.archiveRef}`,
                      source.pageRef && `页码：${source.pageRef}`,
                      source.collector && `采集人：${source.collector}`,
                      source.collectedAt && `采集时间：${source.collectedAt}`,
                    ].filter(Boolean).join('；') || '暂无来源细节'}
                  </p>
                  {source.notes && <p className="mt-2 text-xs leading-relaxed text-[#5C5C5C]">{source.notes}</p>}
                  {source.sourceUrl && (
                    <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-semibold text-[#C41E3A] hover:underline">
                      查看来源链接
                    </a>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <EmptyBlock text="暂无公开来源证据，后台审核通过后可继续补充。" />
          )}
        </SectionShell>
      )
    }

    if (type === 'risk_note') {
      return (
        <SectionShell key={type} title={title} tone="warm">
          <p className="text-sm font-serif leading-relaxed text-[#5C5C5C]/80">
            此文献经过后台审核发布。地图空间中的建筑为轻量风格化模型，主要依据点位名称、已上传图片和可核实公开资料提炼外观特征，用于帮助识别遗址类型与空间位置；目前仍不是测绘级实景复原模型。真实历史风貌请以现场文物、主管部门资料或档案馆藏照片为准。
          </p>
        </SectionShell>
      )
    }

    return null
  }

  const renderedDetailBlocks = detailBlocks.map(renderDetailBlock).filter(Boolean)

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[80] flex items-center justify-center p-1 md:p-6" onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>
      
      <div className="relative w-full max-w-5xl h-full max-h-[98vh] md:max-h-[85vh] bg-white border border-[#E8DFD5] rounded-2xl md:rounded-3xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-[#E8DFD5] bg-[#FEFAF6] relative overflow-hidden">
          {isPlaying && (
            <div className="absolute inset-0 z-0 opacity-15 pointer-events-none flex items-center justify-center gap-2">
              {AUDIO_BARS.map((bar, i) => (
                <div 
                  key={i} 
                  className="w-1.5 bg-[#C41E3A] rounded-full" 
                  style={bar}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 relative z-10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              archive.type === 'revolution' ? 'bg-[#FDE8EC] text-[#C41E3A]' :
              archive.type === 'government' ? 'bg-[#FEFAF6] text-[#5C5C5C]' : 
              'bg-[#FFF8E1] text-[#8B6914]'
            }`}>
              <Landmark size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-wide font-serif">{archive.title}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-[#5C5C5C] font-medium">
                <span className="flex items-center gap-1"><Calendar size={14} className="text-[#C41E3A]" /> {archive.year}年</span>
                <span className="flex items-center gap-1"><MapPin size={14} className="text-[#C41E3A]" /> {regionText}</span>
                <span className="px-2 py-0.5 rounded border border-[#E8DFD5] bg-white" style={{ color: typeMeta.tone }}>{typeMeta.label}</span>
                <span className="flex items-center gap-1 bg-[#FEFAF6] px-2 py-0.5 rounded border border-[#E8DFD5] text-[#5C5C5C]">
                  <Navigation size={14} className="text-[#C41E3A]" /> 地图定位已记录
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={handleToggleAudio}
              className={`flex items-center gap-2 px-4 min-h-[44px] rounded-lg transition-all duration-200 border ${
                isPlaying 
                  ? 'bg-[#FDE8EC] border-[#C41E3A]/40 text-[#C41E3A]' 
                  : 'bg-white border-[#E8DFD5] text-[#5C5C5C] hover:bg-[#FEFAF6]'
              }`}
              aria-label={isPlaying ? '停止讲解' : '语音讲解'}
            >
              {isPlaying ? <Square size={16} className="fill-current" /> : <Volume2 size={16} />}
              <span className="text-sm font-medium">{isPlaying ? '停止讲解' : '语音讲解'}</span>
            </button>
            
            <button 
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-[#E8DFD5] text-[#5C5C5C] hover:bg-[#FDE8EC] hover:text-[#C41E3A] hover:border-[#C41E3A]/30 transition-all duration-200"
              aria-label="关闭档案"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white" key={selectedPoiId}>
          <div className="p-5 md:p-8 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2 font-serif tracking-wider">
                <div className="w-1 h-4 bg-[#C41E3A] rounded-full" />
                档案板块
              </h3>
              <span className="rounded-full border border-[#E8DFD5] bg-[#FEFAF6] px-3 py-1 text-xs text-[#8B6914]">
                按资料顺序展示
              </span>
            </div>

            {renderedDetailBlocks.length ? (
              <div className="space-y-5">{renderedDetailBlocks}</div>
            ) : (
              <SectionShell title="档案板块">
                <EmptyBlock text="当前暂无可展示的详情内容。" />
              </SectionShell>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={handleLearnCourse}
                className="flex items-center gap-2 px-5 min-h-[44px] rounded-lg party-btn-primary"
                aria-label="开始学习本节思政课"
              >
                <BookOpen size={18} />
                开始学习本节思政课
              </button>
              
              <span className="px-4 py-1.5 rounded-full bg-[#FEFAF6] text-[#5C5C5C] text-sm border border-[#E8DFD5] font-medium">
                数字档案坐标
              </span>
              
              {archive.type === 'government' && (
                <button 
                  onClick={() => {
                    setDetailModalOpen(false)
                    setIndoorMode(true)
                  }}
                  className="flex items-center gap-2 px-4 min-h-[44px] rounded-lg bg-white border border-[#E8DFD5] hover:bg-[#FEFAF6] hover:border-[#8B6914]/30 text-[#8B6914] transition-all ml-auto"
                >
                  <Layers size={16} />
                  进入室内 BIM 下钻模式
                </button>
              )}

              {archive.type === 'revolution' && (
                <button 
                  onClick={() => {
                    setDetailModalOpen(false)
                    setRelicMode(true)
                  }}
                  className="flex items-center gap-2 px-4 min-h-[44px] rounded-lg bg-white border border-[#E8DFD5] hover:bg-[#FEFAF6] hover:border-[#8B6914]/30 text-[#8B6914] transition-all ml-auto"
                >
                  <ImageIcon size={16} />
                  档案影像展陈
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
