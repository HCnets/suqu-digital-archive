import React, { useState } from 'react'
import { X, MapPin, Clock, Users, Play, CheckCircle2, Flag, BookOpen, Heart, Stars } from 'lucide-react'

interface Route {
  id: string
  title: string
  subtitle: string
  target: string
  duration: string
  icon: React.ReactNode
  color: string
  pois: string[]
  description: string
  opening: string
}

const ROUTES: Route[] = [
  {
    id: 'route-a',
    title: '初心之旅',
    subtitle: '情感冲击线',
    target: '全体参观者',
    duration: '约30分钟',
    icon: <Heart size={18} />,
    color: '#C41E3A',
    pois: ['suqu-red-house', 'blood-field', 'suqu-monument'],
    description: '从苏维埃政权诞生地出发，走到革命先烈洒热血的地方，最后在纪念碑前缅怀思念。这条线路以最直接的情感冲击，唤起参观者对革命先烈的深切敬意。',
    opening: '欢迎开启"初心之旅"。让我们从红屋开始——1927年12月，紫金县苏维埃政府在这里诞生，这是广东省最早成立的县级苏维埃政权之一。'
  },
  {
    id: 'route-b',
    title: '理论之路',
    subtitle: '政治站位线',
    target: '党员干部、团员骨干',
    duration: '约45分钟',
    icon: <BookOpen size={18} />,
    color: '#5C5C5C',
    pois: ['zijin-party-committee', 'dongjiang-committee', 'zijin-mass-education-center', 'suqu-party-building-square'],
    description: '深入党的组织领导体系——从县委旧址到东江特委，再到群众路线教育实践馆，系统学习党的组织建设、群众路线和根据地治理经验。',
    opening: '欢迎开启"理论之路"。这条线路将带您系统了解中国共产党如何在苏区建立组织体系、领导武装斗争、贯彻群众路线。'
  },
  {
    id: 'route-c',
    title: '少年信仰',
    subtitle: '青少年传承线',
    target: '中小学生、少先队员',
    duration: '约25分钟',
    icon: <Stars size={18} />,
    color: '#8B6914',
    pois: ['paozi-village-defense', 'red-army-pavilion', 'suqu-red-academy'],
    description: '专为青少年设计的信仰培育路线。从16岁小战士钟火妹的故事开始，到红军亭认识革命火种的传递，最后在红色书院感受书香中的红色基因。',
    opening: '欢迎开启"少年信仰"之旅。今天我们要认识一位16岁的英雄——钟火妹哥哥。他在炮子村阻击战中运送弹药，牺牲时双手还紧紧抱着弹药箱……'
  },
]

export const PartyDayRoutes: React.FC<{ onClose: () => void; onStartRoute: (poiIds: string[], opening: string) => void }> = ({ onClose, onStartRoute }) => {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)

  const route = ROUTES.find(r => r.id === selectedRoute)

  if (route) {
    return (
      <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8DFD5] p-6 animate-in zoom-in-95 duration-400">
          <button onClick={() => setSelectedRoute(null)} className="absolute top-4 left-4 p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FEFAF6] text-[#5C5C5C] transition-all flex items-center justify-center" aria-label="返回">
            ← 返回
          </button>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭">
            <X size={20} />
          </button>
          
          <div className="mt-8 text-center mb-6">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: route.color + '15', color: route.color }}>
              {route.icon}
            </div>
            <h2 className="text-xl font-bold text-[#1A1A1A] font-serif">{route.title}</h2>
            <p className="text-sm text-[#5C5C5C]">{route.subtitle}</p>
          </div>

          <div className="flex items-center gap-4 mb-4 text-sm text-[#5C5C5C]">
            <span className="flex items-center gap-1"><Clock size={14} /> {route.duration}</span>
            <span className="flex items-center gap-1"><Users size={14} /> {route.target}</span>
            <span className="flex items-center gap-1"><MapPin size={14} /> {route.pois.length}个点位</span>
          </div>

          <p className="text-sm text-[#5C5C5C] leading-relaxed mb-5 font-serif">{route.description}</p>

          <div className="space-y-2 mb-6">
            {route.pois.map((poiId, idx) => (
              <div key={poiId} className="flex items-center gap-3 p-3 rounded-xl bg-[#FEFAF6] border border-[#E8DFD5]">
                <span className="w-6 h-6 rounded-full bg-[#C41E3A] text-white text-xs flex items-center justify-center font-bold">{idx + 1}</span>
                <span className="text-sm font-medium text-[#1A1A1A]">
                  {poiId === 'suqu-red-house' ? '红屋 · 苏维埃政府旧址' :
                   poiId === 'blood-field' ? '血田遗址' :
                   poiId === 'suqu-monument' ? '革命烈士纪念碑' :
                   poiId === 'zijin-party-committee' ? '紫金县委旧址' :
                   poiId === 'dongjiang-committee' ? '东江特委旧址' :
                   poiId === 'zijin-mass-education-center' ? '群众路线教育实践馆' :
                   poiId === 'suqu-party-building-square' ? '党建文化广场' :
                   poiId === 'paozi-village-defense' ? '炮子村阻击战遗址' :
                   poiId === 'red-army-pavilion' ? '红军亭' :
                   poiId === 'suqu-red-academy' ? '苏区红色书院' : poiId}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => onStartRoute(route.pois, route.opening)}
            className="w-full py-3.5 rounded-xl bg-[#C41E3A] text-white font-bold hover:bg-[#C41E3A]/90 transition-all flex items-center justify-center gap-2"
          >
            <Play size={18} /> 开始{route.title}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#E8DFD5] p-6 animate-in zoom-in-95 duration-400">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-[#1A1A1A] font-serif mb-1 flex items-center gap-2">
          <Flag size={18} className="text-[#C41E3A]" />
          主题党日活动路线
        </h2>
        <p className="text-sm text-[#5C5C5C] mb-6">选择一条学习路线，系统将自动导航讲解</p>
        <div className="space-y-3">
          {ROUTES.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRoute(r.id)}
              className="w-full p-4 rounded-2xl border border-[#E8DFD5] hover:border-[#C41E3A]/30 transition-all text-left hover:shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: r.color + '15', color: r.color }}>
                  {r.icon}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[#1A1A1A] text-sm">{r.title}</div>
                  <div className="text-xs text-[#5C5C5C]">{r.subtitle} · {r.duration}</div>
                </div>
                <div className="flex -space-x-1">
                  {r.pois.map((_, i) => (
                    <div key={i} className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: r.color, opacity: 0.3 + i * 0.2 }} />
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
