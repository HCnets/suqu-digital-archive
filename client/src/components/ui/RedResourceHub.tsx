import React, { useState } from 'react'
import { X, BookOpen, Music, ScrollText, Library, MapPin, Users, BookHeart, Camera, ChevronRight, Heart, Flower2 } from 'lucide-react'

type Tab = 'letters' | 'songs' | 'slogans' | 'decrees' | 'martyrs' | 'women' | 'origin' | 'history' | 'relics'

const TABS: { id: Tab; label: string; icon: React.ReactNode; subtitle: string }[] = [
  { id: 'letters', label: '红色家书', icon: <BookOpen size={14} />, subtitle: '烈士遗言与狱中信' },
  { id: 'songs', label: '苏区歌谣', icon: <Music size={14} />, subtitle: '革命民歌与时代回声' },
  { id: 'slogans', label: '红军标语', icon: <ScrollText size={14} />, subtitle: '土地革命文献拓片' },
  { id: 'decrees', label: '苏维埃法令', icon: <Library size={14} />, subtitle: '政权建设的珍贵文献' },
  { id: 'martyrs', label: '英烈名录', icon: <Heart size={14} />, subtitle: '苏区牺牲烈士名册' },
  { id: 'women', label: '妇女革命', icon: <Flower2 size={14} />, subtitle: '赤卫队娘子军专题' },
  { id: 'origin', label: '地名溯源', icon: <MapPin size={14} />, subtitle: '全国唯一苏区命名乡镇' },
  { id: 'history', label: '根据地史', icon: <BookHeart size={14} />, subtitle: '东江革命根据地文献' },
  { id: 'relics', label: '文物图鉴', icon: <Camera size={14} />, subtitle: '革命文物高清档案' },
]

