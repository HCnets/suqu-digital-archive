import React, { useState } from 'react'
import { X, MapPin, Clock, Route, Download, Footprints, Map, Bookmark } from 'lucide-react'

interface TourItem {
  id: string
  name: string
  time: string
  duration: string
  description: string
}

const ROUTE_A: TourItem[] = [
  { id: '1', name: '紫金县苏维埃政府旧址（红屋）', time: '09:00', duration: '45分钟', description: '核心地标。参观苏维埃成立会场、彭湃办公室复原、历史文件展柜。新党员可在广场重温入党誓词。' },
  { id: '2', name: '血田遗址 · 烈士纪念碑', time: '09:50', duration: '30分钟', description: '步行5分钟。瞻仰烈士英名墙，在默哀区进行1分钟默哀仪式。参观事迹浮雕长廊。' },
  { id: '3', name: '红军亭 · 会师广场', time: '10:30', duration: '20分钟', description: '参观红军会师纪念碑、徐向前题词石刻。沿红色文化长廊了解苏区历史全景。' },
  { id: '4', name: '苏区红色书院', time: '11:00', duration: '40分钟', description: '参观红色文献专题区、党史大讲堂。可在数字阅览室查阅口述历史资料。11:40集体返回。' },
]

const ROUTE_B: TourItem[] = [
  { id: '1', name: '苏区革命烈士纪念碑', time: '09:00', duration: '30分钟', description: '俯瞰炮子村全景。在庄严的纪念碑前集体默哀，参观英烈事迹陈列室。' },
  { id: '2', name: '炮子村阻击战遗址', time: '09:40', duration: '40分钟', description: '参观阻击战纪念亭、钟火妹烈士雕像，沿战壕遗址步道感受当年战斗场景。' },
  { id: '3', name: '血田遗址 · 烈士纪念碑', time: '10:30', duration: '30分钟', description: '聆听450多位烈士的英雄事迹，在英名墙前缅怀革命先烈。' },
  { id: '4', name: '紫金县苏维埃政府旧址（红屋）', time: '11:10', duration: '40分钟', description: '参观苏维埃成立会场，了解中国第一个县级苏维埃政权的建立历程。12:00结束。' },
]

const ROUTE_C: TourItem[] = [
  { id: '1', name: '紫金县苏维埃政府旧址（红屋）', time: '09:00', duration: '30分钟', description: '感受苏维埃成立的历史时刻。适合青少年了解基层民主政权创建历程。' },
  { id: '2', name: '红军亭 · 会师广场', time: '09:40', duration: '20分钟', description: '聆听南昌起义与广州起义会师故事。在广场上进行团队建设活动。' },
  { id: '3', name: '苏区红色书院', time: '10:10', duration: '45分钟', description: 'VR沉浸式体验、小小讲解员互动。查阅红色文献，完成研学任务卡。' },
  { id: '4', name: '炮子村阻击战遗址', time: '11:05', duration: '35分钟', description: '身临其境感受阻击战场景。聆听钟火妹等少年英雄故事。11:40总结分享。' },
]

export const TourGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeRoute, setActiveRoute] = useState<number>(0)

  const routes = [
    { name: '主题党日路线', items: ROUTE_A, color: '#C41E3A', icon: '🏛️', desc: '适合党政机关主题党日活动，侧重仪式教育' },
    { name: '缅怀先烈路线', items: ROUTE_B, color: '#8B6914', icon: '🕯️', desc: '适合清明祭扫和烈士纪念日，侧重敬仰缅怀' },
    { name: '少年信仰路线', items: ROUTE_C, color: '#2E7D32', icon: '🌱', desc: '适合中小学生研学实践，侧重启发性教育' },
  ]

  const curr = routes[activeRoute]

  const generateTourText = () => {
    let text = '═══════════════════════════\n'
    text += `  苏区镇红色文旅导览手册\n`
    text += `  ${curr.name}\n`
    text += `  ${curr.desc}\n`
    text += '═══════════════════════════\n\n'
    curr.items.forEach((item, i) => {
      text += `${i + 1}. ${item.time}  ${item.name}\n`
      text += `   预计时间: ${item.duration}\n`
      text += `   ${item.description}\n\n`
    })
    text += '═══════════════════════════\n'
    text += '  苏区镇数字化红色档案系统 出品\n'
    text += `  生成日期: ${new Date().toLocaleDateString('zh-CN')}\n`
    text += '═══════════════════════════\n'
    return text
  }

  const handleDownload = () => {
    const blob = new Blob([generateTourText()], { type: 'text/plain;charset=UTF-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `苏区镇红色导览_${curr.name}_${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-[85] pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white border-l border-[#E8DFD5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-400 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-[#E8DFD5] bg-[#FEFAF6]">
          <div className="flex items-center gap-2">
            <Map size={18} className="text-[#C41E3A]" />
            <h2 className="text-lg font-bold text-[#1A1A1A] font-serif">苏区镇红色文旅导览</h2>
          </div>
          <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1">
          <div className="grid grid-cols-3 gap-2 mb-6">
            {routes.map((r, i) => (
              <button
                key={i}
                onClick={() => setActiveRoute(i)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  i === activeRoute
                    ? 'bg-[#FDE8EC] border-[#C41E3A]/40 shadow-sm'
                    : 'bg-white border-[#E8DFD5] hover:bg-[#FEFAF6] hover:border-[#C41E3A]/20'
                }`}
              >
                <div className="text-2xl mb-1">{r.icon}</div>
                <div className={`text-xs font-bold font-serif ${i === activeRoute ? 'text-[#C41E3A]' : 'text-[#5C5C5C]'}`}>
                  {r.name}
                </div>
              </button>
            ))}
          </div>

          <div className="museum-card p-5 rounded-2xl border border-[#E8DFD5] mb-6" style={{ borderTopColor: curr.color, borderTopWidth: '3px' }}>
            <h3 className="text-lg font-bold font-serif mb-2" style={{ color: curr.color }}>{curr.name}</h3>
            <p className="text-sm text-[#5C5C5C] mb-4">{curr.desc}</p>

            <div className="flex items-center gap-2 text-xs text-[#5C5C5C] mb-3">
              <Clock size={12} />
              <span>建议参观时长：约3小时</span>
              <span className="mx-2">|</span>
              <Footprints size={12} />
              <span>步行距离：约2公里</span>
            </div>

            <div className="space-y-2">
              {curr.items.map((item, i) => (
                <div key={item.id} className="flex gap-3 p-3 rounded-lg bg-[#FEFAF6] border border-[#E8DFD5]">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: curr.color }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#1A1A1A] font-serif">{item.name}</h4>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-mono text-[#5C5C5C] bg-white px-2 py-0.5 rounded border border-[#E8DFD5]">⏰ {item.time}</span>
                      <span className="text-[10px] text-[#5C5C5C]">⏱ {item.duration}</span>
                    </div>
                    <p className="text-xs text-[#5C5C5C] mt-1.5 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FDE8EC] border border-[#C41E3A]/20 text-center">
            <Route size={20} className="text-[#C41E3A] mx-auto mb-2" />
            <p className="text-xs text-[#5C5C5C] mb-3">
              以上为建议路线，可根据实际需求调整。建议提前预约，团体参访请携带单位介绍信。
            </p>
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-lg bg-[#C41E3A] text-white text-sm font-medium hover:bg-[#A01830] transition-all flex items-center gap-2 mx-auto"
            >
              <Download size={14} />
              下载导览手册
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
