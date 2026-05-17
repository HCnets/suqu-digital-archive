import React, { useEffect, useState } from 'react'
import { HeartHandshake, MessageSquareHeart, Users, Sparkles } from 'lucide-react'

export const RightDataPanel: React.FC = () => {
  const [mounted, setMounted] = useState(false)
  const [flowerCount, setFlowerCount] = useState(128450)
  
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 1000)
    // 模拟云端献花数字增长
    const interval = setInterval(() => setFlowerCount(c => c + Math.floor(Math.random() * 3)), 3000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])

  if (!mounted) return null

  return (
    <div className="absolute top-24 right-6 w-80 bottom-8 flex flex-col gap-6 pointer-events-auto z-40 animate-in slide-in-from-right-8 duration-1000">
      
      {/* 模块一：云端致敬与献花 */}
      <div className="glass-panel p-5 rounded-3xl border border-rose-900/30 bg-zinc-950/80 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative overflow-hidden backdrop-blur-2xl flex-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-rose-600" />
        
        <h3 className="font-bold flex items-center gap-2 text-base mb-4 text-amber-400 font-serif tracking-widest">
          <HeartHandshake size={20} className="text-rose-500" />
          人民的缅怀
        </h3>

        {/* 核心数字 */}
        <div className="bg-rose-950/40 p-4 rounded-2xl border border-rose-900/50 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(225,29,72,0.3)] transition-all duration-300">
          <Sparkles className="absolute top-2 right-2 text-amber-500/30 group-hover:text-amber-400 transition-colors duration-500" size={24} />
          <div className="text-xs text-rose-200/80 mb-2 font-medium">线上参与致敬人次</div>
          <div className="text-4xl font-black text-amber-400 font-serif drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">
            {flowerCount.toLocaleString()}
          </div>
          <div className="mt-3 text-xs text-rose-300/60 flex items-center gap-1">
            <Users size={12}/> 来自全国 34 个省市自治区的群众
          </div>
          
          <button
            className="mt-4 w-full min-h-[44px] bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-900/50 transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5"
            aria-label="参与线上致敬"
          >
            <HeartHandshake size={18} />
            参与线上致敬
          </button>
        </div>
      </div>

      {/* 模块二：群众留言墙 */}
      <div className="glass-panel p-5 rounded-3xl border border-rose-900/30 bg-zinc-950/80 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative backdrop-blur-2xl flex-1 flex flex-col overflow-hidden">
        <h3 className="font-bold flex items-center gap-2 text-base mb-4 text-amber-400 font-serif tracking-widest">
          <MessageSquareHeart size={20} className="text-rose-500" />
          薪火相传留言板
        </h3>
        
        <div className="flex-1 overflow-hidden relative">
          {/* 渐变遮罩 */}
          <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-zinc-950/90 to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-zinc-950/90 to-transparent z-10 pointer-events-none" />
          
          {/* 滚动的留言 */}
          <div className="absolute inset-0 overflow-y-auto custom-scrollbar pt-2 pb-8 space-y-4 pr-2">
            {[
              { name: "群众 138****9921", time: "刚刚", text: "重走红军路，才知道今天的幸福生活多么来之不易。向先烈致敬！" },
              { name: "紫金县实验中学 少先队", time: "10分钟前", text: "我们是共产主义接班人！请党放心，强国有我！" },
              { name: "老党员 张建国", time: "半小时前", text: "看到血田遗址的介绍，老泪纵横。江山就是人民，人民就是江山。" },
              { name: "群众 159****3342", time: "1小时前", text: "数字大屏做得太震撼了，像是在参观国家级博物馆。为苏区点赞！" },
              { name: "外地游客 李先生", time: "2小时前", text: "走好新时代的长征路，把群众路线坚持到底。" }
            ].map((msg, i) => (
              <div key={i} className="bg-rose-950/30 p-4 rounded-xl border border-rose-900/40 hover:bg-rose-900/40 transition-colors duration-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-rose-200">{msg.name}</span>
                  <span className="text-[10px] text-rose-400/60">{msg.time}</span>
                </div>
                <p className="text-sm text-rose-100/90 leading-relaxed font-serif">
                  "{msg.text}"
                </p>
              </div>
            ))}
          </div>
        </div>

        <button
          className="mt-4 w-full min-h-[44px] bg-transparent border border-amber-500/50 hover:bg-amber-500/10 text-amber-400 font-bold rounded-xl transition-all duration-300 text-sm hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(250,204,21,0.2)]"
          aria-label="留下群众感言"
        >
          留下学习感言
        </button>
      </div>

    </div>
  )
}
