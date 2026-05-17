import React from 'react'
import { useAppStore } from '@/store'
import { BookOpen, Flag, Map, MoveHorizontal, Crosshair, Film, BookHeart } from 'lucide-react'

export const HudDashboard: React.FC = () => {
  const { getAllArchives, currentYear, setSwipeMode, setFpsMode, isDirectorMode, setDirectorMode } = useAppStore()
  
  // 基于当前时间轴过滤数据
  const currentArchives = getAllArchives().filter(a => a.year <= currentYear)
  
  const totalCount = currentArchives.length
  const redCount = currentArchives.filter(a => a.type === 'revolution').length
  const govCount = currentArchives.filter(a => a.type === 'government').length
  const culCount = currentArchives.filter(a => a.type === 'culture').length

  return (
    <div className="absolute top-24 left-6 w-80 flex flex-col gap-6 pointer-events-auto z-40">
      
      {/* 核心指标看板: 中国红+琉璃金 风格 (更偏向博物馆/教育馆风格) */}
      <div className="glass-panel p-5 rounded-3xl border-2 border-red-800 bg-red-950/80 shadow-[10px_0_30px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-2xl">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-xl" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-red-500 to-transparent" />
        
        <div className="mb-4 border-b border-red-800/50 pb-4">
          <h3 className="font-bold flex items-center gap-3 text-base">
            <BookHeart size={20} className="text-yellow-400" />
            <span className="text-yellow-400 tracking-wider font-serif">
              苏区思政大课堂
            </span>
          </h3>
          <p className="text-[10px] text-red-200/70 font-medium tracking-widest mt-2 ml-8">
            面向全体人民的党史教育阵地
          </p>
        </div>
        
        <div className="flex items-end gap-2 mb-6">
          <div className="text-4xl font-black text-white font-serif">{totalCount}</div>
          <div className="text-sm text-red-200/80 mb-1 font-medium">处红色阵地</div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-red-300">
              <Flag size={14} /> 红色革命遗址
            </div>
            <span className="font-mono text-white font-bold">{redCount}</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" style={{ width: `${totalCount ? (redCount/totalCount)*100 : 0}%` }} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm text-blue-300">
              <Landmark size={14} /> 政府基础建设
            </div>
            <span className="font-mono text-white font-bold">{govCount}</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" style={{ width: `${totalCount ? (govCount/totalCount)*100 : 0}%` }} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm text-amber-300">
              <Activity size={14} /> 文化与其它设施
            </div>
            <span className="font-mono text-white font-bold">{culCount}</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" style={{ width: `${totalCount ? (culCount/totalCount)*100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* 思政学习大纲 */}
      <div className="glass-panel p-5 rounded-3xl border border-red-800/50 relative bg-black/20">
        <h3 className="text-yellow-400 font-bold flex items-center gap-2 mb-4 text-sm">
          <BookOpen size={16} />
          学习路线与实践
        </h3>
        
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-red-900/30 border border-red-700/50 hover:bg-red-800/50 transition-colors cursor-pointer group">
            <div className="flex justify-between items-center text-sm font-medium text-red-100 group-hover:text-yellow-300">
              <span>第一课：政权归于人民</span>
              <span className="text-xs px-2 py-0.5 rounded bg-red-800 text-red-200">红屋</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-red-900/30 border border-red-700/50 hover:bg-red-800/50 transition-colors cursor-pointer group">
            <div className="flex justify-between items-center text-sm font-medium text-red-100 group-hover:text-yellow-300">
              <span>第二课：信仰的底色是忠诚</span>
              <span className="text-xs px-2 py-0.5 rounded bg-red-800 text-red-200">血田</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-red-900/30 border border-red-700/50 hover:bg-red-800/50 transition-colors cursor-pointer group">
            <div className="flex justify-between items-center text-sm font-medium text-red-100 group-hover:text-yellow-300">
              <span>第三课：群众路线生动实践</span>
              <span className="text-xs px-2 py-0.5 rounded bg-red-800 text-red-200">农会</span>
            </div>
          </div>
        </div>
      </div>

      {/* 时空穿梭与环境控制 */}
      <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-4">
        {/* 时空穿梭 */}
        <div className="flex items-center gap-2 text-purple-300 border-b border-white/10 pb-2">
          <Clock size={16} />
          <h3 className="font-bold text-sm tracking-widest">TIME TRAVEL</h3>
        </div>
        
        <button 
          onClick={() => setSwipeMode(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)]"
        >
          <MoveHorizontal size={16} />
          <span className="text-sm font-medium">时空卷帘门</span>
        </button>

        <button 
          onClick={() => setFpsMode(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        >
          <Crosshair size={16} />
          <span className="text-sm font-medium">第一人称街景漫游</span>
        </button>

        <button 
          onClick={() => setDirectorMode(!isDirectorMode)}
          className={`w-full flex items-center justify-center gap-2 p-3 rounded border transition-all ${
            isDirectorMode 
              ? 'border-amber-500 bg-amber-500/20 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] animate-pulse'
              : 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 shadow-[0_0_20px_rgba(220,38,38,0.2)]'
          }`}
        >
          <Film size={16} />
          <span className="text-sm font-medium">{isDirectorMode ? '⏹ 停止自动汇报' : '▶ 启动自动接待汇报'}</span>
        </button>
      </div>

      {/* Environmental Controls */}
        <div className="flex items-center gap-2 text-red-300 border-b border-red-800/50 pb-2 pt-2">
            <Map size={16} />
            <h3 className="font-bold text-sm tracking-widest">思政空间交互</h3>
          </div>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => setShowHistoricalRoute(!showHistoricalRoute)}
            className={`flex items-center justify-between p-2 rounded border transition-colors ${
              showHistoricalRoute ? 'bg-red-500/20 border-red-500/50 text-red-300' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <Route size={14} />
              <span className="text-xs">红军历史行军动线</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${showHistoricalRoute ? 'bg-red-400 animate-pulse' : 'bg-white/20'}`} />
          </button>

          {/* 天气控制已被移除，替换为留白或保留 */}
        </div>
      </div>

    </div>
  )
}
