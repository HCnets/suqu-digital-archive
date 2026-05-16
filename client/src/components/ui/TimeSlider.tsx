import React from 'react'
import { useAppStore } from '@/store'

export const TimeSlider: React.FC = () => {
  const { currentYear, setCurrentYear } = useAppStore()

  // 设定时间轴的起止年份
  const minYear = 1920
  const maxYear = 2030

  // 关键历史节点
  const marks = [1927, 1980, 2026]

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-3xl px-8 pointer-events-auto">
      <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom-10 duration-700">
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