import React from 'react'
import { ArrowLeft, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  description?: string
  onBack?: () => void
  onAutoTour?: () => void
  isTouring?: boolean
  className?: string
}

export const UnifiedHeader: React.FC<HeaderProps> = ({
  title,
  description,
  onBack,
  onAutoTour,
  isTouring,
  className,
}) => {
  return (
    <header
      className={cn(
        'w-full flex items-center justify-between px-6 py-4 pointer-events-auto',
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white drop-shadow-md">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-300 font-medium tracking-wide drop-shadow">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {onAutoTour && (
          <button
            onClick={onAutoTour}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 border",
              isTouring 
                ? "bg-amber-500/20 text-amber-400 border-amber-500/50 animate-pulse" 
                : "bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md"
            )}
          >
            <Rocket size={16} className={isTouring ? "animate-bounce" : ""} />
            <span className="text-sm font-medium">{isTouring ? "巡航中..." : "自动巡航"}</span>
          </button>
        )}
        <button
          onClick={onBack}
          className="liquid-glass group relative flex items-center justify-center rounded-full p-[12px] transition-all duration-300 hover:scale-105 hover:bg-white/20 active:scale-95"
          aria-label="返回"
        >
          <ArrowLeft className="w-[20px] h-[20px] text-white/90 group-hover:text-white transition-colors" />
        </button>
      </div>
    </header>
  )
}