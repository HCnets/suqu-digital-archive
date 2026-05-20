import React, { useState, useEffect, useCallback } from 'react'
import { X, Heart, Send, MessageCircle, ScrollText, User, RefreshCw } from 'lucide-react'

interface Letter {
  author: string
  role: string
  excerpt: string
  fullText: string
  avatar: string
}

const LETTERS: Letter[] = [
  {
    author: '彭 湃',
    role: '中国农民运动领袖 · 1929年就义',
    excerpt: '冰妹：从此永别，望妹努力前进。兄谢你的爱！万望保重！余言不尽！',
    fullText: '冰妹：从此永别，望妹努力前进。兄谢你的爱！万望保重！余言不尽！你的湃。\n\n这是彭湃同志1929年8月30日于上海龙华英勇就义前给夫人许冰的最后一封信。五天前，因叛徒出卖被捕。狱中受尽酷刑，始终坚贞不屈。',
    avatar: '🌟'
  },
  {
    author: '钟火妹',
    role: '苏区镇少年英雄 · 1928年牺牲 · 年仅16岁',
    excerpt: '阿爸阿妈：我不怕。我们苏区人，从来都是站着死，不会跪着活。',
    fullText: '阿爸阿妈：我不怕。我们苏区人，从来都是站着死，不会跪着活。我不会说出苏维埃政府的去向，你们放心。来生还做你们的女儿。\n\n这是钟火妹就义前通过狱友传出的话。1928年3月，她与钟一朋等17位烈士在血田英勇牺牲。',
    avatar: '🌸'
  },
  {
    author: '李月梅',
    role: '苏区镇交通员 · 1933年牺牲',
    excerpt: '同志们：情报已经送出，我不后悔。革命成功的那天，别忘了我们。',
    fullText: '同志们：情报已经送出，我不后悔。革命成功的那天，别忘了我们。南方的映山红开了吗？我好像闻到了——那是红军的颜色。\n\n这是李月梅被俘前的最后一句话。她成功将情报送达后被捕，1933年牺牲于紫金县。',
    avatar: '🌺'
  },
  {
    author: '黄木生',
    role: '苏区赤卫队员 · 1928年牺牲',
    excerpt: '家人们：我无憾。等红旗插遍全中国，你们就知道了——我们这些人的命，没白丢。',
    fullText: '家人们：我无憾。等红旗插遍全中国，你们就知道了——我们这些人的命，没白丢。告诉孩子们，好好读书，新中国的天下要靠他们来建设。\n\n这是黄木生在炮子村阻击战最后的夜晚，托同村赤卫队员转达给家人的口信。次日，他拉响手榴弹与敌军同归于尽。',
    avatar: '🏔️'
  },
  {
    author: '钟一朋',
    role: '炮子村赤卫队副队长 · 1928年牺牲',
    excerpt: '同志们：炮子村没有叛徒。苏维埃万岁！',
    fullText: '同志们：炮子村没有叛徒。苏维埃万岁！你们不用为我报仇，你们要活着看到革命胜利的那一天。告诉我的儿女，他们的父亲是站着死的。\n\n这是钟一朋在血田就义前的最后呐喊。他与钟火妹等17位烈士一同牺牲在血田中。',
    avatar: '⚔️'
  },
]

interface Message {
  id: string
  author: string
  text: string
  time: string
  inReplyTo: string
}

const STORAGE_KEY = 'suqu_people_messages'

const loadMessages = (): Message[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

const saveMessages = (msgs: Message[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs)) } catch {}
}

