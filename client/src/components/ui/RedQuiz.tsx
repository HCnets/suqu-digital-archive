import React, { useState, useCallback } from 'react'
import { X, Trophy, Award, Star, RotateCw, Medal } from 'lucide-react'

interface Question {
  q: string
  options: string[]
  answer: number
  explanation: string
}

const QUESTIONS: Question[] = [
  { q: '紫金县苏维埃政府成立于哪一年？', options: ['1925年', '1926年', '1927年', '1928年'], answer: 2, explanation: '1927年12月，在彭湃同志直接指导下，紫金县工农兵代表大会在苏区镇林氏宗祠召开，宣告紫金县苏维埃政府成立。' },
  { q: '"血田"遗址得名的原因是？', options: ['当地盛产红花', '土地富含铁质', '450多名烈士鲜血染红水田', '原名就叫血田'], answer: 2, explanation: '1928年春，450多名红军指战员、苏维埃干部和革命群众在炮子村水田中被集体杀害，鲜血染红了整片稻田，经久不褪。' },
  { q: '苏区镇是全国唯一以什么命名的乡镇？', options: ['"红军"', '"苏区"', '"革命"', '"红色"'], answer: 1, explanation: '1958年国务院批准将炮子乡命名为"苏区乡"，这是全国唯一以"苏区"命名的乡镇级行政区划。' },
  { q: '苏区精神的28字表述是什么？（习近平同志2011年提出）', options: ['坚定信念、求真务实、一心为民、清正廉洁、艰苦奋斗、争创一流、无私奉献', '勤劳勇敢、自强不息、团结奋斗、艰苦朴素', '不忘初心、牢记使命、奋发有为、砥砺前行', '爱国敬业、诚信友善、自由平等、公正法治'], answer: 0, explanation: '这28字是习近平总书记关于苏区精神的完整阐述。' },
  { q: '钟火妹牺牲时年仅多少岁？', options: ['14岁', '16岁', '18岁', '20岁'], answer: 1, explanation: '年仅16岁的红军小战士钟火妹在炮子村阻击战中运送弹药途中中弹牺牲，牺牲时双手仍紧紧抱着弹药箱。' },
  { q: '紫金县总农会成立于哪一年？', options: ['1921年', '1922年', '1923年', '1924年'], answer: 2, explanation: '1923年春，紫金县总农会在炮子乡正式成立，成为东江地区继海丰之后第二个县级农会组织。' },
  { q: '南昌起义和广州起义部队在哪会师？', options: ['红屋', '血田', '红军亭', '纪念碑'], answer: 2, explanation: '南昌起义军余部（董朗、颜昌颐率领）和广州起义军余部（叶镛、徐向前率领）在苏区镇红军亭历史性会师。' },
  { q: '交通员李月梅因为什么被捕？', options: ['战斗中负伤被俘', '执行情报传递任务', '叛徒出卖', '主动暴露掩护战友'], answer: 1, explanation: '李月梅在执行绝密交通任务途中被捕，敌人严刑拷打三天三夜，她至死没有吐露半个字。' },
  { q: '炮子村阻击战持续了多久？', options: ['一天一夜', '两天两夜', '三天三夜', '五天五夜'], answer: 2, explanation: '红二师、红四师与苏区赤卫队共约600人在炮子村外围山头构筑防线，与数倍于己的敌军展开了三天三夜的殊死阻击。' },
  { q: '"奋斗"这个词在党的哪份文件中出现最多？', options: ['党章', '入党誓词', '党的二十大报告', '苏区时期的政府公报'], answer: 2, explanation: '党的二十大报告全文"奋斗"一词出现了28次。而苏区镇的历史，就是一部用生命书写的"奋斗"史诗。' },
  { q: '1928年一年间苏区有多少群众和指战员献出生命？', options: ['约500人', '约1000人', '约1500人', '约3000人'], answer: 2, explanation: '据《紫金县志》记载，仅1928年一年间，苏区就有1500多名革命群众和红军指战员献出了宝贵生命。' },
  { q: '"江山就是人民，人民就是江山"出自？', options: ['毛泽东《为人民服务》', '习近平在庆祝中国共产党成立100周年大会上讲话', '邓小平南方谈话', '江泽民"三个代表"'], answer: 1, explanation: '2021年7月1日，习近平总书记在庆祝中国共产党成立100周年大会上庄严宣告。' },
  { q: '彭湃创作的农民运动歌谣叫什么？', options: ['十送红军', '田仔骂田公', '映山红', '南泥湾'], answer: 1, explanation: '1923年彭湃创作了《田仔骂田公》，这是中国最早用当地方言创作的农民运动革命歌谣之一。' },
  { q: '黄木生烈士是怎么牺牲的？', options: ['病逝', '中弹牺牲', '拉响手榴弹与敌同归于尽', '在狱中被杀害'], answer: 2, explanation: '赤卫队员黄木生在弹药耗尽后，拉响最后一颗手榴弹与敌人同归于尽。' },
  { q: '苏区镇在哪个省？', options: ['江西', '福建', '广东', '湖南'], answer: 2, explanation: '苏区镇位于广东省河源市紫金县，地处东江流域，是海陆惠紫革命根据地的重要组成部分。' },
  { q: '东江革命根据地包括哪四县？', options: ['海丰、陆丰、紫金、惠阳', '梅县、兴宁、五华、丰顺', '潮安、揭阳、普宁、惠来', '宝安、东莞、中山、南海'], answer: 0, explanation: '东江革命根据地包括海丰、陆丰、紫金、惠阳四县，面积约3000平方公里，人口超百万。' },
  { q: '红二师师长是谁？', options: ['叶镛', '董朗', '徐向前', '彭湃'], answer: 1, explanation: '南昌起义军余部进入海陆丰后改编为红二师，黄埔一期生董朗任师长，颜昌颐任党代表。' },
  { q: '"苏维埃"一词是什么意思？', options: ['俄语"革命"音译', '俄语"代表会议"音译', '德语"工人"音译', '法语"公社"音译'], answer: 1, explanation: '"苏维埃"是俄语Совет的音译，意为"代表会议"或"委员会"，是俄国1905年革命中工人创建的政权组织形式。' },
  { q: '红四师参谋长是谁？后来成为共和国元帅？', options: ['叶剑英', '徐向前', '聂荣臻', '陈毅'], answer: 1, explanation: '黄埔一期生徐向前参加广州起义后任红四师参谋长，转战东江。后成为中华人民共和国十大元帅之一。' },
  { q: '苏区红色交通站的主要任务不包括？', options: ['传递情报', '护送干部', '运送武器', '对外宣传统战'], answer: 3, explanation: '红色交通站负责传递情报、护送干部、运送物资武器等绝密任务，不承担对外宣传职能。' },
  { q: '钟庆福在血田遗址义务讲解了多久？', options: ['20年', '30年', '40年', '50余年'], answer: 3, explanation: '钟庆福是钟火妹的哥哥，目睹亲人牺牲后，在血田遗址旁义务讲解苏区历史长达50余年。' },
  { q: '苏区兵工厂主要使用什么材料制造武器？', options: ['进口钢材', '缴获的敌军武器改装', '废铁熔炼+土硝火药', '木制仿制'], answer: 2, explanation: '面对敌人严密封锁，苏区兵工厂收集废铁熔炼、用土硝硫磺木炭配制火药，自力更生制造土枪大刀。' },
  { q: '列宁小学第一课教的是什么？', options: ['共产党', '苏维埃', '毛主席', '红军'], answer: 1, explanation: '据苏区教育委员曾石泉口述，列宁小学第一课教的就是"苏维埃"三个字。' },
  { q: '"炮子乡"什么时候改名为"苏区乡"？', options: ['1949年', '1958年', '1966年', '1978年'], answer: 1, explanation: '1958年，经国务院批准，炮子乡正式命名为"苏区乡"，成为全国唯一以"苏区"命名的乡镇。' },
  { q: '海陆惠紫苏区大约有多少人口？', options: ['约50万', '超100万', '约200万', '约500万'], answer: 1, explanation: '海陆惠紫四县连片苏区面积约3000平方公里，人口超百万，是当时全国重要的革命根据地之一。' },
  { q: '彭湃被毛泽东称为什么？', options: ['"工人运动先驱"', '"农民运动大王"', '"红军之父"', '"革命圣人"'], answer: 1, explanation: '毛泽东称彭湃为"农民运动大王"，他是中国共产党早期农民运动的杰出领袖。' },
  { q: '紫金县苏维埃政府的印章是什么材质的？', options: ['铜质', '石质', '木质', '玉质'], answer: 2, explanation: '据文物图鉴记载，紫金县苏维埃政府印章为木质圆形，直径6.8厘米，篆书朱文，现藏于红屋陈列馆。' },
  { q: '长征途中红军翻越了多少座大山？', options: ['10座', '15座', '18座', '25座'], answer: 2, explanation: '据史料记载，红军长征翻越了18座大山，渡过了24条大河，行程约二万五千里。' },
  { q: '遵义会议确立了谁的领导地位？', options: ['周恩来', '朱德', '毛泽东', '张闻天'], answer: 2, explanation: '1935年1月遵义会议确立了毛泽东在红军和党中央的领导地位，这是党的历史上生死攸关的转折点。' },
  { q: '以下哪个不是苏区镇的红色遗址？', options: ['红屋', '红军亭', '黄埔军校旧址', '血田遗址'], answer: 2, explanation: '黄埔军校旧址位于广州，不在苏区镇。苏区镇拥有红屋、血田、红军亭、纪念碑等16处红色遗址。' },
]

