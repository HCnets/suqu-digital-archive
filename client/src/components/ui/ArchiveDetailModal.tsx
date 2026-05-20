import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { MapPin, Calendar, Image as ImageIcon, X, Volume2, Square, Layers, Box, Flower2, BookOpen } from 'lucide-react'
import { TributeCeremony } from '@/components/ui/TributeCeremony'

const MuseumPlaceholder: React.FC<{ archive: any }> = ({ archive }) => {
  const bgColor = archive.type === 'revolution' ? '#FDE8EC' : archive.type === 'government' ? '#F5F0EB' : '#FFF8E1'
  const accentColor = archive.type === 'revolution' ? '#C41E3A' : archive.type === 'government' ? '#5C5C5C' : '#8B6914'
  const label = archive.type === 'revolution' ? '红色革命遗址' : archive.type === 'government' ? '党政服务点位' : '群众文化阵地'
  
  // 根据档案 ID 生成建筑风格 CSS 插画
  const isRedHouse = archive.id === 'suqu-red-house'
  const isMonument = archive.id === 'suqu-monument' || archive.id === 'blood-field'
  const isPavilion = archive.id === 'red-army-pavilion'
  const isAcademy = archive.id === 'scholar-culture-hall' || archive.id === 'suqu-red-academy'
  const isArsenal = archive.id === 'soviet-arsenal'
  const isHospital = archive.id === 'red-army-hospital'
  const isTransport = archive.id === 'suqu-red-transport-station'
  const isHall = archive.id === 'suqu-mass-line-hall' || archive.id === 'suqu-education-base'
  const isSquare = archive.id === 'suqu-party-square'
  const isTownHall = archive.id === 'suqu-town-hall'
  const isDefense = archive.id === 'paozi-village-defense'
  const isFarmers = archive.id === 'zijin-farmers-association'
  const isCommittee = archive.id === 'zijin-party-committee' || archive.id === 'dongjiang-committee'

  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden border border-[#E8DFD5] relative flex items-center justify-center group" style={{ background: `linear-gradient(135deg, ${bgColor} 20%, #FEFAF6 60%, ${bgColor}30 100%)` }}>
      {/* 装饰边框 */}
      <div className="absolute inset-3 rounded-xl border border-dashed opacity-20" style={{ borderColor: accentColor }} />
      
      {/* 建筑 SVG 插画 */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet">
        {/* 天空渐变背景 */}
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={bgColor} stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#FEFAF6" stopOpacity="0.9"/>
          </linearGradient>
          <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.05"/>
          </linearGradient>
        </defs>
        <rect width="800" height="450" fill="url(#skyGrad)"/>
        
        {/* 远山 */}
        <path d="M0 350 Q100 280 200 350 Q300 300 400 360 Q500 290 600 350 Q700 310 800 350 L800 450 L0 450Z" fill="#E8DFD5" opacity="0.5"/>
        
        {/* ===== 红屋/祠堂 ===== */}
        {isRedHouse && <>
          <rect x="250" y="160" width="300" height="200" fill={accentColor} opacity="0.12" rx="2"/>
          <rect x="250" y="160" width="300" height="200" fill="none" stroke={accentColor} strokeWidth="1.5" rx="2"/>
          <path d="M220 160 L400 80 L580 160" fill="url(#roofGrad)" stroke={accentColor} strokeWidth="1.5"/>
          <rect x="350" y="240" width="60" height="120" fill={accentColor} opacity="0.15" stroke={accentColor} strokeWidth="1"/>
          <rect x="270" y="260" width="50" height="60" fill={accentColor} opacity="0.08" stroke={accentColor} strokeWidth="0.5"/>
          <rect x="470" y="260" width="50" height="60" fill={accentColor} opacity="0.08" stroke={accentColor} strokeWidth="0.5"/>
          <circle cx="280" cy="310" r="3" fill={accentColor} opacity="0.3"/>
          <circle cx="480" cy="310" r="3" fill={accentColor} opacity="0.3"/>
        </>}

        {/* ===== 纪念碑 ===== */}
        {isMonument && <>
          <rect x="340" y="100" width="80" height="250" fill={accentColor} opacity="0.15" stroke={accentColor} strokeWidth="1.5"/>
          <rect x="360" y="80" width="40" height="30" fill={accentColor} opacity="0.2" stroke={accentColor} strokeWidth="1"/>
          <rect x="300" y="340" width="160" height="20" fill={accentColor} opacity="0.1" stroke={accentColor} strokeWidth="0.8"/>
          <rect x="280" y="355" width="200" height="15" fill={accentColor} opacity="0.08" stroke={accentColor} strokeWidth="0.5"/>
          <line x1="380" y1="120" x2="380" y2="330" stroke={accentColor} strokeWidth="0.5" opacity="0.3"/>
        </>}

        {/* ===== 亭子 ===== */}
        {isPavilion && <>
          <rect x="310" y="280" width="140" height="8" fill={accentColor} opacity="0.15"/>
          <rect x="320" y="180" width="8" height="105" fill={accentColor} opacity="0.2"/>
          <rect x="432" y="180" width="8" height="105" fill={accentColor} opacity="0.2"/>
          <path d="M280 185 L380 100 L480 185" fill="url(#roofGrad)" stroke={accentColor} strokeWidth="1.5"/>
          <path d="M280 185 Q380 210 480 185" fill="none" stroke={accentColor} strokeWidth="1" opacity="0.4"/>
          <rect x="370" y="290" width="20" height="15" fill={accentColor} opacity="0.1"/>
          <circle cx="380" cy="300" r="8" fill={accentColor} opacity="0.08" stroke={accentColor} strokeWidth="0.5"/>
        </>}

        {/* ===== 书院 ===== */}
        {isAcademy && <>
          <rect x="220" y="200" width="360" height="160" fill={accentColor} opacity="0.1" stroke={accentColor} strokeWidth="1.2" rx="2"/>
          <rect x="220" y="200" width="360" height="25" fill={accentColor} opacity="0.15"/>
          <rect x="260" y="250" width="55" height="90" fill={accentColor} opacity="0.08" stroke={accentColor} strokeWidth="0.6"/>
          <rect x="340" y="250" width="55" height="90" fill={accentColor} opacity="0.08" stroke={accentColor} strokeWidth="0.6"/>
          <rect x="420" y="250" width="55" height="90" fill={accentColor} opacity="0.08" stroke={accentColor} strokeWidth="0.6"/>
          <rect x="480" y="250" width="55" height="90" fill={accentColor} opacity="0.08" stroke={accentColor} strokeWidth="0.6"/>
        </>}

        {/* ===== 兵工厂 ===== */}
        {isArsenal && <>
          <rect x="280" y="220" width="200" height="140" fill={accentColor} opacity="0.1" stroke={accentColor} strokeWidth="1" rx="1"/>
          <path d="M260 225 L380 185 L500 225" fill="none" stroke={accentColor} strokeWidth="1.2" opacity="0.4"/>
          <rect x="310" y="260" width="40" height="60" fill={accentColor} opacity="0.12" stroke={accentColor} strokeWidth="0.5"/>
          <rect x="380" y="260" width="40" height="60" fill={accentColor} opacity="0.12" stroke={accentColor} strokeWidth="0.5"/>
          <circle cx="380" cy="210" r="15" fill="none" stroke={accentColor} strokeWidth="0.8" opacity="0.3"/>
        </>}

        {/* ===== 医院 ===== */}
        {isHospital && <>
          <rect x="240" y="200" width="320" height="160" fill={accentColor} opacity="0.08" stroke={accentColor} strokeWidth="1.2" rx="2"/>
          <rect x="240" y="200" width="320" height="20" fill={accentColor} opacity="0.12"/>
          <text x="400" y="214" textAnchor="middle" fill={accentColor} opacity="0.5" fontSize="11" fontFamily="serif">+</text>
          <rect x="270" y="250" width="50" height="70" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="0.5"/>
          <rect x="350" y="250" width="50" height="70" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="0.5"/>
          <rect x="430" y="250" width="50" height="70" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="0.5"/>
          <line x1="295" y1="280" x2="295" y2="300" stroke={accentColor} strokeWidth="1" opacity="0.2"/>
          <line x1="375" y1="280" x2="375" y2="300" stroke={accentColor} strokeWidth="1" opacity="0.2"/>
          <line x1="455" y1="280" x2="455" y2="300" stroke={accentColor} strokeWidth="1" opacity="0.2"/>
        </>}

        {/* ===== 交通站 ===== */}
        {isTransport && <>
          <rect x="290" y="230" width="180" height="130" fill={accentColor} opacity="0.1" stroke={accentColor} strokeWidth="1" rx="1"/>
          <path d="M290 230 L380 195 L470 230" fill="none" stroke={accentColor} strokeWidth="1" opacity="0.3"/>
          <rect x="320" y="270" width="35" height="60" fill={accentColor} opacity="0.08" stroke={accentColor} strokeWidth="0.5"/>
          <rect x="380" y="270" width="35" height="60" fill={accentColor} opacity="0.08" stroke={accentColor} strokeWidth="0.5"/>
          <circle cx="365" cy="310" r="10" fill="none" stroke={accentColor} strokeWidth="0.8" opacity="0.25" strokeDasharray="3 3"/>
        </>}

        {/* ===== 党建广场 ===== */}
        {isSquare && <>
          <rect x="200" y="280" width="400" height="100" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="0.8"/>
          <circle cx="400" cy="300" r="30" fill={accentColor} opacity="0.1" stroke={accentColor} strokeWidth="1"/>
          <line x1="400" y1="270" x2="400" y2="330" stroke={accentColor} strokeWidth="0.5" opacity="0.3"/>
          <line x1="370" y1="300" x2="430" y2="300" stroke={accentColor} strokeWidth="0.5" opacity="0.3"/>
          <rect x="220" y="230" width="15" height="55" fill={accentColor} opacity="0.15"/>
          <rect x="565" y="230" width="15" height="55" fill={accentColor} opacity="0.15"/>
          <path d="M227 230 L235 210 L243 230" fill={accentColor} opacity="0.2"/>
          <path d="M565 230 L573 210 L581 230" fill={accentColor} opacity="0.2"/>
        </>}

        {/* ===== 政府大楼 ===== */}
        {isTownHall && <>
          <rect x="230" y="170" width="340" height="200" fill={accentColor} opacity="0.08" stroke={accentColor} strokeWidth="1.2" rx="2"/>
          <rect x="230" y="170" width="340" height="30" fill={accentColor} opacity="0.12"/>
          <rect x="270" y="230" width="55" height="100" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="0.6"/>
          <rect x="345" y="230" width="70" height="50" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="0.6"/>
          <rect x="440" y="230" width="55" height="100" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="0.6"/>
          <rect x="345" y="310" width="70" height="30" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="0.6"/>
          <line x1="380" y1="200" x2="380" y2="230" stroke={accentColor} strokeWidth="0.5" opacity="0.3"/>
        </>}

        {/* ===== 阻击战遗址 ===== */}
        {isDefense && <>
          <path d="M100 360 Q200 280 300 350 Q400 260 500 340 Q600 290 700 350 L700 450 L100 450Z" fill="#FEFAF6" stroke={accentColor} strokeWidth="0.8" opacity="0.4"/>
          <path d="M100 360 Q200 320 300 360 Q400 310 500 350 Q600 320 700 360" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.2"/>
          <rect x="330" y="240" width="100" height="80" fill={accentColor} opacity="0.1" stroke={accentColor} strokeWidth="0.8" rx="1"/>
          <circle cx="380" cy="280" r="5" fill={accentColor} opacity="0.3"/>
          <line x1="380" y1="285" x2="380" y2="310" stroke={accentColor} strokeWidth="0.5" opacity="0.2"/>
        </>}

        {/* ===== 农会/县委/特委 ===== */}
        {(isFarmers || isCommittee) && <>
          <rect x="250" y="220" width="300" height="150" fill={accentColor} opacity="0.08" stroke={accentColor} strokeWidth="1" rx="1"/>
          <path d="M230 225 L400 170 L570 225" fill="url(#roofGrad)" stroke={accentColor} strokeWidth="1" opacity="0.5"/>
          <rect x="280" y="260" width="50" height="70" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="0.5"/>
          <rect x="360" y="260" width="50" height="70" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="0.5"/>
          <rect x="440" y="260" width="50" height="70" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="0.5"/>
        </>}

        {/* ===== 群众路线馆/教育基地 ===== */}
        {isHall && <>
          <rect x="200" y="180" width="400" height="190" fill={accentColor} opacity="0.08" stroke={accentColor} strokeWidth="1.2" rx="3"/>
          <rect x="200" y="180" width="400" height="35" fill={accentColor} opacity="0.12" rx="3"/>
          <rect x="230" y="240" width="80" height="100" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="0.6"/>
          <rect x="340" y="240" width="80" height="100" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="0.6"/>
          <rect x="450" y="240" width="80" height="100" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="0.6"/>
          <line x1="270" y1="215" x2="270" y2="240" stroke={accentColor} strokeWidth="0.4" opacity="0.2"/>
          <line x1="530" y1="215" x2="530" y2="240" stroke={accentColor} strokeWidth="0.4" opacity="0.2"/>
        </>}

        {/* 默认：通用建筑轮廓 */}
        {!isRedHouse && !isMonument && !isPavilion && !isAcademy && !isArsenal && !isHospital && !isTransport && !isSquare && !isTownHall && !isDefense && !isFarmers && !isCommittee && !isHall && <>
          <rect x="280" y="200" width="200" height="160" fill={accentColor} opacity="0.08" stroke={accentColor} strokeWidth="1" rx="2"/>
          <rect x="280" y="200" width="200" height="20" fill={accentColor} opacity="0.1"/>
          <rect x="310" y="250" width="40" height="80" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="0.5"/>
          <rect x="380" y="250" width="40" height="80" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="0.5"/>
        </>}
      </svg>

      {/* 文字叠加 */}
      <div className="absolute bottom-6 inset-x-0 text-center z-10">
        <div className="text-lg font-bold font-serif text-[#1A1A1A] tracking-wide drop-shadow-sm">{archive.title}</div>
        <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-serif tracking-wider" style={{ color: accentColor, backgroundColor: bgColor, border: `1px solid ${accentColor}30` }}>
          {archive.year}年 · {label}
        </div>
      </div>
    </div>
  )
}

export const ArchiveDetailModal: React.FC = () => {
  const { selectedPoiId, getArchiveData, isDetailModalOpen, setDetailModalOpen, setIndoorMode, setRelicMode, setSelectedPoiId, mainMapInstance } = useAppStore()
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [imgFailed, setImgFailed] = React.useState(false)
  const [showCeremony, setShowCeremony] = useState(false)
  
  useEffect(() => {
    setImgFailed(false)
  }, [selectedPoiId])
  
  if (!isDetailModalOpen || !selectedPoiId) return null
  
  const archive = getArchiveData(selectedPoiId)
  if (!archive) return null

  const handleClose = () => {
    setDetailModalOpen(false)
    setSelectedPoiId(null)
  }

  const handleLearnCourse = () => {
    setDetailModalOpen(false)
    if (mainMapInstance) {
      mainMapInstance.flyTo({
        center: [archive.longitude, archive.latitude],
        zoom: 17,
        pitch: 65,
        bearing: -20,
        duration: 2000,
        essential: true
      })
    }
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
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[80] flex items-center justify-center p-1 md:p-6" onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>
      
      <div className="relative w-full max-w-5xl h-full max-h-[98vh] md:max-h-[85vh] bg-white border border-[#E8DFD5] rounded-2xl md:rounded-3xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-[#E8DFD5] bg-[#FEFAF6] relative overflow-hidden">
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
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8 bg-white" key={selectedPoiId}>
          
          {/* Left: Media */}
          <div className="w-full lg:w-3/5 flex flex-col gap-4">
            {archive.media && archive.media.length > 0 && !imgFailed ? (
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-[#FEFAF6] border border-[#E8DFD5] relative group">
                <img 
                  src={`${import.meta.env.BASE_URL}images/archives/${archive.id}.jpg`}
                  alt={archive.media[0]?.caption || archive.title}
                  onError={(e) => {
                    // 本地图片加载失败 → 尝试原始URL → 都失败则显示占位
                    const img = e.currentTarget
                    if (img.dataset.fallbackTried === 'true') {
                      setImgFailed(true)
                    } else {
                      img.dataset.fallbackTried = 'true'
                      img.src = archive.media[0]?.url || ''
                    }
                  }}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-white/90 to-transparent">
                  <p className="text-[#1A1A1A]/90 text-sm flex items-center gap-2 font-serif">
                    <ImageIcon size={14} className="text-[#C41E3A]" /> {archive.media[0]?.caption || archive.title}
                  </p>
                </div>
              </div>
            ) : (
              <MuseumPlaceholder archive={archive} />
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
              <button
                onClick={handleLearnCourse}
                className="flex items-center gap-2 px-5 min-h-[44px] rounded-lg party-btn-primary"
                aria-label="开始学习本节思政课"
              >
                <BookOpen size={18} />
                开始学习本节思政课
              </button>
              
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
                  onClick={() => setShowCeremony(true)}
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

      {showCeremony && (
        <TributeCeremony onClose={() => setShowCeremony(false)} />
      )}
    </div>
  )
}
