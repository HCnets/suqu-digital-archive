import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { UnifiedHeader } from '@/components/ui/UnifiedHeader'
import { GisMap } from '@/components/map/GisMap'
import { TimeSlider } from '@/components/ui/TimeSlider'
import { HudDashboard } from '@/components/ui/HudDashboard'
import { Footer } from '@/components/ui/Footer'
import { useAppStore } from '@/store'
import { shouldUseBackend } from '@/lib/env'
import { BookOpenText, Layers, Globe, MapPin, X } from 'lucide-react'
import type maplibregl from 'maplibre-gl'

// 非首屏组件懒加载
const ArchiveDetailModal = lazy(() => import('@/components/ui/ArchiveDetailModal').then(m => ({ default: m.ArchiveDetailModal })))
const IndoorBimMode = lazy(() => import('@/components/ui/IndoorBimMode').then(m => ({ default: m.IndoorBimMode })))
const RelicShowcaseMode = lazy(() => import('@/components/ui/RelicShowcaseMode').then(m => ({ default: m.RelicShowcaseMode })))
const SwipeMode = lazy(() => import('@/components/ui/SwipeMode').then(m => ({ default: m.SwipeMode })))
const FpsOverlay = lazy(() => import('@/components/ui/FpsOverlay').then(m => ({ default: m.FpsOverlay })))
const WeatherSystem = lazy(() => import('@/components/ui/WeatherSystem').then(m => ({ default: m.WeatherSystem })))
const RightDataPanel = lazy(() => import('@/components/ui/RightDataPanel').then(m => ({ default: m.RightDataPanel })))
const DirectorModeController = lazy(() => import('@/components/ui/DirectorModeController').then(m => ({ default: m.DirectorModeController })))

