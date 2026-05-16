import React, { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store'
import { X, MoveHorizontal } from 'lucide-react'

export const SwipeMode: React.FC = () => {
  const { isSwipeMode, setSwipeMode } = useAppStore()
  const [dividerX, setDividerX] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100))
    setDividerX(percentage)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100))
    setDividerX(percentage)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('mousemove', handleMouseMove as any)
    }
    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove as any)
    }
  }, [isDragging])

  if (!isSwipeMode) return null

  return (
    <div className="fixed inset-0 z-[70] bg-black pointer-events-auto animate-in fade-in duration-500">
      <div 
        ref={containerRef}
        className="absolute inset-0 overflow-hidden cursor-ew-resize"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
      >
        {/* 右半部分：2026年现代 (默认) */}
        <div className="absolute inset-0">
          <iframe 
            src="http://localhost:5174/" 
            className="w-full h-full border-0"
            title="2026-Modern"
          />
          <div className="absolute top-8 right-8 glass-panel p-4 rounded-2xl border border-white/10 bg-blue-900/50 backdrop-blur-xl">
            <div className="text-blue-200 font-mono text-xs uppercase tracking-[0.2em]">
              公元 2026
            </div>
            <h2 className="text-2xl font-black text-white mt-1">
              新时代数字苏区
            </h2>
          </div>
        </div>

        {/* 左半部分：1927年历史 (带战争滤镜) */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${dividerX}%` }}
        >
          <div className="w-full h-full relative">
            <iframe 
              src="http://localhost:5174/" 
              className="w-full h-full border-0"
              title="1927-Historical"
            />
            {/* 复古/战争滤镜叠加层 */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'linear-gradient(45deg, rgba(0,0,0,0.3) 0%, rgba(139, 69, 19, 0.2) 100%)',
              mixBlendMode: 'multiply',
              filter: 'grayscale(60%) sepia(30%) contrast(1.2) saturate(0.3) brightness(0.9)'
            }} />
            <div className="absolute top-8 left-8 glass-panel p-4 rounded-2xl border border-white/10 bg-red-900/50 backdrop-blur-xl">
              <div className="text-red-200 font-mono text-xs uppercase tracking-[0.2em]">
                民国 16年
              </div>
              <h2 className="text-2xl font-black text-white mt-1">
                苏维埃政权成立
              </h2>
            </div>
          </div>
        </div>

        {/* 时空光轴分割线 */}
        <div 
          className="absolute top-0 bottom-0 z-10 flex items-center justify-center pointer-events-none"
          style={{ left: `${dividerX}%`, transform: 'translateX(-50%)' }}
        >
          {/* 发光光柱 */}
          <div className="absolute inset-y-0 w-1 bg-gradient-to-b from-transparent via-white to-transparent shadow-[0_0_30px_rgba(255,255,255,0.8)]" />
          
          {/* 拖拽手柄 */}
          <div 
            className="relative z-20 pointer-events-auto cursor-ew-resize"
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
          >
            <div className="w-12 h-12 rounded-full bg-white/90 border-4 border-white shadow-[0_0_30px_rgba(255,255,255,0.6)] flex items-center justify-center text-slate-800">
              <MoveHorizontal size={24} className="fill-current" />
            </div>
          </div>
        </div>
      </div>

      {/* 退出按钮 */}
      <button 
        onClick={() => setSwipeMode(false)}
        className="absolute top-8 left-1/2 -translate-x-1/2 z-20 p-4 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md"
      >
        <X size={28} />
      </button>

      {/* 底部说明 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-center">
        <p className="text-white/60 text-sm font-mono tracking-widest">
          拖动中间光轴，穿梭于时空之间
        </p>
      </div>
    </div>
  )
}
