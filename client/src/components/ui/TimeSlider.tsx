import React, { useEffect } from 'react'
import { useAppStore } from '@/store'

const HISTORICAL_EVENTS: Record<number, { title: string, subtitle: string }> = {
  1927: { title: "紫金苏维埃政权成立", subtitle: "星火燎原，武装暴动" },
  1928: { title: "血战炮子村", subtitle: "可歌可泣的苏区保卫战" },
  1929: { title: "苏维埃兵工厂建立", subtitle: "后勤命脉，武装工农" },
  2026: { title: "新时代数字苏区", subtitle: "红色基因，数字孪生" }
}

export const TimeSlider: React.FC = () => {
  const { currentYear, setCurrentYear, setActiveEvent } = useAppStore()

  const minYear = 1920
  const maxYear = 2030
  const marks = [1927, 1980, 2026]

  useEffect(() => {
    if (HISTORICAL_EVENTS[currentYear]) {
      setActiveEvent?.(HISTORICAL_EVENTS[currentYear].title)
    } else {
      setActiveEvent?.(null)
    }
  }, [currentYear, setActiveEvent])

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8 pointer-events-auto z-40">
      {/* 编年史大事件提示 */}
      {HISTORICAL_EVENTS[currentYear] && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 text-center pointer-events-none w-full animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className="inline-flex flex-col items-center p-6 rounded-2xl bg-white border border-[#E8DFD5] shadow-lg">
            <h1 className="text-5xl md:text-6xl font-black tracking-widest font-serif text-[#C41E3A]">
              {currentYear}
            </h1>
            <h2 className="text-xl font-bold text-[#1A1A1A] tracking-wide mt-1 font-serif">
              {HISTORICAL_EVENTS[currentYear].title}
            </h2>
            <p className="text-[#5C5C5C] text-sm mt-1 font-medium">
              {HISTORICAL_EVENTS[currentYear].subtitle}
            </p>
          </div>
          <div className="w-px h-8 mx-auto mt-2 bg-gradient-to-b from-[#C41E3A]/40 to-transparent" />
        </div>
      )}

      <div className="museum-card p-6 rounded-2xl flex flex-col gap-5">
        <div className="flex justify-between items-center text-[#5C5C5C]">
          <span className="text-sm font-medium">{minYear}</span>
          <span className="text-3xl font-bold text-[#1A1A1A] font-serif">
            {currentYear}
          </span>
          <span className="text-sm font-medium">{maxYear}</span>
        </div>

        <div className="relative w-full h-2 bg-[#FEFAF6] rounded-full mt-2 border border-[#E8DFD5]">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#C41E3A] to-[#8B6914] rounded-full"
            style={{ width: `${((currentYear - minYear) / (maxYear - minYear)) * 100}%` }}
          />

          {marks.map(mark => {
            const leftPercent = ((mark - minYear) / (maxYear - minYear)) * 100
            const isPassed = currentYear >= mark
            return (
              <div 
                key={mark}
                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${leftPercent}%` }}
              >
                <div className={`w-3 h-3 rounded-full border-2 border-white transition-colors duration-300 ${
                  isPassed ? 'bg-[#C41E3A] shadow-sm' : 'bg-[#E8DFD5]'
                }`} />
                <span className={`absolute top-4 text-xs font-medium transition-colors duration-300 ${
                  isPassed ? 'text-[#C41E3A] font-bold' : 'text-[#5C5C5C]/50'
                }`}>
                  {mark}
                </span>
              </div>
            )
          })}

          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
            className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-8 opacity-0 cursor-pointer"
            aria-label="拖动时间轴以浏览不同年份的档案"
          />
        </div>
        
        <div className="text-center mt-2 text-xs text-[#5C5C5C]/50 font-medium">
          拖动时间轴以回溯苏区镇历史档案变迁
        </div>
      </div>
    </div>
  )
}
