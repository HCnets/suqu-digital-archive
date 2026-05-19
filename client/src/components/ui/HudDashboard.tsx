import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { BookOpen, Flag, Map, MoveHorizontal, Crosshair, Film, BookHeart, Landmark, Activity, Clock, Route, ChevronRight, CheckCircle2, PanelLeftClose, PanelLeftOpen, Menu, X, CloudRain, CloudSnow, Sun, Users, Library, ScrollText, Star, Stamp, MapPinCheck, GitCompare, Music, Mic, Camera, MapPin, Send, Tv } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FpsOverlay } from '@/components/ui/FpsOverlay'
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

const LEARNING_COURSES: { title: string; subtitle: string; archiveId: string; order: number }[] = [
  { title: "第一课：政权归于人民", subtitle: "走进红屋，了解苏维埃政权的诞生", archiveId: "suqu-red-house", order: 1 },
  { title: "第二课：信仰的底色是忠诚", subtitle: "血田泣血，见证革命先烈的赤胆忠心", archiveId: "blood-field", order: 2 },
  { title: "第三课：群众路线生动实践", subtitle: "农会旧址，感受千百万劳苦大众的觉醒", archiveId: "zijin-farmers-association", order: 3 },
  { title: "第四课：牺牲与担当", subtitle: "炮子村阻击战，600勇士以弱抗强护百姓", archiveId: "paozi-village-defense", order: 4 },
  { title: "第五课：星火燎原的力量", subtitle: "红军亭，南昌起义与广州起义部队会师", archiveId: "red-army-pavilion", order: 5 },
  { title: "第六课：深山里的红色中枢", subtitle: "县委旧址，看党的组织领导革命斗争", archiveId: "zijin-party-committee", order: 6 },
  { title: "第七课：隐蔽战线的忠诚", subtitle: "红色交通站，绝密情报与干部的护送命脉", archiveId: "suqu-red-transport-station", order: 7 },
  { title: "第八课：一盘棋的革命战略", subtitle: "东江特委，统一领导百万人口的东江苏区", archiveId: "dongjiang-committee", order: 8 },
]

