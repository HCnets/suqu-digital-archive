import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { BookOpen, Flag, Map as MapIcon, MoveHorizontal, Crosshair, Film, BookHeart, Landmark, Activity, Clock, Route, ChevronRight, CheckCircle2, PanelLeftClose, PanelLeftOpen, Menu, X, CloudRain, CloudSnow, Sun, Users, Library, ScrollText, Star, Stamp, GitCompare, Music, Mic, Camera, MapPin, Send, Tv } from 'lucide-react'
import { HeroesPanel } from '@/components/ui/HeroesPanel'
import { RedResourceHub } from '@/components/ui/RedResourceHub'
import { TodaySuqu } from '@/components/ui/TodaySuqu'
import { RedQuiz } from '@/components/ui/RedQuiz'
import { PartyDayRoutes } from '@/components/ui/PartyDayRoutes'
import { CheckInPassport } from '@/components/ui/CheckInPassport'
import { RedSongPlayer } from '@/components/ui/RedSongPlayer'
import { PartyOathWall } from '@/components/ui/PartyOathWall'
import { RedPanorama } from '@/components/ui/RedPanorama'
import { LongMarchRoute } from '@/components/ui/LongMarchRoute'
import { OralHistory } from '@/components/ui/OralHistory'
import { TourGuide } from '@/components/ui/TourGuide'
import { RedFilmArchive } from '@/components/ui/RedFilmArchive'
import { PeopleCoCreation } from '@/components/ui/PeopleCoCreation'
import { asText, fetchPublishedContents, type PublicContentItem } from '@/lib/cmsContent'
import { API_BASE } from '@/lib/env'

const CHECKIN_VISITOR_KEY = 'suqu_checkin_visitor_id'

interface LearningCourse {
  title: string
  subtitle: string
  archiveId: string
  order: number
}

interface DashboardEntry {
  id: string
  label: string
  description: string
  actionKey: DashboardActionKey
  groupKey: string
  groupTitle: string
  iconKey: string
  sectionIconKey: string
  badgeMode: string
  order: number
}

type DashboardActionKey =
  | 'heroes'
  | 'song_player'
  | 'party_oath'
  | 'panorama'
  | 'long_march'
  | 'oral_history'
  | 'resource_hub'
  | 'today_suqu'
  | 'red_quiz'
  | 'party_routes'
  | 'passport'
  | 'tour_guide'
  | 'film_archive'
  | 'cocreation'

const DASHBOARD_ACTION_KEYS: ReadonlySet<string> = new Set([
  'heroes',
  'song_player',
  'party_oath',
  'panorama',
  'long_march',
  'oral_history',
  'resource_hub',
  'today_suqu',
  'red_quiz',
  'party_routes',
  'passport',
  'tour_guide',
  'film_archive',
  'cocreation',
])

const dashboardIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  book: BookOpen,
  flag: Flag,
  map: MapIcon,
  route: Route,
  users: Users,
  library: Library,
  scroll: ScrollText,
  star: Star,
  stamp: Stamp,
  compare: GitCompare,
  music: Music,
  mic: Mic,
  camera: Camera,
  pin: MapPin,
  send: Send,
  tv: Tv,
  chevron: ChevronRight,
}

