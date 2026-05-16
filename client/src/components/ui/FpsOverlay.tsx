import React from 'react'
import { useAppStore } from '@/store'
import { X, Target, Navigation } from 'lucide-react'

export const FpsOverlay: React.FC = () => {
  const { isFpsMode, setFpsMode } = useAppStore()

  if (!isFpsMode) return null

  return (
    <div className="fixed inset-0 z-[45] pointer-events-none animate-in fade-in duration-1000">
      
      {/* 屏幕准星 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50 flex items-center justify-center">
        <Target size={32} className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" strokeWidth={1} />
      </div>

      {/* 屏幕边缘暗角 (模拟头盔或镜头感) */}
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />

      {/* 顶部提示条 */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 glass-panel px-6 py-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-white/80 font-mono text-sm tracking-widest">
          红色革命遗址 第一人称街景漫游
        </span>
      </div>

      {/* 右侧控制说明 */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 glass-panel p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-2 text-white/50 mb-4 border-b border-white/10 pb-2">
          <Navigation size={16} />
          <span className="font-bold text-xs uppercase tracking-widest">Controls</span>
        </div>
        
        <div className="space-y-4 font-mono text-sm text-white/70">
          <div className="flex items-center justify-between gap-8">
            <span>平移镜头</span>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 rounded bg-white/10 border border-white/20">W</kbd>
              <kbd className="px-2 py-1 rounded bg-white/10 border border-white/20">A</kbd>
              <kbd className="px-2 py-1 rounded bg-white/10 border border-white/20">S</kbd>
              <kbd className="px-2 py-1 rounded bg-white/10 border border-white/20">D</kbd>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-8">
            <span>旋转视角</span>
            <span className="text-xs">鼠标右键拖拽</span>
          </div>

          <div className="flex items-center justify-between gap-8">
            <span>调整高度</span>
            <span className="text-xs">鼠标滚轮</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 text-xs text-blue-300/80 leading-relaxed">
          <p>您已降落至苏区镇地表。</p>
          <p className="mt-1">仰望四周，红色的光柱即为革命先烈战斗过的坐标。</p>
        </div>
      </div>

      {/* 退出按钮 */}
      <button 
        onClick={() => setFpsMode(false)}
        className="absolute top-8 right-8 p-4 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 transition-all backdrop-blur-md pointer-events-auto"
        title="返回上帝视角"
      >
        <X size={24} />
      </button>
    </div>
  )
}