const CONTENT: Record<Tab, { title: string; items: { title: string; subtitle: string; text: string }[] }> = {
  letters: {
    title: '红色家书 · 烈士遗言馆',
    items: [
      { title: '彭湃就义前致同志书（节录）', subtitle: '1929年8月 · 上海龙华', text: '我们在此精神很好，望你们不要挂念。同志们，要继续奋斗！我们的牺牲，是为了千千万万劳苦大众的解放。海陆丰的农民兄弟们，要坚信红旗一定会插遍全中国。' },
      { title: '钟火妹最后的口述', subtitle: '1928年3月 · 炮子村', text: '弹药箱比我命重。告诉同志们，我钟火妹没有给赤卫队丢脸。这颗子弹是留给敌人的，最后这颗是留给自己的——苏维埃万岁！' },
      { title: '李月梅未寄出的信', subtitle: '1928年5月 · 紫金狱中', text: '阿妈：当你看到这封信时，女儿可能已经不在了。敌人拷打了女儿三天三夜，女儿一个字都没有说。不是女儿不孝，是那些情报关系着几百名同志的生命。女儿是交通员，死也要守住这条线。' },
      { title: '徐向前回忆录（节录）', subtitle: '关于炮子村阻击战', text: '炮子村一役，打得极其惨烈。红四师的战士们子弹打光了就用刺刀，刺刀折断了就用石头。年仅十六岁的小战士钟火妹，运送弹药途中中弹牺牲。他是千千万万为中国革命献出生命的少年英雄之一。' },
    ]
  },
  songs: {
    title: '红色歌谣墙 · 苏区民谣集',
    items: [
      { title: '《田仔骂田公》', subtitle: '彭湃 1923年创作 · 海陆丰民歌调', text: '冬呀冬，田仔骂田公。田公着厝食白米，田仔耕田耕到死。田是公家的，他耕无道理。死是大家死，无是田仔死。你勿惊，大家团结起。联合起，你勿惊。' },
      { title: '《五一劳动节》', subtitle: '彭湃 1924年创作', text: '今日何日？五一劳动节。世界工党同盟罢工纪念日。劳动最神圣，社会革命时机熟。希望兄弟与姊妹，劳动两字永牢记。' },
      { title: '《十送红军》（东江客家话版）', subtitle: '苏区民间传唱', text: '一送红军下了山，秋风细雨缠绵绵。山上野鹿声声号，树树梧桐叶落完。问一声亲人红军啊，几时人马再回山。' },
      { title: '《苏区山歌》', subtitle: '炮子乡民间采风', text: '炮子山头红旗飘，苏区人民志气高。打倒土豪分田地，耕者有其田自豪。红军阿哥你慢走，革命成功再回头。' },
    ]
  },
  slogans: {
    title: '红军标语墙 · 数字拓片',
    items: [
      { title: '"打倒土豪劣绅，分田分地"', subtitle: '紫金县苏维埃政府旧址外墙 · 1927年', text: '此标语以朱砂红漆书写于林氏宗祠外墙石灰壁面，字体为正楷繁体。现经数字化拓片技术高清采集，尺寸约为 180×45 厘米。保护级别：省级文物保护单位附属文物。' },
      { title: '"一切权力归苏维埃"', subtitle: '炮子村农会旧址 · 1927年12月', text: '该标语是紫金县苏维埃政府成立后发布的第一批宣传口号之一。笔迹刚劲有力，据考证为当时苏维埃政府文书所题写。' },
      { title: '"红军是工人农民的军队"', subtitle: '红军亭附近民居外墙 · 1928年', text: '此标语写于红二师、红四师会师期间，旨在宣传红军性质和任务。现原迹已模糊，本次数字拓片系根据黑白照片和目击者口述还原。' },
      { title: '"耕者有其田"', subtitle: '苏区镇各村土地分配点 · 1928年', text: '这条简短的四个字，概括了中国农民两千多年的土地梦想。苏维埃政府在苏区镇辖区各村张贴此标语，配合土地分配办法执行。' },
    ]
  },
  decrees: {
    title: '苏维埃政府法令文献馆',
    items: [
      { title: '《紫金县苏维埃政府土地分配办法》', subtitle: '1927年12月颁布', text: '兹决定：没收一切地主土地，分配给无地少地农民。分配原则：以乡为单位，按人口平均分配，男女老幼一律平等。红军官兵家属分好田。特此布告。紫金县苏维埃政府执行委员会 一九二七年十二月' },
      { title: '《没收地主土地归农民》布告全文', subtitle: '紫金县苏维埃政府 1927年', text: '为布告事：照得土地乃农民之命根，地主阶级不劳而获，压迫剥削农民，天理不容。本政府代表工农利益，决定没收全县地主阶级一切土地，无偿分配给贫苦农民耕种。自布告之日起施行。此布。' },
      { title: '澎湃《海丰农民运动》（1926年出版）节选', subtitle: '中国第一部农民运动专著', text: '农民运动者应当深入农村，与农民同吃同住同劳动。只有取得农民的信任，才能了解农民的疾苦。农民要组织起来，第一步就是成立农会。农会就是农民的炮台。' },
      { title: '苏维埃政府印章（红屋实物拓印）', subtitle: '紫金县苏维埃政府执行委员会印', text: '该印章为木质圆形，直径6.8厘米，印文为"紫金县苏维埃政府执行委员会印"，篆书朱文。现存于紫金县苏区镇红屋陈列馆。这是见证紫金人民政权诞生的核心文物。' },
    ]
  },
  martyrs: {
    title: '苏区镇牺牲英烈名录墙',
    items: [
      { title: '1928年"血田"惨案', subtitle: '450+ 名烈士', text: '钟火妹（赤卫队员，16岁）、黄木生（红四师战士，19岁）、李月梅（交通员，24岁）等450余名红军指战员、苏维埃干部和革命群众在炮子村水田中被集体杀害。' },
      { title: '炮子村阻击战阵亡', subtitle: '约 200 名烈士', text: '红二师、红四师战士及苏区赤卫队员共约600人参战，据史料记载约200人在三天三夜的阻击战中英勇牺牲。' },
      { title: '历年牺牲汇总', subtitle: '1923-1949', text: '据《紫金县志》不完全统计，苏区镇（含原炮子乡）在土地革命战争、抗日战争、解放战争时期共牺牲的革命烈士超过1500人。仅1928年一年间就牺牲了1500多人。' },
      { title: '寻找先辈', subtitle: '致敬每一个名字', text: '请在名录中寻找您的家族先辈。如果您发现名录中缺少您知道的苏区烈士姓名，请联系紫金县党史研究室补充。每一个名字，都应被铭记。' },
    ]
  },
  women: {
    title: '赤卫队娘子军 · 苏区妇女革命专题',
    items: [
      { title: '苏惠：海陆丰妇女运动先驱', subtitle: '1909-1996', text: '苏惠，原名苏宝珍，广东海丰人。1925年加入中国共产党。在海陆丰农民运动和苏维埃政权建设中，她是妇女解放运动的旗手。她组织妇女纺纱队、纳鞋队支援红军，被称为"东江女将"。新中国成立后历任全国妇联执委。' },
      { title: '李月梅：红色交通员', subtitle: '1904-1928', text: '李月梅，紫金苏区人。1927年加入赤卫队，负责连接海陆丰与中央苏区的秘密交通。1928年被捕后，敌人严刑拷打三天三夜，她至死未吐露半个字。牺牲时年仅24岁。她用生命守护了交通线的安全。' },
      { title: '苏区妇女纺纱队', subtitle: '支前数据', text: '据《东江革命根据地史》记载，1927-1928年间，苏区镇及周边村庄组织了12支妇女纺纱队，共织布3000余匹、纳鞋底5000余双，全部无偿送往前线。她们说："男人们在前方打仗，我们在后方织布——都是为了一个好日子。"' },
      { title: '"送郎当红军"——群像叙事', subtitle: '苏区母亲与妻子的抉择', text: '土地革命时期，苏区镇的许多母亲和妻子含泪送别丈夫和儿子参加红军。她们知道这一别可能就是永别，但她们依然说："去吧，打完仗就回来。如果回不来……那也是光荣的。"正是这无数个家庭的牺牲，撑起了中国革命的天空。' },
    ]
  },
  origin: {
    title: '全国唯一"苏区"命名乡镇 · 地名溯源',
    items: [
      { title: '1958年：国务院批准命名"苏区乡"', subtitle: '中华人民共和国民政部批文', text: '1958年，为纪念在土地革命战争中作出巨大牺牲的紫金县炮子乡革命先烈，经广东省人民政府申请，国务院正式批准将炮子乡命名为"苏区乡"。这是中华人民共和国历史上唯一以"苏区"命名的乡镇级行政区划。后改为苏区镇，延续至今。' },
      { title: '从"炮子乡"到"苏区镇"', subtitle: '行政区划演变', text: '清代：炮子乡（属永安县）→ 民国：炮子乡（属紫金县）→ 1958年：苏区乡 → 1980年代：苏区镇。一个地名承载着一部革命史。' },
      { title: '全国唯一性考证', subtitle: '地名学视角', text: '全国其他带"红"字的地名，如"红安""红河""红原"等大都与苏维埃运动无关。唯独"苏区镇"是经国务院正式批准、直接以"苏区"命名的乡镇，在中华人民共和国行政区划中具有独特的历史地位和纪念意义。' },
      { title: '红色地名保护', subtitle: '文化遗产视角', text: '2021年，苏区镇被列入广东省红色村组织振兴试点。"苏区"这个地名受到《地名管理条例》的特别保护，任何单位不得随意更改。它是一座永不磨灭的纪念碑。' },
    ]
  },
  history: {
    title: '《东江革命根据地史》数字展阅',
    items: [
      { title: '东江革命根据地概述', subtitle: '1927-1935', text: '东江革命根据地是中国共产党在广东东部地区创建的革命根据地，包括海丰、陆丰、惠阳、紫金四县，面积约3000平方公里，人口超百万。苏区镇（原炮子乡）是其核心区域之一。' },
      { title: '红二师与红四师的汇合', subtitle: '1927年10月-1928年1月', text: '1927年10月，董朗、颜昌颐率南昌起义军余部1200余人进入海陆丰。同年12月，叶镛、徐向前率广州起义军余部1000余人也到达海陆丰。两支英雄部队在苏区镇红军亭会师，改编为中国工农革命军第二师和第四师。' },
      { title: '参考资料推荐书目', subtitle: '延伸阅读', text: '《海陆丰革命根据地史》（中共党史出版社）、《紫金县革命斗争史》（紫金县委党史研究室编）、《东江革命根据地史》（广东人民出版社）、《彭湃传》（人民出版社）、《徐向前回忆录》（解放军出版社）。' },
      { title: '红色交通线网络', subtitle: '绝密的地下动脉', text: '从苏区镇出发，红色交通线向北连接中央苏区（瑞金），向南连接香港和南洋。这些隐藏在山林间的秘密通道，承担着传递情报、护送干部、运送物资的绝密任务。交通员们以生命为代价，保障了革命的无形大动脉。' },
    ]
  },
  relics: {
    title: '革命文物高清图鉴',
    items: [
      { title: '苏维埃政府印章', subtitle: '紫金县苏维埃政府 · 红屋陈列', text: '木质圆形印章，直径6.8厘米，印文"紫金县苏维埃政府执行委员会印"，篆书朱文。这是见证1927年紫金人民政权诞生的核心文物。现藏于苏区镇红屋陈列馆。' },
      { title: '红军使用的土枪', subtitle: '自制单发步枪 · 兵工厂生产', text: '苏区兵工厂利用简陋设备制造的单发步枪，枪管为钢管改制，枪托为杂木手工打造。虽然性能远不及敌军装备，但它是苏区军民自力更生、艰苦奋斗精神的最好见证。' },
      { title: '交通站暗格', subtitle: '红色交通站机关 · 原址保留', text: '位于苏区红色交通站二楼地板下的秘密暗格，用于隐藏重要文件和电台。暗格设计巧妙，不知情者难以发现。李月梅同志就是在这里传递了最后一份情报。' },
      { title: '苏维埃布告原件', subtitle: '《没收地主土地归农民》· 1927年', text: '毛笔手书的布告原件，以毛边纸书写，字体端正规整。现存于广东省档案馆，为一级革命文物。布告内容反映了苏维埃政府土地革命的核心政策。' },
    ]
  },
}

