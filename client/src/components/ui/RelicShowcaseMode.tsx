import React from 'react'
import { useAppStore, type ArchiveData } from '@/store'
import { X, Image as ImageIcon, Landmark, MapPin, Calendar, ShieldCheck } from 'lucide-react'

const resolveAssetUrl = (url?: string) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return url
  return `/${url.replace(/^\.?\//, '')}`
}

const getArchiveTypeLabel = (type?: ArchiveData['type']) => {
  if (type === 'government') return '党政服务点位'
  if (type === 'culture') return '群众文化阵地'
  return '红色革命遗址'
}

export const RelicShowcaseMode: React.FC = () => {
  const { isRelicMode, setRelicMode, selectedPoiId, getArchiveData } = useAppStore()
  const archive = selectedPoiId ? getArchiveData(selectedPoiId) : null
  const primaryMedia = archive?.media?.find(item => item.type === 'image') || archive?.media?.[0]
  const imageUrl = resolveAssetUrl(primaryMedia?.url || archive?.coverImage)
  const typeLabel = getArchiveTypeLabel(archive?.type)

  if (!isRelicMode) return null

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#FEFAF6] pointer-events-auto animate-in fade-in duration-300">
      <header className="relative z-10 flex items-center justify-between border-b border-[#E8DFD5] bg-white/92 px-5 py-4 shadow-sm backdrop-blur-md md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#C41E3A]/20 bg-[#FDE8EC] text-[#C41E3A]">
            <Landmark size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-[#8B6914]">档案影像展陈</p>
            <h2 className="truncate text-lg font-bold text-[#1A1A1A] md:text-2xl">
              {archive?.title || '未选择档案点位'}
            </h2>
          </div>
        </div>
        <button
          onClick={() => setRelicMode(false)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#E8DFD5] bg-white text-[#5C5C5C] transition-all hover:border-[#C41E3A]/30 hover:bg-[#FDE8EC] hover:text-[#C41E3A]"
          aria-label="退出档案影像展陈"
        >
          <X size={22} />
        </button>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1.25fr)_420px]">
        <section className="relative flex min-h-[52vh] items-center justify-center overflow-hidden bg-[#F4EFE8] p-4 md:p-8">
          <div className="absolute inset-0 opacity-70" style={{ background: 'radial-gradient(circle at 48% 38%, rgba(196,30,58,0.08), transparent 38%), linear-gradient(135deg, rgba(216,196,168,0.45), rgba(254,250,246,0.92))' }} />
          {imageUrl ? (
            <figure className="relative z-10 flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl shadow-[#5A281B]/12">
              <div className="relative min-h-[280px] bg-[#1A1A1A] md:min-h-[520px]">
                <img
                  src={imageUrl}
                  alt={primaryMedia?.caption || archive?.title || '档案图片'}
                  loading="lazy"
                  decoding="async"
                  className="h-full max-h-[68vh] w-full object-contain"
                />
              </div>
              <figcaption className="border-t border-[#E8DFD5] bg-white px-4 py-3 text-sm leading-relaxed text-[#5C5C5C]">
                {primaryMedia?.caption || archive?.title || '已审核档案素材'}
              </figcaption>
            </figure>
          ) : (
            <div className="relative z-10 flex min-h-[360px] w-full max-w-3xl flex-col items-center justify-center rounded-2xl border border-dashed border-[#D8C4A8] bg-white/85 p-8 text-center">
              <ImageIcon size={42} className="text-[#C41E3A]" />
              <h3 className="mt-5 text-xl font-bold text-[#1A1A1A]">暂无可展示影像</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#5C5C5C]">
                补充并审核图片或视频资料后，这里会同步展示。
              </p>
            </div>
          )}
        </section>

        <aside className="border-l border-[#E8DFD5] bg-white p-5 md:p-7">
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#E8DFD5] bg-[#FEFAF6] p-4">
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="inline-flex items-center gap-1 rounded-full border border-[#C41E3A]/20 bg-white px-3 py-1 text-[#C41E3A]">
                  <ShieldCheck size={13} />
                  已审核发布
                </span>
                <span className="rounded-full border border-[#E8DFD5] bg-white px-3 py-1 text-[#8B6914]">{typeLabel}</span>
              </div>
              <h3 className="mt-4 text-2xl font-bold leading-snug text-[#1A1A1A]">{archive?.title || '未选择档案点位'}</h3>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#5C5C5C]">
                {archive?.year && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={14} className="text-[#C41E3A]" />
                    {archive.year}年
                  </span>
                )}
                {archive && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} className="text-[#C41E3A]" />
                    地图点位已绑定
                  </span>
                )}
              </div>
            </div>

            <section className="rounded-2xl border border-[#E8DFD5] p-4">
              <h4 className="text-base font-bold text-[#C41E3A]">档案简介</h4>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-loose text-[#5C5C5C]">
                {archive?.description || '暂无简介。'}
              </p>
            </section>

            {archive?.content && (
              <section className="rounded-2xl border border-[#E8DFD5] p-4">
                <h4 className="text-base font-bold text-[#C41E3A]">历史文献</h4>
                <p className="mt-3 max-h-[260px] overflow-y-auto whitespace-pre-wrap pr-2 text-sm leading-loose text-[#5C5C5C]">
                  {archive.content}
                </p>
              </section>
            )}

            <section className="rounded-2xl border border-[#8B6914]/20 bg-[#FFF8E1] p-4">
              <p className="text-sm leading-relaxed text-[#5C5C5C]">
                当前展示已审核的档案影像与文字资料。后续补充实测资料后，将以主管部门审核内容为准同步更新。
              </p>
            </section>
          </div>
        </aside>
      </main>
    </div>
  )
}
