import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  description?: string
  onBack?: () => void
  className?: string
}

export const UnifiedHeader: React.FC<HeaderProps> = ({
  title,
  description,
  onBack,
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

      <button
        onClick={onBack}
        className="liquid-glass group relative flex items-center justify-center rounded-full p-[12px] transition-all duration-300 hover:scale-105 hover:bg-white/20 active:scale-95"
        aria-label="返回"
      >
        <ArrowLeft className="w-[20px] h-[20px] text-white/90 group-hover:text-white transition-colors" />
      </button>
    </header>
  )
}