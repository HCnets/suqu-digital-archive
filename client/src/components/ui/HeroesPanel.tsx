import React from 'react'
import { X, Star, Shield, BookOpen, Heart } from 'lucide-react'

interface Hero {
  name: string
  role: string
  years: string
  category: 'leader' | 'soldier' | 'civilian'
  story: string
  legacy: string
}

const HEROES: Hero[] = [
  {
    name: '彭湃',
    role: '海陆丰农民运动领袖',
    years: '1896 — 1929',
    category: 'leader',
    story: '中国共产党早期农民运动领袖，海陆丰革命根据地主要创始人。1927年创建中国第一个苏维埃政权——海丰县苏维埃政府。亲自指导紫金县工农武装暴动，为紫金苏维埃政权的建立奠定了组织基础和思想基础。毛泽东称他为"农民运动大王"。',
    legacy: '他用一生诠释了"为农民而生，为革命而死"。农运星火，燃遍海陆丰。'
  },
  {
    name: '刘琴西',
    role: '紫金县苏维埃政府主席',
    years: '1902 — 1934',
    category: 'leader',
    story: '紫金县炮子乡人，紫金早期党组织的核心成员。1927年12月参与领导紫金工农武装暴动，当选紫金县苏维埃政府第一任主席。带领苏区人民打土豪、分田地、建武装，把炮子乡建成东江苏区的坚强堡垒。1934年在汕头被捕，英勇就义。',
    legacy: '他是全国唯一以"苏区"命名的土地上的第一代建设者，用生命保卫了人民政权。'
  },
  {
    name: '叶镛',
    role: '广州起义军余部将领',
    years: '1899 — 1928',
    category: 'soldier',
    story: '黄埔军校第四期毕业生，参加广州起义。起义失败后率余部突围，编入红四师，与徐向前等将领转战海陆丰、紫金一带。1928年春在炮子村阻击战中身负重伤，被俘后壮烈牺牲，时年29岁。',
    legacy: '从黄埔军校到苏区战场，他用短暂而光辉的一生走了一条"武装保卫苏维埃"的革命道路。'
  },
  {
    name: '徐向前',
    role: '红四师参谋长',
    years: '1901 — 1990',
    category: 'leader',
    story: '黄埔军校一期毕业生，参加广州起义后任红四师参谋长，率部转战海陆惠紫苏区。在苏区镇的红军亭与南昌起义军余部会师。后成为中华人民共和国十大元帅之一，历任国防部长等职。',
    legacy: '从苏区镇出发的革命足迹，最终走向共和国的将帅之路。他是东江苏区走出去的最耀眼将星。'
  },
  {
    name: '钟火妹',
    role: '红军小战士',
    years: '1912 — 1928',
    category: 'soldier',
    story: '苏区镇炮子村人，年仅16岁参加红军赤卫队。1928年3月炮子村阻击战中，她在敌军炮火下往返阵地运送弹药。最后一次运送途中不幸中弹，牺牲时双手仍紧紧抱着弹药箱。她的事迹在苏区代代传颂，被誉为"苏区的刘胡兰"。',
    legacy: '十六岁的青春，定格成炮子山上最年轻的不朽丰碑。她用双手托起的是弹药的重量，更是信仰的分量。'
  },
  {
    name: '黄木生',
    role: '苏区赤卫队员',
    years: '1890 — 1928',
    category: 'soldier',
    story: '炮子村农民出身，苏区赤卫队骨干队员。1928年3月，在阻击战中弹药耗尽、身陷重围的绝境下，他毅然拉响最后一颗手榴弹，与数名敌军同归于尽，为战友转移争取了宝贵时间。他用生命践行了"宁死不屈"的革命气节。',
    legacy: '在最后的时刻，他没有选择投降，也没有选择自殉，而是选择了与敌人同归于尽——这是最极致的勇敢。'
  },
  {
    name: '李月梅',
    role: '红色交通站交通员',
    years: '1905 — 1933',
    category: 'civilian',
    story: '苏区镇炮子村妇女，1929年加入红色交通站。她以贩卖山货为掩护，多次往返于紫金、梅州、汕头之间传递情报和护送干部。1933年春在执行任务途中被捕，敌人施以酷刑逼问交通站机密，她严守党的秘密直至牺牲，至死未吐露半个字。',
    legacy: '隐蔽战线的无名英雄，她用沉默回答了敌人的一切拷问，用生命守护了革命的火种。'
  },
  {
    name: '张木桂',
    role: '炮子村赤卫队队长',
    years: '1895 — 1928',
    category: 'soldier',
    story: '炮子村贫苦农民出身，1927年加入中国共产党，担任炮子村赤卫队队长。血田惨案发生时，他已被捕，敌人要他指认苏维埃干部，他怒目而斥："要杀便杀！"与450余名红军战士和群众一同倒在血田中。',
    legacy: '在生与死的抉择之间，他选择的是尊严和信仰。血田无声，精神永存。'
  },
  {
    name: '魏荫亭',
    role: '海陆惠紫特委委员',
    years: '1893 — 1930',
    category: 'leader',
    story: '海陆惠紫革命根据地核心领导人之一。1928年在国民党重兵围剿下，他与彭湃等带领红军和苏维埃干部转入山区坚持斗争。曾多次深入苏区镇指导群众路线工作，提出"革命的胜利在于相信群众、依靠群众"。',
    legacy: '他提出的"相信群众、依靠群众"至今仍是苏区镇党建工作的灵魂。群众路线从苏区走来，从未远去。'
  },
  {
    name: '苏惠',
    role: '海陆丰妇女运动先驱',
    years: '1906 — 1995',
    category: 'leader',
    story: '海丰县人，广东省第一位女共产党员之一。1927年随彭湃到紫金苏区开展妇女解放运动，组织苏区妇女纺纱织布支援前线、救护伤员、传递情报。建国后历任全国妇联执委、广东省妇联主任等职，是海陆惠紫地区妇女革命的一面旗帜。',
    legacy: '她证明了：革命不是男人的专利，苏区妇女同样是那段烽火岁月的主角。'
  },
  {
    name: '董朗',
    role: '红二师师长 · 南昌起义将领',
    years: '1894 — 1932',
    category: 'leader',
    story: '黄埔军校第一期毕业生，参加南昌起义。起义失败后率余部1200余人转战海陆丰，与彭湃会合，部队改编为红二师并任师长。率部在苏区镇一带开展游击战，为东江革命根据地的创建作出卓越贡献。1932年在湘鄂西牺牲。',
    legacy: '从黄埔到南昌，从海陆丰到湘鄂西——他走了一条自始至终的革命军人之路。'
  },
  {
    name: '颜昌颐',
    role: '红二师党代表',
    years: '1900 — 1929',
    category: 'leader',
    story: '湖南安乡人，1921年加入中国共产党。南昌起义后与董朗率余部进入海陆丰，任红二师党代表兼中共东江特委军委主任。在苏区镇整顿部队、发展党组织，为苏维埃政权提供军事保障。1929年因叛徒出卖在上海被捕就义。',
    legacy: '从湘江到东江，他的生命轨迹画出了一条贯穿南北的革命弧线。'
  },
  {
    name: '刘琴西',
    role: '紫金县苏维埃政府主席',
    years: '1902 — 1934',
    category: 'leader',
    story: '紫金县炮子乡人，紫金早期党组织的核心成员。1927年12月参与领导紫金工农武装暴动，当选紫金县苏维埃政府第一任主席。带领苏区人民打土豪、分田地、建武装，把炮子乡建成东江苏区的坚强堡垒。1934年在汕头被捕，英勇就义。',
    legacy: '他是全国唯一以"苏区"命名的土地上的第一代建设者，用生命保卫了人民政权。'
  },
  {
    name: '赖松柏',
    role: '紫金农军总指挥',
    years: '1901 — 1930',
    category: 'leader',
    story: '紫金县九和镇人，1924年加入中国共产党。1927年率领紫金农军参加武装暴动，担任农军总指挥。在他的指挥下，农军攻克紫金县城，建立了广东最早的县级红色政权之一。后在九龙峰战斗中英勇牺牲。',
    legacy: '以农军之躯对抗正规军，他证明了"民心即军心"的真理。'
  },
  {
    name: '李素娇',
    role: '苏区妇女纺纱队长',
    years: '1908 — 1998',
    category: 'civilian',
    story: '紫金苏区镇人，1930年参加革命。她组织了苏区镇第一支妇女纺纱队，带领12名妇女在极端困难条件下为红军纺纱织布。抗战期间，她掩护东江纵队伤员在自己家中养伤。建国后她坚持在苏区义务讲解红色历史40余年，被群众称为"苏区活历史"。',
    legacy: '她没有上过战场，但她的织布机就是她的阵地，她织的每一尺布都裹着红军战士的伤口。'
  },
  {
    name: '钟一朋',
    role: '炮子村赤卫队副队长',
    years: '1898 — 1928',
    category: 'soldier',
    story: '紫金苏区镇炮子村人。1928年3月血田惨案中，他与钟火妹等17位烈士一同被俘。敌人要他指认同村的苏维埃干部，他怒斥道："要杀便杀，炮子村没有叛徒！"随即高呼"苏维埃万岁"慷慨就义。',
    legacy: '在最后的时刻，他喊出了苏区人最响亮的回答：宁死不屈，苏维埃万岁。'
  },
  {
    name: '钟庆福',
    role: '苏区镇义务讲解员',
    years: '1913 — 2008',
    category: 'civilian',
    story: '炮子村人，1928年炮子村阻击战时年仅15岁。目睹了父亲钟一朋和妹妹钟火妹等17位亲人在血田英勇就义。新中国成立后，他在血田遗址旁义务讲解苏区历史长达50余年，被称为"苏区活的纪念碑"。',
    legacy: '他不是在讲述历史，他就是在历史中活着的人。50年如一日的义务讲解，让英雄的故事从未被遗忘。'
  },
]

