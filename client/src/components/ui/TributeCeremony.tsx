import React, { useState, useEffect, useCallback } from 'react'
import { X, Flower2, Clock } from 'lucide-react'

interface TributeCeremonyProps {
  onClose: () => void
}

const PARTY_OATH = `我志愿加入中国共产党，拥护党的纲领，遵守党的章程，履行党员义务，执行党的决定，严守党的纪律，保守党的秘密，对党忠诚，积极工作，为共产主义奋斗终身，随时准备为党和人民牺牲一切，永不叛党。`

const SUQU_SPIRIT = `坚定信念、求真务实、一心为民、清正廉洁、艰苦奋斗、争创一流、无私奉献`

export const TributeCeremony: React.FC<TributeCeremonyProps> = ({ onClose }) => {
  const [phase, setPhase] = useState<'oath' | 'silence' | 'done'>('oath')
  const [silenceCount, setSilenceCount] = useState(10)

  useEffect(() => {
    if (phase === 'silence') {
      if (silenceCount <= 0) {
        setPhase('done')
        return
      }
      const timer = setTimeout(() => setSilenceCount(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [phase, silenceCount])

  const handleStartSilence = useCallback(() => {
    setPhase('silence')
    setSilenceCount(10)
  }, [])

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-3xl shadow-2xl animate-in zoom-in-95 fade-in duration-500"
        style={{ backgroundColor: '#FEFAF6' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/90 border border-[#E8DFD5] text-[#5C5C5C] hover:text-[#C41E3A] hover:bg-[#FDE8EC] hover:border-[#C41E3A]/30 transition-all min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation"
          aria-label="关闭仪式"
        >
          <X size={22} />
        </button>

        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#C41E3A] via-[#8B6914] to-[#C41E3A]" />

        <div className="p-8 md:p-12 flex flex-col items-center text-center">
          {phase === 'oath' && (
            <>
              <div className="mb-8 relative">
                <div className="w-24 h-24 rounded-full bg-[#FDE8EC] flex items-center justify-center relative">
                  <Flower2 size={40} className="text-[#C41E3A]" />
                  <div className="absolute inset-0 rounded-full border-2 border-[#C41E3A]/20 animate-ping" style={{ animationDuration: '3s' }} />
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-[#C41E3A] font-serif tracking-widest mb-3">
                向苏区革命烈士敬献花篮
              </h2>
              <p className="text-[#5C5C5C] text-sm md:text-base leading-relaxed mb-8 max-w-lg">
                青山埋忠骨，鲜花寄哀思。让我们以最崇高的敬意，缅怀为中国人民解放事业英勇献身的苏区革命先烈。
              </p>

              <div className="w-full p-6 rounded-2xl bg-white border border-[#E8DFD5] mb-8">
                <h3 className="text-sm font-bold text-[#8B6914] tracking-widest mb-4 font-serif">
                  ★ 中国共产党入党誓词 ★
                </h3>
                <p className="text-[#1A1A1A] text-base md:text-lg leading-loose font-serif tracking-wide">
                  {PARTY_OATH}
                </p>
              </div>

              <button
                onClick={handleStartSilence}
                className="party-btn-primary px-8 py-3.5 min-h-[48px] rounded-xl text-base font-bold tracking-wider flex items-center gap-3 touch-manipulation"
              >
                <Clock size={20} />
                默哀致敬
              </button>
            </>
          )}

          {phase === 'silence' && (
            <>
              <div className="mb-10 relative">
                <div className="w-32 h-32 rounded-full bg-[#1A1A1A]/5 flex items-center justify-center">
                  <div className="text-6xl font-black text-[#C41E3A] font-mono">
                    {silenceCount}
                  </div>
                </div>
                <div
                  className="absolute inset-0 rounded-full border-2 border-[#C41E3A]/30 animate-ping"
                  style={{ animationDuration: '1.5s' }}
                />
                <div
                  className="absolute -inset-4 rounded-full border border-[#C41E3A]/15 animate-ping"
                  style={{ animationDuration: '2.5s' }}
                />
              </div>

              <h2 className="text-xl md:text-2xl font-black text-[#1A1A1A] font-serif tracking-widest mb-4">
                全体默哀
              </h2>
              <p className="text-[#5C5C5C] text-sm md:text-base leading-relaxed max-w-md mb-4">
                请肃立，向为中国人民解放事业和共和国建设事业英勇献身的苏区革命先烈默哀。
              </p>
              <p className="text-[#C41E3A]/60 text-xs tracking-[0.3em] font-medium">
                致敬 · 缅怀 · 奋进
              </p>
            </>
          )}

          {phase === 'done' && (
            <>
              <div className="mb-8">
                <div className="w-24 h-24 rounded-full bg-[#FDE8EC] flex items-center justify-center mx-auto">
                  <Flower2 size={40} className="text-[#C41E3A]" fill="currentColor" fillOpacity={0.2} />
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-[#C41E3A] font-serif tracking-widest mb-3">
                致敬英烈
              </h2>
              <p className="text-[#5C5C5C] text-base leading-relaxed mb-8 max-w-lg">
                花篮已敬献，默哀已完成。英雄虽已远去，精神永存人间。
              </p>

              <div className="w-full p-6 rounded-2xl bg-[#FFF8E1] border border-[#8B6914]/20 mb-8">
                <h3 className="text-sm font-bold text-[#8B6914] tracking-widest mb-3 font-serif">
                  ★ 苏区精神 ★
                </h3>
                <p className="text-[#8B6914] text-lg font-bold leading-loose font-serif tracking-widest">
                  {SUQU_SPIRIT}
                </p>
                <p className="text-[#5C5C5C]/60 text-xs mt-3">
                  习近平总书记 2011年11月4日 · 纪念中央革命根据地创建暨中华苏维埃共和国成立80周年座谈会
                </p>
              </div>

              <button
                onClick={onClose}
                className="party-btn-primary px-8 py-3.5 min-h-[48px] rounded-xl text-base font-bold tracking-wider touch-manipulation"
              >
                铭记历史 · 继续前行
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
