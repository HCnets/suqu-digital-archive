import React from 'react'
import { UnifiedHeader } from '@/components/ui/UnifiedHeader'
import { GisMap } from '@/components/map/GisMap'
import { useAppStore } from '@/store'

function App() {
  const { selectedPoiId, setSelectedPoiId, getArchiveData } = useAppStore()
  
  const activeArchive = selectedPoiId ? getArchiveData(selectedPoiId) : null

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* GIS Map Layer */}
      <div className="absolute inset-0 z-0">
        <GisMap />
      </div>

      {/* UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
        {/* Top Header */}
        <UnifiedHeader 
          title="广东省苏区镇数字化档案" 
          description="基于真实经纬度的 WebGIS 交互架构 (MapLibre + React)"
          onBack={() => console.log('Back button clicked')}
        />

        {/* Dynamic Glass Panel for POI Info */}
        <div className="flex-1 flex items-end justify-start p-6">
          {activeArchive && (
            <div className="glass-panel p-6 rounded-2xl w-full max-w-md pointer-events-auto transform transition-all duration-500 translate-y-0 opacity-100 animate-in fade-in slide-in-from-bottom-8">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${
                    activeArchive.type === 'revolution' ? 'bg-red-500' :
                    activeArchive.type === 'government' ? 'bg-blue-500' : 'bg-amber-500'
                  } shadow-[0_0_10px_currentColor]`} />
                  <h2 className="text-xl font-bold text-white">{activeArchive.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedPoiId(null)}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-slate-300 leading-relaxed text-sm">
                {activeArchive.description}
              </p>
              
              <div className="mt-4 flex gap-4 text-xs text-white/40 font-mono bg-black/30 p-2 rounded">
                <span>LNG: {activeArchive.longitude.toFixed(4)}</span>
                <span>LAT: {activeArchive.latitude.toFixed(4)}</span>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium">
                  查看详细档案
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App