import React, { useState, useRef, useCallback, useEffect } from 'react'
import { X, Play, Pause, SkipBack, SkipForward, Volume2, Music, ChevronDown } from 'lucide-react'

interface Song {
  title: string
  source: string
  lyrics: string[]
  year: string
}

const SONGS: Song[] = [
  {
    title: '十送红军',
    source: '东江客家话版',
    year: '1934',
    lyrics: [
      '一送红军下了山，秋风细雨缠绵绵',
      '山上野鹿声声号，树树梧桐叶落完',
      '问一声亲人红军啊，几时人马再回山',
      '三送红军到拿山，山上包谷金灿灿',
      '包谷种子红军种，包谷棒棒穷人搬',
      '紧紧拉着红军手，红军啊撒下种子红了天',
      '五送红军过了坡，鸿雁阵阵空中过',
      '鸿雁能够捎书信，鸿雁啊飞到天涯海角',
      '千言万语嘱咐红军啊，捎信多把革命说',
      '十送红军转回来，武陵山巅搭高台',
      '台高十丈白玉柱，雕龙绣凤放光彩',
      '红军啊这台名叫望红台'
    ]
  },
  {
    title: '映山红',
    source: '电影《闪闪的红星》插曲',
    year: '1974',
    lyrics: [
      '夜半三更哟盼天明，寒冬腊月哟盼春风',
      '若要盼得哟红军来，岭上开遍哟映山红',
      '若要盼得哟红军来，岭上开遍哟映山红',
      '岭上开遍哟映山红，岭上开遍哟映山红',
      '映山红哟映山红，英雄儿女哟血染成',
      '火映红星哟星更亮，血洒红旗哟旗更红',
      '高举红旗哟朝前迈，革命鲜花哟代代红'
    ]
  },
  {
    title: '八月桂花遍地开',
    source: '鄂豫皖苏区民歌',
    year: '1929',
    lyrics: [
      '八月桂花遍地开，鲜红的旗帜竖呀竖起来',
      '张灯又结彩呀，张灯又结彩呀',
      '光辉灿烂闪出新世界',
      '红军队伍真威风，百战百胜最英勇',
      '活捉张辉瓒呀，活捉张辉瓒呀',
      '打垮了反动派的气焰',
      '一杆红旗飘在空中，红军队伍要扩充',
      '保卫工农新政权，带领群众闹革命',
      '红色战士最光荣'
    ]
  },
  {
    title: '田仔骂田公',
    source: '彭湃 1923年创作 · 海陆丰民歌调',
    year: '1923',
    lyrics: [
      '冬呀冬，田仔骂田公',
      '田公着厝食白米，田仔耕田耕到死',
      '田是公家的，他耕无道理',
      '死是大家死，无是田仔死',
      '你勿惊，大家团结起',
      '联合起，你勿惊'
    ]
  },
  {
    title: '苏区山歌',
    source: '炮子乡民间采风',
    year: '1928',
    lyrics: [
      '炮子山头红旗飘，苏区人民志气高',
      '打倒土豪分田地，耕者有其田自豪',
      '红军阿哥你慢走，革命成功再回头',
      '妹在房中绣红旗，一针一线情意长',
      '红旗插到南京去，全国工农得解放'
    ]
  },
  {
    title: '南泥湾',
    source: '延安时期经典',
    year: '1943',
    lyrics: [
      '花篮的花儿香，听我来唱一唱',
      '来到了南泥湾，南泥湾好地方',
      '好地方来好风光，到处是庄稼遍地是牛羊',
      '往年的南泥湾，处处是荒山',
      '如今南泥湾，是陕北的好江南',
      '又战斗来又生产，三五九旅是模范',
      '咱们走向前，鲜花送模范'
    ]
  }
]

