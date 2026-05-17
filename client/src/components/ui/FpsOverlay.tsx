import React from 'react'
import { useAppStore } from '@/store'
import { X, Target, Navigation } from 'lucide-react'

export const FpsOverlay: React.FC = () => {
  const { isFpsMode, setFpsMode } = useAppStore()

  if (!isFpsMode) return null

  return (
    <div className="fixed inset-0 z-[45] pointer-events-none animate-in fade-in duration-1000">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 flex items-center justify-center">
        <Target size={32} className="text-[#C41E3A]" strokeWidth={1.5} />
      </div>

      <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.3)]" />

      <div className="absolute top-8 left-1/2 -translate-x-1/2 museum-card px-6 py-2 rounded-full flex items-center gap-3 pointer-events-auto">
        <div className="w-2 h-2 rounded-full bg-[#C41E3A] animate-pulse" />
        <span className="text-[#1A1A1A] font-serif text-sm tracking-wider">
          重走红军路 · 第一人称街景漫游
        </span>
      </div>

      <div className="absolute right-8 top-1/2 -translate-y-1/2 museum-card p-5 rounded-2xl pointer-events-auto">
        <div className="flex items-center gap-2 text-[#1A1A1A] mb-3 border-b border-[#E8DFD5] pb-2">
          <Navigation size={16} className="text-[#C41E3A]" />
          <span className="font-bold text-xs tracking-wider font-serif">操作说明</span>
        </div>
        
        <div className="space-y-3 text-sm text-[#5C5C5C]">
          <div className="flex items-center justify-between gap-8">
            <span>平移镜头</span>
            <div className="flex gap-1">
              <kbd className="px-2 py-0.5 rounded bg-[#FEFAF6] border border-[#E8DFD5] text-[#1A1A1A] font-mono text-xs">W</kbd>
              <kbd className="px-2 py-0.5 rounded bg-[#FEFAF6] border border-[#E8DFD5] text-[#1A1A1A] font-mono text-xs">A</kbd>
              <kbd className="px-2 py-0.5 rounded bg-[#FEFAF6] border border-[#E8DFD5] text-[#1A1A1A] font-mono text-xs">S</kbd>
              <kbd className="px-2 py-0.5 rounded bg-[#FEFAF6] border border-[#E8DFD5] text-[#1A1A1A] font-mono text-xs">D</kbd>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-8">
            <span>旋转视角</span>
            <span className="text-xs">鼠标拖拽</span>
          </div>

          <div className="flex items-center justify-between gap-8">
            <span>调整高度</span>
            <span className="text-xs">鼠标滚轮</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#E8DFD5] text-xs text-[#5C5C5C] leading-relaxed font-serif">
          <p>您已降落至苏区镇地表。</p>
          <p className="mt-1">四周的红色光柱即为革命先烈战斗过的坐标。</p>
        </div>
      </div>

      <button 
        onClick={() => setFpsMode(false)}
        className="absolute top-8 right-8 p-3 rounded-xl bg-white border border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:bg-[#FDE8EC] hover:border-[#C41E3A]/30 transition-all pointer-events-auto"
        title="返回展厅总览"
        aria-label="退出第一人称漫游"
      >
        <X size={22} />
      </button>
    </div>
  )
}