export const PeopleCoCreation: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedLetter, setSelectedLetter] = useState<number>(0)
  const [userName, setUserName] = useState('')
  const [userText, setUserText] = useState('')
  const [messages, setMessages] = useState<Message[]>(loadMessages)
  const [showWall, setShowWall] = useState(false)

  useEffect(() => {
    saveMessages(messages)
  }, [messages])

  const handleSubmit = useCallback(() => {
    if (!userText.trim()) return
    const msg: Message = {
      id: Date.now().toString(36),
      author: userName.trim() || '匿名同志',
      text: userText.trim(),
      time: new Date().toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      inReplyTo: LETTERS[selectedLetter].author
    }
    setMessages(prev => [msg, ...prev])
    setUserText('')
  }, [userName, userText, selectedLetter])

  return (
    <div className="fixed inset-0 z-[85] pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white border-l border-[#E8DFD5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-400 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-[#E8DFD5] bg-[#FEFAF6]">
          <div className="flex items-center gap-2">
            <ScrollText size={18} className="text-[#C41E3A]" />
            <h2 className="text-lg font-bold text-[#1A1A1A] font-serif">红色家书 — 薪火相传</h2>
          </div>
          <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        {!showWall ? (
          <div className="p-6 flex-1">
            <div className="museum-card p-5 rounded-2xl border border-[#E8DFD5] mb-6">
              <Heart size={20} className="text-[#C41E3A] mb-3" />
              <h3 className="text-sm font-bold text-[#1A1A1A] mb-2 font-serif">续写先烈家书</h3>
              <p className="text-xs text-[#5C5C5C] leading-relaxed">
                阅读革命先烈的绝笔家书，感受他们的信念与温度。选择一封触动你的信，写下你想对先烈说的话。精选留言将展示在"薪火相传"墙上。每一次书写，都是跨越时空的对话。
              </p>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {LETTERS.map((l, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedLetter(i)}
                  className={`flex-shrink-0 p-3 rounded-xl border min-w-[120px] text-center transition-all ${
                    i === selectedLetter
                      ? 'bg-[#FDE8EC] border-[#C41E3A]/40 shadow-sm'
                      : 'bg-white border-[#E8DFD5] hover:bg-[#FEFAF6]'
                  }`}
                >
                  <div className="text-xl mb-1">{l.avatar}</div>
                  <div className="text-xs font-bold font-serif">{l.author}</div>
                </button>
              ))}
            </div>

            <div className="p-5 rounded-2xl border-2 border-[#E8DFD5] bg-[#FEFAF6] mb-6">
              <div className="text-center mb-3">
                <div className="text-3xl mb-2">{LETTERS[selectedLetter].avatar}</div>
                <h3 className="text-lg font-black font-serif text-[#C41E3A]">{LETTERS[selectedLetter].author}</h3>
                <p className="text-[10px] text-[#5C5C5C]">{LETTERS[selectedLetter].role}</p>
              </div>
              <div className="w-12 h-px bg-[#C41E3A] mx-auto my-3 opacity-30" />
              <blockquote className="text-sm text-[#1A1A1A] leading-relaxed font-serif text-center italic px-4 mb-4">
                "——{LETTERS[selectedLetter].excerpt}——"
              </blockquote>
              <p className="text-xs text-[#5C5C5C] leading-relaxed whitespace-pre-line border-t border-[#E8DFD5] pt-3 mt-3">
                {LETTERS[selectedLetter].fullText.split('\n\n')[1]}
              </p>
            </div>

            <div className="mb-3">
              <input
                type="text"
                placeholder="你的名字（选填）"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#E8DFD5] text-sm bg-white text-[#1A1A1A] placeholder:text-[#D4C5B2] focus:border-[#C41E3A]/40 focus:outline-none"
                maxLength={12}
              />
            </div>
            <div className="mb-3">
              <textarea
                placeholder={`写一封给 ${LETTERS[selectedLetter].author} 同志的回信...`}
                value={userText}
                onChange={e => setUserText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#E8DFD5] text-sm bg-white text-[#1A1A1A] placeholder:text-[#D4C5B2] focus:border-[#C41E3A]/40 focus:outline-none resize-none h-28"
                maxLength={500}
              />
              <p className="text-[10px] text-[#D4C5B2] text-right mt-1">{userText.length}/500</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!userText.trim()}
              className="w-full py-3 min-h-[44px] rounded-xl party-btn-primary disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send size={16} />
              寄出这封信
            </button>

            <div className="mt-4 text-center">
              <button
                onClick={() => setShowWall(true)}
                className="text-xs text-[#C41E3A] hover:underline flex items-center gap-1 justify-center"
              >
                <MessageCircle size={12} />
                查看薪火相传墙 ({messages.length} 封续信)
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 flex-1">
            <button
              onClick={() => setShowWall(false)}
              className="mb-4 text-xs text-[#C41E3A] hover:underline flex items-center gap-1"
            >
              ← 返回写信
            </button>

            <h3 className="text-lg font-bold font-serif text-[#1A1A1A] mb-4 flex items-center gap-2">
              <Heart size={16} className="text-[#C41E3A]" />
              薪火相传墙
            </h3>

            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📮</div>
                <p className="text-sm text-[#5C5C5C] font-serif">还未有人寄出回信</p>
                <p className="text-xs text-[#D4C5B2] mt-1">成为第一位续写家书的同志</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className="p-4 rounded-xl bg-[#FEFAF6] border border-[#E8DFD5]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-[#FDE8EC] flex items-center justify-center text-xs">
                        <User size={10} className="text-[#C41E3A]" />
                      </div>
                      <span className="font-bold text-xs text-[#1A1A1A] font-serif">{msg.author}</span>
                      <span className="text-[10px] text-[#D4C5B2]">回复 {msg.inReplyTo}</span>
                      <span className="ml-auto text-[10px] text-[#D4C5B2]">{msg.time}</span>
                    </div>
                    <p className="text-sm text-[#5C5C5C] leading-relaxed font-serif">{msg.text}</p>
                  </div>
                ))}
              </div>
            )}

            {messages.length > 0 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setMessages([])}
                  className="text-xs text-[#D4C5B2] hover:text-[#C41E3A] transition-all flex items-center gap-1 mx-auto"
                >
                  <RefreshCw size={10} />
                  清空留言（仅本地）
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
