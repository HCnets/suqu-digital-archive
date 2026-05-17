import React, { useEffect, useState } from 'react'
import { UnifiedHeader } from '@/components/ui/UnifiedHeader'
import { GisMap } from '@/components/map/GisMap'
import { ArchiveDetailModal } from '@/components/ui/ArchiveDetailModal'
import { TimeSlider } from '@/components/ui/TimeSlider'
import { HudDashboard } from '@/components/ui/HudDashboard'
import { IndoorBimMode } from '@/components/ui/IndoorBimMode'
import { RelicShowcaseMode } from '@/components/ui/RelicShowcaseMode'
import { SwipeMode } from '@/components/ui/SwipeMode'
import { FpsOverlay } from '@/components/ui/FpsOverlay'
import { WeatherSystem } from '@/components/ui/WeatherSystem'
import { RightDataPanel } from '@/components/ui/RightDataPanel'
import { DirectorModeController } from '@/components/ui/DirectorModeController'
import { useAppStore } from '@/store'
import { BookOpenText, Layers, Globe, X } from 'lucide-react'

function App() {
  const { fetchArchives, selectedPoiId, setSelectedPoiId, getArchiveData, setDetailModalOpen, isAutoTouring, setAutoTouring, mapStyle, setMapStyle, isIndoorMode, isSwipeMode, setMainMapInstance } = useAppStore()
  
  const activeArchive = selectedPoiId ? getArchiveData(selectedPoiId) : null
  
  const [showIntro, setShowIntro] = useState(true)

  useEffect(() => {
    fetchArchives()
    const timer = setTimeout(() => {
      setShowIntro(false)
    }, 3500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ backgroundColor: '#FEFAF6' }}>
      {/* GIS Map Layer */}
      <div className="absolute inset-0 z-0">
        <GisMap key={mapStyle} onMapLoad={(map) => setMainMapInstance(map)} />
      </div>

      {/* UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
        {/* Top Header */}
        <UnifiedHeader 
          title="广东省苏区镇数字化档案" 
          description="传承红色基因 · 弘扬苏区精神 —— 面向全体人民的红色党建与思政实践数字展厅"
          onAutoTour={() => setAutoTouring(!isAutoTouring)}
          isTouring={isAutoTouring}
        />

        {/* Map Style Switcher */}
        <div className="absolute top-24 right-6 pointer-events-auto">
          <div className="museum-card p-1.5 rounded-2xl flex flex-col gap-2">
            <button
              onClick={() => setMapStyle('museum')}
              className={`p-3 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-all duration-200 ${
                mapStyle === 'museum' ? 'bg-[#C41E3A] text-white shadow-sm' : 'hover:bg-[#FDE8EC] text-[#5C5C5C]'
              }`}
              title="博物馆导览底图"
              aria-label="切换到博物馆明亮底图"
            >
              <Layers size={22} />
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`p-3 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-all duration-200 ${
                mapStyle === 'satellite' ? 'bg-[#8B6914] text-white shadow-sm' : 'hover:bg-[#FFF8E1] text-[#5C5C5C]'
              }`}
              title="遗址实景底图"
              aria-label="切换到遗址实景底图"
            >
              <Globe size={22} />
            </button>
          </div>
        </div>

        {/* 左侧 HUD */}
        {!showIntro && <HudDashboard />}

        {/* POI 信息卡 */}
        <div className="flex-1 flex items-end justify-end p-6 pb-32 z-50">
          {activeArchive && (
            <div className="museum-card p-6 rounded-2xl w-full max-w-md pointer-events-auto transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden shadow-xl shadow-black/5">
              <div className={`absolute top-0 left-0 w-full h-1 ${
                activeArchive.type === 'revolution' ? 'bg-[#C41E3A]' :
                activeArchive.type === 'government' ? 'bg-[#5C5C5C]' : 'bg-[#8B6914]'
              }`} />

              <div className="flex justify-between items-start mb-3 relative z-10 mt-1">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full border-2 ${
                    activeArchive.type === 'revolution' ? 'bg-[#C41E3A] border-[#C41E3A]' :
                    activeArchive.type === 'government' ? 'bg-[#5C5C5C] border-[#5C5C5C]' : 'bg-[#8B6914] border-[#8B6914]'
                  }`} />
                  <h2 className="text-lg font-bold text-[#1A1A1A] tracking-wide font-serif">{activeArchive.title}</h2>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedPoiId(null) }}
                  className="text-[#5C5C5C]/40 hover:text-[#5C5C5C] transition-colors rounded-full p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="关闭当前档案简介"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-[#5C5C5C] leading-relaxed text-sm font-serif">
                {activeArchive.description}
              </p>
              
              <div className="mt-3 flex gap-4 text-xs text-[#5C5C5C]/70 font-mono bg-[#FEFAF6] p-2.5 rounded-lg border border-[#E8DFD5]">
                <span>LNG: {activeArchive.longitude.toFixed(4)}</span>
                <span>LAT: {activeArchive.latitude.toFixed(4)}</span>
                <span className="ml-auto text-[#C41E3A] font-medium">{activeArchive.year}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-[#E8DFD5] flex justify-end">
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedPoiId(null); setDetailModalOpen(true) }}
                  className="party-btn-primary group flex items-center gap-2 px-5 min-h-[44px]"
                  aria-label={`查看${activeArchive.title}的完整档案`}
                >
                  <BookOpenText size={16} />
                  查看完整档案
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 底部时间轴 */}
        <TimeSlider />
      </div>
      
      <ArchiveDetailModal />
      {isIndoorMode && <IndoorBimMode />}
      <RelicShowcaseMode />
      <SwipeMode />
      <FpsOverlay />
      <RightDataPanel />
      <DirectorModeController />
      <WeatherSystem />

      {/* 开场幕布 */}
      {showIntro && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none" style={{ backgroundColor: '#FEFAF6' }}>
          <div className="text-center space-y-6 animate-in slide-in-from-bottom-8 duration-1000">
            <div className="w-16 h-16 mx-auto mb-8" style={{ color: '#C41E3A' }}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-[0.2em] font-serif" style={{ color: '#C41E3A' }}>
              广东省苏区镇数字化档案
            </h1>
            <h2 className="text-xl md:text-2xl tracking-[0.5em] font-light mt-4" style={{ color: '#8B6914' }}>
              传承红色基因 · 弘扬苏区精神
            </h2>
            <p className="mt-12 text-sm tracking-[0.22em]" style={{ color: '#5C5C5C' }}>
              正在整理苏区史料与实践路线...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
