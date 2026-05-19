import React, { useState, useCallback } from 'react'
import { X, Star, Sparkles, Download } from 'lucide-react'

const OATH_FULL = '我志愿加入中国共产党，拥护党的纲领，遵守党的章程，履行党员义务，执行党的决定，严守党的纪律，保守党的秘密，对党忠诚，积极工作，为共产主义奋斗终身，随时准备为党和人民牺牲一切，永不叛党。'

const OATH_SEGMENTS = [
  { text: '我志愿加入中国共产党', key: 0 },
  { text: '拥护党的纲领', key: 1 },
  { text: '遵守党的章程', key: 2 },
  { text: '履行党员义务', key: 3 },
  { text: '执行党的决定', key: 4 },
  { text: '严守党的纪律', key: 5 },
  { text: '保守党的秘密', key: 6 },
  { text: '对党忠诚', key: 7 },
  { text: '积极工作', key: 8 },
  { text: '为共产主义奋斗终身', key: 9 },
  { text: '随时准备为党和人民牺牲一切', key: 10 },
  { text: '永不叛党', key: 11 },
]

export const PartyOathWall: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [completed, setCompleted] = useState<number[]>([])
  const [finished, setFinished] = useState(false)
  const [userName, setUserName] = useState('')
  const [certReady, setCertReady] = useState(false)

  const handleSegmentClick = useCallback((key: number) => {
    if (completed.includes(key)) return
    const next = [...completed, key]
    setCompleted(next)
    if (next.length === OATH_SEGMENTS.length) {
      setTimeout(() => setFinished(true), 600)
    }
  }, [completed])

  const handleGenerateCert = () => {
    setCertReady(true)
  }

  if (finished && certReady) {
    return (
      <div className="fixed inset-0 z-[86] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-[#C41E3A] p-8 text-center animate-in zoom-in-95 duration-500">
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="text-2xl font-black text-[#C41E3A] font-serif mb-2">入党誓词完整诵读</h2>
          <h3 className="text-lg font-bold text-[#1A1A1A] font-serif mb-1">宣誓证书</h3>
          <div className="w-24 h-px bg-[#C41E3A] mx-auto my-4" />
          <p className="text-sm text-[#5C5C5C] leading-relaxed mb-2 font-serif">
            兹证明 <span className="font-bold text-[#1A1A1A]">{userName || '匿名同志'}</span> 已逐句完整诵读入党誓词全文，铭记于心。
          </p>
          <div className="mt-4 p-4 rounded-xl bg-[#FDE8EC] border border-[#C41E3A]/30">
            <p className="text-xs text-[#C41E3A] leading-relaxed font-serif">{OATH_FULL}</p>
          </div>
          <p className="text-[10px] text-[#5C5C5C] mt-3">
            苏区镇数字化档案系统 · 自动生成 · {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white border border-[#E8DFD5] text-[#5C5C5C] text-sm font-medium hover:bg-[#FEFAF6] transition-all">
              完成
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="fixed inset-0 z-[86] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-[#C41E3A] p-8 text-center animate-in zoom-in-95 duration-500">
          <Sparkles className="mx-auto text-[#C41E3A] mb-4" size={48} />
          <h2 className="text-2xl font-black text-[#C41E3A] font-serif mb-3">誓言铭心</h2>
          <p className="text-sm text-[#5C5C5C] leading-relaxed mb-6 font-serif">
            您已逐句完成了入党誓词全文的诵读。每一句誓言，都是对党和人民的庄严承诺。
          </p>
          <div className="mb-4">
            <input
              type="text"
              placeholder="请留下您的姓名以生成证书"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#E8DFD5] text-sm bg-[#FEFAF6] text-[#1A1A1A] placeholder:text-[#D4C5B2] focus:border-[#C41E3A]/40 focus:outline-none text-center"
              maxLength={20}
            />
          </div>
          <button
            onClick={handleGenerateCert}
            className="px-6 py-3 rounded-xl bg-[#C41E3A] text-white font-bold shadow-lg hover:bg-[#A01830] transition-all"
          >
            <Download size={16} className="inline mr-2" />生成宣誓证书
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E8DFD5] p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-400">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center z-10" aria-label="关闭">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <Star size={36} className="text-[#C41E3A] mx-auto mb-3" />
          <h2 className="text-xl font-bold text-[#1A1A1A] font-serif">入党誓词互动墙</h2>
          <p className="text-sm text-[#5C5C5C] mt-1">逐句点击，完成入党誓词全文诵读</p>
          <div className="mt-3 text-xs text-[#C41E3A] font-medium">
            已完成 {completed.length} / {OATH_SEGMENTS.length} 句
          </div>
          <div className="w-full bg-[#FEFAF6] h-2 rounded-full mt-2 overflow-hidden border border-[#E8DFD5]">
            <div
              className="h-full bg-gradient-to-r from-[#C41E3A] to-[#8B6914] rounded-full transition-all duration-500"
              style={{ width: `${(completed.length / OATH_SEGMENTS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {OATH_SEGMENTS.map((segment) => {
            const isDone = completed.includes(segment.key)
            return (
              <button
                key={segment.key}
                onClick={() => handleSegmentClick(segment.key)}
                className={`px-4 py-3 rounded-xl border transition-all duration-300 min-w-[44px] min-h-[44px] text-sm font-medium font-serif ${
                  isDone
                    ? 'bg-[#C41E3A] text-white border-[#C41E3A] shadow-md scale-95'
                    : 'bg-white border-[#E8DFD5] text-[#5C5C5C] hover:border-[#C41E3A]/40 hover:bg-[#FEFAF6] hover:text-[#C41E3A] hover:-translate-y-0.5'
                }`}
              >
                {isDone ? '✓ ' : ''}{segment.text}
              </button>
            )
          })}
        </div>

        {completed.length > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-[#FDE8EC] border border-[#C41E3A]/20">
            <h4 className="text-sm font-bold text-[#C41E3A] mb-2 font-serif">已诵读誓言</h4>
            <p className="text-sm text-[#1A1A1A] leading-relaxed font-serif">
              {completed.map(k => OATH_SEGMENTS.find(s => s.key === k)?.text).join('，')}。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
