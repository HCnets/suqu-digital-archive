import React from 'react'
import { useAppStore } from '@/store'
import { BookOpen, Flag, Map, MoveHorizontal, Crosshair, Film, BookHeart, Landmark, Activity, Clock, Route, ChevronRight } from 'lucide-react'

export const HudDashboard: React.FC = () => {
  const { getAllArchives, currentYear, setSwipeMode, setFpsMode, isDirectorMode, setDirectorMode, showHistoricalRoute, setShowHistoricalRoute } = useAppStore()
  
  // 基于当前时间轴过滤数据
  const currentArchives = getAllArchives().filter(a => a.year <= currentYear)
  
  const totalCount = currentArchives.length
  const redCount = currentArchives.filter(a => a.type === 'revolution').length
  const govCount = currentArchives.filter(a => a.type === 'government').length
  const culCount = currentArchives.filter(a => a.type === 'culture').length

  return (
    <div className="absolute top-24 left-6 w-80 flex flex-col gap-6 pointer-events-auto z-40">
      
      {/* 核心指标看板: 中国红+琉璃金 风格 (更偏向博物馆/教育馆风格) */}
      <div className="glass-panel p-5 rounded-3xl border border-rose-900/30 bg-zinc-950/80 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative overflow-hidden backdrop-blur-2xl">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-600/10 rounded-full blur-2xl" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-rose-600 to-transparent" />
        
        <div className="mb-4 border-b border-rose-900/40 pb-4">
          <h3 className="font-bold flex items-center gap-3 text-base">
            <BookHeart size={20} className="text-amber-400" />
            <span className="text-amber-400 tracking-wider font-serif">
              苏区思政大课堂
            </span>
          </h3>
          <p className="text-[10px] text-rose-200/70 font-medium tracking-widest mt-2 ml-8">
            面向全体人民的党史教育阵地
          </p>
        </div>
        
        <div className="flex items-end gap-2 mb-6">
          <div className="text-4xl font-black text-white font-serif">{totalCount}</div>
          <div className="text-sm text-rose-200/80 mb-1 font-medium">处红色阵地</div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between group cursor-pointer hover:-translate-y-0.5 transition-transform duration-300">
            <div className="flex items-center gap-2 text-sm text-rose-300">
              <Flag size={14} className="group-hover:text-rose-400 transition-colors" /> 红色革命遗址
            </div>
            <span className="font-mono text-white font-bold">{redCount}</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.6)] transition-all duration-1000" style={{ width: `${totalCount ? (redCount/totalCount)*100 : 0}%` }} />
          </div>

          <div className="flex items-center justify-between pt-2 group cursor-pointer hover:-translate-y-0.5 transition-transform duration-300">
            <div className="flex items-center gap-2 text-sm text-blue-300">
              <Landmark size={14} className="group-hover:text-blue-400 transition-colors" /> 政府基础建设
            </div>
            <span className="font-mono text-white font-bold">{govCount}</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] transition-all duration-1000" style={{ width: `${totalCount ? (govCount/totalCount)*100 : 0}%` }} />
          </div>

          <div className="flex items-center justify-between pt-2 group cursor-pointer hover:-translate-y-0.5 transition-transform duration-300">
            <div className="flex items-center gap-2 text-sm text-amber-300">
              <Activity size={14} className="group-hover:text-amber-400 transition-colors" /> 文化与其它设施
            </div>
            <span className="font-mono text-white font-bold">{culCount}</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)] transition-all duration-1000" style={{ width: `${totalCount ? (culCount/totalCount)*100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* 思政学习大纲 */}
      <div className="glass-panel p-5 rounded-3xl border border-rose-900/30 relative bg-zinc-950/60 shadow-lg backdrop-blur-xl">
        <h3 className="text-amber-400 font-bold flex items-center gap-2 mb-4 text-sm font-serif tracking-widest">
          <BookOpen size={16} />
          学习路线与实践
        </h3>
        
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/60 hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(225,29,72,0.3)] transition-all duration-300 cursor-pointer group flex flex-col justify-center min-h-[44px]">
            <div className="flex justify-between items-center text-sm font-medium text-rose-100 group-hover:text-amber-300 transition-colors">
              <span className="flex items-center gap-2"><ChevronRight size={14} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" /> 第一课：政权归于人民</span>
              <span className="text-xs px-2 py-0.5 rounded bg-rose-900/80 text-rose-200 border border-rose-800/50">红屋</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/60 hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(225,29,72,0.3)] transition-all duration-300 cursor-pointer group flex flex-col justify-center min-h-[44px]">
            <div className="flex justify-between items-center text-sm font-medium text-rose-100 group-hover:text-amber-300 transition-colors">
              <span className="flex items-center gap-2"><ChevronRight size={14} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" /> 第二课：信仰的底色是忠诚</span>
              <span className="text-xs px-2 py-0.5 rounded bg-rose-900/80 text-rose-200 border border-rose-800/50">血田</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/60 hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(225,29,72,0.3)] transition-all duration-300 cursor-pointer group flex flex-col justify-center min-h-[44px]">
            <div className="flex justify-between items-center text-sm font-medium text-rose-100 group-hover:text-amber-300 transition-colors">
              <span className="flex items-center gap-2"><ChevronRight size={14} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" /> 第三课：群众路线生动实践</span>
              <span className="text-xs px-2 py-0.5 rounded bg-rose-900/80 text-rose-200 border border-rose-800/50">农会</span>
            </div>
          </div>
        </div>
      </div>

      {/* 时空穿梭与环境控制 */}
      <div className="glass-panel p-4 rounded-xl border border-rose-900/30 space-y-4 bg-zinc-950/60 shadow-lg backdrop-blur-xl mt-6">
        {/* 时空穿梭 */}
        <div className="flex items-center gap-2 text-amber-400 border-b border-rose-900/40 pb-2">
          <Clock size={16} />
          <h3 className="font-bold text-sm tracking-widest font-serif">时空印记与体验</h3>
        </div>
        
        <button 
          onClick={() => setSwipeMode(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded border border-rose-800/30 bg-rose-900/10 text-rose-200 hover:bg-rose-900/30 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 min-h-[44px]"
        >
          <MoveHorizontal size={16} />
          <span className="text-sm font-medium">百年时空卷帘门</span>
        </button>

        <button 
          onClick={() => setFpsMode(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded border border-rose-800/30 bg-rose-900/10 text-rose-200 hover:bg-rose-900/30 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 min-h-[44px]"
        >
          <Crosshair size={16} />
          <span className="text-sm font-medium">重走红军路 (第一人称)</span>
        </button>

        <button 
          onClick={() => setDirectorMode(!isDirectorMode)}
          className={`w-full flex items-center justify-center gap-2 p-3 rounded border transition-all duration-300 min-h-[44px] hover:-translate-y-0.5 hover:shadow-lg ${
            isDirectorMode 
              ? 'border-amber-500 bg-amber-500/20 text-amber-400 shadow-[0_0_20px_rgba(250,204,21,0.4)] animate-pulse'
              : 'border-rose-800/30 bg-rose-600/20 text-white hover:bg-rose-600/40 shadow-[0_4px_15px_rgba(225,29,72,0.3)]'
          }`}
        >
          <Film size={16} />
          <span className="text-sm font-medium">{isDirectorMode ? '⏹ 停止自动汇报' : '▶ 启动沉浸式自动宣讲'}</span>
        </button>
      </div>

      {/* Environmental Controls */}
      <div className="glass-panel p-4 rounded-xl border border-rose-900/30 space-y-4 bg-zinc-950/60 shadow-lg backdrop-blur-xl mt-6">
        <div className="flex items-center gap-2 text-rose-300 border-b border-rose-900/40 pb-2">
            <Map size={16} />
            <h3 className="font-bold text-sm tracking-widest font-serif">思政空间交互</h3>
        </div>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => setShowHistoricalRoute(!showHistoricalRoute)}
            className={`flex items-center justify-between p-3 rounded border transition-all duration-300 min-h-[44px] hover:-translate-y-0.5 hover:shadow-lg ${
              showHistoricalRoute ? 'bg-rose-600/30 border-rose-500/50 text-rose-100 shadow-[0_4px_15px_rgba(225,29,72,0.3)]' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <Route size={14} />
              <span className="text-sm font-medium">红军历史行军动线</span>
            </div>
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${showHistoricalRoute ? 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.8)]' : 'bg-white/20'}`} />
          </button>
        </div>
      </div>
      
    </div>
  )
}