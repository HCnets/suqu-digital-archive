import React, { useState, useCallback, useEffect } from 'react'
import { X, Trophy, Award, Star, RotateCw, Medal } from 'lucide-react'
import { asRecordArray, asStringArray, asText, fetchPublishedContents, type PublicContentItem } from '@/lib/cmsContent'

interface Question {
  q: string
  options: string[]
  answer: number
  explanation: string
}

const LEVELS: { label: string; count: number; icon: React.ReactNode; color: string }[] = [
  { label: '红领巾', count: 5, icon: <Star size={16} />, color: 'bg-[#FDE8EC] text-[#C41E3A]' },
  { label: '共青团员', count: 10, icon: <Award size={16} />, color: 'bg-[#FFF8E1] text-[#8B6914]' },
  { label: '共产党员', count: 15, icon: <Trophy size={16} />, color: 'bg-[#FEFAF6] text-[#1A1A1A] border-[#C41E3A]' },
]

export const RedQuiz: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [level, setLevel] = useState<number | null>(null)
  const [questionBank, setQuestionBank] = useState<Question[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadQuestions() {
      setLoading(true)
      try {
        const items = await fetchPublishedContents('quiz', 200)
        const cmsQuestions = items.flatMap(contentToQuizQuestions)
        if (!cancelled) setQuestionBank(cmsQuestions)
      } catch {
        if (!cancelled) setQuestionBank([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadQuestions()
    return () => { cancelled = true }
  }, [])

  const shuffleAndPick = useCallback((n: number) => {
    const shuffled = [...questionBank].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, n)
  }, [questionBank])

  const startQuiz = (n: number) => {
    if (!questionBank.length) return
    const actualCount = Math.min(n, questionBank.length)
    setLevel(actualCount)
    const qs = shuffleAndPick(actualCount)
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
    const ratio = questions.length ? score / questions.length : 0
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
          {loading ? (
            <div className="py-10 text-center">
              <div className="w-9 h-9 rounded-full border-2 border-[#E8DFD5] border-t-[#C41E3A] animate-spin mx-auto mb-4" />
              <p className="text-sm text-[#5C5C5C]">正在读取已审核发布的党史题库</p>
            </div>
          ) : questionBank.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-[#E8DFD5] bg-[#FEFAF6] p-5 text-sm leading-relaxed text-[#5C5C5C]">
              当前暂无已审核发布的党史题库。
            </div>
          ) : (
            <>
              <p className="text-sm text-[#5C5C5C] mb-6">当前题库 {questionBank.length} 题，选择难度开始挑战</p>
              <div className="space-y-3">
                {LEVELS.map((lvl, i) => {
                  const count = Math.min(lvl.count, questionBank.length)
                  return (
                    <button
                      key={i}
                      onClick={() => startQuiz(lvl.count)}
                      className={`w-full p-4 rounded-2xl border border-[#E8DFD5] hover:border-[#C41E3A]/30 transition-all text-left flex items-center gap-3 ${lvl.color} hover:shadow-sm`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center">{lvl.icon}</div>
                      <div>
                        <div className="font-bold text-[#1A1A1A] text-sm">{lvl.label}难度</div>
                        <div className="text-xs text-[#5C5C5C]">随机抽选{count}题</div>
                      </div>
                      <div className="ml-auto text-2xl font-black text-[#C41E3A]/30">{count}</div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  const q = questions[currentQ]
  if (!q) {
    return (
      <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#E8DFD5] p-8 text-center animate-in zoom-in-95 duration-400">
          <p className="text-sm text-[#5C5C5C] mb-5">当前暂无可用题目。</p>
          <button onClick={() => setLevel(null)} className="px-6 py-3 rounded-xl bg-[#C41E3A] text-white font-medium hover:bg-[#C41E3A]/90 transition-all">
            返回题库
          </button>
        </div>
      </div>
    )
  }

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

function contentToQuizQuestions(item: PublicContentItem): Question[] {
  const data = item.data || {}
  const entries = asRecordArray(data.questions).length > 0 ? asRecordArray(data.questions) : [data]
  return entries.map(entry => {
    const q = asText(entry.q) || asText(entry.question) || asText(entry.title) || item.title
    const options = asStringArray(entry.options)
    const answer = Number(entry.answer)
    const explanation = asText(entry.explanation) || asText(entry.analysis) || item.summary || ''
    if (!q || options.length < 2 || !Number.isInteger(answer) || answer < 0 || answer >= options.length || !explanation) return null
    return { q, options, answer, explanation }
  }).filter(Boolean) as Question[]
}
