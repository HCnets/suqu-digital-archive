import React, { useState, useRef, useEffect, useCallback } from 'react'
import { X, Play, Pause, Volume2, User, Quote } from 'lucide-react'

interface OralRecord {
  id: string
  narrator: string
  age: number
  title: string
  content: string
  date: string
  emotion: string
}

const RECORDS: OralRecord[] = [
  {
    id: '1',
    narrator: '钟庆福',
    age: 93,
    title: '炮子村阻击战亲历',
    content: '那年我才十五岁。1928年3月18日，天刚麻麻亮，国民党军队从南面打过来了。我阿爸是赤卫队长，他把我推进灶膛里说"别出来"。枪声从早响到晚，我听见阿妹钟火妹在外面喊"打倒国民党"。后来才知道，她那年只有十六岁，和钟一朋等十七位烈士一起牺牲在了血田里。四十五年过去了，每天晚上我还能听见她的声音。',
    date: '1973年口述记录',
    emotion: '深情怀念'
  },
  {
    id: '2',
    narrator: '彭桂',
    age: 88,
    title: '彭湃同志在苏区的日子',
    content: '1927年冬天，彭湃同志来到苏区镇。他穿着普通的农民衣裳，打着赤脚，和我们一样吃番薯。他教我们唱《田仔骂田公》，说"田是公家的，耕者有其田"。他办公室的煤油灯通宵亮着，都在写文件。有一次我送茶进去，他抬头对我笑了一下说"小同志，辛苦了"，那个笑容我记了一辈子。',
    date: '1968年口述记录',
    emotion: '敬仰追忆'
  },
  {
    id: '3',
    narrator: '李月梅',
    age: 91,
    title: '苏维埃政府的女交通员',
    content: '我是1928年入的交通队。我们的任务是在苏区镇和白溪乡之间送情报。情报有时候塞在竹竿里，有时候缝在鞋底。最危险的一次是过敌占区，我把情报嚼碎吞进肚子里，然后假装疯女人在田埂上唱歌，敌人真的没查我。后来同志们都说我是"疯交通"，我到现在想起来还要笑。',
    date: '1975年口述记录',
    emotion: '革命乐观'
  },
  {
    id: '4',
    narrator: '黄瑞麟',
    age: 85,
    title: '我参加了苏维埃成立大会',
    content: '1927年12月1日，苏维埃政府在红屋成立，我在台下当童子团。彭湃同志站在高台上宣布"紫金县苏维埃政府成立了"，下面几千人一起喊"苏维埃万岁"，那个声音震得瓦片都在响。我当时个子矮看不见，是阿爸把我扛在肩上看的。阿爸后来打游击牺牲在陆丰，但他说过的话我记得："仔啊，记住今天，这是穷人翻身的日子。"',
    date: '1967年口述记录',
    emotion: '激动自豪'
  },
  {
    id: '5',
    narrator: '徐向前',
    age: 0,
    title: '红四师转战东江',
    content: '广州起义失败后，我们红四师1200余人转战到东江。在海陆丰会见了彭湃，又和红二师会合。东江人民真好啊，自己吃番薯，把米留给我们。苏区镇的老乡把祠堂让出来给我们当指挥部，妇女们连夜赶制军鞋。这里的山山水水救过我们的命，我任何时候都忘不了东江苏区人民。',
    date: '徐向前元帅回忆录摘录',
    emotion: '感恩怀念'
  },
  {
    id: '6',
    narrator: '刘桂香',
    age: 90,
    title: '红军阿哥你慢走',
    content: '1930年扩红运动，我们苏区镇去了六十多个后生。我阿哥刘水生走的那天，我站在村口唱了那首苏区山歌——"红军阿哥你慢走，革命成功再回头"。他回头朝我挥了挥手，那个身影越来越小。他再也没有回来，解放后才收到烈属证。但我从不后悔送他去当红军，因为我们苏区人，从来都是站着死，不会跪着活。',
    date: '1978年口述记录',
    emotion: '坚强自豪'
  },
]

export const OralHistory: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeRecord, setActiveRecord] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const speechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const record = RECORDS[activeRecord]

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false)
      if (window.speechSynthesis) window.speechSynthesis.cancel()
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current)
    } else {
      setIsPlaying(true)
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(record.content)
        u.lang = 'zh-CN'
        u.rate = 0.8
        u.onend = () => setIsPlaying(false)
        window.speechSynthesis.speak(u)
      }
    }
  }, [isPlaying, record.content])

  const handleSelectRecord = useCallback((idx: number) => {
    setIsPlaying(false)
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setActiveRecord(idx)
  }, [])

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel()
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[85] pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white border-l border-[#E8DFD5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-400 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-[#E8DFD5] bg-[#FEFAF6]">
          <div className="flex items-center gap-2">
            <Volume2 size={18} className="text-[#C41E3A]" />
            <h2 className="text-lg font-bold text-[#1A1A1A] font-serif">红色口述历史录音室</h2>
          </div>
          <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1">
          <div className="museum-card p-5 rounded-2xl border border-[#E8DFD5] mb-6">
            <Quote size={24} className="text-[#C41E3A] mb-3 opacity-50" />
            
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#FDE8EC] flex items-center justify-center">
                <User size={18} className="text-[#C41E3A]" />
              </div>
              <div>
                <h3 className="font-bold text-[#1A1A1A] text-sm font-serif">{record.narrator}</h3>
                {record.age > 0 && <p className="text-xs text-[#5C5C5C]">{record.age}岁 · {record.date}</p>}
                {record.age === 0 && <p className="text-xs text-[#5C5C5C]">{record.date}</p>}
              </div>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#FDE8EC] text-[#C41E3A] font-medium">{record.emotion}</span>
            </div>
            
            <h4 className="text-base font-bold text-[#1A1A1A] mb-3 font-serif">{record.title}</h4>
            
            <p className="text-sm text-[#5C5C5C] leading-relaxed font-serif whitespace-pre-line">
              {record.content}
            </p>

            <button
              onClick={handlePlay}
              className="mt-4 flex items-center gap-2 px-5 py-3 rounded-xl party-btn-primary"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? '暂停倾听' : '聆听口述'}
            </button>
          </div>

          <h4 className="text-sm font-bold text-[#1A1A1A] mb-3 font-serif">更多口述记录</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {RECORDS.map((r, i) => (
              <button
                key={r.id}
                onClick={() => handleSelectRecord(i)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  i === activeRecord
                    ? 'bg-[#FDE8EC] border-[#C41E3A]/40 shadow-sm'
                    : 'bg-white border-[#E8DFD5] hover:bg-[#FEFAF6] hover:border-[#C41E3A]/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User size={12} className={i === activeRecord ? 'text-[#C41E3A]' : 'text-[#5C5C5C]'} />
                  <span className={`text-xs font-bold font-serif ${i === activeRecord ? 'text-[#C41E3A]' : 'text-[#1A1A1A]'}`}>{r.narrator}</span>
                </div>
                <p className="text-xs text-[#5C5C5C] mt-1 line-clamp-2">{r.title}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
