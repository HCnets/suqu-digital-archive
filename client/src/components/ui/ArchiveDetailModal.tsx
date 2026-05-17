import React, { useEffect } from 'react'
import { useAppStore } from '@/store'
import { X, Calendar, MapPin, Image as ImageIcon, Layers, Volume2, Square, Box, Flower2 } from 'lucide-react'
import { useTTS } from '@/hooks/useTTS'

export const ArchiveDetailModal: React.FC = () => {
  const { selectedPoiId, getArchiveData, isDetailModalOpen, setDetailModalOpen, setIndoorMode, isIndoorMode, setRelicMode } = useAppStore()
  const { speak, stop, isPlaying } = useTTS()
  
  // 当模态框关闭时停止语音
  useEffect(() => {
    if (!isDetailModalOpen) {
      stop()
    }
  }, [isDetailModalOpen, stop])

  if (!isDetailModalOpen || !selectedPoiId) return null
  
  const archive = getArchiveData(selectedPoiId)
  if (!archive) return null

  const handleToggleAudio = () => {
    if (isPlaying) {
      stop()
    } else {
      speak(`现在为您播报档案：${archive.title}。${archive.content || archive.description}`)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 pointer-events-auto animate-in fade-in duration-300">
      {/* 动态毛玻璃遮罩 */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={() => setDetailModalOpen(false)}
      />
      
      {/* 模态框主体 */}
      <div className="relative w-full max-w-5xl h-full max-h-[85vh] bg-zinc-950/90 backdrop-blur-2xl border border-rose-900/30 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        
        {/* 模态框头部 */}
        <div className="flex items-center justify-between p-6 border-b border-rose-900/30 bg-black/20 relative overflow-hidden">
          {/* Audio Waveform Effect (Only visible when playing) */}
          {isPlaying && (
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center gap-2">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-2 bg-rose-500 rounded-full animate-pulse" 
                  style={{ 
                    height: `${Math.random() * 60 + 20}%`,
                    animationDuration: `${Math.random() * 0.5 + 0.3}s` 
                  }}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 relative z-10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              archive.type === 'revolution' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
              archive.type === 'government' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              <MapPin size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-rose-50 tracking-wide font-serif">{archive.title}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-rose-200/60 font-medium">
                <span className="flex items-center gap-1"><Calendar size={14} /> {archive.year}年</span>
                <span className="flex items-center gap-1 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">
                  {archive.longitude.toFixed(4)}, {archive.latitude.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <button
              onClick={handleToggleAudio}
              className={`flex items-center gap-2 px-5 min-h-[44px] rounded-full transition-all duration-300 border ${
                isPlaying 
                  ? 'bg-rose-600/20 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(225,29,72,0.3)]' 
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:-translate-y-0.5'
              }`}
            >
              {isPlaying ? <Square size={16} className="fill-current" /> : <Volume2 size={16} />}
              <span className="text-sm font-medium">{isPlaying ? '停止讲解' : '语音讲解'}</span>
            </button>
            
            <button 
              onClick={() => setDetailModalOpen(false)}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/50 hover:bg-rose-600/20 hover:text-rose-200 hover:border-rose-500/30 transition-all duration-300"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 模态框内容区 */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8">
          
          {/* 左侧：多媒体展示 */}
          <div className="w-full lg:w-3/5 flex flex-col gap-4">
            {archive.media && archive.media.length > 0 ? (
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black/50 border border-rose-900/30 relative group">
                <img 
                  src={archive.media[0].url} 
                  alt={archive.media[0].caption}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-zinc-950 to-transparent">
                  <p className="text-white/90 text-sm flex items-center gap-2 font-serif">
                    <ImageIcon size={16} /> {archive.media[0].caption}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-video rounded-2xl bg-white/5 border border-rose-900/30 flex items-center justify-center text-white/30 font-serif">
                暂无多媒体资料
              </div>
            )}
            
            {/* 缩略图列表 (如果有多个) */}
            {archive.media && archive.media.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {archive.media.map((m, idx) => (
                  <div key={idx} className="w-32 aspect-video rounded-xl overflow-hidden bg-white/10 flex-shrink-0 cursor-pointer hover:ring-2 ring-rose-500/50 transition-all hover:-translate-y-1 duration-300">
                    <img src={m.url} alt={m.caption} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右侧：深度档案文本 */}
          <div className="w-full lg:w-2/5 flex flex-col">
            <h3 className="text-lg font-semibold text-amber-400/90 mb-4 flex items-center gap-2 font-serif tracking-wider">
              <div className="w-1 h-4 bg-amber-500 rounded-full" />
              档案详述
            </h3>
              <div className="prose prose-invert prose-red max-w-none">
                <p className="text-rose-100/90 leading-loose text-base md:text-lg font-serif">
                  {archive.description}
                </p>
                
                {archive.content && (
                  <div className="mt-8 pt-6 border-t border-rose-900/40">
                    <h4 className="text-amber-400 font-bold mb-4 flex items-center gap-2 font-serif text-lg tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      深度历史文献档案
                    </h4>
                    <div className="text-rose-50/80 whitespace-pre-wrap leading-loose font-serif">
                      {archive.content}
                    </div>
                  </div>
                )}
                
                <div className="mt-8 p-5 rounded-2xl bg-rose-950/30 border border-rose-900/50 text-rose-200/70 text-sm font-serif leading-relaxed">
                  <strong className="text-rose-200">档案局注记：</strong> 此文献经过数字化多维拓扑重建。基于目前系统客观条件限制，地图空间中显示的 3D 建筑为 GIS 地理空间引擎生成的【程序化高程占位基座】，用以标记遗址坐标与范围，并非历史建筑的 1:1 倾斜摄影或手工 3D 还原模型。真实历史风貌请以现场文物或档案局馆藏老照片为准。
                </div>
              </div>

            {/* Tags & Actions */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
                <span className="px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-300 text-sm border border-blue-500/20 font-medium">
                  数字沙盘点位
                </span>
                
                {/* Indoor BIM Action */}
                {archive.type === 'government' && (
                  <button 
                    onClick={() => {
                      setDetailModalOpen(false)
                      setIndoorMode(true)
                    }}
                    className="flex items-center gap-2 px-5 min-h-[44px] rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all ml-auto hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
                  >
                    <Layers size={16} />
                    进入室内 BIM 下钻模式
                  </button>
                )}

                {/* Relic Showcase Action */}
                {archive.type === 'revolution' && archive.id !== 'suqu-monument' && (
                  <button 
                    onClick={() => {
                      setDetailModalOpen(false)
                      setRelicMode(true)
                    }}
                    className="flex items-center gap-2 px-5 min-h-[44px] rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all ml-auto hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(245,158,11,0.2)]"
                  >
                    <Box size={16} />
                    文物全息展台
                  </button>
                )}

                {/* Monument Special Action */}
                {archive.id === 'suqu-monument' && (
                  <button 
                    className="flex items-center gap-2 px-6 min-h-[44px] rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-[0_4px_20px_rgba(225,29,72,0.4)] ml-auto hover:-translate-y-0.5"
                    onClick={() => alert('敬献花篮成功，重温入党誓词：我志愿加入中国共产党...')}
                    aria-label="敬献花篮并重温誓词"
                  >
                    <Flower2 size={18} />
                    敬献花篮 · 重温誓词
                  </button>
                )}
              </div>
          </div>
        </div>
      </div>
    </div>
  )
}