const CATEGORY_CONFIG: Record<string, { label: string, color: string, bg: string, icon: React.FC<{ size?: number }> }> = {
  leader: { label: '革命领袖', color: '#C41E3A', bg: '#FDE8EC', icon: Star },
  soldier: { label: '红军战士', color: '#8B6914', bg: '#FFF8E1', icon: Shield },
  civilian: { label: '人民群众', color: '#2E7D32', bg: '#E8F5E9', icon: Heart }
}

interface HeroesPanelProps {
  onClose: () => void
}

export const HeroesPanel: React.FC<HeroesPanelProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl animate-in zoom-in-95 fade-in duration-400"
        style={{ backgroundColor: '#FEFAF6' }}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 p-2.5 rounded-full bg-white/95 border border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:bg-[#FDE8EC] hover:border-[#C41E3A]/30 transition-all min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation"
          aria-label="关闭英雄谱"
        >
          <X size={22} />
        </button>

        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#C41E3A] via-[#8B6914] to-[#C41E3A]" />

        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-px" style={{ backgroundColor: '#C41E3A', opacity: 0.3 }} />
              <span className="text-3xl">★</span>
              <div className="w-12 h-px" style={{ backgroundColor: '#C41E3A', opacity: 0.3 }} />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-[#C41E3A] font-serif tracking-widest">
              革命先驱 · 英雄谱
            </h2>
            <p className="text-sm text-[#5C5C5C] mt-2 tracking-wider">
              那些镌刻在苏区大地上的名字
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {HEROES.map((hero) => {
              const catConfig = CATEGORY_CONFIG[hero.category]
              const CatIcon = catConfig.icon
              return (
                <div
                  key={hero.name}
                  className="relative p-5 rounded-2xl border transition-all duration-200 hover:shadow-md group"
                  style={{ backgroundColor: catConfig.bg, borderColor: `${catConfig.color}15` }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${catConfig.color}15` }}
                    >
                      <CatIcon size={20} style={{ color: catConfig.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-[#1A1A1A] font-serif tracking-wide">
                          {hero.name}
                        </h3>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium tracking-wider"
                          style={{ color: catConfig.color, backgroundColor: `${catConfig.color}10` }}
                        >
                          {catConfig.label}
                        </span>
                      </div>
                      <p className="text-xs font-medium mt-0.5" style={{ color: catConfig.color }}>
                        {hero.role}
                      </p>
                      <p className="text-xs text-[#5C5C5C]/60 mt-0.5">
                        {hero.years}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-[#1A1A1A] leading-relaxed font-serif">
                    {hero.story}
                  </p>

                  <div className="mt-3 pt-3 border-t" style={{ borderColor: `${catConfig.color}15` }}>
                    <p className="text-xs italic leading-relaxed" style={{ color: catConfig.color }}>
                      <BookOpen size={11} className="inline mr-1" style={{ color: catConfig.color, opacity: 0.5 }} />
                      {hero.legacy}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
