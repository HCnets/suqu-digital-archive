import React from 'react'
import { ArrowLeft, AudioLines, Database, Landmark } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  description?: string
  onBack?: () => void
  onAutoTour?: () => void
  isTouring?: boolean
  onOpenAdmin?: () => void
  className?: string
}

export const UnifiedHeader: React.FC<HeaderProps> = ({
  title,
  description,
  onBack,
  onAutoTour,
  isTouring,
  onOpenAdmin,
  className,
}) => {
  return (
    <header
      className={cn(
        'w-full flex flex-col gap-3 px-4 py-3 pointer-events-auto sm:py-4 md:flex-row md:items-start md:justify-between md:px-6',
        className
      )}
    >
      <div className="flex min-w-0 max-w-[760px] items-start gap-3">
        <div className="mt-0.5 hidden h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-party-red bg-white/95 text-party-red shadow-sm shadow-black/5 sm:flex">
          <Landmark size={22} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 border-l-4 border-party-red bg-white/92 px-3 py-2 shadow-sm shadow-black/5 sm:border-l-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-sm bg-party-red-dark px-2 py-1 text-[11px] font-bold leading-none text-white">
              苏区镇红色阵地
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-party-gold sm:inline-flex" />
            <span className="hidden text-xs font-semibold leading-none text-[#7A5A16] sm:inline">
              数字化档案导览
            </span>
          </div>
          <h1 className="max-w-full break-words text-[1.75rem] font-black leading-tight text-[#171717] font-display title-balance">
            {title}
          </h1>
          {description && (
            <p className="hidden max-w-[64ch] text-sm font-semibold leading-6 text-[#4F4A45] sm:block">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-start md:gap-3 md:self-auto">
        {onOpenAdmin && (
          <button
            onClick={onOpenAdmin}
            className="flex min-h-[44px] items-center gap-2 rounded-lg border border-museum-border bg-white/95 px-4 text-[#4F4A45] shadow-sm shadow-black/5 transition-colors duration-200 hover:bg-museum-bg"
            aria-label="打开档案录入中心"
          >
            <Database size={16} />
            <span className="hidden text-sm font-semibold sm:inline">录入中心</span>
          </button>
        )}
        {onAutoTour && (
          <button
            onClick={onAutoTour}
            className={cn(
              'flex min-h-[44px] items-center gap-2 rounded-lg border px-4 shadow-sm shadow-black/5 transition-colors duration-200',
              isTouring 
                ? 'bg-party-red-light text-party-red border-party-red'
                : 'bg-white/95 hover:bg-museum-bg text-[#4F4A45] border-museum-border'
            )}
            aria-label={isTouring ? '停止自动讲解' : '启动自动讲解'}
          >
            <AudioLines size={16} />
            <span className="hidden whitespace-nowrap text-sm font-semibold sm:inline">{isTouring ? '讲解进行中' : '自动讲解'}</span>
          </button>
        )}
        {onBack && (
          <button
            onClick={onBack}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-museum-border bg-white/95 p-2 shadow-sm shadow-black/5 transition-colors duration-200 hover:bg-museum-bg"
            aria-label="返回"
          >
            <ArrowLeft className="w-[20px] h-[20px] text-party-ink-light" />
          </button>
        )}
      </div>
    </header>
  )
}
