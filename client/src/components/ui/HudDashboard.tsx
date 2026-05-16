import React from 'react'
import { useAppStore } from '@/store'
import { Activity, Database, Flag, Landmark, CloudRain, CloudSnow, Sun, Route, MoveHorizontal, Clock } from 'lucide-react'

export const HudDashboard: React.FC = () => {
  const { getAllArchives, currentYear, weather, setWeather, showHistoricalRoute, setShowHistoricalRoute, setSwipeMode } = useAppStore()
  
  // 基于当前时间轴过滤数据
  const currentArchives = getAllArchives().filter(a => a.year <= currentYear)
  
  const totalCount = currentArchives.length
  const redCount = currentArchives.filter(a => a.type === 'revolution').length
  const govCount = currentArchives.filter(a => a.type === 'government').length
  const culCount = currentArchives.filter(a => a.type === 'culture').length

  return (
    <div className="absolute top-24 left-6 w-80 flex flex-col gap-6 pointer-events-auto z-40">
      
      {/* 核心指标看板 */}
      <div className="glass-panel p-5 rounded-3xl border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)] relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl" />
        
        <h3 className="text-white/80 font-bold flex items-center gap-2 mb-4 text-sm">
          <Database size={16} className="text-blue-400" />
          苏区镇档案总览
        </h3>
        
        <div className="flex items-end gap-2 mb-6">
          <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-blue-200 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            {totalCount}
          </span>
          <span className="text-white/50 text-sm mb-1 font-medium">个坐标卷宗</span>
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

      {/* 实时雷达监控面板 */}
      <div className="glass-panel p-5 rounded-3xl border border-white/5 relative">
        <h3 className="text-white/60 font-bold text-xs uppercase tracking-widest mb-4 flex justify-between items-center">
          <span>Active Radar</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Online
          </span>
        </h3>
        
        <div className="h-32 w-full border border-white/10 rounded-xl bg-black/40 relative overflow-hidden flex items-center justify-center">
          {/* 雷达扫描线模拟 */}
          <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,rgba(0,0,0,0)_0%,rgba(59,130,246,0.2)_100%)] animate-spin" style={{ animationDuration: '3s' }} />
          <div className="absolute w-full h-[1px] bg-blue-500/30 top-1/2 -translate-y-1/2" />
          <div className="absolute h-full w-[1px] bg-blue-500/30 left-1/2 -translate-x-1/2" />
          
          <div className="absolute top-2 right-2 text-[10px] text-blue-400/50 font-mono">SYS.OK</div>
          <div className="absolute bottom-2 left-2 text-[10px] text-blue-400/50 font-mono">LNG: 115.34 LAT: 23.36</div>
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

        {/* Environmental Controls */}
        <div className="flex items-center gap-2 text-blue-300 border-b border-white/10 pb-2 pt-2">
          <Activity size={16} />
          <h3 className="font-bold text-sm tracking-widest">ENV CONTROLS</h3>
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

          <div className="flex gap-2">
            <button 
              onClick={() => setWeather('clear')}
              className={`flex-1 flex flex-col items-center justify-center p-2 rounded border transition-colors ${
                weather === 'clear' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
              }`}
            >
              <Sun size={14} className="mb-1" />
              <span className="text-[10px]">晴朗</span>
            </button>
            <button 
              onClick={() => setWeather('rain')}
              className={`flex-1 flex flex-col items-center justify-center p-2 rounded border transition-colors ${
                weather === 'rain' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
              }`}
            >
              <CloudRain size={14} className="mb-1" />
              <span className="text-[10px]">暴雨</span>
            </button>
            <button 
              onClick={() => setWeather('snow')}
              className={`flex-1 flex flex-col items-center justify-center p-2 rounded border transition-colors ${
                weather === 'snow' ? 'bg-white/20 border-white/50 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
              }`}
            >
              <CloudSnow size={14} className="mb-1" />
              <span className="text-[10px]">大雪</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