function App() {
  const { fetchArchives, fetchRegionConfig, regionConfig, selectedPoiId, setSelectedPoiId, getArchiveData, setDetailModalOpen, setDirectorMode, isDirectorMode, mapStyle, setMapStyle, isIndoorMode, setMainMapInstance } = useAppStore()
  
  const activeArchive = selectedPoiId ? getArchiveData(selectedPoiId) : null
  
  const [showIntro, setShowIntro] = useState(true)
  const offlineMode = !shouldUseBackend()
  const regionDisplayName = regionConfig.defaultRegion?.fullName || regionConfig.defaultRegion?.name || ''
  const appTitle = regionDisplayName ? `${regionDisplayName}数字化档案` : '红色文化数字档案'
  const introTitle = '苏区镇红色阵地数字化档案'
  const handleMapLoad = useCallback((map: maplibregl.Map) => {
    setMainMapInstance(map)
  }, [setMainMapInstance])

  useEffect(() => {
    void Promise.all([fetchRegionConfig(), fetchArchives()])
    const timer = setTimeout(() => {
      setShowIntro(false)
    }, 1200)
    return () => clearTimeout(timer)
  }, [fetchArchives, fetchRegionConfig])

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden" style={{ backgroundColor: '#FEFAF6' }}>
      {/* GIS Map Layer */}
      <div className="absolute inset-0 z-0">
        <GisMap onMapLoad={handleMapLoad} />
      </div>

      {/* UI Layer */}
      <div className="absolute inset-x-0 top-0 z-40 pointer-events-none">
        {offlineMode && (
          <div className="absolute top-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full border border-[#8B6914]/30 bg-[#FFF8E1]/90 text-[#8B6914] text-xs font-medium whitespace-nowrap shadow-sm">
            离线演示模式：未连接数据服务，展示内容为静态示例，实时档案/地图数据不可用。
          </div>
        )}
        {/* Top Header */}
        <UnifiedHeader 
          title={appTitle}
          description="AI赋能红色传承 · 后台审核发布 · 红色阵地数字导览"
          onAutoTour={() => setDirectorMode(!isDirectorMode)}
          isTouring={isDirectorMode}
        />

        {/* Map Style Switcher */}
        <div className="absolute right-4 top-[calc(100%+0.75rem)] pointer-events-auto md:right-[360px]">
          <div className="museum-card flex gap-2 rounded-xl p-1.5 md:flex-col">
            <button
              onClick={() => setMapStyle('museum')}
              className={`p-3 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-all duration-200 ${
                mapStyle === 'museum' ? 'bg-party-red text-white shadow-sm' : 'hover:bg-party-red-light text-party-ink-light'
              }`}
              title="博物馆导览底图"
              aria-label="切换到博物馆明亮底图"
            >
              <Layers size={22} />
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`p-3 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-all duration-200 ${
                mapStyle === 'satellite' ? 'bg-party-gold text-white shadow-sm' : 'hover:bg-party-gold-light text-party-ink-light'
              }`}
              title="遗址实景底图"
              aria-label="切换到遗址实景底图"
            >
              <Globe size={22} />
            </button>
          </div>
        </div>

        {/* 底部时间轴 */}
        <div className={activeArchive ? 'hidden md:block' : ''}>
          <TimeSlider />
        </div>
      </div>

      {/* 左侧 HUD — 提升到 root 层级，避免被 RightDataPanel 的 stacking context 压制 */}
      {!showIntro && <HudDashboard />}

      {/* POI 信息卡 */}
      {!showIntro && activeArchive && (
        <div className="fixed inset-x-4 bottom-20 z-[60] pointer-events-auto md:inset-x-auto md:bottom-24 md:right-[360px] md:w-[380px]">
          <div className="museum-card max-h-[42dvh] overflow-y-auto rounded-2xl p-4 shadow-xl shadow-black/5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 md:max-h-[calc(100dvh-12rem)] md:p-5">
            <div className={`absolute top-0 left-0 w-full h-1 ${
              activeArchive.type === 'revolution' ? 'bg-party-red' :
              activeArchive.type === 'government' ? 'bg-party-ink-light' : 'bg-party-gold'
            }`} />

            <div className="flex justify-between items-start mb-3 relative z-10 mt-1">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full border-2 ${
                  activeArchive.type === 'revolution' ? 'bg-party-red border-party-red' :
                  activeArchive.type === 'government' ? 'bg-party-ink-light border-party-ink-light' : 'bg-party-gold border-party-gold'
                }`} />
                <h2 className="text-lg font-bold leading-snug text-party-ink font-display">{activeArchive.title}</h2>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedPoiId(null) }}
                className="text-party-ink-light hover:text-party-ink-light transition-colors rounded-full p-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/80 hover:bg-white"
                aria-label="关闭当前档案简介"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm leading-relaxed text-party-ink-light font-reading">
              {activeArchive.description}
            </p>
            
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-party-ink-light bg-museum-bg p-2.5 rounded-lg border border-museum-border">
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-party-red" />
                地图定位已记录
              </span>
              <span className="ml-auto text-party-red font-medium">{activeArchive.year} 年</span>
            </div>

            <div className="mt-4 pt-4 border-t border-museum-border flex justify-end">
              <button 
                onClick={(e) => { e.stopPropagation(); setDetailModalOpen(true) }}
                className="party-btn-primary group flex items-center gap-2 px-5 min-h-[44px]"
                aria-label={`查看${activeArchive.title}的完整档案`}
              >
                <BookOpenText size={16} />
                查看完整档案
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Suspense fallback={
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-museum-bg backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-party-red animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-party-red animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-party-red animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-xs font-medium text-party-ink-light">加载中...</p>
          </div>
        </div>
      }>
        <ArchiveDetailModal />
        {isIndoorMode && <IndoorBimMode />}
        <RelicShowcaseMode />
        <SwipeMode />
        <FpsOverlay />
        <RightDataPanel />
        <DirectorModeController />
        <WeatherSystem />
      </Suspense>

      {/* 页脚信息条 */}
      <Footer />

      {/* 开场幕布 */}
      {showIntro && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden pointer-events-none" style={{ backgroundColor: '#FEFAF6' }}>
          <div className="absolute inset-x-0 top-[18%] h-px bg-party-gold-line" />
          <div className="absolute inset-x-0 bottom-[20%] h-px bg-party-gold-line" />
          <div className="w-full max-w-4xl px-6 text-center animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-party-gold-line bg-white/70 shadow-lg shadow-black/5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
            </div>
            <p className="mx-auto mb-4 inline-flex rounded-md border border-party-gold bg-white/75 px-3 py-1.5 text-xs font-semibold shadow-sm shadow-black/5" style={{ color: '#8B6914' }}>
              红色党建思政实践平台
            </p>
            <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight font-display title-balance md:text-5xl" style={{ color: '#1A1A1A' }}>
              {introTitle}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 md:text-base" style={{ color: '#5C5C5C' }}>
              聚焦苏区镇革命旧址、政权机关与群众文化阵地，呈现经后台审核发布的红色档案。
            </p>
            <div className="mx-auto mt-9 flex max-w-xl items-center justify-center gap-3 text-xs font-semibold" style={{ color: '#8B6914' }}>
              <span>档案审核</span>
              <span className="h-px w-10 bg-party-gold-line" />
              <span>地图定位</span>
              <span className="h-px w-10 bg-party-gold-line" />
              <span>阵地导览</span>
            </div>
            <div className="mx-auto mt-10 h-1.5 w-56 overflow-hidden rounded-full bg-museum-border">
              <div className="h-full w-2/3 rounded-full bg-party-red animate-pulse" />
            </div>
            <p className="mt-5 text-xs font-medium" style={{ color: '#5C5C5C' }}>
              正在准备苏区镇红色阵地导览
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
