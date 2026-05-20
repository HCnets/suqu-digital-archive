import React, { useState } from 'react'
import { X, Film, Tv, Clapperboard, ExternalLink, Info } from 'lucide-react'

interface FilmItem {
  title: string
  year: string
  type: '电影' | '电视剧' | '纪录片'
  description: string
  connection: string
  imageChar: string
  accent: string
}

const FILMS: FilmItem[] = [
  {
    title: '红色摇篮',
    year: '2010',
    type: '电视剧',
    description: '29集革命历史题材电视剧，讲述1929-1934年毛泽东、朱德、周恩来等领导红军开辟中央苏区的历史。以瑞金为中心，全面展现中华苏维埃共和国的创建历程。',
    connection: '东江苏区与中央苏区在1931年取得联系后，成为南方游击战争的重要策应力量。苏区镇正是在此大背景下成为紫金县革命中心。',
    imageChar: '🏛️',
    accent: '#C41E3A'
  },
  {
    title: '寻路',
    year: '2013',
    type: '电视剧',
    description: '44集重大革命历史题材电视剧，全景展现1927-1932年间中国共产党人探索中国革命道路的艰难历程，从南昌起义到建立中央苏区。',
    connection: '剧中多次展现彭湃领导的海陆丰农民运动，苏区镇作为海陆惠紫革命根据地的组成部分，与剧中历史脉络直接相连。',
    imageChar: '🗺️',
    accent: '#C41E3A'
  },
  {
    title: '彭湃',
    year: '2001',
    type: '电视剧',
    description: '以中国农民运动领袖彭湃为原型的传记电视剧，讲述他从富家少爷到革命领袖的传奇人生，以及海陆丰苏维埃政权的建立。',
    connection: '彭湃同志1927年冬亲赴苏区镇指导工作，在红屋成立了紫金县苏维埃政府。剧中的《田仔骂田公》至今仍在苏区传唱。',
    imageChar: '👨‍🌾',
    accent: '#8B6914'
  },
  {
    title: '闪闪的红星',
    year: '1974',
    type: '电影',
    description: '经典红色儿童电影。少年潘冬子在红军离开后坚持斗争，最终成长为红军战士。插曲《映山红》《红星照我去战斗》传唱至今。',
    connection: '影片中红军离开根据地的情节与1934年红军长征后苏区人民坚持斗争的经历高度相似，潘冬子的勇气也是苏区少年英雄的精神写照。',
    imageChar: '⭐',
    accent: '#C41E3A'
  },
  {
    title: '长征',
    year: '1996',
    type: '纪录片',
    description: '中央电视台大型文献纪录片，全景式回顾中国工农红军二万五千里长征的全过程，包含大量珍贵历史影像和当事人采访。',
    connection: '长征途中，从东江出发的老红军战士参加了多场重要战役。苏区镇的红军后代至今珍藏着父辈的长征回忆录。',
    imageChar: '🎖️',
    accent: '#C41E3A'
  },
  {
    title: '东江纵队',
    year: '2019',
    type: '纪录片',
    description: '广东省制作的大型纪录片，还原东江纵队在抗日战争和解放战争中的历史贡献，包括大量东江地区实地拍摄内容。',
    connection: '东江纵队的许多骨干正是1927-1934年东江苏区的老红军后代，苏区镇的红色基因通过他们延续到了抗日战争中。',
    imageChar: '🏔️',
    accent: '#2E7D32'
  },
  {
    title: '大决战',
    year: '2021',
    type: '电视剧',
    description: '建党百年献礼剧，全景展现解放战争三大战役的宏大历史画卷。毛泽东说"战争的伟力之最深厚的根源，存在于民众之中"。',
    connection: '从苏区镇的赤卫队到三大战役的百万雄师，中国革命的每一步都是人民力量的汇聚。苏区人的儿子也参加了辽沈战役。',
    imageChar: '⚔️',
    accent: '#C41E3A'
  },
  {
    title: '理想照耀中国',
    year: '2021',
    type: '电视剧',
    description: '建党百年主题系列短剧，40个故事讲述不同时期中国共产党人的初心使命。',
    connection: '剧中"真理的味道""劳工万岁"等单元与苏区镇的农民运动、工人运动历史一脉相承。',
    imageChar: '🔥',
    accent: '#C41E3A'
  },
  {
    title: '建军大业',
    year: '2017',
    type: '电影',
    description: '献礼建军90周年历史大片，聚焦1927年南昌起义到井冈山会师的革命历程，全明星阵容演绎建军伟业。',
    connection: '南昌起义军余部后来进入海陆丰地区，在苏区镇红军亭与广州起义余部会师，影片中的历史正是苏区故事的起点。',
    imageChar: '⚡',
    accent: '#C41E3A'
  },
  {
    title: '绝密使命',
    year: '2021',
    type: '电视剧',
    description: '32集谍战剧，首次聚焦中央红色交通线——从上海到瑞金三千里水陆地下交通线上的绝密故事。',
    connection: '苏区镇红色交通站是这条交通线的重要支线节点。剧中交通员的经历，与苏区镇交通员李月梅的真实故事惊人相似。',
    imageChar: '🕵️',
    accent: '#8B6914'
  },
  {
    title: '古田军号',
    year: '2019',
    type: '电影',
    description: '以一个红军小号手的视角，讲述1929年古田会议前后红军队伍的思想建设和组织建设历程。',
    connection: '古田会议确立的"思想建党、政治建军"原则，在苏区镇的赤卫队和苏维埃政权建设中同样得到了坚决贯彻。',
    imageChar: '📯',
    accent: '#C41E3A'
  },
  {
    title: '觉醒年代',
    year: '2021',
    type: '电视剧',
    description: '43集重大革命历史题材电视剧，全景展现1915-1921年新文化运动到中国共产党成立的思想启蒙历程。',
    connection: '李大钊、陈独秀等先驱播下的革命火种，经彭湃等人传递到海陆丰、播撒到苏区镇。觉醒的不仅是知识分子，更是千千万万的贫苦农民。',
    imageChar: '🌅',
    accent: '#C41E3A'
  },
]

