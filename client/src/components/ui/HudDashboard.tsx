import React from 'react'
import { useAppStore } from '@/store'
import { BookOpen, Flag, Map, MoveHorizontal, Crosshair, Film, BookHeart, Landmark, Activity, Clock, Route, ChevronRight, CheckCircle2, PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'

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
  const { getAllArchives, currentYear, setSwipeMode, setFpsMode, isDirectorMode, setDirectorMode, showHistoricalRoute, setShowHistoricalRoute, setSelectedPoiId, setDetailModalOpen, mainMapInstance, selectedPoiId } = useAppStore()
  const [collapsed, setCollapsed] = useState(false)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

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
        </div>
      </div>
      
    </div>
    </div>
    )}
    </div>
    </>
  )
}
