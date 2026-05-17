import React, { useRef } from 'react'
import { useAppStore } from '@/store'
import { MapPin, Calendar, Image as ImageIcon, X, Volume2, Square, Layers, Box } from 'lucide-react'
import { Flower2 } from 'lucide-react'

export const ArchiveDetailModal: React.FC = () => {
  const { selectedPoiId, getArchiveData, isDetailModalOpen, setDetailModalOpen, setIndoorMode, setRelicMode, setSelectedPoiId } = useAppStore()
  const [isPlaying, setIsPlaying] = React.useState(false)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  
  if (!isDetailModalOpen || !selectedPoiId) return null
  
  const archive = getArchiveData(selectedPoiId)
  if (!archive) return null

  const handleClose = () => {
    setDetailModalOpen(false)
    setSelectedPoiId(null)
  }

  const handleToggleAudio = () => {
    if (isPlaying) {
      window.speechSynthesis?.cancel()
      setIsPlaying(false)
      return
    }
    const msg = new SpeechSynthesisUtterance()
    msg.text = `${archive.title}。${archive.year}年。${archive.description}`
    msg.lang = 'zh-CN'
    msg.rate = 0.85
    msg.pitch = 1.0
    msg.onend = () => setIsPlaying(false)
    window.speechSynthesis?.speak(msg)
    setIsPlaying(true)
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[80] flex items-center justify-center p-6" onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>
      
      <div className="relative w-full max-w-5xl h-full max-h-[85vh] bg-white border border-[#E8DFD5] rounded-3xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E8DFD5] bg-[#FEFAF6] relative overflow-hidden">
          {isPlaying && (
            <div className="absolute inset-0 z-0 opacity-15 pointer-events-none flex items-center justify-center gap-2">
              {[...Array(16)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1.5 bg-[#C41E3A] rounded-full" 
                  style={{ 
                    height: `${Math.random() * 40 + 15}%`,
                    animation: `pulse ${Math.random() * 0.4 + 0.3}s ease-in-out infinite alternate`
                  }}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 relative z-10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              archive.type === 'revolution' ? 'bg-[#FDE8EC] text-[#C41E3A]' :
              archive.type === 'government' ? 'bg-[#FEFAF6] text-[#5C5C5C]' : 
              'bg-[#FFF8E1] text-[#8B6914]'
            }`}>
              <MapPin size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-wide font-serif">{archive.title}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-[#5C5C5C] font-medium">
                <span className="flex items-center gap-1"><Calendar size={14} className="text-[#C41E3A]" /> {archive.year}年</span>
                <span className="flex items-center gap-1 font-mono bg-[#FEFAF6] px-2 py-0.5 rounded border border-[#E8DFD5] text-[#5C5C5C]">
                  {archive.longitude.toFixed(4)}, {archive.latitude.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={handleToggleAudio}
              className={`flex items-center gap-2 px-4 min-h-[44px] rounded-lg transition-all duration-200 border ${
                isPlaying 
                  ? 'bg-[#FDE8EC] border-[#C41E3A]/40 text-[#C41E3A]' 
                  : 'bg-white border-[#E8DFD5] text-[#5C5C5C] hover:bg-[#FEFAF6]'
              }`}
              aria-label={isPlaying ? '停止讲解' : '语音讲解'}
            >
              {isPlaying ? <Square size={16} className="fill-current" /> : <Volume2 size={16} />}
              <span className="text-sm font-medium">{isPlaying ? '停止讲解' : '语音讲解'}</span>
            </button>
            
            <button 
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-[#E8DFD5] text-[#5C5C5C] hover:bg-[#FDE8EC] hover:text-[#C41E3A] hover:border-[#C41E3A]/30 transition-all duration-200"
              aria-label="关闭档案"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8 bg-white">
          
          {/* Left: Media */}
          <div className="w-full lg:w-3/5 flex flex-col gap-4">
            {archive.media && archive.media.length > 0 ? (
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-[#FEFAF6] border border-[#E8DFD5] relative group">
                <img 
                  src={archive.media[0].url} 
                  alt={archive.media[0].caption}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-white/90 to-transparent">
                  <p className="text-[#1A1A1A]/90 text-sm flex items-center gap-2 font-serif">
                    <ImageIcon size={14} className="text-[#C41E3A]" /> {archive.media[0].caption}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-video rounded-2xl bg-[#FEFAF6] border border-[#E8DFD5] flex items-center justify-center text-[#5C5C5C]/30 font-serif">
                暂无多媒体资料
              </div>
            )}
            
            {archive.media && archive.media.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {archive.media.map((m, idx) => (
                  <div key={idx} className="w-32 aspect-video rounded-xl overflow-hidden bg-[#FEFAF6] border border-[#E8DFD5] flex-shrink-0 cursor-pointer hover:border-[#C41E3A]/30 transition-all hover:shadow-sm duration-200">
                    <img src={m.url} alt={m.caption} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Archive Text */}
          <div className="w-full lg:w-2/5 flex flex-col">
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2 font-serif tracking-wider">
              <div className="w-1 h-4 bg-[#C41E3A] rounded-full" />
              档案详述
            </h3>
            <div className="max-w-none">
              <p className="text-[#5C5C5C] leading-loose text-base md:text-lg font-serif">
                {archive.description}
              </p>
              
              {archive.content && (
                <div className="mt-8 pt-6 border-t border-[#E8DFD5]">
                  <h4 className="text-[#C41E3A] font-bold mb-4 flex items-center gap-2 font-serif text-lg tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C41E3A]" />
                    深度历史文献档案
                  </h4>
                  <div className="text-[#5C5C5C] whitespace-pre-wrap leading-loose font-serif">
                    {archive.content}
                  </div>
                </div>
              )}
              
              <div className="mt-8 p-5 rounded-2xl bg-[#FFF8E1] border border-[#8B6914]/20 text-[#5C5C5C]/80 text-sm font-serif leading-relaxed">
                <strong className="text-[#8B6914]">档案局注记：</strong> 此文献经过数字化多维拓扑重建。基于目前系统客观条件限制，地图空间中显示的 3D 建筑为 GIS 地理空间引擎生成的【程序化高程占位基座】，用以标记遗址坐标与范围，并非历史建筑的 1:1 倾斜摄影或手工 3D 还原模型。真实历史风貌请以现场文物或档案局馆藏老照片为准。
              </div>
            </div>

            {/* Tags & Actions */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="px-4 py-1.5 rounded-full bg-[#FEFAF6] text-[#5C5C5C] text-sm border border-[#E8DFD5] font-medium">
                数字档案坐标
              </span>
              
              {archive.type === 'government' && (
                <button 
                  onClick={() => {
                    setDetailModalOpen(false)
                    setIndoorMode(true)
                  }}
                  className="flex items-center gap-2 px-4 min-h-[44px] rounded-lg bg-white border border-[#E8DFD5] hover:bg-[#FEFAF6] hover:border-[#8B6914]/30 text-[#8B6914] transition-all ml-auto"
                >
                  <Layers size={16} />
                  进入室内 BIM 下钻模式
                </button>
              )}

              {archive.type === 'revolution' && archive.id !== 'suqu-monument' && (
                <button 
                  onClick={() => {
                    setDetailModalOpen(false)
                    setRelicMode(true)
                  }}
                  className="flex items-center gap-2 px-4 min-h-[44px] rounded-lg bg-white border border-[#E8DFD5] hover:bg-[#FEFAF6] hover:border-[#8B6914]/30 text-[#8B6914] transition-all ml-auto"
                >
                  <Box size={16} />
                  文物全息展台
                </button>
              )}

              {archive.id === 'suqu-monument' && (
                <button 
                  className="flex items-center gap-2 px-5 min-h-[44px] rounded-lg party-btn-primary ml-auto"
                  onClick={() => alert('敬献花篮成功')}
                  aria-label="敬献花篮"
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
