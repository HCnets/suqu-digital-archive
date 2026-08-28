import React, { useState, useEffect } from 'react'
import { X, Stamp, Trophy, MapPin } from 'lucide-react'
import { asText, fetchPublishedContents } from '@/lib/cmsContent'

type CheckinConfig = {
  title: string
  description: string
  totalCount: number
  certificateTitle: string
  stampLabel: string
  certificateText: string
}

export const CheckInPassport: React.FC<{ onClose: () => void; visitedPois: string[]; totalCount?: number }> = ({ onClose, visitedPois, totalCount: panelTotalCount }) => {
  const [config, setConfig] = useState<CheckinConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const totalCount = Math.max(1, panelTotalCount || config?.totalCount || 1)
  const visitedCount = visitedPois.length
  const allVisited = Boolean(config) && visitedCount >= totalCount
  const progressPercent = Math.min(100, (visitedCount / totalCount) * 100)
  const [showCertificate, setShowCertificate] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadConfig() {
      setLoading(true)
      try {
        const items = await fetchPublishedContents('checkin', 1)
        const data = items[0]?.data || {}
        const nextTotal = Number(data.totalCount || data.total_count)
        const nextConfig = items.length > 0 ? {
          title: asText(data.title) || items[0].title,
          description: asText(data.description) || items[0].summary || '',
          totalCount: Number.isInteger(nextTotal) && nextTotal > 0 ? nextTotal : 0,
          certificateTitle: asText(data.certificateTitle) || asText(data.certificate_title),
          stampLabel: asText(data.stampLabel) || asText(data.stamp_label),
          certificateText: asText(data.certificateText) || asText(data.certificate_text) || items[0].body || '',
        } : null
        if (!cancelled) {
          setConfig(
            nextConfig?.title &&
            nextConfig.description &&
            nextConfig.totalCount > 0 &&
            nextConfig.certificateTitle &&
            nextConfig.stampLabel &&
            nextConfig.certificateText
              ? nextConfig
              : null,
          )
        }
      } catch {
        if (!cancelled) setConfig(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadConfig()
    return () => { cancelled = true }
  }, [panelTotalCount])

  useEffect(() => {
    if (allVisited) {
      setTimeout(() => setShowCertificate(true), 600)
    }
  }, [allVisited])

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#E8DFD5] p-6 animate-in zoom-in-95 duration-400 max-h-[85vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FDE8EC] text-[#5C5C5C] hover:text-[#C41E3A] transition-all flex items-center justify-center" aria-label="关闭">
          <X size={20} />
        </button>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-10 h-10 rounded-full border-2 border-[#E8DFD5] border-t-[#C41E3A] animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#5C5C5C]">正在读取已发布的打卡护照配置</p>
          </div>
        ) : !config ? (
          <div className="py-10 text-center">
            <Stamp size={28} className="text-[#C41E3A] mx-auto mb-3" />
            <h2 className="text-xl font-bold text-[#1A1A1A] font-serif mb-2">打卡护照未配置</h2>
            <p className="text-sm text-[#5C5C5C] leading-relaxed">
              当前暂无已审核发布的打卡护照配置，请在后台发布 `checkin` 内容后再启用该入口。
            </p>
          </div>
        ) : showCertificate && allVisited ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">🏆</div>
            <h2 className="text-xl font-bold text-[#1A1A1A] font-serif mb-1">{config.certificateTitle}</h2>
            <p className="text-sm text-[#5C5C5C] mb-4">恭喜！您已完成全部 {totalCount} 处红色阵地的打卡学习</p>
            <div className="p-4 rounded-2xl border-2 border-[#C41E3A] bg-[#FDE8EC]/20 mb-4">
              <div className="w-16 h-16 rounded-full bg-[#C41E3A] text-white flex items-center justify-center mx-auto mb-2">
                <Trophy size={28} />
              </div>
              <h3 className="font-bold text-[#C41E3A] font-serif text-lg">{config.stampLabel}</h3>
              <h3 className="font-bold text-[#C41E3A] font-serif text-lg mb-2">全域打卡证书</h3>
              <p className="text-xs text-[#5C5C5C] leading-relaxed whitespace-pre-line">
                {config.certificateText}
              </p>
              <div className="mt-3 pt-3 border-t border-[#E8DFD5]">
                <p className="text-[10px] text-[#5C5C5C]">数字化档案系统 · 自动颁发</p>
                <p className="text-[10px] text-[#5C5C5C]">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <button 
                onClick={() => {
                  setShowCertificate(false)
                }}
                className="px-4 py-2 rounded-xl bg-[#FDE8EC] text-[#C41E3A] text-sm font-medium hover:bg-[#FDE8EC]/80 transition-all"
              >
                再浏览一次
              </button>
              <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white border border-[#E8DFD5] text-[#5C5C5C] text-sm font-medium hover:bg-[#FEFAF6] transition-all">
                关闭
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-[#1A1A1A] font-serif mb-1 flex items-center gap-2">
              <Stamp size={18} className="text-[#C41E3A]" />
              {config.title}
            </h2>
            <p className="text-sm text-[#5C5C5C] mb-5">{config.description}</p>
            
            <div className="mb-4">
              <div className="flex justify-between text-xs text-[#5C5C5C] mb-1.5">
                <span>学习进度</span>
                <span className="font-bold text-[#C41E3A]">{visitedCount}/{totalCount}</span>
              </div>
              <div className="w-full bg-[#FEFAF6] h-2.5 rounded-full overflow-hidden border border-[#E8DFD5]">
                <div className="h-full bg-gradient-to-r from-[#C41E3A] to-[#8B6914] rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {Array.from({ length: totalCount }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-300 ${
                    i < visitedCount
                      ? 'bg-[#FDE8EC] border border-[#C41E3A]/30'
                      : 'bg-[#FEFAF6] border border-[#E8DFD5] opacity-50'
                  }`}
                >
                  {i < visitedCount ? (
                    <MapPin size={18} className="text-[#C41E3A]" />
                  ) : (
                    <span className="text-xs text-[#E8DFD5] font-bold">{i + 1}</span>
                  )}
                </div>
              ))}
            </div>

            {visitedCount > 0 && (
              <div className="p-4 rounded-xl bg-[#FFF8E1] border border-[#8B6914]/20 text-xs text-[#5C5C5C] leading-relaxed font-serif">
                您已参观了 {visitedCount} 个红色阵地。{totalCount - visitedCount > 0 ? `还差 ${totalCount - visitedCount} 个即可获得“${config.certificateTitle}”电子证书。` : '恭喜！您已达成全域打卡！'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