export const HudDashboard: React.FC = () => {
  const { getAllArchives, currentYear, setSwipeMode, setFpsMode, isDirectorMode, setDirectorMode, setSelectedPoiId, setDetailModalOpen, mainMapInstance, selectedPoiId, weather, setWeather } = useAppStore()
  const [collapsed, setCollapsed] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768)
  const [showHeroes, setShowHeroes] = useState(false)
  const [showResourceHub, setShowResourceHub] = useState(false)
  const [showTodaySuqu, setShowTodaySuqu] = useState(false)
  const [showRedQuiz, setShowRedQuiz] = useState(false)
  const [showPartyRoutes, setShowPartyRoutes] = useState(false)
  const [showPassport, setShowPassport] = useState(false)
  const [showSongPlayer, setShowSongPlayer] = useState(false)
  const [showOathWall, setShowOathWall] = useState(false)
  const [showPanorama, setShowPanorama] = useState(false)
  const [showLongMarch, setShowLongMarch] = useState(false)
  const [showOralHistory, setShowOralHistory] = useState(false)
  const [showTourGuide, setShowTourGuide] = useState(false)
  const [showFilmArchive, setShowFilmArchive] = useState(false)
  const [showCoCreation, setShowCoCreation] = useState(false)
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' && window.innerWidth < 768)
  const [visitedPois, setVisitedPois] = useState<string[]>([])
  const [checkinTotalCount, setCheckinTotalCount] = useState<number | null>(null)
  const [learningCourses, setLearningCourses] = useState<LearningCourse[]>([])
  const [dashboardEntries, setDashboardEntries] = useState<DashboardEntry[]>([])
  const [visitorId] = useState<string>(() => getVisitorId())

  useEffect(() => {
    let cancelled = false
    async function loadCheckinConfig() {
      try {
        const items = await fetchPublishedContents('checkin', 1)
        const data = items[0]?.data || {}
        const total = Number(data.totalCount || data.total_count)
        if (!cancelled) setCheckinTotalCount(Number.isInteger(total) && total > 0 ? total : null)
      } catch {
        if (!cancelled) setCheckinTotalCount(null)
      }
    }
    loadCheckinConfig()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadLearningCourses() {
      try {
        const items = await fetchPublishedContents('learning_course', 100)
        const courses = items
          .map(contentToLearningCourse)
          .filter((course): course is LearningCourse => Boolean(course))
          .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'zh-CN'))
        if (!cancelled) setLearningCourses(courses)
      } catch {
        if (!cancelled) setLearningCourses([])
      }
    }
    loadLearningCourses()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadDashboardEntries() {
      try {
        const items = await fetchPublishedContents('dashboard_entry', 100)
        const entries = items
          .map(contentToDashboardEntry)
          .filter((entry): entry is DashboardEntry => Boolean(entry))
          .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, 'zh-CN'))
        if (!cancelled) setDashboardEntries(entries)
      } catch {
        if (!cancelled) setDashboardEntries([])
      }
    }
    loadDashboardEntries()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadCheckinProgress() {
      try {
        const response = await fetch(`${API_BASE}/checkin/progress`, {
          headers: { 'X-Visitor-Id': visitorId },
        })
        if (!response.ok) return
        const payload = await response.json() as { visitedPois?: string[] }
        if (!cancelled && Array.isArray(payload.visitedPois)) {
          setVisitedPois(payload.visitedPois)
        }
      } catch {
        // Local map interaction stays usable if the progress endpoint is offline.
      }
    }
    loadCheckinProgress()
    return () => { cancelled = true }
  }, [visitorId])

  useEffect(() => {
    if (selectedPoiId && !visitedPois.includes(selectedPoiId)) {
      const next = [...visitedPois, selectedPoiId]
      const timer = window.setTimeout(() => setVisitedPois(next), 0)
      void fetch(`${API_BASE}/checkin/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Visitor-Id': visitorId,
        },
        body: JSON.stringify({ visitedPois: next }),
      }).catch(() => {
        // Offline or transient backend failure should not block the tour flow.
      })
      return () => window.clearTimeout(timer)
    }
  }, [selectedPoiId, visitedPois, visitorId])

  useEffect(() => {
    const handleResize = () => {
      const nextIsMobile = window.innerWidth < 768
      setIsMobile(nextIsMobile)
      setCollapsed(nextIsMobile)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const currentArchives = getAllArchives().filter(a => a.year <= currentYear)
  
  const totalCount = currentArchives.length
  const redCount = currentArchives.filter(a => a.type === 'revolution').length
  const govCount = currentArchives.filter(a => a.type === 'government').length
  const culCount = currentArchives.filter(a => a.type === 'culture').length

  const handleLearningCourseClick = (archiveId: string) => {
    const archive = getAllArchives().find(a => a.id === archiveId)
    if (!archive) return
    
    setSelectedPoiId(archiveId)
    setTimeout(() => {
      setDetailModalOpen(true)
    }, 400)
    
    if (mainMapInstance) {
      mainMapInstance.flyTo({
        center: [archive.longitude, archive.latitude],
        zoom: 17,
        pitch: 65,
        bearing: -15,
        duration: 2500,
        essential: true
      })
    }
  }

  const getEntryBadge = (entry: DashboardEntry) => {
    if (entry.badgeMode === 'checkin_progress') return checkinTotalCount ? `${visitedPois.length}/${checkinTotalCount}` : '未配置'
    // toggle_state 模式无真实开关数据（原 getEntryActive 死桩恒返回 false 显示"未开启"），属假数据，不再渲染徽标
    return ''
  }

  const handleDashboardEntryClick = (entry: DashboardEntry) => {
    if (entry.actionKey === 'heroes') {
      setShowHeroes(true)
    } else if (entry.actionKey === 'song_player') {
      setShowSongPlayer(true)
    } else if (entry.actionKey === 'party_oath') {
      setShowOathWall(true)
    } else if (entry.actionKey === 'panorama') {
      setShowPanorama(true)
    } else if (entry.actionKey === 'long_march') {
      setShowLongMarch(true)
    } else if (entry.actionKey === 'oral_history') {
      setShowOralHistory(true)
    } else if (entry.actionKey === 'resource_hub') {
      setShowResourceHub(true)
    } else if (entry.actionKey === 'today_suqu') {
      setShowTodaySuqu(true)
    } else if (entry.actionKey === 'red_quiz') {
      setShowRedQuiz(true)
    } else if (entry.actionKey === 'party_routes') {
      setShowPartyRoutes(true)
    } else if (entry.actionKey === 'passport') {
      setShowPassport(true)
    } else if (entry.actionKey === 'tour_guide') {
      setShowTourGuide(true)
    } else if (entry.actionKey === 'film_archive') {
      setShowFilmArchive(true)
    } else if (entry.actionKey === 'cocreation') {
      setShowCoCreation(true)
    }

    if (isMobile) {
      setCollapsed(true)
    }
  }

  const dashboardSections = Array.from(
    dashboardEntries.reduce((groups, entry) => {
      const existing = groups.get(entry.groupKey) || {
        key: entry.groupKey,
        title: entry.groupTitle,
        iconKey: entry.sectionIconKey,
        entries: [] as DashboardEntry[],
        order: entry.order,
      }
      existing.entries.push(entry)
      existing.order = Math.min(existing.order, entry.order)
      groups.set(entry.groupKey, existing)
      return groups
    }, new Map<string, { key: string; title: string; iconKey: string; entries: DashboardEntry[]; order: number }>()),
  ).map(([, section]) => ({
    ...section,
    entries: section.entries.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, 'zh-CN')),
  })).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'zh-CN'))

  return (
    <>
      {/* 移动端遮罩 */}
      {!collapsed && isMobile && (
        <div className="md:hidden fixed inset-0 bg-black/30 z-[45] pointer-events-auto" onClick={() => setCollapsed(true)} />
      )}
      
      <div className="fixed bottom-4 left-4 z-[70] flex gap-0 md:bottom-auto md:top-28 md:z-[50]">
        {/* 折叠/汉堡按钮 */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`pointer-events-auto self-start h-12 min-w-[48px] rounded-xl bg-white border border-museum-border flex items-center justify-center text-party-ink-light hover:text-party-red hover:bg-museum-bg transition-all shadow-sm ${
            collapsed ? 'rounded-xl' : 'rounded-l-xl'
          }`}
          aria-label={collapsed ? "展开学习面板" : "折叠学习面板"}
        >
          {collapsed ? (isMobile ? <Menu size={18} /> : <PanelLeftOpen size={16} />) : <PanelLeftClose size={16} />}
        </button>

        {!collapsed && (
          <div className={`pointer-events-auto flex flex-col gap-4 border border-museum-border bg-white shadow-2xl md:border-none md:bg-transparent md:shadow-none ${isMobile ? 'fixed inset-x-4 bottom-20 top-24 rounded-2xl' : 'w-80'}`} style={{ maxHeight: isMobile ? 'calc(100dvh - 8.5rem)' : 'calc(100dvh - 12rem)' }}>
            {isMobile && (
              <div className="flex items-center justify-between px-5 pt-4 md:hidden">
                <h2 className="text-sm font-bold text-party-ink font-serif flex items-center gap-2">
                  <BookHeart size={16} className="text-party-red" /> 苏区思政大课堂
                </h2>
                <button onClick={() => setCollapsed(true)} className="p-1.5 rounded-lg hover:bg-museum-bg text-party-ink-light min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="关闭面板">
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="overflow-y-auto custom-scrollbar pr-1 pb-4 space-y-4 flex-1 px-1 md:px-0">
      
      {/* 核心指标总览 */}
      <div className="museum-card p-5 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-party-red" />
        
        <div className="mb-4 mt-1">
          <h3 className="font-bold flex items-center gap-3 text-base">
            <BookHeart size={20} className="text-party-red" />
            <span className="text-party-ink tracking-wide font-serif">
              苏区思政大课堂
            </span>
          </h3>
          <p className="text-[11px] text-party-ink-light font-medium tracking-wider mt-1 ml-8">
            面向全体人民的党史教育阵地
          </p>
        </div>
        
        <div className="flex items-end gap-2 mb-5">
          <div className="text-4xl font-black text-party-red font-serif">{totalCount}</div>
          <div className="text-sm text-party-ink-light mb-1 font-medium">处红色阵地</div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-2 text-sm text-party-ink-light">
              <Flag size={14} className="text-party-red" /> 红色革命遗址
            </div>
            <span className="font-mono text-party-ink font-bold">{redCount}</span>
          </div>
          <div className="w-full h-1.5 bg-museum-bg rounded-full overflow-hidden">
            <div className="h-full bg-party-red transition-all duration-700" style={{ width: `${totalCount ? (redCount/totalCount)*100 : 0}%` }} />
          </div>

          <div className="flex items-center justify-between pt-2 group cursor-pointer">
            <div className="flex items-center gap-2 text-sm text-party-ink-light">
              <Landmark size={14} className="text-party-ink-light" /> 党政服务点位
            </div>
            <span className="font-mono text-party-ink font-bold">{govCount}</span>
          </div>
          <div className="w-full h-1.5 bg-museum-bg rounded-full overflow-hidden">
            <div className="h-full bg-party-gold transition-all duration-700" style={{ width: `${totalCount ? (govCount/totalCount)*100 : 0}%` }} />
          </div>

          <div className="flex items-center justify-between pt-2 group cursor-pointer">
            <div className="flex items-center gap-2 text-sm text-party-ink-light">
              <Activity size={14} className="text-party-gold" /> 群众文化阵地
            </div>
            <span className="font-mono text-party-ink font-bold">{culCount}</span>
          </div>
          <div className="w-full h-1.5 bg-museum-bg rounded-full overflow-hidden">
            <div className="h-full bg-[#D4C5B2] transition-all duration-700" style={{ width: `${totalCount ? (culCount/totalCount)*100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* 思政学习大纲 */}
      <div className="museum-card p-5 rounded-2xl">
        <h3 className="text-party-ink font-bold flex items-center gap-2 mb-1 text-sm font-serif tracking-wider">
          <BookOpen size={16} className="text-party-red" />
          学习路线与实践
        </h3>
        <p className="text-xs text-party-ink-light mb-4 leading-relaxed">
          按顺序点击每一课，地图将自动定位到对应红色遗址并展开深度档案。
        </p>
        
        <div className="space-y-2.5">
          {learningCourses.length > 0 ? learningCourses.map((course) => {
            const isActive = selectedPoiId === course.archiveId
            return (
              <button
                key={course.order}
                onClick={() => { handleLearningCourseClick(course.archiveId); if (isMobile) setCollapsed(true) }}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer group flex flex-col justify-center min-h-[44px] touch-manipulation ${
                  isActive 
                    ? 'bg-party-red-light border-party-red shadow-sm' 
                    : 'bg-white border-museum-border hover:border-party-red hover:bg-museum-bg'
                }`}
                aria-label={`点击学习${course.title}`}
              >
                <div className="flex justify-between items-center text-sm font-medium text-party-ink">
                  <span className="flex items-center gap-2">
                    {isActive ? (
                      <CheckCircle2 size={14} className="text-party-red" />
                    ) : (
                      <ChevronRight size={14} className="text-party-red group-hover:text-party-red group-hover:translate-x-1 transition-all" />
                    )}
                    {course.title}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    isActive ? 'bg-party-red text-white' : 'bg-party-red-light text-party-red'
                  }`}>
                    {isActive ? '学习中' : '点击学习'}
                  </span>
                </div>
                <p className="text-xs text-party-ink-light mt-1 ml-6">{course.subtitle}</p>
              </button>
            )
          }) : (
            <div className="rounded-xl border border-dashed border-museum-border bg-museum-bg p-4 text-xs leading-relaxed text-party-ink-light">
              当前暂无已审核发布的学习课程。
            </div>
          )}
        </div>
      </div>

      {/* 时空印记与体验 */}
      <div className="museum-card p-4 rounded-2xl space-y-3">
        <h3 className="text-party-ink font-bold flex items-center gap-2 text-sm font-serif tracking-wider">
          <Clock size={16} className="text-party-gold" />
          时空印记与体验
        </h3>
        
        <button 
          onClick={() => { setSwipeMode(true); if (isMobile) setCollapsed(true) }}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-museum-border bg-white hover:bg-museum-bg hover:border-party-red text-party-ink-light hover:text-party-red transition-all duration-200 min-h-[44px] touch-manipulation"
        >
          <MoveHorizontal size={16} />
          <span className="text-sm font-medium">百年时空对照</span>
        </button>

        <button 
          onClick={() => { setFpsMode(true); if (isMobile) setCollapsed(true) }}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-museum-border bg-white hover:bg-museum-bg hover:border-party-red text-party-ink-light hover:text-party-red transition-all duration-200 min-h-[44px] touch-manipulation"
        >
          <Crosshair size={16} />
          <span className="text-sm font-medium">重走红军路</span>
        </button>

        <button 
          onClick={() => { setDirectorMode(!isDirectorMode); if (isMobile) setCollapsed(true) }}
          className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation ${
            isDirectorMode 
              ? 'bg-party-red-light border-party-red text-party-red'
              : 'bg-white hover:bg-museum-bg border-museum-border text-party-ink-light hover:text-party-red hover:border-party-red'
          }`}
        >
          <Film size={16} />
          <span className="text-sm font-medium">{isDirectorMode ? '停止自动讲解' : '开始自动讲解'}</span>
        </button>

        <button 
          onClick={() => setWeather(weather === 'clear' ? 'rain' : weather === 'rain' ? 'snow' : 'clear')}
          className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation ${
            weather !== 'clear'
              ? 'bg-party-red-light border-party-red text-party-red'
              : 'bg-white hover:bg-museum-bg border-museum-border text-party-ink-light hover:text-party-red hover:border-party-red'
          }`}
        >
          {weather === 'clear' ? <CloudRain size={16} /> : weather === 'rain' ? <CloudSnow size={16} /> : <Sun size={16} />}
          <span className="text-sm font-medium">{weather === 'clear' ? '雨中追忆' : weather === 'rain' ? '雪落苏区' : '晴空万里'}</span>
        </button>
      </div>

      {dashboardSections.length > 0 ? dashboardSections.map((section) => {
        const SectionIcon = dashboardIcons[section.iconKey] || MapIcon
        return (
          <div key={section.key} className="museum-card p-4 rounded-2xl space-y-3">
            <h3 className="text-party-ink font-bold flex items-center gap-2 text-sm font-serif tracking-wider">
              <SectionIcon size={16} className="text-party-red" />
              {section.title}
            </h3>

            <div className="flex flex-col gap-2">
              {section.entries.map((entry) => {
                const EntryIcon = dashboardIcons[entry.iconKey] || ChevronRight
                const badge = getEntryBadge(entry)
                return (
                  <button
                    key={entry.id}
                    onClick={() => handleDashboardEntryClick(entry)}
                    className="flex items-center justify-between p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation bg-white hover:bg-museum-bg border-museum-border text-party-ink-light hover:text-party-red hover:border-party-red"
                  >
                    <div className="flex items-center gap-2 min-w-0 text-left">
                      <EntryIcon size={14} className="shrink-0" />
                      <span className="text-sm font-medium truncate">{entry.label}</span>
                    </div>
                    {badge ? (
                      <span className="text-xs font-bold text-party-red shrink-0 ml-3">{badge}</span>
                    ) : (
                      <ChevronRight size={14} className="opacity-40 shrink-0 ml-3" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      }) : (
        <div className="museum-card p-4 rounded-2xl">
          <div className="rounded-xl border border-dashed border-museum-border bg-museum-bg p-4 text-xs leading-relaxed text-party-ink-light">
            暂无已审核发布的专题入口，请在后台发布后查看。
          </div>
        </div>
      )}
      
    </div>
    </div>
    )}
    </div>

    {showHeroes && <HeroesPanel onClose={() => setShowHeroes(false)} />}
    {showResourceHub && <RedResourceHub onClose={() => setShowResourceHub(false)} />}
    {showTodaySuqu && <TodaySuqu onClose={() => setShowTodaySuqu(false)} />}
    {showRedQuiz && <RedQuiz onClose={() => setShowRedQuiz(false)} />}
    {showPartyRoutes && (
      <PartyDayRoutes 
        onClose={() => setShowPartyRoutes(false)} 
        onStartRoute={(poiIds, opening) => {
          setShowPartyRoutes(false)
          if (isMobile) setCollapsed(true)
          if (poiIds.length > 0) {
            setSelectedPoiId(poiIds[0])
          }
          setTimeout(() => {
            setDirectorMode(true)
          }, 800)
          if (opening && window.speechSynthesis) {
            setTimeout(() => {
              const u = new SpeechSynthesisUtterance(opening)
              u.lang = 'zh-CN'
              u.rate = 0.95
              window.speechSynthesis.speak(u)
            }, 1200)
          }
        }}
      />
    )}
    {showPassport && <CheckInPassport onClose={() => setShowPassport(false)} visitedPois={visitedPois} totalCount={checkinTotalCount || undefined} />}
    {showSongPlayer && <RedSongPlayer onClose={() => setShowSongPlayer(false)} />}
    {showOathWall && <PartyOathWall onClose={() => setShowOathWall(false)} />}
    {showPanorama && <RedPanorama onClose={() => setShowPanorama(false)} />}
    {showLongMarch && <LongMarchRoute onClose={() => setShowLongMarch(false)} />}
    {showOralHistory && <OralHistory onClose={() => setShowOralHistory(false)} />}
    {showTourGuide && <TourGuide onClose={() => setShowTourGuide(false)} />}
    {showFilmArchive && <RedFilmArchive onClose={() => setShowFilmArchive(false)} />}
    {showCoCreation && <PeopleCoCreation onClose={() => setShowCoCreation(false)} />}
    </>
  )
}

function getVisitorId() {
  try {
    const saved = localStorage.getItem(CHECKIN_VISITOR_KEY)
    if (saved) return saved
    const next = (globalThis.crypto?.randomUUID?.() || `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`)
    localStorage.setItem(CHECKIN_VISITOR_KEY, next)
    return next
  } catch {
    return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }
}

function contentToLearningCourse(item: PublicContentItem): LearningCourse | null {
  const data = item.data || {}
  const title = asText(data.title) || item.title
  const subtitle = asText(data.subtitle) || item.summary || item.body || ''
  const archiveId = asText(data.archiveId) || asText(data.archive_id) || asText(data.poiId) || asText(data.poi_id)
  const order = Number(data.order ?? data.sortOrder ?? data.sort_order ?? 0)

  if (!title || !subtitle || !archiveId) return null
  return {
    title,
    subtitle,
    archiveId,
    order: Number.isFinite(order) ? order : 0,
  }
}

function contentToDashboardEntry(item: PublicContentItem): DashboardEntry | null {
  const data = item.data || {}
  const actionKey = asText(data.actionKey) || asText(data.action_key)
  if (!DASHBOARD_ACTION_KEYS.has(actionKey)) return null

  const label = asText(data.label) || asText(data.title) || item.title
  const groupKey = asText(data.groupKey) || asText(data.group_key) || item.category || 'general'
  const groupTitle = asText(data.groupTitle) || asText(data.group_title) || item.category || '功能入口'
  const iconKey = asText(data.iconKey) || asText(data.icon_key) || 'chevron'
  const sectionIconKey = asText(data.sectionIconKey) || asText(data.section_icon_key) || iconKey
  const badgeMode = asText(data.badgeMode) || asText(data.badge_mode)
  const order = Number(data.order ?? data.sortOrder ?? data.sort_order ?? 0)

  if (!label || !groupKey || !groupTitle) return null
  return {
    id: item.id || `${groupKey}-${actionKey}`,
    label,
    description: asText(data.description) || item.summary || item.body || '',
    actionKey: actionKey as DashboardActionKey,
    groupKey,
    groupTitle,
    iconKey,
    sectionIconKey,
    badgeMode,
    order: Number.isFinite(order) ? order : 0,
  }
}