export const RedFilmArchive: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="fixed inset-0 z-[85] pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white border-l border-[#E8DFD5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-400 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-[#E8DFD5] bg-[#FEFAF6]">
          <div className="flex items-center gap-2">
            <Film size={18} className="text-[#C41E3A]" />
            <h2 className="text-lg font-bold text-[#1A1A1A] font-serif">红色影视资料库</h2>
          </div>
          <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1">
          <div className="museum-card p-5 rounded-2xl border border-[#E8DFD5] mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Clapperboard size={24} className="text-[#C41E3A]" />
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A] font-serif">影视中的苏区记忆</h3>
                <p className="text-xs text-[#5C5C5C] mt-1">
                  收录 8 部与东江苏区、海陆丰革命及中国革命密切相关的影视作品。每部作品均附"与苏区的关联"说明。
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FILMS.map((film, i) => (
              <div
                key={i}
                className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                  expanded === i ? 'border-[#C41E3A]/40 shadow-sm' : 'border-[#E8DFD5]'
                }`}
              >
                <div
                  className="p-4 cursor-pointer hover:bg-[#FEFAF6] transition-all"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  style={{ borderLeft: `4px solid ${film.accent}` }}
                >
                  <div className="flex items-center gap-3">
                  {/* CSS 电影海报卡片 —— 替代 emoji */}
                  <div className="w-14 h-20 rounded-lg flex-shrink-0 flex flex-col items-center justify-center relative overflow-hidden" style={{ backgroundColor: `${film.accent}15`, border: `1.5px solid ${film.accent}30` }}>
                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: film.accent, opacity: 0.6 }} />
                    <span className="text-[9px] font-black font-serif tracking-widest leading-tight text-center px-1" style={{ color: film.accent }}>
                      {film.title.length > 4 ? film.title.slice(0, 4) : film.title}
                    </span>
                    <span className="text-[7px] font-mono mt-0.5" style={{ color: film.accent, opacity: 0.5 }}>{film.year}</span>
                    <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: film.accent, opacity: 0.3 }} />
                      <div className="flex items-center gap-2 mt-1">
                        {film.type === '电影' && <Tv size={10} className="text-[#C41E3A]" />}
                        {film.type === '电视剧' && <Tv size={10} className="text-[#8B6914]" />}
                        {film.type === '纪录片' && <Film size={10} className="text-[#2E7D32]" />}
                        <span className="text-[10px] text-[#5C5C5C]">{film.type}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {expanded === i && (
                  <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-xs text-[#5C5C5C] leading-relaxed mb-3">{film.description}</p>
                    <div className="p-3 rounded-lg bg-[#FDE8EC] border border-[#C41E3A]/20">
                      <div className="flex items-center gap-1 mb-1">
                        <Info size={10} className="text-[#C41E3A]" />
                        <span className="text-[10px] font-bold text-[#C41E3A]">与苏区镇的关联</span>
                      </div>
                      <p className="text-xs text-[#5C5C5C] leading-relaxed">{film.connection}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
