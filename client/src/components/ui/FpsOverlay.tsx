import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/store'
import { X, MapPin, Play, Pause, ChevronLeft, ChevronRight, Volume2, VolumeX, Flag } from 'lucide-react'

interface RouteNode {
  id: string
  title: string
  description: string
  year: number
  lng: number
  lat: number
}

/** 每个站点的停留时长（毫秒） */
const DWELL_MS = 9000
/** 漫游相机参数：低视角贴近地面，模拟第一人称沿街行走 */
const ROUTE_VIEW = { zoom: 17.2, pitch: 78, duration: 2600 } as const

/**
 * 重走红军路 · 第一人称漫游
 * 沿革命旧址档案（按年代排序）自动巡航：低空飞行 → 站点解说 → 自动推进。
 * 数据全部来自已审核发布的真实档案，非占位。
 */
export const FpsOverlay: React.FC = () => {
  const { isFpsMode, setFpsMode, getAllArchives, mainMapInstance } = useAppStore()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const indexRef = useRef(0)

  /** 构建红军路：革命旧址档案按年代排序 */
  const route = useMemo<RouteNode[]>(() => {
    if (!isFpsMode) return []
    return getAllArchives()
      .filter((a) => a.type === 'revolution' && Number.isFinite(a.longitude) && Number.isFinite(a.latitude))
      .sort((a, b) => (a.year || 0) - (b.year || 0))
      .map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description || '',
        year: a.year || 0,
        lng: a.longitude,
        lat: a.latitude,
      }))
  }, [isFpsMode, getAllArchives])

  const stopTts = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])

  /** 飞往指定站点并朗读解说 */
  const visit = useCallback(
    (i: number) => {
      const node = route[i]
      if (!node) return
      indexRef.current = i
      setIndex(i)
      mainMapInstance?.flyTo({
        center: [node.lng, node.lat],
        zoom: ROUTE_VIEW.zoom,
        pitch: ROUTE_VIEW.pitch,
        bearing: i % 2 === 0 ? -12 : 8,
        duration: ROUTE_VIEW.duration,
        essential: true,
      })
      if (!muted && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const text = `${node.title}。${node.description}`.slice(0, 120)
        const utter = new SpeechSynthesisUtterance(text)
        utter.lang = 'zh-CN'
        utter.rate = 1
        window.speechSynthesis.speak(utter)
      }
    },
    [route, mainMapInstance, muted],
  )

  /** 安排下一次自动推进 */
  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const next = indexRef.current + 1
      if (next < route.length) {
        visit(next)
      } else {
        setPaused(true) // 走完全程后停在最后一站，等待用户操作
      }
    }, DWELL_MS)
  }, [route.length, visit])

  // 进入/退出模式
  useEffect(() => {
    if (!isFpsMode) {
      stopTts()
      if (timerRef.current) clearTimeout(timerRef.current)
      indexRef.current = 0
      setIndex(0)
      setPaused(false)
      return
    }
    if (route.length === 0) return
    indexRef.current = 0
    visit(0)
    scheduleNext()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFpsMode, route.length])

  // 暂停/继续时重建定时器
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (isFpsMode && !paused && route.length > 0) scheduleNext()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [paused, isFpsMode, scheduleNext])

  // 卸载清理
  useEffect(
    () => () => {
      stopTts()
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [stopTts],
  )

  if (!isFpsMode) return null

  const total = route.length
  const node = route[index]
  const goPrev = () => {
    if (index > 0) {
      stopTts()
      visit(index - 1)
      scheduleNext()
    }
  }
  const goNext = () => {
    if (index < total - 1) {
      stopTts()
      visit(index + 1)
      scheduleNext()
    }
  }

  return (
    <div className="fixed inset-0 z-[45] pointer-events-none animate-in fade-in duration-700">
      {/* 中央准星 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
        <MapPin size={30} className="text-party-red" strokeWidth={1.4} />
      </div>
      <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.35)]" />

      {/* 顶部当前站点 */}
      {node && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 museum-card px-5 py-2.5 rounded-full flex items-center gap-3 pointer-events-auto max-w-[70vw]">
          <span className="w-2 h-2 rounded-full bg-party-red animate-pulse shrink-0" />
          <span className="text-party-ink font-serif text-sm tracking-wider truncate">
            {index + 1} / {total} · {node.title}
          </span>
          <span className="text-party-ink-light text-xs shrink-0 hidden sm:inline">{node.year} 年</span>
        </div>
      )}

      {/* 右侧站点解说卡（桌面端） */}
      {node && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-64 museum-card rounded-2xl p-5 pointer-events-auto hidden md:block">
          <div className="flex items-center gap-2 text-party-ink mb-2 border-b border-museum-border pb-2">
            <Flag size={15} className="text-party-red" />
            <span className="font-bold text-xs tracking-wider font-serif">红军路 · 站点解说</span>
          </div>
          <p className="text-sm text-party-ink leading-relaxed font-serif line-clamp-5">{node.description}</p>
          <div className="mt-3 h-1.5 rounded-full bg-party-red-light overflow-hidden">
            <div
              className="h-full bg-party-red rounded-full transition-all duration-700"
              style={{ width: `${((index + 1) / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 空态：无革命旧址数据 */}
      {total === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 museum-card rounded-2xl px-6 py-4 pointer-events-auto text-center">
          <p className="text-party-ink font-serif text-sm">暂无已发布革命旧址档案，无法生成红军路漫游。</p>
          <button
            onClick={() => setFpsMode(false)}
            className="mt-3 px-4 py-1.5 rounded-xl bg-party-red text-white text-xs hover:opacity-90"
          >
            返回
          </button>
        </div>
      )}

      {/* 底部控制条 */}
      {total > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 museum-card rounded-2xl px-4 py-3 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="p-2 rounded-xl hover:bg-party-red-light text-party-ink disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="上一站"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setPaused((p) => !p)}
            className="p-2 rounded-xl hover:bg-party-red-light text-party-ink"
            aria-label={paused ? '继续' : '暂停'}
          >
            {paused ? <Play size={18} /> : <Pause size={18} />}
          </button>
          <button
            onClick={goNext}
            disabled={index >= total - 1}
            className="p-2 rounded-xl hover:bg-party-red-light text-party-ink disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="下一站"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => setMuted((m) => !m)}
            className="p-2 rounded-xl hover:bg-party-red-light text-party-ink"
            aria-label={muted ? '开启语音' : '静音'}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <div className="w-px h-5 bg-museum-border mx-1" />
          <button
            onClick={() => setFpsMode(false)}
            className="p-2 rounded-xl hover:bg-party-red-light text-party-ink"
            aria-label="退出重走红军路"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  )
}