export const HudDashboard: React.FC = () => {
  const { getAllArchives, currentYear, setSwipeMode, setFpsMode, isDirectorMode, setDirectorMode, showHistoricalRoute, setShowHistoricalRoute, showSovietRegion, setShowSovietRegion, setSelectedPoiId, setDetailModalOpen, mainMapInstance, selectedPoiId, weather, setWeather } = useAppStore()
  const [collapsed, setCollapsed] = useState(false)
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
  const [visitedPois, setVisitedPois] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('suqu_checkin_pois')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  useEffect(() => {
    if (selectedPoiId && !visitedPois.includes(selectedPoiId)) {
      setVisitedPois(prev => {
        const next = [...prev, selectedPoiId]
        try { localStorage.setItem('suqu_checkin_pois', JSON.stringify(next)) } catch {}
        return next
      })
    }
  }, [selectedPoiId])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setCollapsed(isMobile)
  }, [isMobile])
  
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

  return (
    <>
      {/* 移动端遮罩 */}
      {!collapsed && isMobile && (
        <div className="md:hidden fixed inset-0 bg-black/30 z-[45] pointer-events-auto" onClick={() => setCollapsed(true)} />
      )}
      
      <div className="absolute top-24 left-4 flex gap-0 z-[50]">
        {/* 折叠/汉堡按钮 */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`pointer-events-auto self-start w-10 h-12 rounded-xl bg-white border border-[#E8DFD5] flex items-center justify-center text-[#5C5C5C] hover:text-[#C41E3A] hover:bg-[#FEFAF6] transition-all shadow-sm ${
            collapsed ? 'rounded-xl' : 'rounded-l-xl'
          }`}
          aria-label={collapsed ? "展开学习面板" : "折叠学习面板"}
        >
          {collapsed ? (isMobile ? <Menu size={18} /> : <PanelLeftOpen size={16} />) : <PanelLeftClose size={16} />}
        </button>

        {!collapsed && (
          <div className={`flex flex-col gap-4 pointer-events-auto bg-white md:bg-transparent md:border-none border border-l-0 border-[#E8DFD5] rounded-r-2xl md:rounded-none ${isMobile ? 'w-[85vw] max-w-[360px] fixed left-4 top-20 bottom-4 shadow-2xl rounded-2xl' : 'w-80'}`} style={{ maxHeight: isMobile ? 'calc(100vh - 96px)' : 'calc(100vh - 220px)' }}>
            {isMobile && (
              <div className="flex items-center justify-between px-5 pt-4 md:hidden">
                <h2 className="text-sm font-bold text-[#1A1A1A] font-serif flex items-center gap-2">
                  <BookHeart size={16} className="text-[#C41E3A]" /> 苏区思政大课堂
                </h2>
                <button onClick={() => setCollapsed(true)} className="p-1.5 rounded-lg hover:bg-[#FEFAF6] text-[#5C5C5C] min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="关闭面板">
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="overflow-y-auto custom-scrollbar pr-1 pb-4 space-y-4 flex-1 px-1 md:px-0">
      
      {/* 核心指标总览 */}
      <div className="museum-card p-5 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#C41E3A]" />
        
        <div className="mb-4 mt-1">
          <h3 className="font-bold flex items-center gap-3 text-base">
            <BookHeart size={20} className="text-[#C41E3A]" />
            <span className="text-[#1A1A1A] tracking-wide font-serif">
              苏区思政大课堂
            </span>
          </h3>
          <p className="text-[11px] text-[#5C5C5C] font-medium tracking-wider mt-1 ml-8">
            面向全体人民的党史教育阵地
          </p>
        </div>
        
        <div className="flex items-end gap-2 mb-5">
          <div className="text-4xl font-black text-[#C41E3A] font-serif">{totalCount}</div>
          <div className="text-sm text-[#5C5C5C] mb-1 font-medium">处红色阵地</div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-2 text-sm text-[#5C5C5C]">
              <Flag size={14} className="text-[#C41E3A]" /> 红色革命遗址
            </div>
            <span className="font-mono text-[#1A1A1A] font-bold">{redCount}</span>
          </div>
          <div className="w-full h-1.5 bg-[#FEFAF6] rounded-full overflow-hidden">
            <div className="h-full bg-[#C41E3A] transition-all duration-700" style={{ width: `${totalCount ? (redCount/totalCount)*100 : 0}%` }} />
          </div>

          <div className="flex items-center justify-between pt-2 group cursor-pointer">
            <div className="flex items-center gap-2 text-sm text-[#5C5C5C]">
              <Landmark size={14} className="text-[#5C5C5C]" /> 党政服务点位
            </div>
            <span className="font-mono text-[#1A1A1A] font-bold">{govCount}</span>
          </div>
          <div className="w-full h-1.5 bg-[#FEFAF6] rounded-full overflow-hidden">
            <div className="h-full bg-[#8B6914] transition-all duration-700" style={{ width: `${totalCount ? (govCount/totalCount)*100 : 0}%` }} />
          </div>

          <div className="flex items-center justify-between pt-2 group cursor-pointer">
            <div className="flex items-center gap-2 text-sm text-[#5C5C5C]">
              <Activity size={14} className="text-[#8B6914]" /> 群众文化阵地
            </div>
            <span className="font-mono text-[#1A1A1A] font-bold">{culCount}</span>
          </div>
          <div className="w-full h-1.5 bg-[#FEFAF6] rounded-full overflow-hidden">
            <div className="h-full bg-[#D4C5B2] transition-all duration-700" style={{ width: `${totalCount ? (culCount/totalCount)*100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* 思政学习大纲 */}
      <div className="museum-card p-5 rounded-2xl">
        <h3 className="text-[#1A1A1A] font-bold flex items-center gap-2 mb-1 text-sm font-serif tracking-wider">
          <BookOpen size={16} className="text-[#C41E3A]" />
          学习路线与实践
        </h3>
        <p className="text-xs text-[#5C5C5C] mb-4 leading-relaxed">
          按顺序点击每一课，地图将自动定位到对应红色遗址并展开深度档案。
        </p>
        
        <div className="space-y-2.5">
          {LEARNING_COURSES.map((course) => {
            const isActive = selectedPoiId === course.archiveId
            return (
              <button
                key={course.order}
                onClick={() => { handleLearningCourseClick(course.archiveId); if (isMobile) setCollapsed(true) }}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer group flex flex-col justify-center min-h-[44px] touch-manipulation ${
                  isActive 
                    ? 'bg-[#FDE8EC] border-[#C41E3A]/50 shadow-sm' 
                    : 'bg-white border-[#E8DFD5] hover:border-[#C41E3A]/30 hover:bg-[#FEFAF6]'
                }`}
                aria-label={`点击学习${course.title}`}
              >
                <div className="flex justify-between items-center text-sm font-medium text-[#1A1A1A]">
                  <span className="flex items-center gap-2">
                    {isActive ? (
                      <CheckCircle2 size={14} className="text-[#C41E3A]" />
                    ) : (
                      <ChevronRight size={14} className="text-[#C41E3A]/50 group-hover:text-[#C41E3A] group-hover:translate-x-1 transition-all" />
                    )}
                    {course.title}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    isActive ? 'bg-[#C41E3A] text-white' : 'bg-[#FDE8EC] text-[#C41E3A]'
                  }`}>
                    {isActive ? '学习中' : '点击学习'}
                  </span>
                </div>
                <p className="text-xs text-[#5C5C5C]/60 mt-1 ml-6">{course.subtitle}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 时空印记与体验 */}
      <div className="museum-card p-4 rounded-2xl space-y-3">
        <h3 className="text-[#1A1A1A] font-bold flex items-center gap-2 text-sm font-serif tracking-wider">
          <Clock size={16} className="text-[#8B6914]" />
          时空印记与体验
        </h3>
        
        <button 
          onClick={() => { setSwipeMode(true); if (isMobile) setCollapsed(true) }}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-[#E8DFD5] bg-white hover:bg-[#FEFAF6] hover:border-[#C41E3A]/30 text-[#5C5C5C] hover:text-[#C41E3A] transition-all duration-200 min-h-[44px] touch-manipulation"
        >
          <MoveHorizontal size={16} />
          <span className="text-sm font-medium">百年时空对照</span>
        </button>

        <button 
          onClick={() => { setFpsMode(true); if (isMobile) setCollapsed(true) }}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-[#E8DFD5] bg-white hover:bg-[#FEFAF6] hover:border-[#C41E3A]/30 text-[#5C5C5C] hover:text-[#C41E3A] transition-all duration-200 min-h-[44px] touch-manipulation"
        >
          <Crosshair size={16} />
          <span className="text-sm font-medium">重走红军路</span>
        </button>

        <button 
          onClick={() => { setDirectorMode(!isDirectorMode); if (isMobile) setCollapsed(true) }}
          className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation ${
            isDirectorMode 
              ? 'bg-[#FDE8EC] border-[#C41E3A]/40 text-[#C41E3A]'
              : 'bg-white hover:bg-[#FEFAF6] border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:border-[#C41E3A]/30'
          }`}
        >
          <Film size={16} />
          <span className="text-sm font-medium">{isDirectorMode ? '停止自动讲解' : '开始自动讲解'}</span>
        </button>

        <button 
          onClick={() => setWeather(weather === 'clear' ? 'rain' : weather === 'rain' ? 'snow' : 'clear')}
          className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation ${
            weather !== 'clear'
              ? 'bg-[#FDE8EC] border-[#C41E3A]/40 text-[#C41E3A]'
              : 'bg-white hover:bg-[#FEFAF6] border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:border-[#C41E3A]/30'
          }`}
        >
          {weather === 'clear' ? <CloudRain size={16} /> : weather === 'rain' ? <CloudSnow size={16} /> : <Sun size={16} />}
          <span className="text-sm font-medium">{weather === 'clear' ? '雨中追忆' : weather === 'rain' ? '雪落苏区' : '晴空万里'}</span>
        </button>
      </div>

      {/* 辅助学习工具 */}
      <div className="museum-card p-4 rounded-2xl space-y-3">
        <h3 className="text-[#1A1A1A] font-bold flex items-center gap-2 text-sm font-serif tracking-wider">
          <Map size={16} className="text-[#C41E3A]" />
          辅助学习工具
        </h3>
        
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setShowHistoricalRoute(!showHistoricalRoute)}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation ${
              showHistoricalRoute ? 'bg-[#FDE8EC] border-[#C41E3A]/40 text-[#C41E3A]' : 'bg-white hover:bg-[#FEFAF6] border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:border-[#C41E3A]/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <Route size={14} />
              <span className="text-sm font-medium">红军历史行军动线</span>
            </div>
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${showHistoricalRoute ? 'bg-[#C41E3A]' : 'bg-[#E8DFD5]'}`} />
          </button>

          <button 
            onClick={() => setShowHeroes(true)}
            className="flex items-center justify-between p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation bg-white hover:bg-[#FEFAF6] border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:border-[#C41E3A]/30"
          >
            <div className="flex items-center gap-2">
              <Users size={14} />
              <span className="text-sm font-medium">革命先驱 · 英雄谱</span>
            </div>
            <ChevronRight size={14} className="opacity-40" />
          </button>

          <button 
            onClick={() => setShowSovietRegion(!showSovietRegion)}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation ${
              showSovietRegion ? 'bg-[#FDE8EC] border-[#C41E3A]/40 text-[#C41E3A]' : 'bg-white hover:bg-[#FEFAF6] border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:border-[#C41E3A]/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <Map size={14} />
              <span className="text-sm font-medium">东江苏区全域形势</span>
            </div>
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${showSovietRegion ? 'bg-[#C41E3A]' : 'bg-[#E8DFD5]'}`} />
          </button>
        </div>
      </div>

      {/* 红色互动体验 */}
      <div className="museum-card p-4 rounded-2xl space-y-3">
        <h3 className="text-[#1A1A1A] font-bold flex items-center gap-2 text-sm font-serif tracking-wider">
          <Music size={16} className="text-[#C41E3A]" />
          红色互动体验
        </h3>
        
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => { setShowSongPlayer(true); if (isMobile) setCollapsed(true) }}
            className="flex items-center justify-between p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation bg-white hover:bg-[#FEFAF6] border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:border-[#C41E3A]/30"
          >
            <div className="flex items-center gap-2">
              <Music size={14} />
              <span className="text-sm font-medium">苏区红歌馆</span>
            </div>
            <ChevronRight size={14} className="opacity-40" />
          </button>

          <button 
            onClick={() => { setShowOathWall(true); if (isMobile) setCollapsed(true) }}
            className="flex items-center justify-between p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation bg-white hover:bg-[#FEFAF6] border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:border-[#C41E3A]/30"
          >
            <div className="flex items-center gap-2">
              <ScrollText size={14} />
              <span className="text-sm font-medium">入党誓词互动墙</span>
            </div>
            <ChevronRight size={14} className="opacity-40" />
          </button>

          <button 
            onClick={() => { setShowPanorama(true); if (isMobile) setCollapsed(true) }}
            className="flex items-center justify-between p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation bg-white hover:bg-[#FEFAF6] border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:border-[#C41E3A]/30"
          >
            <div className="flex items-center gap-2">
              <Camera size={14} />
              <span className="text-sm font-medium">红色遗址360°全景</span>
            </div>
            <ChevronRight size={14} className="opacity-40" />
          </button>

          <button 
            onClick={() => { setShowLongMarch(true); if (isMobile) setCollapsed(true) }}
            className="flex items-center justify-between p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation bg-white hover:bg-[#FEFAF6] border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:border-[#C41E3A]/30"
          >
            <div className="flex items-center gap-2">
              <Flag size={14} />
              <span className="text-sm font-medium">长征路线交互沙盘</span>
            </div>
            <ChevronRight size={14} className="opacity-40" />
          </button>

          <button 
            onClick={() => { setShowOralHistory(true); if (isMobile) setCollapsed(true) }}
            className="flex items-center justify-between p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation bg-white hover:bg-[#FEFAF6] border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:border-[#C41E3A]/30"
          >
            <div className="flex items-center gap-2">
              <Mic size={14} />
              <span className="text-sm font-medium">口述历史录音室</span>
            </div>
            <ChevronRight size={14} className="opacity-40" />
          </button>
        </div>
      </div>

      {/* 红色资源文库 */}
      <div className="museum-card p-4 rounded-2xl space-y-3">
        <h3 className="text-[#1A1A1A] font-bold flex items-center gap-2 text-sm font-serif tracking-wider">
          <Library size={16} className="text-[#C41E3A]" />
          红色资源文库
        </h3>
        
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => { setShowResourceHub(true); if (isMobile) setCollapsed(true) }}
            className="flex items-center justify-between p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation bg-white hover:bg-[#FEFAF6] border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:border-[#C41E3A]/30"
          >
            <div className="flex items-center gap-2">
              <ScrollText size={14} />
              <span className="text-sm font-medium">红色家书 · 文献馆藏</span>
            </div>
            <ChevronRight size={14} className="opacity-40" />
          </button>

          <button 
            onClick={() => { setShowTodaySuqu(true); if (isMobile) setCollapsed(true) }}
            className="flex items-center justify-between p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation bg-white hover:bg-[#FEFAF6] border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:border-[#C41E3A]/30"
          >
            <div className="flex items-center gap-2">
              <GitCompare size={14} />
              <span className="text-sm font-medium">今日苏区 · 今昔对比</span>
            </div>
            <ChevronRight size={14} className="opacity-40" />
          </button>

          <button 
            onClick={() => { setShowRedQuiz(true); if (isMobile) setCollapsed(true) }}
            className="flex items-center justify-between p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation bg-white hover:bg-[#FEFAF6] border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:border-[#C41E3A]/30"
          >
            <div className="flex items-center gap-2">
              <Star size={14} />
              <span className="text-sm font-medium">党史知识闯关答题</span>
            </div>
            <ChevronRight size={14} className="opacity-40" />
          </button>

          <button 
            onClick={() => { setShowPartyRoutes(true); if (isMobile) setCollapsed(true) }}
            className="flex items-center justify-between p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation bg-white hover:bg-[#FEFAF6] border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:border-[#C41E3A]/30"
          >
            <div className="flex items-center gap-2">
              <MapPinCheck size={14} />
              <span className="text-sm font-medium">主题党日活动路线</span>
            </div>
            <ChevronRight size={14} className="opacity-40" />
          </button>

          <button 
            onClick={() => { setShowPassport(true); if (isMobile) setCollapsed(true) }}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation ${
              visitedPois.length >= 16 ? 'bg-[#FDE8EC] border-[#C41E3A]/40 text-[#C41E3A]' : 'bg-white hover:bg-[#FEFAF6] border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:border-[#C41E3A]/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <Stamp size={14} />
              <span className="text-sm font-medium">红色地标打卡护照</span>
            </div>
            <span className="text-xs font-bold text-[#C41E3A]">{visitedPois.length}/16</span>
          </button>

          <button 
            onClick={() => { setShowTourGuide(true); if (isMobile) setCollapsed(true) }}
            className="flex items-center justify-between p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation bg-white hover:bg-[#FEFAF6] border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:border-[#C41E3A]/30"
          >
            <div className="flex items-center gap-2">
              <MapPin size={14} />
              <span className="text-sm font-medium">红色文旅导览手册</span>
            </div>
            <ChevronRight size={14} className="opacity-40" />
          </button>

          <button 
            onClick={() => { setShowFilmArchive(true); if (isMobile) setCollapsed(true) }}
            className="flex items-center justify-between p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation bg-white hover:bg-[#FEFAF6] border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:border-[#C41E3A]/30"
          >
            <div className="flex items-center gap-2">
              <Tv size={14} />
              <span className="text-sm font-medium">红色影视资料库</span>
            </div>
            <ChevronRight size={14} className="opacity-40" />
          </button>

          <button 
            onClick={() => { setShowCoCreation(true); if (isMobile) setCollapsed(true) }}
            className="flex items-center justify-between p-3 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation bg-white hover:bg-[#FEFAF6] border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:border-[#C41E3A]/30"
          >
            <div className="flex items-center gap-2">
              <Send size={14} />
              <span className="text-sm font-medium">红色家书 · 薪火相传</span>
            </div>
            <ChevronRight size={14} className="opacity-40" />
          </button>
        </div>
      </div>
      
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
    {showPassport && <CheckInPassport onClose={() => setShowPassport(false)} visitedPois={visitedPois} />}
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
