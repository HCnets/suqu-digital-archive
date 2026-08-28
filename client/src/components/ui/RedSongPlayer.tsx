import React, { useState, useRef, useCallback, useEffect } from 'react'
import { X, Play, Pause, SkipBack, SkipForward, Music, ChevronDown } from 'lucide-react'
import { asStringArray, asText, fetchPublishedContents, type PublicContentItem } from '@/lib/cmsContent'

interface Song {
  id: string
  title: string
  source: string
  lyrics: string[]
  year: string
}

export const RedSongPlayer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [songs, setSongs] = useState<Song[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)
  const [lyricLine, setLyricLine] = useState(0)
  const [loading, setLoading] = useState(true)
  const lyricTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const song = songs[currentIdx] || null

  useEffect(() => {
    let cancelled = false
    async function loadSongs() {
      setLoading(true)
      try {
        const items = await fetchPublishedContents('song', 100)
        const cmsSongs = items.map(contentToSong).filter(Boolean) as Song[]
        if (!cancelled) {
          setSongs(cmsSongs)
          setCurrentIdx(0)
          setLyricLine(0)
        }
      } catch {
        if (!cancelled) setSongs([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadSongs()
    return () => { cancelled = true }
  }, [])

  const stopLyrics = useCallback(() => {
    if (lyricTimerRef.current) {
      clearInterval(lyricTimerRef.current)
      lyricTimerRef.current = null
    }
  }, [])

  const startLyrics = useCallback(() => {
    if (!song) return
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
  }, [song, stopLyrics])

  const handlePlay = () => {
    if (!song) return
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
    if (songs.length === 0) return
    setIsPlaying(false)
    stopLyrics()
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setCurrentIdx(prev => (prev - 1 + songs.length) % songs.length)
  }

  const handleNext = () => {
    if (songs.length === 0) return
    setIsPlaying(false)
    stopLyrics()
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setCurrentIdx(prev => (prev + 1) % songs.length)
  }

  useEffect(() => {
    return () => {
      stopLyrics()
      if (window.speechSynthesis) window.speechSynthesis.cancel()
    }
  }, [stopLyrics])

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
          <p className="text-xs text-[#5C5C5C] mt-1">仅展示已审核发布的红歌资料</p>
        </div>

        <div className="bg-[#FEFAF6] rounded-2xl p-5 mb-4 border border-[#E8DFD5]">
          {loading ? (
            <div className="min-h-[160px] flex flex-col items-center justify-center text-center">
              <div className="w-9 h-9 rounded-full border-2 border-[#E8DFD5] border-t-[#C41E3A] animate-spin mb-3" />
              <p className="text-sm text-[#5C5C5C]">正在读取已审核发布的红歌资料</p>
            </div>
          ) : song ? (
            <>
              <h3 className="text-lg font-bold text-[#C41E3A] font-serif text-center">{song.title}</h3>
              <p className="text-xs text-[#5C5C5C] text-center mt-1">{song.source} · {song.year}</p>

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
            </>
          ) : (
            <div className="min-h-[160px] flex items-center justify-center text-center">
              <p className="text-sm text-[#5C5C5C] leading-relaxed">当前暂无已审核发布的红歌资料。</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 mb-4">
          <button onClick={handlePrev} disabled={!song} className="p-2 min-w-[44px] min-h-[44px] rounded-full hover:bg-[#FEFAF6] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none" aria-label="上一首">
            <SkipBack size={20} />
          </button>
          <button
            onClick={handlePlay}
            disabled={!song}
            className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-[#C41E3A] text-white shadow-lg hover:bg-[#A01830] transition-all flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none"
            aria-label={isPlaying ? '暂停播放' : '播放红歌'}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>
          <button onClick={handleNext} disabled={!song} className="p-2 min-w-[44px] min-h-[44px] rounded-full hover:bg-[#FEFAF6] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none" aria-label="下一首">
            <SkipForward size={20} />
          </button>
        </div>

        <div className="flex justify-center gap-1.5 mb-4">
          {songs.map((_, i) => (
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
          disabled={!song}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-[#E8DFD5] text-[#5C5C5C] hover:bg-[#FEFAF6] transition-all text-sm font-medium disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronDown size={16} className={`transition-transform ${showLyrics ? 'rotate-180' : ''}`} />
          {showLyrics ? '收起歌词' : '展开完整歌词'}
        </button>

        {showLyrics && (
          <div className="mt-3 p-4 rounded-xl bg-[#FEFAF6] border border-[#E8DFD5] max-h-48 overflow-y-auto custom-scrollbar">
            <h4 className="text-sm font-bold text-[#1A1A1A] mb-2 font-serif">歌单列表</h4>
            {songs.map((s, i) => (
              <button
                key={s.id}
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

function contentToSong(item: PublicContentItem): Song | null {
  const data = item.data || {}
  const lyrics = asStringArray(data.lyrics)
  const bodyLyrics = item.body
    ? item.body.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    : []
  const nextLyrics = lyrics.length > 0 ? lyrics : bodyLyrics
  const title = asText(data.title) || item.title
  const source = asText(data.source) || item.summary || item.category || ''
  const year = asText(data.year) || asText(data.years) || ''

  if (!title || !source || !year || nextLyrics.length === 0) return null
  return { id: item.id || title, title, source, year, lyrics: nextLyrics }
}
