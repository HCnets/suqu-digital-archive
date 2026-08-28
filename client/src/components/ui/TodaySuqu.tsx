import React, { useEffect, useState } from 'react'
import { X, MoveHorizontal, ArrowRight, TrendingUp, Users, Home, Leaf, GraduationCap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { asRecordArray, asText, fetchPublishedContents } from '@/lib/cmsContent'

type TodayMetric = {
  iconKey: string
  number: string
  label: string
  detail: string
}

type TodayComparison = {
  title: string
  before: string
  after: string
}

type TodayConfig = {
  title: string
  beforeYear: string
  afterYear: string
  introBefore: string
  transitionLabel: string
  introAfter: string
  metrics: TodayMetric[]
  comparisons: TodayComparison[]
}

const ICONS: Record<string, LucideIcon> = {
  users: Users,
  home: Home,
  trending: TrendingUp,
  trend: TrendingUp,
  leaf: Leaf,
  education: GraduationCap,
  graduation: GraduationCap,
}

function normalizeMetrics(value: unknown) {
  return asRecordArray(value).map((item) => ({
    iconKey: asText(item.iconKey) || asText(item.icon_key) || asText(item.icon) || 'trending',
    number: asText(item.number) || asText(item.value),
    label: asText(item.label) || asText(item.title),
    detail: asText(item.detail) || asText(item.description) || asText(item.text),
  })).filter(item => item.number && item.label && item.detail)
}

function normalizeComparisons(value: unknown) {
  return asRecordArray(value).map((item) => ({
    title: asText(item.title) || asText(item.name),
    before: asText(item.before) || asText(item.past),
    after: asText(item.after) || asText(item.now) || asText(item.present),
  })).filter(item => item.title && item.before && item.after)
}

function metricIcon(iconKey: string) {
  const Icon = ICONS[iconKey] || ICONS.trending
  return <Icon size={20} />
}

async function fetchTodayConfig() {
  const items = await fetchPublishedContents('today_suqu', 1)
  const item = items[0]
  if (!item) return null

  const data = item.data || {}
  const metrics = normalizeMetrics(data.metrics || data.todayData || data.today_data)
  const comparisons = normalizeComparisons(data.comparisons || data.beforeAfter || data.before_after)
  const config: TodayConfig = {
    title: asText(data.title) || asText(data.headline) || item.title,
    beforeYear: asText(data.beforeYear) || asText(data.before_year),
    afterYear: asText(data.afterYear) || asText(data.after_year),
    introBefore: asText(data.introBefore) || asText(data.intro_before) || item.summary || '',
    transitionLabel: asText(data.transitionLabel) || asText(data.transition_label),
    introAfter: asText(data.introAfter) || asText(data.intro_after) || item.body || '',
    metrics,
    comparisons,
  }

  if (!config.title || !config.beforeYear || !config.afterYear || !config.introBefore || !config.transitionLabel || !config.introAfter) return null
  if (!config.metrics.length || !config.comparisons.length) return null
  return config
}

export const TodaySuqu: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeBeforeAfter, setActiveBeforeAfter] = useState(0)
  const [config, setConfig] = useState<TodayConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchTodayConfig()
      .then(next => {
        if (!cancelled) {
          setConfig(next)
          setActiveBeforeAfter(0)
        }
      })
      .catch(() => {
        if (!cancelled) setConfig(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const activeComparison = config?.comparisons[activeBeforeAfter] || config?.comparisons[0] || null

  return (
    <div className="fixed inset-0 z-[85] pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white border-l border-[#E8DFD5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-400 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-[#E8DFD5] bg-[#FEFAF6]">
          <h2 className="text-lg font-bold text-[#1A1A1A] font-serif tracking-wider flex items-center gap-2">
            <span className="w-1 h-5 bg-[#C41E3A] rounded-full" />
            {config?.title || '今日苏区'}
          </h2>
          <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {isLoading ? (
            <div className="py-16 text-center rounded-xl border border-[#E8DFD5] bg-[#FEFAF6]">
              <div className="text-sm font-bold text-[#1A1A1A] font-serif">正在读取已审核发布的今日苏区资料</div>
              <p className="text-xs text-[#8C7A68] mt-2">公开端不会展示未经后台审核的本地今昔数据。</p>
            </div>
          ) : !config || !activeComparison ? (
            <div className="py-16 text-center rounded-xl border border-[#E8DFD5] bg-[#FEFAF6]">
              <div className="text-4xl mb-3">📊</div>
              <div className="text-sm font-bold text-[#1A1A1A] font-serif">暂无已审核发布的今日苏区资料</div>
              <p className="text-xs text-[#8C7A68] mt-2 px-6 leading-relaxed">
                请先在后台创建并终审发布“今日苏区”内容，公开端才会展示今昔对比和数据看板。
              </p>
            </div>
          ) : (
            <>
              <div className="relative museum-card rounded-2xl border border-[#E8DFD5] overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C41E3A] to-[#8B6914]" />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#1A1A1A] font-serif mb-2">{config.beforeYear} 年 → {config.afterYear} 年</h3>
                  <p className="text-sm text-[#5C5C5C] leading-relaxed mb-2">
                    {config.introBefore}
                  </p>
                  <div className="flex items-center gap-2 text-[#C41E3A] font-bold">
                    <ArrowRight size={16} />
                    <span className="font-serif">{config.transitionLabel}</span>
                  </div>
                  <p className="text-sm text-[#5C5C5C] leading-relaxed mt-2">
                    {config.introAfter}
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-bold text-[#1A1A1A] font-serif flex items-center gap-2">
                <TrendingUp size={18} className="text-[#C41E3A]" />
                乡村振兴数据看板
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {config.metrics.map((item, idx) => (
                  <div key={`${item.label}-${idx}`} className="museum-card p-4 rounded-2xl border border-[#E8DFD5] text-center hover:border-[#C41E3A]/20 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-[#FDE8EC] text-[#C41E3A] flex items-center justify-center mx-auto mb-3">
                      {metricIcon(item.iconKey)}
                    </div>
                    <div className="text-2xl font-black text-[#C41E3A] font-serif">{item.number}</div>
                    <div className="text-xs font-bold text-[#1A1A1A] mt-1">{item.label}</div>
                    <div className="text-[10px] text-[#5C5C5C] mt-1 leading-relaxed">{item.detail}</div>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-bold text-[#1A1A1A] font-serif flex items-center gap-2">
                <MoveHorizontal size={18} className="text-[#8B6914]" />
                旧址今貌对比
              </h3>
              <div className="flex gap-2 flex-wrap mb-4">
                {config.comparisons.map((item, idx) => (
                  <button
                    key={`${item.title}-${idx}`}
                    onClick={() => setActiveBeforeAfter(idx)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeBeforeAfter === idx
                        ? 'bg-[#FDE8EC] text-[#C41E3A] border border-[#C41E3A]/30'
                        : 'bg-white border border-[#E8DFD5] text-[#5C5C5C] hover:bg-[#FEFAF6]'
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
              <div className="museum-card p-6 rounded-2xl border border-[#E8DFD5]">
                <h4 className="font-bold text-[#1A1A1A] font-serif mb-4">{activeComparison.title}</h4>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#FEFAF6] border border-[#E8DFD5]">
                    <span className="text-xs font-bold text-[#C41E3A] uppercase tracking-wider">过去</span>
                    <p className="text-sm text-[#5C5C5C] leading-relaxed mt-1">{activeComparison.before}</p>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight size={20} className="text-[#8B6914]" />
                  </div>
                  <div className="p-4 rounded-xl bg-[#FFF8E1] border border-[#8B6914]/20">
                    <span className="text-xs font-bold text-[#8B6914] uppercase tracking-wider">现在</span>
                    <p className="text-sm text-[#5C5C5C] leading-relaxed mt-1">{activeComparison.after}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
