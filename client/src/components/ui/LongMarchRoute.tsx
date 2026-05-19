import React, { useState } from 'react'
import { X, Flag, MapPin, ArrowRight, Clock } from 'lucide-react'

interface Stage {
  year: number
  title: string
  location: string
  description: string
  lng?: number
  lat?: number
}

const STAGES: Stage[] = [
  { year: 1927, title: '海陆丰起义', location: '广东海丰', description: '彭湃领导海陆丰第三次武装起义，创建中国第一个苏维埃政权——海陆丰苏维埃。苏区镇作为紫金县革命中心，在彭湃直接指导下开展工作。' },
  { year: 1928, title: '东江苏区形成', location: '广东紫金苏区镇', description: '海陆惠紫四县连片，形成面积约3000平方公里的东江革命根据地。炮子村阻击战打响了苏区保卫战。', lng: 115.3415, lat: 23.3610 },
  { year: 1930, title: '东江红军整编', location: '广东惠阳', description: '东江地区红军统一整编为红十一军，以八乡山为根据地，向潮汕平原发展。苏区镇持续作为重要后方基地。' },
  { year: 1931, title: '中华苏维埃共和国成立', location: '江西瑞金', description: '11月7日，中华苏维埃共和国临时中央政府在瑞金成立。毛泽东当选主席。东江苏区作为南方重要根据地与中央苏区遥相呼应。' },
  { year: 1933, title: '中央苏区第五次反围剿', location: '江西瑞金周边', description: '蒋介石调集百万兵力发动第五次"围剿"。由于"左"倾错误领导，反围剿失利，红军被迫进行战略转移的筹备。' },
  { year: 1934, title: '红军开始长征', location: '江西于都', description: '10月，中央红军主力8.6万余人从江西于都等地出发，开始举世闻名的二万五千里长征。留在苏区的同志转入游击战争。' },
  { year: 1935, title: '遵义会议', location: '贵州遵义', description: '1月，中共中央在遵义召开政治局扩大会议，确立了毛泽东在红军和党中央的领导地位，挽救了党、挽救了红军、挽救了中国革命。' },
  { year: 1935, title: '强渡大渡河·飞夺泸定桥', location: '四川泸定', description: '5月，红军先头部队在安顺场强渡大渡河，随后飞夺泸定桥，粉碎了蒋介石让红军成为"石达开第二"的企图。' },
  { year: 1935, title: '爬雪山过草地', location: '川西北', description: '翻越夹金山等大雪山，穿越松潘草地。许多红军战士长眠于此，用生命为革命铺就了前进的道路。' },
  { year: 1936, title: '三军会师', location: '甘肃会宁', description: '10月，红一、二、四方面军在甘肃会宁胜利会师，标志着长征的伟大胜利。长征是宣言书、宣传队、播种机。' },
]

export const LongMarchRoute: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeStage, setActiveStage] = useState<number | null>(null)

  return (
    <div className="fixed inset-0 z-[85] pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white border-l border-[#E8DFD5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-400 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-[#E8DFD5] bg-[#FEFAF6]">
          <div className="flex items-center gap-2">
            <Flag size={18} className="text-[#C41E3A]" />
            <h2 className="text-lg font-bold text-[#1A1A1A] font-serif tracking-wider">长征路线交互沙盘</h2>
          </div>
          <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="museum-card p-5 rounded-2xl border border-[#E8DFD5] mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C41E3A] to-[#8B6914]" />
            <p className="text-sm text-[#5C5C5C] leading-relaxed font-serif mt-1">
              从东江苏区镇出发，追溯中国工农红军主力从南方根据地到陕北的长征足迹。二万五千里征途，跨越14个省，翻越18座大山，渡过24条大河，是人类战争史上的伟大奇迹。
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#E8DFD5]" />
            <div className="absolute left-6 top-0 w-0.5 bg-[#C41E3A] transition-all duration-700 rounded-full" style={{ height: activeStage !== null ? `${((activeStage + 1) / STAGES.length) * 100}%` : '0%' }} />

            <div className="space-y-2">
              {STAGES.map((stage, idx) => {
                const isActive = activeStage === idx
                const isPassed = activeStage !== null && idx <= activeStage
                return (
                  <div
                    key={idx}
                    className="relative pl-14"
                  >
                    <button
                      onClick={() => setActiveStage(isActive ? null : idx)}
                      className={`absolute left-4 top-4 w-5 h-5 rounded-full border-2 transition-all duration-300 z-10 ${
                        isPassed
                          ? 'bg-[#C41E3A] border-[#C41E3A] shadow-sm'
                          : 'bg-white border-[#E8DFD5] hover:border-[#C41E3A]/50'
                      }`}
                    />

                    <div
                      className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'bg-[#FDE8EC] border-[#C41E3A]/40 shadow-sm'
                          : isPassed
                          ? 'bg-[#FEFAF6] border-[#E8DFD5]'
                          : 'bg-white border-[#E8DFD5] hover:border-[#C41E3A]/20 hover:bg-[#FEFAF6]'
                      }`}
                      onClick={() => setActiveStage(isActive ? null : idx)}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-mono font-bold text-[#C41E3A] bg-[#FDE8EC] px-2 py-0.5 rounded">{stage.year}</span>
                        <h3 className="font-bold text-[#1A1A1A] text-sm font-serif">{stage.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#5C5C5C] mb-2">
                        <MapPin size={11} />
                        <span>{stage.location}</span>
                      </div>
                      {isActive && (
                        <p className="text-sm text-[#5C5C5C] leading-relaxed font-serif mt-2 pt-2 border-t border-[#E8DFD5] animate-in slide-in-from-top-2 duration-300">
                          {stage.description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-[#FEFAF6] border border-[#E8DFD5] text-center">
            <p className="text-sm text-[#5C5C5C] font-serif leading-relaxed">
              <span className="font-bold text-[#C41E3A]">长征精神：</span>
              把全国人民和中华民族的根本利益看得高于一切，坚定革命的理想和信念，坚信正义事业必然胜利的精神；为了救国救民，不怕任何艰难险阻，不惜付出一切牺牲的精神。
            </p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <Clock size={12} className="text-[#5C5C5C]" />
              <span className="text-xs text-[#5C5C5C]">1934年10月 — 1936年10月 · 历时两年</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
