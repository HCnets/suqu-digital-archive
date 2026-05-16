import React, { useEffect, useState } from 'react'
import { PieChart, TrendingUp, Users, ShieldAlert } from 'lucide-react'

export const RightDataPanel: React.FC = () => {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (!mounted) return null

  return (
    <div className="absolute top-24 right-6 w-80 bottom-8 flex flex-col gap-6 pointer-events-auto z-40 animate-in slide-in-from-right-8 duration-1000">
      
      {/* 模块一：客流与态势 */}
      <div className="glass-panel p-5 rounded-3xl border border-red-900/30 bg-black/60 shadow-[0_0_30px_rgba(220,38,38,0.1)] relative overflow-hidden backdrop-blur-xl flex-1">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-red-600" />
        
        <h3 className="font-bold flex items-center gap-2 text-sm mb-6 text-red-100">
          <TrendingUp size={16} className="text-red-500" />
          红色文旅年度态势
        </h3>

        {/* 核心数字 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-red-900/20 p-3 rounded-xl border border-red-500/20">
            <div className="text-xs text-red-300/60 mb-1 flex items-center gap-1"><Users size={12}/> 累计参观</div>
            <div className="text-2xl font-black text-amber-400 font-mono">128.4<span className="text-sm">w</span></div>
          </div>
          <div className="bg-red-900/20 p-3 rounded-xl border border-red-500/20">
            <div className="text-xs text-red-300/60 mb-1 flex items-center gap-1"><ShieldAlert size={12}/> 研学团队</div>
            <div className="text-2xl font-black text-amber-400 font-mono">3,240<span className="text-sm">批</span></div>
          </div>
        </div>

        {/* SVG 折线图模拟 */}
        <div className="h-32 w-full relative mt-4 border-b border-l border-red-900/50">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
            {/* 网格线 */}
            <line x1="0" y1="12.5" x2="100" y2="12.5" stroke="rgba(220,38,38,0.2)" strokeWidth="0.5" strokeDasharray="2,2" />
            <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(220,38,38,0.2)" strokeWidth="0.5" strokeDasharray="2,2" />
            <line x1="0" y1="37.5" x2="100" y2="37.5" stroke="rgba(220,38,38,0.2)" strokeWidth="0.5" strokeDasharray="2,2" />
            
            {/* 渐变填充 */}
            <defs>
              <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(245,158,11,0.5)" />
                <stop offset="100%" stopColor="rgba(220,38,38,0)" />
              </linearGradient>
            </defs>
            <polygon points="0,50 0,40 20,35 40,45 60,20 80,15 100,5 100,50" fill="url(#area-gradient)" className="animate-[pulse_4s_ease-in-out_infinite]" />
            
            {/* 折线 */}
            <polyline points="0,40 20,35 40,45 60,20 80,15 100,5" fill="none" stroke="#fbbf24" strokeWidth="1.5" className="drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
            
            {/* 节点 */}
            <circle cx="20" cy="35" r="1.5" fill="#fff" />
            <circle cx="40" cy="45" r="1.5" fill="#fff" />
            <circle cx="60" cy="20" r="1.5" fill="#fff" />
            <circle cx="80" cy="15" r="1.5" fill="#fff" />
            <circle cx="100" cy="5" r="2" fill="#ef4444" className="animate-ping" />
          </svg>
          {/* X轴标签 */}
          <div className="absolute -bottom-5 left-0 w-full flex justify-between text-[10px] text-red-200/40 font-mono">
            <span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span>
          </div>
        </div>
      </div>

      {/* 模块二：资产分类 */}
      <div className="glass-panel p-5 rounded-3xl border border-red-900/30 bg-black/60 shadow-[0_0_30px_rgba(220,38,38,0.1)] relative backdrop-blur-xl flex-1 flex flex-col">
        <h3 className="font-bold flex items-center gap-2 text-sm mb-6 text-red-100">
          <PieChart size={16} className="text-red-500" />
          革命遗产数字矩阵
        </h3>
        
        <div className="flex-1 flex items-center justify-center relative">
          {/* CSS 环形图模拟 */}
          <div className="w-32 h-32 rounded-full border-[12px] border-red-900/30 relative flex items-center justify-center">
            {/* 进度条 1 */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="64" cy="64" r="58" fill="none" stroke="#ef4444" strokeWidth="12" strokeDasharray="364" strokeDashoffset="100" className="drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            </svg>
            {/* 进度条 2 */}
            <svg className="absolute inset-0 w-full h-full rotate-[120deg]">
              <circle cx="64" cy="64" r="58" fill="none" stroke="#fbbf24" strokeWidth="12" strokeDasharray="364" strokeDashoffset="260" className="drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            </svg>

            <div className="text-center">
              <div className="text-2xl font-black text-white font-mono">100%</div>
              <div className="text-[10px] text-red-200/50 uppercase scale-90">Digitalized</div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" />重要战斗遗址</div>
            <span className="text-white font-mono">45%</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400" />政权机构旧址</div>
            <span className="text-white font-mono">35%</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-900" />纪念碑及陵园</div>
            <span className="text-white font-mono">20%</span>
          </div>
        </div>
      </div>

    </div>
  )
}
