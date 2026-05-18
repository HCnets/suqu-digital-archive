import React, { useState } from 'react'
import { X, MoveHorizontal, ArrowRight, TrendingUp, Users, Home, Leaf, GraduationCap } from 'lucide-react'

const COMPARISONS = [
  { year: 1928, label: '血战炮子村', old: '硝烟弥漫的战场，450余名革命烈士血洒水田。', new: '炮子村如今已是广东省红色旅游精品线路核心节点，血田遗址被列为全国重点文物保护单位。', icon: <MoveHorizontal size={16} /> },
  { year: 2026, label: '今日苏区', old: '', new: '', icon: <ArrowRight size={16} /> },
]

const TODAY_DATA = [
  { icon: <Users size={20} />, number: '4.2万', label: '苏区镇户籍人口', detail: '下辖16个行政村，是中国红色美丽乡村示范镇' },
  { icon: <Home size={20} />, number: '16处', label: '红色遗址保护单位', detail: '含全国重点文保1处、省级文保3处、县级12处' },
  { icon: <TrendingUp size={20} />, number: '30万+', label: '年接待参观人次', detail: '红色旅游成为苏区镇支柱产业，带动全镇经济增长' },
  { icon: <Leaf size={20} />, number: '零', label: '绝对贫困发生率', detail: '2020年如期实现全面脱贫，贫困发生率归零' },
  { icon: <GraduationCap size={20} />, number: '38个', label: '党员教育基地班次/年', detail: '广东省党员教育基地年均承接省内外党性教育培训班次' },
  { icon: <Users size={20} />, number: '95%', label: '群众满意度', detail: '2025年全镇群众路线教育实践活动群众满意度测评结果' },
]

const BEFORE_AFTER = [
  { title: '红屋（苏维埃政府旧址）', before: '1927年，林氏宗祠被改造为苏维埃政府办公地，条件简陋，桌椅均由群众捐献。', after: '经多次修缮保护，红屋现为广东省党史教育基地，内设苏维埃政权建设专题陈列。' },
  { title: '红军亭', before: '1928年，南昌起义和广州起义部队在此用竹竿和茅草搭建临时会师台。', after: '现为红色旅游打卡地标，亭前广场可容纳千人集会，每年七一在此举行新党员入党宣誓。' },
  { title: '苏区红色书院', before: '1923年，农会在此开办农民夜校，教农民识字算账、宣讲革命道理。', after: '2023年建成苏区红色书院，藏书2万余册，设有党史学习区、数字阅览室，免费向群众开放。' },
]

export const TodaySuqu: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeBeforeAfter, setActiveBeforeAfter] = useState(0)

  return (
    <div className="fixed inset-0 z-[85] pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white border-l border-[#E8DFD5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-400 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-[#E8DFD5] bg-[#FEFAF6]">
          <h2 className="text-lg font-bold text-[#1A1A1A] font-serif tracking-wider flex items-center gap-2">
            <span className="w-1 h-5 bg-[#C41E3A] rounded-full" />
            今日苏区 · 乡村振兴今昔对比
          </h2>
          <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* 英雄对比卡片 */}
          <div className="relative museum-card rounded-2xl border border-[#E8DFD5] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C41E3A] to-[#8B6914]" />
            <div className="p-6">
              <h3 className="text-xl font-bold text-[#1A1A1A] font-serif mb-2">1928 年 → 2026 年</h3>
              <p className="text-sm text-[#5C5C5C] leading-relaxed mb-2">
                1928年，国民党反动派对苏区发动残酷"围剿"，450余名革命先烈血洒炮子村水田。烈士的鲜血染红了整片稻田，经久不褪，当地群众悲痛地将那块水田称为"血田"。
              </p>
              <div className="flex items-center gap-2 text-[#C41E3A] font-bold">
                <ArrowRight size={16} />
                <span className="font-serif">传承 → 发展</span>
              </div>
              <p className="text-sm text-[#5C5C5C] leading-relaxed mt-2">
                今天，苏区镇已成为"广东省红色村组织振兴试点"，全国唯一以"苏区"命名的乡镇。红色旅游年接待量超30万人次，农民人均年收入较2015年翻了一番。过去是为了活下去而战斗的地方，现在是为了过得更好而奋斗的热土。
              </p>
            </div>
          </div>

          {/* 数据卡片 */}
          <h3 className="text-lg font-bold text-[#1A1A1A] font-serif flex items-center gap-2">
            <TrendingUp size={18} className="text-[#C41E3A]" />
            乡村振兴数据看板
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TODAY_DATA.map((item, idx) => (
              <div key={idx} className="museum-card p-4 rounded-2xl border border-[#E8DFD5] text-center hover:border-[#C41E3A]/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#FDE8EC] text-[#C41E3A] flex items-center justify-center mx-auto mb-3">
                  {item.icon}
                </div>
                <div className="text-2xl font-black text-[#C41E3A] font-serif">{item.number}</div>
                <div className="text-xs font-bold text-[#1A1A1A] mt-1">{item.label}</div>
                <div className="text-[10px] text-[#5C5C5C] mt-1 leading-relaxed">{item.detail}</div>
              </div>
            ))}
          </div>

          {/* 今昔对比 */}
          <h3 className="text-lg font-bold text-[#1A1A1A] font-serif flex items-center gap-2">
            <MoveHorizontal size={18} className="text-[#8B6914]" />
            旧址今貌对比
          </h3>
          <div className="flex gap-2 flex-wrap mb-4">
            {BEFORE_AFTER.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setActiveBeforeAfter(idx)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeBeforeAfter === idx
                    ? 'bg-[#FDE8EC] text-[#C41E3A] border border-[#C41E3A]/30'
                    : 'bg-white border border-[#E8DFD5] text-[#5C5C5C] hover:bg-[#FEFAF6]'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
          <div className="museum-card p-6 rounded-2xl border border-[#E8DFD5]">
            <h4 className="font-bold text-[#1A1A1A] font-serif mb-4">{BEFORE_AFTER[activeBeforeAfter].title}</h4>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#FEFAF6] border border-[#E8DFD5]">
                <span className="text-xs font-bold text-[#C41E3A] uppercase tracking-wider">过去</span>
                <p className="text-sm text-[#5C5C5C] leading-relaxed mt-1">{BEFORE_AFTER[activeBeforeAfter].before}</p>
              </div>
              <div className="flex justify-center">
                <ArrowRight size={20} className="text-[#8B6914]" />
              </div>
              <div className="p-4 rounded-xl bg-[#FFF8E1] border border-[#8B6914]/20">
                <span className="text-xs font-bold text-[#8B6914] uppercase tracking-wider">现在</span>
                <p className="text-sm text-[#5C5C5C] leading-relaxed mt-1">{BEFORE_AFTER[activeBeforeAfter].after}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
