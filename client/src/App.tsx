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
import { Play, Layers, Globe } from 'lucide-react'

function App() {
  const { fetchArchives, selectedPoiId, setSelectedPoiId, getArchiveData, setDetailModalOpen, isAutoTouring, setAutoTouring, mapStyle, setMapStyle, isIndoorMode, isSwipeMode, setMainMapInstance } = useAppStore()
  
  const activeArchive = selectedPoiId ? getArchiveData(selectedPoiId) : null
  
  // 开场动画状态
  const [showIntro, setShowIntro] = useState(true)

  useEffect(() => {
    // 从后端加载数据
    fetchArchives()
    
    // 3秒后移除开场黑屏遮罩
    const timer = setTimeout(() => {
      setShowIntro(false)
    }, 3500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* GIS Map Layer */}
      <div className="absolute inset-0 z-0">
        <GisMap key={mapStyle} onMapLoad={(map) => setMainMapInstance(map)} />
      </div>

      {/* 天气粒子层 (模拟雾气/发光粉尘) */}
      <div className="absolute inset-0 z-0 pointer-events-none mix-blend-screen opacity-40" style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 60%)'
      }} />

      {/* UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
        {/* Top Header */}
        <UnifiedHeader 
          title="广东省苏区镇数字化档案" 
          description="大屏展示系统 - WebGIS 交互架构"
          onAutoTour={() => setAutoTouring(!isAutoTouring)}
          isTouring={isAutoTouring}
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

        {/* 左侧大屏 HUD */}
        {!showIntro && <HudDashboard />}

        {/* Dynamic Glass Panel for POI Info */}
        <div className="flex-1 flex items-end justify-end p-6 pb-32 z-20">
          {activeArchive && (
            <div className="glass-panel p-6 rounded-3xl w-full max-w-md pointer-events-auto transform transition-all duration-500 translate-y-0 opacity-100 animate-in fade-in slide-in-from-bottom-8 shadow-2xl border border-white/10 relative overflow-hidden">
              {/* 面板装饰光晕 */}
              <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 ${
                activeArchive.type === 'revolution' ? 'bg-red-500' :
                activeArchive.type === 'government' ? 'bg-blue-500' : 'bg-amber-500'
              }`} />

              <div className="flex justify-between items-start mb-4 relative z-10">
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

      {/* 室内 BIM 下钻层 */}
      {isIndoorMode && <IndoorBimMode />}

      {/* 文物全息展台层 */}
      <RelicShowcaseMode />

      {/* 时空卷帘门层 */}
      <SwipeMode />

      {/* 第一人称漫游覆盖层 */}
      <FpsOverlay />

      {/* 右侧数据面板 */}
      <RightDataPanel />

      {/* 自动导演模式控制器 */}
      <DirectorModeController />

      {/* 动态天气系统层 */}
      <WeatherSystem />

      {/* 开场太空坠入幕布 */}
      {showIntro && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 animate-out fade-out duration-1000 delay-[2500ms] fill-mode-forwards pointer-events-none">
          <div className="text-center space-y-6 animate-in slide-in-from-bottom-8 duration-1000">
            <div className="w-16 h-16 mx-auto mb-8 text-red-600 animate-pulse">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-400 to-red-700 tracking-[0.2em]" style={{ fontFamily: 'STZhongsong, "华文中宋", serif' }}>
              广东省苏区镇数字化档案
            </h1>
            <h2 className="text-xl md:text-2xl text-amber-400 tracking-[0.5em] font-light mt-4">
              传承红色基因 · 弘扬苏区精神
            </h2>
            <p className="text-red-900/50 mt-12 font-mono text-sm uppercase tracking-[0.3em] animate-pulse">
              正在载入全域革命遗址数据...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
