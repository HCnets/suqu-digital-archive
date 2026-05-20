import React, { useState, useRef, useCallback } from 'react'
import { X, Rotate3D, MapPin, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'

interface Panorama {
  id: string
  title: string
  description: string
  bgColor: string
  accentColor: string
  features: string[]
  lat: number
  lng: number
}

const PANORAMAS: Panorama[] = [
  {
    id: 'suqu-red-house',
    title: '紫金县苏维埃政府旧址 · 红屋',
    description: '1927年12月，紫金县苏维埃政府在此庄严宣告成立。林氏宗祠三进院落，青砖黛瓦，门前石狮依然守护。堂内陈列着苏维埃时期的桌椅、文件柜和红旗。',
    bgColor: '#FDE8EC',
    accentColor: '#C41E3A',
    features: ['苏维埃政府成立会场', '彭湃同志办公室复原', '苏维埃印章陈列', '历史文件展柜'],
    lat: 23.3615,
    lng: 115.3412
  },
  {
    id: 'blood-field',
    title: '血田遗址 · 烈士纪念碑',
    description: '1928年春，450多名革命先烈在此壮烈牺牲，鲜血染红整片水田。如今纪念碑巍然矗立，碑文"革命烈士永垂不朽"八个大字庄严肃穆。',
    bgColor: '#FEFAF6',
    accentColor: '#C41E3A',
    features: ['血田纪念广场', '烈士英名墙', '默哀区', '事迹浮雕长廊'],
    lat: 23.3590,
    lng: 115.3385
  },
  {
    id: 'red-army-pavilion',
    title: '红军亭 · 会师广场',
    description: '南昌起义与广州起义余部在此历史性会师。红军亭始建于1927年，现为红色旅游打卡地标，亭前广场可容纳千人集会。',
    bgColor: '#FFF8E1',
    accentColor: '#8B6914',
    features: ['红军会师纪念碑', '徐向前题词石刻', '新党员宣誓广场', '红色文化长廊'],
    lat: 23.3625,
    lng: 115.3420
  },
  {
    id: 'suqu-monument',
    title: '苏区革命烈士纪念碑',
    description: '1958年国务院命名"苏区乡"同年修建。碑身巍峨，俯瞰整个炮子村。每年清明和七一，数万群众来此缅怀先烈。',
    bgColor: '#FDE8EC',
    accentColor: '#C41E3A',
    features: ['烈士纪念碑主碑', '英烈事迹陈列室', '入党宣誓墙', '红色教育课堂'],
    lat: 23.3640,
    lng: 115.3430
  },
  {
    id: 'paozi-village',
    title: '炮子村阻击战遗址',
    description: '1928年，600勇士在此以弱抗强，阻击敌军三天三夜，掩护苏维埃政府和群众安全转移。战场遗址如今绿树成荫，和平来之不易。',
    bgColor: '#E8F5E9',
    accentColor: '#2E7D32',
    features: ['阻击战纪念亭', '钟火妹烈士雕像', '战壕遗址步道', '观景平台'],
    lat: 23.3585,
    lng: 115.3330
  },
  {
    id: 'suqu-red-academy',
    title: '苏区红色书院',
    description: '2023年建成，藏书三万余册。设有党史学习区、数字阅览室、VR体验区。从农民夜校到现代书院，知识的火种从未熄灭。',
    bgColor: '#FFF8E1',
    accentColor: '#8B6914',
    features: ['红色文献专题区', 'VR沉浸式体验', '党史大讲堂', '小小讲解员培训室'],
    lat: 23.3595,
    lng: 115.3415
  },
  {
    id: 'zijin-party-committee',
    title: '中共紫金县委旧址',
    description: '大革命失败后，中共紫金县委秘密迁至炮子乡深山之中，在此领导了紫金县的武装暴动和苏维埃政权建设。彭湃同志曾多次在此主持会议。',
    bgColor: '#FDE8EC',
    accentColor: '#C41E3A',
    features: ['县委秘密会议室复原', '彭湃同志办公旧址', '革命文物展柜', '历史照片墙'],
    lat: 23.3580,
    lng: 115.3400
  },
  {
    id: 'dongjiang-committee',
    title: '中共东江特委旧址',
    description: '中共东江特别委员会机关驻地，彭湃同志任书记。在此统一领导海陆惠紫四县的革命斗争，创办《东江红旗》等革命刊物。',
    bgColor: '#FDE8EC',
    accentColor: '#C41E3A',
    features: ['特委机关旧址', '《东江红旗》编辑部复原', '彭湃同志卧室复原', '根据地沙盘模型'],
    lat: 23.3610,
    lng: 115.3395
  },
  {
    id: 'soviet-arsenal',
    title: '苏维埃兵工厂遗址',
    description: '紫金苏维埃政权在极端困难条件下创建的秘密兵工厂。苏区军民在此制造土枪、大刀、手榴弹，用智慧和汗水为武装斗争提供了宝贵后勤保障。',
    bgColor: '#E8F5E9',
    accentColor: '#2E7D32',
    features: ['兵工厂遗址', '土枪展示区', '工具陈列', '历史场景复原'],
    lat: 23.3575,
    lng: 115.3365
  },
  {
    id: 'suqu-transport',
    title: '苏区红色交通站旧址',
    description: '连接东江苏区与中央苏区的地下交通线重要节点。交通员们以商贩、郎中等身份为掩护，在此传递情报、护送干部、运送物资。',
    bgColor: '#FFF8E1',
    accentColor: '#8B6914',
    features: ['交通站暗格', '情报传递展', '交通员事迹墙', '秘密通道复原'],
    lat: 23.3570,
    lng: 115.3425
  },
]

export const RedPanorama: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [rotation, setRotation] = useState(0)
  const isDragging = useRef(false)
  const lastX = useRef(0)

  const panorama = PANORAMAS[currentIdx]

  const handlePrev = () => setCurrentIdx(prev => (prev - 1 + PANORAMAS.length) % PANORAMAS.length)
  const handleNext = () => setCurrentIdx(prev => (prev + 1) % PANORAMAS.length)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true
    lastX.current = e.clientX
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - lastX.current
    setRotation(prev => (prev + dx * 0.3) % 360)
    lastX.current = e.clientX
  }, [])

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  return (
    <div className={`fixed ${isFullscreen ? 'inset-0' : 'inset-0'} z-[85] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300`}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative bg-white rounded-3xl shadow-2xl border border-[#E8DFD5] overflow-hidden animate-in zoom-in-95 duration-400 ${isFullscreen ? 'w-full h-full max-w-[95vw] max-h-[95vh]' : 'w-full max-w-2xl'}`}>
        <div className="flex items-center justify-between p-4 border-b border-[#E8DFD5] bg-[#FEFAF6]">
          <div className="flex items-center gap-2">
            <Rotate3D size={18} className="text-[#C41E3A]" />
            <h2 className="text-sm font-bold text-[#1A1A1A] font-serif">苏区镇红色遗址360°全景</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center">
              <Maximize2 size={16} />
            </button>
            <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="relative" style={{ background: `linear-gradient(135deg, ${panorama.bgColor} 0%, #FEFAF6 50%, ${panorama.bgColor}90 100%)` }}>
          <div
            className="w-full h-64 md:h-80 cursor-grab active:cursor-grabbing select-none flex items-center justify-center relative overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <div className="text-center px-8 z-10">
              <div
                className="text-8xl mb-4 transition-transform duration-100"
                style={{ transform: `rotateY(${rotation}deg)` }}
              >
                🏛️
              </div>
              <h3 className="text-2xl font-black font-serif mb-2" style={{ color: panorama.accentColor }}>
                {panorama.title}
              </h3>
              <p className="text-sm text-[#5C5C5C] leading-relaxed max-w-md mx-auto font-serif">
                {panorama.description}
              </p>
            </div>

            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="compass" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                    <circle cx="30" cy="30" r="28" fill="none" stroke={panorama.accentColor} strokeWidth="0.5" />
                    <line x1="30" y1="2" x2="30" y2="58" stroke={panorama.accentColor} strokeWidth="0.5" />
                    <line x1="2" y1="30" x2="58" y2="30" stroke={panorama.accentColor} strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#compass)" />
              </svg>
            </div>

            <div className="absolute top-4 left-4 bg-white/90 px-3 py-1.5 rounded-full text-xs font-medium text-[#5C5C5C]">
              ← 拖拽旋转 →
            </div>

            <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-[#E8DFD5] shadow-sm flex items-center justify-center text-[#5C5C5C] hover:text-[#C41E3A] hover:bg-white transition-all">
              <ChevronLeft size={20} />
            </button>
            <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-[#E8DFD5] shadow-sm flex items-center justify-center text-[#5C5C5C] hover:text-[#C41E3A] hover:bg-white transition-all">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={14} className="text-[#C41E3A]" />
            <span className="text-xs text-[#5C5C5C] font-mono">
              {panorama.lng.toFixed(4)}, {panorama.lat.toFixed(4)}
            </span>
            <span className="text-xs text-[#C41E3A] font-medium ml-auto">{currentIdx + 1} / {PANORAMAS.length}</span>
          </div>

          <h4 className="text-sm font-bold text-[#1A1A1A] mb-2 font-serif">场景特色</h4>
          <div className="grid grid-cols-2 gap-2">
            {panorama.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-[#FEFAF6] border border-[#E8DFD5] text-xs text-[#5C5C5C]">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: panorama.accentColor }} />
                {f}
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-2 mt-4">
            {PANORAMAS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentIdx ? 'bg-[#C41E3A] scale-125 shadow-sm' : 'bg-[#E8DFD5] hover:bg-[#D4C5B2]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
