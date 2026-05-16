import React from 'react'
import { UnifiedHeader } from '@/components/ui/UnifiedHeader'
import { GisMap } from '@/components/map/GisMap'
import { ArchiveDetailModal } from '@/components/ui/ArchiveDetailModal'
import { TimeSlider } from '@/components/ui/TimeSlider'
import { useAppStore } from '@/store'
import { Play, Layers, Globe } from 'lucide-react'

function App() {
  const { selectedPoiId, setSelectedPoiId, getArchiveData, setDetailModalOpen, isAutoTouring, setAutoTouring, mapStyle, setMapStyle } = useAppStore()
  
  const activeArchive = selectedPoiId ? getArchiveData(selectedPoiId) : null

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* GIS Map Layer */}
      <div className="absolute inset-0 z-0">
        <GisMap key={mapStyle} />
      </div>

      {/* UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
        {/* Top Header */}
        <UnifiedHeader 
          title="广东省苏区镇数字化档案" 
          description="基于真实经纬度的 WebGIS 交互架构 (MapLibre + React)"
          onAutoTour={() => setAutoTouring(!isAutoTouring)}
          isTouring={isAutoTouring}
          onBack={() => console.log('Back button clicked')}
        />

        {/* Map Style Switcher */}
        <div className="absolute top-24 right-6 pointer-events-auto">
          <div className="glass-panel p-1.5 rounded-2xl flex flex-col gap-2 shadow-2xl border border-white/10 bg-black/40 backdrop-blur-md">
            <button
              onClick={() => setMapStyle('dark')}
              className={`p-3 rounded-xl flex items-center justify-center transition-all duration-300 ${
                mapStyle === 'dark' ? 'bg-blue-500/80 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'hover:bg-white/10 text-white/50'
              }`}
              title="科技暗黑风"
            >
              <Layers size={22} />
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`p-3 rounded-xl flex items-center justify-center transition-all duration-300 ${
                mapStyle === 'satellite' ? 'bg-amber-500/80 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'hover:bg-white/10 text-white/50'
              }`}
              title="高清卫星实景"
            >
              <Globe size={22} />
            </button>
          </div>
        </div>

        {/* Dynamic Glass Panel for POI Info */}
        <div className="flex-1 flex items-end justify-start p-6 pb-32">
          {activeArchive && (
            <div className="glass-panel p-6 rounded-3xl w-full max-w-md pointer-events-auto transform transition-all duration-500 translate-y-0 opacity-100 animate-in fade-in slide-in-from-bottom-8 shadow-2xl">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${
                    activeArchive.type === 'revolution' ? 'bg-red-500' :
                    activeArchive.type === 'government' ? 'bg-blue-500' : 'bg-amber-500'
                  } shadow-[0_0_10px_currentColor]`} />
                  <h2 className="text-xl font-bold text-white tracking-wide">{activeArchive.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedPoiId(null)}
                  className="text-white/40 hover:text-white transition-colors bg-white/5 rounded-full p-1"
                >
                  ✕
                </button>
              </div>
              <p className="text-slate-300 leading-relaxed text-sm">
                {activeArchive.description}
              </p>
              
              <div className="mt-4 flex gap-4 text-xs text-white/50 font-mono bg-black/40 p-2.5 rounded-lg border border-white/5">
                <span>LNG: {activeArchive.longitude.toFixed(4)}</span>
                <span>LAT: {activeArchive.latitude.toFixed(4)}</span>
                <span className="ml-auto text-blue-400">{activeArchive.year}</span>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                <button 
                  onClick={() => setDetailModalOpen(true)}
                  className="group flex items-center gap-2 px-5 py-2.5 bg-blue-600/80 hover:bg-blue-500 text-white rounded-xl transition-all duration-300 text-sm font-medium shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:scale-105"
                >
                  <Play size={16} className="text-white/80 group-hover:text-white" />
                  深度解析档案
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 底部全局时间沙盘 */}
        <TimeSlider />
      </div>
      
      {/* 独立的全屏模态框层 */}
      <ArchiveDetailModal />
    </div>
  )
}

export default App