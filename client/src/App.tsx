import React from 'react'
import { UnifiedHeader } from '@/components/ui/UnifiedHeader'
import { MockMap } from '@/components/map/MockMap'
import { useAppStore } from '@/store'

function App() {
  const { selectedPoiId, setSelectedPoiId, getArchiveData } = useAppStore()
  
  const activeArchive = selectedPoiId ? getArchiveData(selectedPoiId) : null

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 3D Map Layer */}
      <div className="absolute inset-0 z-0">
        <MockMap onPoiClick={(id) => setSelectedPoiId(id)} />
      </div>

      {/* UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
        {/* Top Header */}
        <UnifiedHeader 
          title="广东省苏区镇数字化档案" 
          description="地图点击建模系统 Alpha 版 (React + Three.js)"
          onBack={() => console.log('Back button clicked')}
        />

        {/* Dynamic Glass Panel for POI Info */}
        <div className="flex-1 flex items-end justify-start p-6">
          {activeArchive && (
            <div className="glass-panel p-6 rounded-2xl w-full max-w-md pointer-events-auto transform transition-all duration-500 translate-y-0 opacity-100 animate-in fade-in slide-in-from-bottom-8">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-white">{activeArchive.title}</h2>
                <button 
                  onClick={() => setSelectedPoiId(null)}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {activeArchive.description}
              </p>
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