export const RedSongPlayer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)
  const [lyricLine, setLyricLine] = useState(0)
  const lyricTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const song = SONGS[currentIdx]

  const stopLyrics = useCallback(() => {
    if (lyricTimerRef.current) {
      clearInterval(lyricTimerRef.current)
      lyricTimerRef.current = null
    }
  }, [])

  const startLyrics = useCallback(() => {
    stopLyrics()
    setLyricLine(0)
    lyricTimerRef.current = setInterval(() => {
      setLyricLine(prev => {
        if (prev + 1 >= song.lyrics.length) {
          stopLyrics()
          return prev
        }
        return prev + 1
      })
    }, 3500)
  }, [song.lyrics.length, stopLyrics])

  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
      stopLyrics()
      if (window.speechSynthesis) window.speechSynthesis.cancel()
    } else {
      setIsPlaying(true)
      startLyrics()
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(song.lyrics.join('。'))
        u.lang = 'zh-CN'
        u.rate = 0.75
        u.onend = () => {
          setIsPlaying(false)
          stopLyrics()
        }
        window.speechSynthesis.speak(u)
      }
    }
  }

  const handlePrev = () => {
    setIsPlaying(false)
    stopLyrics()
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setCurrentIdx(prev => (prev - 1 + SONGS.length) % SONGS.length)
  }

  const handleNext = () => {
    setIsPlaying(false)
    stopLyrics()
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setCurrentIdx(prev => (prev + 1) % SONGS.length)
  }

  useEffect(() => {
    return () => {
      stopLyrics()
      if (window.speechSynthesis) window.speechSynthesis.cancel()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8DFD5] p-6 animate-in zoom-in-95 duration-400">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#FDE8EC] text-[#C41E3A] flex items-center justify-center mx-auto mb-3">
            <Music size={28} />
          </div>
          <h2 className="text-xl font-bold text-[#1A1A1A] font-serif">苏区红歌馆</h2>
          <p className="text-xs text-[#5C5C5C] mt-1">红色旋律 · 时代回声</p>
        </div>

        <div className="bg-[#FEFAF6] rounded-2xl p-5 mb-4 border border-[#E8DFD5]">
          <h3 className="text-lg font-bold text-[#C41E3A] font-serif text-center">{song.title}</h3>
          <p className="text-xs text-[#5C5C5C] text-center mt-1">{song.source} · {song.year}年</p>
          
          <div className="mt-4 space-y-1.5 min-h-[120px]">
            {song.lyrics.slice(0, isPlaying ? lyricLine + 1 : song.lyrics.length).map((line, i) => (
              <p
                key={i}
                className={`text-sm leading-relaxed font-serif transition-all duration-500 ${
                  isPlaying && i === lyricLine
                    ? 'text-[#C41E3A] font-bold text-base'
                    : 'text-[#5C5C5C]'
                }`}
              >
                {line}
              </p>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mb-4">
          <button onClick={handlePrev} className="p-2 min-w-[44px] min-h-[44px] rounded-full hover:bg-[#FEFAF6] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center">
            <SkipBack size={20} />
          </button>
          <button
            onClick={handlePlay}
            className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-[#C41E3A] text-white shadow-lg hover:bg-[#A01830] transition-all flex items-center justify-center"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>
          <button onClick={handleNext} className="p-2 min-w-[44px] min-h-[44px] rounded-full hover:bg-[#FEFAF6] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center">
            <SkipForward size={20} />
          </button>
        </div>

        <div className="flex justify-center gap-1.5 mb-4">
          {SONGS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentIdx(i); setIsPlaying(false); stopLyrics(); if (window.speechSynthesis) window.speechSynthesis.cancel() }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentIdx ? 'bg-[#C41E3A] scale-125' : 'bg-[#E8DFD5] hover:bg-[#D4C5B2]'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setShowLyrics(!showLyrics)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-[#E8DFD5] text-[#5C5C5C] hover:bg-[#FEFAF6] transition-all text-sm font-medium"
        >
          <ChevronDown size={16} className={`transition-transform ${showLyrics ? 'rotate-180' : ''}`} />
          {showLyrics ? '收起歌词' : '展开完整歌词'}
        </button>

        {showLyrics && (
          <div className="mt-3 p-4 rounded-xl bg-[#FEFAF6] border border-[#E8DFD5] max-h-48 overflow-y-auto custom-scrollbar">
            <h4 className="text-sm font-bold text-[#1A1A1A] mb-2 font-serif">歌单列表</h4>
            {SONGS.map((s, i) => (
              <button
                key={i}
                onClick={() => { setCurrentIdx(i); setIsPlaying(false); stopLyrics(); setShowLyrics(false) }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                  i === currentIdx ? 'bg-[#FDE8EC] text-[#C41E3A] font-bold' : 'text-[#5C5C5C] hover:bg-[#FEFAF6]'
                }`}
              >
                <Music size={12} />
                {s.title}
                <span className="text-xs opacity-50 ml-auto">{s.source}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