export const RedResourceHub: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('letters')
  const data = CONTENT[activeTab]

  return (
    <div className="fixed inset-0 z-[85] pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white border-l border-[#E8DFD5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-400">
        <div className="flex items-center justify-between p-5 border-b border-[#E8DFD5] bg-[#FEFAF6]">
          <h2 className="text-lg font-bold text-[#1A1A1A] font-serif tracking-wider flex items-center gap-2">
            <span className="w-1 h-5 bg-[#C41E3A] rounded-full" />
            苏区红色资源文库
          </h2>
          <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭资源库">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="overflow-x-auto flex-shrink-0 border-b border-[#E8DFD5] bg-white">
            <div className="flex px-2 py-2 gap-0.5 min-w-max">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl min-w-[72px] transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-[#FDE8EC] text-[#C41E3A]'
                      : 'text-[#5C5C5C] hover:bg-[#FEFAF6]'
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs font-medium">
                    {tab.icon}
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </div>
                  <span className="text-[9px] opacity-50">{tab.subtitle}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-2xl font-bold text-[#1A1A1A] font-serif tracking-wide mb-1">{data.title}</h3>
            <p className="text-sm text-[#5C5C5C] mb-6">{TABS.find(t => t.id === activeTab)?.subtitle}</p>
            
            <div className="space-y-5">
              {data.items.map((item, idx) => (
                <div key={idx} className="museum-card p-5 rounded-2xl border border-[#E8DFD5] hover:border-[#C41E3A]/20 transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="w-7 h-7 rounded-lg bg-[#FDE8EC] text-[#C41E3A] flex items-center justify-center text-sm font-bold flex-shrink-0">{idx + 1}</span>
                    <div>
                      <h4 className="font-bold text-[#1A1A1A] font-serif leading-snug">{item.title}</h4>
                      <p className="text-xs text-[#C41E3A] font-medium mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#5C5C5C] leading-relaxed font-serif ml-10">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
