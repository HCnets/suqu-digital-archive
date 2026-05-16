import React, { useEffect } from 'react'
import { useAppStore } from '@/store'

// 编年史大事件剧场数据字典
const HISTORICAL_EVENTS: Record<number, { title: string, subtitle: string, type: 'blood' | 'gold' | 'tech' }> = {
  1927: { title: "紫金苏维埃政权成立", subtitle: "星火燎原，武装暴动", type: "blood" },
  1928: { title: "血战炮子村", subtitle: "可歌可泣的苏区保卫战", type: "blood" },
  1929: { title: "苏维埃兵工厂建立", subtitle: "后勤命脉，武装工农", type: "gold" },
  2026: { title: "新时代数字苏区", subtitle: "红色基因，数字孪生", type: "tech" }
}

export const TimeSlider: React.FC = () => {
  const { currentYear, setCurrentYear, setActiveEvent } = useAppStore()

  // 设定时间轴的起止年份
  const minYear = 1920
  const maxYear = 2030

  // 关键历史节点
  const marks = [1927, 1980, 2026]

  // 检查是否触发了大事件
  useEffect(() => {
    if (HISTORICAL_EVENTS[currentYear]) {
      setActiveEvent?.(HISTORICAL_EVENTS[currentYear].title)
    } else {
      setActiveEvent?.(null)
    }
  }, [currentYear, setActiveEvent])

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8 pointer-events-auto z-40">
      {/* 编年史大事件全息投影提示 */}
      {HISTORICAL_EVENTS[currentYear] && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 text-center pointer-events-none w-full animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className={`inline-flex flex-col items-center p-6 rounded-3xl backdrop-blur-md border ${
            HISTORICAL_EVENTS[currentYear].type === 'blood' ? 'bg-red-900/30 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.3)]' :
            HISTORICAL_EVENTS[currentYear].type === 'gold' ? 'bg-amber-900/30 border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.3)]' :
            'bg-blue-900/30 border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.3)]'
          }`}>
            <h1 className={`text-4xl md:text-5xl font-black tracking-widest uppercase mb-2 ${
              HISTORICAL_EVENTS[currentYear].type === 'blood' ? 'text-transparent bg-clip-text bg-gradient-to-b from-red-200 to-red-600' :
              HISTORICAL_EVENTS[currentYear].type === 'gold' ? 'text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600' :
              'text-transparent bg-clip-text bg-gradient-to-b from-blue-200 to-blue-600'
            }`}>
              {currentYear}
            </h1>
            <h2 className="text-2xl font-bold text-white tracking-wider">
              {HISTORICAL_EVENTS[currentYear].title}
            </h2>
            <p className="text-white/60 text-sm mt-2 font-mono tracking-widest">
              {HISTORICAL_EVENTS[currentYear].subtitle}
            </p>
          </div>
          {/* 连接线 */}
          <div className={`w-px h-8 mx-auto mt-2 ${
            HISTORICAL_EVENTS[currentYear].type === 'blood' ? 'bg-gradient-to-b from-red-500/50 to-transparent' :
            HISTORICAL_EVENTS[currentYear].type === 'gold' ? 'bg-gradient-to-b from-amber-500/50 to-transparent' :
            'bg-gradient-to-b from-blue-500/50 to-transparent'
          }`} />
        </div>
      )}

      <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl bg-black/60 backdrop-blur-xl flex flex-col gap-6">
        <div className="flex justify-between items-center text-white/80 font-mono">
          <span className="text-sm">{minYear}</span>
          <span className="text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            {currentYear}
          </span>
          <span className="text-sm">{maxYear}</span>
        </div>

        <div className="relative w-full h-2 bg-white/10 rounded-full mt-2">
          {/* 滑块轨道高亮部分 */}
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-amber-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            style={{ width: `${((currentYear - minYear) / (maxYear - minYear)) * 100}%` }}
          />

          {/* 刻度标记 */}
          {marks.map(mark => {
            const leftPercent = ((mark - minYear) / (maxYear - minYear)) * 100
            const isPassed = currentYear >= mark
            return (
              <div 
                key={mark}
                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${leftPercent}%` }}
              >
                <div className={`w-3 h-3 rounded-full border-2 border-slate-900 transition-colors duration-300 ${
                  isPassed ? 'bg-white shadow-[0_0_10px_white]' : 'bg-white/30'
                }`} />
                <span className={`absolute top-4 text-xs font-mono transition-colors duration-300 ${
                  isPassed ? 'text-white font-bold' : 'text-white/40'
                }`}>
                  {mark}
                </span>
              </div>
            )
          })}

          {/* 原生 range input，完全透明覆盖在上面 */}
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
            className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-8 opacity-0 cursor-pointer"
          />
        </div>
        
        <div className="text-center mt-2 text-xs text-white/40 font-medium">
          拖动时间轴以回溯苏区镇历史档案变迁
        </div>
      </div>
    </div>
  )
}