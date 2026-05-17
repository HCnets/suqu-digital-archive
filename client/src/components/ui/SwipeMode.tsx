import React, { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/store'
import { X, MoveHorizontal } from 'lucide-react'
import { GisMap } from '../map/GisMap'

export const SwipeMode: React.FC = () => {
  const { isSwipeMode, setSwipeMode, mainMapInstance } = useAppStore()
  const [dividerX, setDividerX] = useState(50)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const historicalMapInstance = useRef<any>(null)

  // 同步两个地图的相机
  useEffect(() => {
    if (!isSwipeMode || !mainMapInstance || !historicalMapInstance.current) return

    const mainMap = mainMapInstance
    const histMap = historicalMapInstance.current

    let isSyncingLeft = false
    let isSyncingRight = false

    const syncMaps = (source: any, target: any, flagSetter: (val: boolean) => void, flagGetter: () => boolean) => {
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
  }, [isSwipeMode, mainMapInstance])

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

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isSwipeMode])

  if (!isSwipeMode) return null

  return (
    <div className="fixed inset-0 z-50 bg-transparent pointer-events-none" ref={containerRef}>
      
      {/* 底部：右半部分，现代地图 (直接透传 mainMap) - 实际上我们只需要把整个 SwipeMode 背景变透明，让 App 的 mainMap 露出来即可！
          但是为了确保层级，我们在 SwipeMode 里直接挖个洞或者盖一层 */}
      
      {/* 
        优雅的实现：
        App.tsx 里的 mainMap 始终在底层。
        SwipeMode 里，我们只渲染一个覆盖全屏的 historicalMap，然后用 clip-path 裁剪它，让它只显示左半边。
        这样右半边自然就露出了底层的 mainMap！
      */}

      {/* 左半部分：1927年历史 */}
      <div 
        className="absolute inset-0 z-10 pointer-events-auto"
        style={{ clipPath: `polygon(0 0, ${dividerX}% 0, ${dividerX}% 100%, 0 100%)` }}
      >
        <GisMap 
          className="w-full h-full" 
          mapId="historical-map" 
          onMapLoad={(map) => historicalMapInstance.current = map}
        />
        
        {/* 复古/战争滤镜叠加层 (让整个历史地图变暗红) */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(45deg, rgba(0,0,0,0.3) 0%, rgba(139, 69, 19, 0.2) 100%)',
          mixBlendMode: 'multiply',
          filter: 'grayscale(60%) sepia(30%) contrast(1.2) saturate(0.3) brightness(0.9)'
        }} />

        {/* 历史标识牌 */}
        <div className="absolute top-8 left-8 museum-card p-4 rounded-2xl pointer-events-none">
          <div className="text-[#C41E3A] font-mono text-xs uppercase tracking-[0.2em]">
            民国 16年 · 1927
          </div>
          <h2 className="text-2xl font-black text-[#1A1A1A] mt-1 font-serif">
            苏维埃政权成立
          </h2>
        </div>
      </div>

      {/* 现代标识牌 (悬浮在右侧) */}
      <div className="absolute top-8 right-8 z-20 museum-card p-4 rounded-2xl pointer-events-none">
        <div className="text-[#8B6914] font-mono text-xs uppercase tracking-[0.2em]">
          公元 2026
        </div>
        <h2 className="text-2xl font-black text-[#1A1A1A] mt-1 font-serif">
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
            onMouseDown={() => isDragging.current = true}
          >
            <MoveHorizontal size={20} className="text-[#C41E3A]" />
          </div>
          </div>
        </div>
      </div>

      {/* 退出按钮 */}
      <button 
        onClick={() => setSwipeMode(false)}
        className="absolute top-8 left-1/2 -translate-x-1/2 z-40 p-3 rounded-xl bg-white border border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:bg-[#FDE8EC] hover:border-[#C41E3A]/30 transition-all pointer-events-auto shadow-sm"
      >
        <X size={20} />
      </button>
    </div>
  )
}
