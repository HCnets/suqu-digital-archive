import React, { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/store'
import { asRecordArray, asText, fetchPublishedContents } from '@/lib/cmsContent'

type TimelineEvent = {
  year: number
  title: string
  subtitle: string
}

type TimelineConfig = {
  minYear: number
  maxYear: number
  marks: number[]
  events: TimelineEvent[]
  helperText: string
}

function normalizeEvents(value: unknown) {
  return asRecordArray(value)
    .map((item) => ({
      year: Number(item.year),
      title: asText(item.title) || asText(item.name),
      subtitle: asText(item.subtitle) || asText(item.summary) || asText(item.description),
    }))
    .filter(item => Number.isInteger(item.year) && item.title && item.subtitle)
    .sort((a, b) => a.year - b.year)
}

function normalizeMarks(value: unknown, events: TimelineEvent[], minYear: number, maxYear: number) {
  const raw = Array.isArray(value) && value.length ? value : events.map(item => item.year)
  return Array.from(new Set(raw
    .map(item => Number(typeof item === 'object' && item !== null ? (item as { year?: unknown }).year : item))
    .filter(year => Number.isInteger(year) && year >= minYear && year <= maxYear)))
    .sort((a, b) => a - b)
}

async function fetchTimelineConfig() {
  const items = await fetchPublishedContents('timeline', 1)
  const item = items[0]
  if (!item) return null

  const data = item.data || {}
  const minYear = Number(data.minYear || data.min_year)
  const maxYear = Number(data.maxYear || data.max_year)
  if (!Number.isInteger(minYear) || !Number.isInteger(maxYear) || maxYear <= minYear) return null

  const events = normalizeEvents(data.events || data.items)
  const marks = normalizeMarks(data.marks || data.markYears || data.mark_years, events, minYear, maxYear)
  const helperText = asText(data.helperText) || asText(data.helper_text) || item.body || ''
  const inRangeEvents = events.filter(event => event.year >= minYear && event.year <= maxYear)
  if (!inRangeEvents.length || !marks.length || !helperText) return null

  return {
    minYear,
    maxYear,
    marks,
    events: inRangeEvents,
    helperText,
  }
}

export const TimeSlider: React.FC = () => {
  const { currentYear, setCurrentYear, setActiveEvent } = useAppStore()
  const [config, setConfig] = useState<TimelineConfig | null>(null)

  // 时间轴配置只加载一次（内部有 30s 缓存 + 去重）
  useEffect(() => {
    let cancelled = false
    fetchTimelineConfig()
      .then(next => {
        if (!cancelled) setConfig(next)
      })
      .catch(() => {
        if (!cancelled) setConfig(null)
      })
    return () => { cancelled = true }
  }, [])

  // 当前年份越界时收敛到配置范围（独立 effect，避免拖拽时反复重拉配置）
  useEffect(() => {
    if (!config) return
    if (currentYear < config.minYear) setCurrentYear(config.minYear)
    if (currentYear > config.maxYear) setCurrentYear(config.maxYear)
  }, [config, currentYear, setCurrentYear])

  const eventByYear = useMemo(() => {
    const entries = (config?.events || []).map(event => [event.year, event] as const)
    return new Map(entries)
  }, [config?.events])
  const activeEvent = eventByYear.get(currentYear)

  useEffect(() => {
    setActiveEvent?.(activeEvent?.title || null)
  }, [activeEvent, setActiveEvent])

  if (!config) return null

  const range = Math.max(1, config.maxYear - config.minYear)
  const progress = Math.min(100, Math.max(0, ((currentYear - config.minYear) / range) * 100))

  return (
    <div className="fixed inset-x-4 bottom-20 z-40 pointer-events-auto md:bottom-8 md:left-[360px] md:right-[360px]">
      {activeEvent && (
        <div className="absolute bottom-full left-1/2 hidden w-full -translate-x-1/2 text-center pointer-events-none animate-in slide-in-from-bottom-4 fade-in duration-500 md:mb-8 md:block">
          <div className="inline-flex flex-col items-center p-4 md:p-6 rounded-2xl bg-white border border-museum-border shadow-lg">
            <h1 className="text-3xl md:text-6xl font-black tracking-widest font-serif text-party-red">
              {currentYear}
            </h1>
            <h2 className="text-lg md:text-xl font-bold text-party-ink tracking-wide mt-1 font-serif">
              {activeEvent.title}
            </h2>
            <p className="text-party-ink-light text-xs md:text-sm mt-1 font-medium">
              {activeEvent.subtitle}
            </p>
          </div>
          <div className="w-px h-6 md:h-8 mx-auto mt-2 bg-gradient-to-b from-party-red to-transparent" />
        </div>
      )}

      <div className="museum-card flex flex-col gap-3 rounded-xl p-3 md:rounded-2xl md:p-5 md:gap-5">
        <div className="flex justify-between items-center text-party-ink-light">
          <span className="text-xs md:text-sm font-medium">{config.minYear}</span>
          <span className="text-xl md:text-3xl font-bold text-party-ink font-serif">
            {currentYear}
          </span>
          <span className="text-xs md:text-sm font-medium">{config.maxYear}</span>
        </div>

        <div className="relative w-full h-2 bg-museum-bg rounded-full mt-2 border border-museum-border">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-party-red to-party-gold rounded-full"
            style={{ width: `${progress}%` }}
          />

          {config.marks.map(mark => {
            const leftPercent = Math.min(100, Math.max(0, ((mark - config.minYear) / range) * 100))
            const isPassed = currentYear >= mark
            return (
              <div
                key={mark}
                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${leftPercent}%` }}
              >
                <div className={`w-3 h-3 rounded-full border-2 border-white transition-colors duration-300 ${
                  isPassed ? 'bg-party-red shadow-sm' : 'bg-museum-border'
                }`} />
                <span className={`absolute top-4 text-xs font-medium transition-colors duration-300 ${
                  isPassed ? 'text-party-red font-bold' : 'text-party-ink-light'
                }`}>
                  {mark}
                </span>
              </div>
            )
          })}

          <input
            type="range"
            min={config.minYear}
            max={config.maxYear}
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
            className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-8 opacity-0 cursor-pointer"
            aria-label="拖动时间轴以浏览不同年份的档案"
          />
        </div>

        <div className="hidden text-center mt-2 text-xs text-party-ink-light font-medium md:block">
          {config.helperText}
        </div>
      </div>
    </div>
  )
}
