import React, { useEffect, useState } from 'react'
import { HeartHandshake, Sparkles, Users, MessageSquareHeart, Flower2 } from 'lucide-react'

export const RightDataPanel: React.FC = () => {
  const [flowerCount, setFlowerCount] = useState(11990821)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFlowerCount(prev => prev + Math.floor(Math.random() * 3) + 1)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const handleFlowerClick = () => {
    setFlowerCount(prev => prev + 1)
  }

  return (
    <div className="absolute top-24 right-20 w-80 flex flex-col gap-4 pointer-events-auto z-40">
      
      {/* 模块一：线上参与致敬 */}
      <div className="museum-card p-5 rounded-2xl relative overflow-hidden flex-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C41E3A] to-[#8B6914]" />
        
        <h3 className="font-bold flex items-center gap-2 text-base mb-4 text-[#1A1A1A] font-serif tracking-wider">
          <HeartHandshake size={20} className="text-[#C41E3A]" />
          人民的缅怀
        </h3>

        <div className="bg-[#FEFAF6] p-4 rounded-2xl border border-[#E8DFD5] flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer">
          <Sparkles className="absolute top-2 right-2 text-[#8B6914]/30 group-hover:text-[#8B6914]/50 transition-colors duration-300" size={20} />
          <div className="text-xs text-[#5C5C5C] mb-2 font-medium">累计线上群众致敬次数</div>
          <div className="text-4xl font-black text-[#C41E3A] font-serif">
            {flowerCount.toLocaleString()}
          </div>
          <div className="mt-3 text-xs text-[#5C5C5C]/60 flex items-center gap-1">
            <Users size={12}/> 来自全国 34 个省市自治区的群众
          </div>
          
          <button 
            onClick={handleFlowerClick}
            className="mt-4 w-full min-h-[44px] party-btn-primary flex items-center justify-center gap-2"
            aria-label="点击参与线上致敬"
          >
            <Flower2 size={18} />
            参与线上致敬
          </button>
        </div>
      </div>

      {/* 模块二：学习感言留言板 */}
      <div className="museum-card p-5 rounded-2xl relative flex-1 flex flex-col overflow-hidden">
        <h3 className="font-bold flex items-center gap-2 text-base mb-4 text-[#1A1A1A] font-serif tracking-wider">
          <MessageSquareHeart size={20} className="text-[#C41E3A]" />
          学习感言留言板
        </h3>
        
        <div className="flex-1 overflow-hidden relative min-h-[260px]">
          <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
          
          <div className="absolute inset-0 overflow-y-auto custom-scrollbar pt-2 pb-8 space-y-3 pr-2">
            {[
              { name: "群众 138****9921", time: "刚刚", text: "重走红军路，才知道今天的幸福生活多么来之不易。向先烈致敬！" },
              { name: "紫金县实验中学 少先队", time: "10分钟前", text: "我们是共产主义接班人！请党放心，强国有我！" },
              { name: "老党员 张建国", time: "半小时前", text: "看到血田遗址的介绍，老泪纵横。江山就是人民，人民就是江山。" },
              { name: "群众 159****3342", time: "1小时前", text: "数字大屏做得太震撼了，像是在参观国家级博物馆。为苏区点赞！" },
              { name: "河源市青年学习小组", time: "2小时前", text: "走好新时代的长征路，把群众路线坚持到底。" },
              { name: "大埔围村 党员小队", time: "3小时前", text: "看了红屋的介绍，更加坚定了为人民服务的初心使命。" }
            ].map((msg, i) => (
              <div key={i} className="bg-[#FEFAF6] p-3.5 rounded-xl border border-[#E8DFD5] hover:border-[#C41E3A]/20 transition-colors duration-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-[#1A1A1A]">{msg.name}</span>
                  <span className="text-[10px] text-[#5C5C5C]/50">{msg.time}</span>
                </div>
                <p className="text-sm text-[#5C5C5C] leading-relaxed font-serif">
                  "{msg.text}"
                </p>
              </div>
            ))}
          </div>
        </div>

        <button className="mt-3 w-full min-h-[44px] party-btn-gold text-sm font-medium">
          留下学习感言
        </button>
      </div>
    </div>
  )
}
