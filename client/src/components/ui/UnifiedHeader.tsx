import React from 'react'
import { ArrowLeft, AudioLines, Database } from 'lucide-react'
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
        'w-full flex items-start justify-between px-6 py-4 pointer-events-auto',
        className
      )}
    >
      <div className="flex flex-col gap-1 max-w-[72ch]">
        <p className="text-xs md:text-sm uppercase tracking-[0.28em] text-[#C41E3A] font-medium">
          红色党建思政实践平台
        </p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1A1A1A] font-serif">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[#5C5C5C]/90 font-medium tracking-wide leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {onOpenAdmin && (
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-2 px-4 min-h-[44px] rounded-lg transition-all duration-200 border border-[#E8DFD5] bg-white hover:bg-[#FEFAF6] text-[#5C5C5C]"
            aria-label="打开档案录入中心"
          >
            <Database size={16} />
            <span className="text-sm font-medium">录入中心</span>
          </button>
        )}
        {onAutoTour && (
          <button
            onClick={onAutoTour}
            className={cn(
              'flex items-center gap-2 px-4 min-h-[44px] rounded-lg transition-all duration-200 border',
              isTouring 
                ? 'bg-[#FDE8EC] text-[#C41E3A] border-[#C41E3A]/40'
                : 'bg-white hover:bg-[#FEFAF6] text-[#5C5C5C] border-[#E8DFD5]'
            )}
            aria-label={isTouring ? '停止自动讲解' : '启动自动讲解'}
          >
            <AudioLines size={16} />
            <span className="text-sm font-medium">{isTouring ? '讲解进行中' : '自动讲解'}</span>
          </button>
        )}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center rounded-full p-2 transition-all duration-200 bg-white border border-[#E8DFD5] hover:bg-[#FEFAF6] min-w-[44px] min-h-[44px]"
            aria-label="返回"
          >
            <ArrowLeft className="w-[20px] h-[20px] text-[#5C5C5C]" />
          </button>
        )}
      </div>
    </header>
  )
}
