import React from 'react'
import { useAppStore } from '@/store'
import { X, Calendar, MapPin, Image as ImageIcon } from 'lucide-react'

export const ArchiveDetailModal: React.FC = () => {
  const { selectedPoiId, getArchiveData, isDetailModalOpen, setDetailModalOpen } = useAppStore()
  
  if (!isDetailModalOpen || !selectedPoiId) return null
  
  const archive = getArchiveData(selectedPoiId)
  if (!archive) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 pointer-events-auto animate-in fade-in duration-300">
      {/* 动态毛玻璃遮罩 */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={() => setDetailModalOpen(false)}
      />
      
      {/* 模态框主体 */}
      <div className="relative w-full max-w-5xl h-full max-h-[85vh] bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        
        {/* 模态框头部 */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              archive.type === 'revolution' ? 'bg-red-500/20 text-red-400' :
              archive.type === 'government' ? 'bg-blue-500/20 text-blue-400' : 
              'bg-amber-500/20 text-amber-400'
            }`}>
              <MapPin size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wide">{archive.title}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                <span className="flex items-center gap-1"><Calendar size={14} /> {archive.year}年</span>
                <span className="flex items-center gap-1 font-mono bg-white/5 px-2 rounded">
                  {archive.longitude.toFixed(4)}, {archive.latitude.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setDetailModalOpen(false)}
            className="p-3 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 模态框内容区 */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8">
          
          {/* 左侧：多媒体展示 */}
          <div className="w-full lg:w-3/5 flex flex-col gap-4">
            {archive.media && archive.media.length > 0 ? (
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black/50 border border-white/5 relative group">
                <img 
                  src={archive.media[0].url} 
                  alt={archive.media[0].caption}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white/90 text-sm flex items-center gap-2">
                    <ImageIcon size={16} /> {archive.media[0].caption}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-video rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
                暂无多媒体资料
              </div>
            )}
            
            {/* 缩略图列表 (如果有多个) */}
            {archive.media && archive.media.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {archive.media.map((m, idx) => (
                  <div key={idx} className="w-32 aspect-video rounded-lg overflow-hidden bg-white/10 flex-shrink-0 cursor-pointer hover:ring-2 ring-white/50 transition-all">
                    <img src={m.url} alt={m.caption} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右侧：深度档案文本 */}
          <div className="w-full lg:w-2/5 flex flex-col">
            <h3 className="text-lg font-semibold text-white/80 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded-full" />
              档案详述
            </h3>
            <div className="prose prose-invert prose-slate max-w-none">
              <p className="text-slate-300 leading-loose text-base md:text-lg">
                {archive.content || archive.description}
              </p>
              
              <div className="mt-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm">
                <strong>数字化注记：</strong> 该档案条目基于 MapLibre 空间坐标引擎与 Liquid Glass 界面协议构建，支持在 3D 地形下自动锚定与动态展示。
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}