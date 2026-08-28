import React, { useState, useEffect, useRef } from 'react'
import type maplibregl from 'maplibre-gl'
import { useAppStore } from '@/store'
import { X, MoveHorizontal } from 'lucide-react'
import { GisMap } from '../map/GisMap'

export const SwipeMode: React.FC = () => {
  const { isSwipeMode, setSwipeMode, mainMapInstance } = useAppStore()
  const [dividerX, setDividerX] = useState(50)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [historicalMapInstance, setHistoricalMapInstance] = useState<maplibregl.Map | null>(null)

  // 同步两个地图的相机（historicalMapInstance 用 state，第二张图异步就绪后 effect 会重跑，避免竞态）
  useEffect(() => {
    if (!isSwipeMode || !mainMapInstance || !historicalMapInstance) return

    const mainMap = mainMapInstance
    const histMap = historicalMapInstance

    let isSyncingLeft = false
    let isSyncingRight = false

    const syncMaps = (source: maplibregl.Map, target: maplibregl.Map, flagSetter: (val: boolean) => void, flagGetter: () => boolean) => {
      if (flagGetter()) return
      flagSetter(true)
      target.jumpTo({
        center: source.getCenter(),
        zoom: source.getZoom(),
        bearing: source.getBearing(),
        pitch: source.getPitch()
      })
      flagSetter(false)
    }

    const onMainMove = () => syncMaps(mainMap, histMap, (val) => isSyncingRight = val, () => isSyncingLeft)
    const onHistMove = () => syncMaps(histMap, mainMap, (val) => isSyncingLeft = val, () => isSyncingRight)

    mainMap.on('move', onMainMove)
    histMap.on('move', onHistMove)

    return () => {
      mainMap.off('move', onMainMove)
      histMap.off('move', onHistMove)
    }
  }, [isSwipeMode, mainMapInstance, historicalMapInstance])

  useEffect(() => {
    if (!isSwipeMode) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      setDividerX((x / rect.width) * 100)
    }

    const handleMouseUp = () => {
      isDragging.current = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width))
      setDividerX((x / rect.width) * 100)
    }

    const handleTouchEnd = () => {
      isDragging.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      if (historicalMapInstance) {
        historicalMapInstance.remove()
        setHistoricalMapInstance(null)
      }
    }
  }, [isSwipeMode, historicalMapInstance])

  if (!isSwipeMode) return null

  return (
    <div className="fixed inset-0 z-50 bg-transparent pointer-events-none" ref={containerRef}>

      {/* 左半部分：1927年历史 */}
      <div 
        className="absolute inset-y-0 left-0 z-10 overflow-hidden"
        style={{ width: `${dividerX}%` }}
      >
        <div className="absolute inset-y-0 left-0 pointer-events-auto" style={{ width: '100vw' }}>
          <GisMap 
            className="w-full h-full" 
            mapId="historical-map" 
            onMapLoad={(map) => setHistoricalMapInstance(map)}
            timeLockYear={1930}
          />
          
          {/* 复古/战争滤镜叠加层（仅作老照片质感，点位由 timeLockYear 真实过滤） */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(45deg, rgba(0,0,0,0.3) 0%, rgba(139, 69, 19, 0.2) 100%)',
            mixBlendMode: 'multiply',
            filter: 'grayscale(60%) sepia(30%) contrast(1.2) saturate(0.3) brightness(0.9)'
          }} />

          {/* 历史标识牌 */}
          <div className="absolute top-8 left-8 museum-card p-4 rounded-2xl pointer-events-none">
            <div className="text-party-red font-mono text-xs uppercase tracking-[0.2em]">
              历史视角 · 1930 年前建立
            </div>
            <h2 className="text-2xl font-black text-party-ink mt-1 font-serif">
              苏维埃政权初创
            </h2>
            <p className="text-xs text-party-ink-light mt-1 max-w-[220px] leading-relaxed">
              本侧仅显示 1930 年及以前建立的革命旧址（按档案年代真实过滤）。
            </p>
          </div>
        </div>
      </div>

      {/* 现代标识牌 (悬浮在右侧) */}
      <div className="absolute top-8 right-8 z-20 museum-card p-4 rounded-2xl pointer-events-none">
        <div className="text-party-gold font-mono text-xs uppercase tracking-[0.2em]">
          公元 2026
        </div>
        <h2 className="text-2xl font-black text-party-ink mt-1 font-serif">
          新时代数字苏区
        </h2>
      </div>

      {/* 分割线与拖拽手柄 */}
      <div 
        className="absolute top-0 bottom-0 z-30 flex items-center justify-center -ml-[1px]"
        style={{ left: `${dividerX}%` }}
      >
        <div className="w-[2px] h-full bg-[#C41E3A] shadow-[0_0_12px_rgba(196,30,58,0.6)] relative">
          <div 
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white border-2 border-[#C41E3A] shadow-xl flex items-center justify-center cursor-ew-resize hover:scale-110 transition-transform pointer-events-auto"
            onPointerDown={() => isDragging.current = true}
          >
            <MoveHorizontal size={20} className="text-[#C41E3A]" />
          </div>
        </div>
      </div>

      {/* 退出按钮 */}
      <button 
        onClick={() => setSwipeMode(false)}
        className="absolute top-8 right-4 z-40 md:left-1/2 md:-translate-x-1/2 md:right-auto p-3 rounded-xl bg-white border border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:bg-[#FDE8EC] hover:border-[#C41E3A]/30 transition-all pointer-events-auto shadow-sm"
      >
        <X size={20} />
      </button>
    </div>
  )
}
