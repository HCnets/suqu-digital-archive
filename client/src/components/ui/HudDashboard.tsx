import React from 'react'
import { useAppStore } from '@/store'
import { BookOpen, Flag, Map, MoveHorizontal, Crosshair, Film, BookHeart, Landmark, Activity, Clock, Route, ChevronRight } from 'lucide-react'

export const HudDashboard: React.FC = () => {
  const { getAllArchives, currentYear, setSwipeMode, setFpsMode, isDirectorMode, setDirectorMode, showHistoricalRoute, setShowHistoricalRoute } = useAppStore()
  
  const currentArchives = getAllArchives().filter(a => a.year <= currentYear)
  
  const totalCount = currentArchives.length
  const redCount = currentArchives.filter(a => a.type === 'revolution').length
  const govCount = currentArchives.filter(a => a.type === 'government').length
  const culCount = currentArchives.filter(a => a.type === 'culture').length

  return (
    <div className="absolute top-24 left-6 w-80 flex flex-col gap-4 pointer-events-auto z-40">
      
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
          按照"览遗址全景、读红色史料、谈学习感悟"的顺序，循序渐进地走进苏区革命历史。
        </p>
        
        <div className="space-y-2.5">
          <div className="p-3 rounded-xl museum-card-hover cursor-pointer group flex flex-col justify-center min-h-[44px]">
            <div className="flex justify-between items-center text-sm font-medium text-[#1A1A1A]">
              <span className="flex items-center gap-2">
                <ChevronRight size={14} className="text-[#C41E3A]/50 group-hover:text-[#C41E3A] group-hover:translate-x-1 transition-all" />
                第一课：政权归于人民
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#FDE8EC] text-[#C41E3A]">红屋</span>
            </div>
          </div>
          <div className="p-3 rounded-xl museum-card-hover cursor-pointer group flex flex-col justify-center min-h-[44px]">
            <div className="flex justify-between items-center text-sm font-medium text-[#1A1A1A]">
              <span className="flex items-center gap-2">
                <ChevronRight size={14} className="text-[#C41E3A]/50 group-hover:text-[#C41E3A] group-hover:translate-x-1 transition-all" />
                第二课：信仰的底色是忠诚
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#FDE8EC] text-[#C41E3A]">血田</span>
            </div>
          </div>
          <div className="p-3 rounded-xl museum-card-hover cursor-pointer group flex flex-col justify-center min-h-[44px]">
            <div className="flex justify-between items-center text-sm font-medium text-[#1A1A1A]">
              <span className="flex items-center gap-2">
                <ChevronRight size={14} className="text-[#C41E3A]/50 group-hover:text-[#C41E3A] group-hover:translate-x-1 transition-all" />
                第三课：群众路线生动实践
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#FDE8EC] text-[#C41E3A]">农会</span>
            </div>
          </div>
        </div>
      </div>

      {/* 时空印记与体验 */}
      <div className="museum-card p-4 rounded-2xl space-y-3">
        <h3 className="text-[#1A1A1A] font-bold flex items-center gap-2 text-sm font-serif tracking-wider">
          <Clock size={16} className="text-[#8B6914]" />
          时空印记与体验
        </h3>
        
        <button 
          onClick={() => setSwipeMode(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-[#E8DFD5] bg-white hover:bg-[#FEFAF6] hover:border-[#C41E3A]/30 text-[#5C5C5C] hover:text-[#C41E3A] transition-all duration-200 min-h-[44px]"
        >
          <MoveHorizontal size={16} />
          <span className="text-sm font-medium">百年时空对照</span>
        </button>

        <button 
          onClick={() => setFpsMode(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-[#E8DFD5] bg-white hover:bg-[#FEFAF6] hover:border-[#C41E3A]/30 text-[#5C5C5C] hover:text-[#C41E3A] transition-all duration-200 min-h-[44px]"
        >
          <Crosshair size={16} />
          <span className="text-sm font-medium">重走红军路</span>
        </button>

        <button 
          onClick={() => setDirectorMode(!isDirectorMode)}
          className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 min-h-[44px] ${
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
            className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 min-h-[44px] ${
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
  )
}