const LEVELS: { label: string; count: number; icon: React.ReactNode; color: string }[] = [
  { label: '红领巾', count: 5, icon: <Star size={16} />, color: 'bg-[#FDE8EC] text-[#C41E3A]' },
  { label: '共青团员', count: 10, icon: <Award size={16} />, color: 'bg-[#FFF8E1] text-[#8B6914]' },
  { label: '共产党员', count: 15, icon: <Trophy size={16} />, color: 'bg-[#FEFAF6] text-[#1A1A1A] border-[#C41E3A]' },
]

export const RedQuiz: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [level, setLevel] = useState<number | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [finished, setFinished] = useState(false)

  const shuffleAndPick = useCallback((n: number) => {
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, n)
  }, [])

  const startQuiz = (n: number) => {
    setLevel(n)
    const qs = shuffleAndPick(n)
    setQuestions(qs)
    setCurrentQ(0)
    setScore(0)
    setSelected(null)
    setShowResult(false)
    setFinished(false)
  }

  const handleSelect = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    setShowResult(true)
    if (idx === questions[currentQ].answer) {
      setScore(s => s + 1)
    }
  }

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      setFinished(true)
      return
    }
    setCurrentQ(c => c + 1)
    setSelected(null)
    setShowResult(false)
  }

  const getMedalEmoji = () => {
    const ratio = score / questions.length
    if (ratio >= 0.9) return '🥇'
    if (ratio >= 0.7) return '🥈'
    if (ratio >= 0.5) return '🥉'
    return '🌱'
  }

  if (finished) {
    const ratio = score / questions.length
    return (
      <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8DFD5] p-8 text-center animate-in zoom-in-95 duration-400">
          <div className="text-6xl mb-4">{getMedalEmoji()}</div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] font-serif mb-2">答题完成</h2>
          <div className="text-5xl font-black text-[#C41E3A] font-serif mb-1">{score}/{questions.length}</div>
          <p className="text-sm text-[#5C5C5C] mb-2">
            {ratio >= 0.9 ? '优秀！您对苏区革命历史非常了解！' :
             ratio >= 0.7 ? '良好！继续学习，争做红色传人！' :
             ratio >= 0.5 ? '及格了，但还有很多要学哦！' :
             '学无止境，欢迎再次挑战！'}
          </p>
          <div className="flex items-center justify-center gap-1 mb-6">
            {questions.map((_, i) => (
              <Medal key={i} size={16} className={i < score ? 'text-[#C41E3A]' : 'text-[#E8DFD5]'} />
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => startQuiz(level!)} className="px-6 py-3 rounded-xl bg-[#FDE8EC] text-[#C41E3A] font-medium hover:bg-[#FDE8EC]/80 transition-all flex items-center gap-2">
              <RotateCw size={16} /> 再考一次
            </button>
            <button onClick={onClose} className="px-6 py-3 rounded-xl bg-white border border-[#E8DFD5] text-[#5C5C5C] font-medium hover:bg-[#FEFAF6] transition-all">关闭</button>
          </div>
        </div>
      </div>
    )
  }

  if (level === null) {
    return (
      <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#E8DFD5] p-8 animate-in zoom-in-95 duration-400">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭">
            <X size={20} />
          </button>
          <h2 className="text-xl font-bold text-[#1A1A1A] font-serif mb-1">党史知识闯关答题</h2>
          <p className="text-sm text-[#5C5C5C] mb-6">选择难度开始挑战</p>
          <div className="space-y-3">
            {LEVELS.map((lvl, i) => (
              <button
                key={i}
                onClick={() => startQuiz(lvl.count)}
                className={`w-full p-4 rounded-2xl border border-[#E8DFD5] hover:border-[#C41E3A]/30 transition-all text-left flex items-center gap-3 ${lvl.color} hover:shadow-sm`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center">{lvl.icon}</div>
                <div>
                  <div className="font-bold text-[#1A1A1A] text-sm">{lvl.label}难度</div>
                  <div className="text-xs text-[#5C5C5C]">随机抽选{lvl.count}题</div>
                </div>
                <div className="ml-auto text-2xl font-black text-[#C41E3A]/30">{lvl.count}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const q = questions[currentQ]

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E8DFD5] p-6 animate-in slide-in-from-bottom-8 duration-400">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-[#C41E3A] font-serif">第 {currentQ + 1}/{questions.length} 题</span>
          <span className="text-sm text-[#5C5C5C]">得分: {score}</span>
          <button onClick={onClose} className="p-1.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="退出答题">
            <X size={18} />
          </button>
        </div>
        <div className="w-full bg-[#FEFAF6] h-1.5 rounded-full mb-6">
          <div className="h-full bg-[#C41E3A] rounded-full transition-all duration-300" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
        </div>
        <h3 className="text-lg font-bold text-[#1A1A1A] font-serif mb-5 leading-relaxed">{q.q}</h3>
        <div className="space-y-2.5">
          {q.options.map((opt, idx) => {
            const isCorrect = idx === q.answer
            const isWrong = selected === idx && idx !== q.answer
            let className = 'w-full p-3.5 rounded-xl border text-left text-sm font-medium transition-all '
            if (!showResult) {
              className += 'border-[#E8DFD5] hover:border-[#C41E3A]/30 hover:bg-[#FEFAF6] bg-white'
            } else if (isCorrect) {
              className += 'bg-green-50 border-green-300 text-green-800'
            } else if (isWrong) {
              className += 'bg-red-50 border-red-300 text-red-800'
            } else {
              className += 'border-[#E8DFD5] bg-white opacity-50'
            }
            return (
              <button key={idx} onClick={() => handleSelect(idx)} className={className} disabled={showResult}>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FEFAF6] text-xs font-bold mr-2">{'ABCD'[idx]}</span>
                {opt}
              </button>
            )
          })}
        </div>
        {showResult && (
          <div className="mt-4 p-4 rounded-xl bg-[#FFF8E1] border border-[#8B6914]/20">
            <p className="text-sm text-[#5C5C5C] leading-relaxed">{questions[currentQ].explanation}</p>
          </div>
        )}
        {showResult && (
          <button onClick={handleNext} className="w-full mt-4 py-3 rounded-xl bg-[#C41E3A] text-white font-medium hover:bg-[#C41E3A]/90 transition-all">
            {currentQ + 1 >= questions.length ? '查看成绩' : '下一题'}
          </button>
        )}
      </div>
    </div>
  )
}
