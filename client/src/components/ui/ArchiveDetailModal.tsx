import React, { useEffect } from 'react'
import { useAppStore } from '@/store'
import { X, Calendar, MapPin, Image as ImageIcon, Play, ExternalLink, Layers, Volume2, Square, Box } from 'lucide-react'
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
      <div className="relative w-full max-w-5xl h-full max-h-[85vh] bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        
        {/* 模态框头部 */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/20 relative overflow-hidden">
          {/* Audio Waveform Effect (Only visible when playing) */}
          {isPlaying && (
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center gap-2">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-2 bg-blue-400 rounded-full animate-pulse" 
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
          
          <div className="flex items-center gap-4 relative z-10">
            <button
              onClick={handleToggleAudio}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 border ${
                isPlaying 
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {isPlaying ? <Square size={16} className="fill-current" /> : <Volume2 size={16} />}
              <span className="text-sm font-medium">{isPlaying ? '停止解说' : 'AI 智能解说'}</span>
            </button>
            
            <button 
              onClick={() => setDetailModalOpen(false)}
              className="p-3 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
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

              {/* Tags & Actions */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm border border-blue-500/30">
                  数字沙盘点位
                </span>
                
                {/* Indoor BIM Action */}
                {archive.type === 'government' && (
                  <button 
                    onClick={() => {
                      setDetailModalOpen(false)
                      setIndoorMode(true)
                    }}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 transition-colors ml-auto animate-pulse"
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
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 transition-colors ml-auto animate-pulse"
                  >
                    <Box size={16} />
                    文物全息展台
                  </button>
                )}

                {/* Monument Special Action */}
                {archive.id === 'suqu-monument' && (
                  <button 
                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-red-600/80 hover:bg-red-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] ml-auto"
                    onClick={() => alert('敬献花篮成功，重温入党誓词：我志愿加入中国共产党...')}
                  >
                    <span className="text-xl">🌺</span>
                    敬献花篮 · 重温誓词
                  </button>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}