import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  /** 宽度类，如 'max-w-md' / 'max-w-2xl' */
  maxWidth?: string
  showClose?: boolean
  /** 是否显示顶部标题栏 */
  showHeader?: boolean
}

/**
 * 通用模态弹窗：遮罩 + 标题栏 + 内容区 + 关闭按钮。
 * 支持 Esc 关闭、点击遮罩关闭、无障碍 role=dialog。
 * 使用设计令牌类，供各功能弹窗统一复用。
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
  showClose = true,
  showHeader = true,
}) => {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div
        className={`relative w-full ${maxWidth} museum-card rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300`}
      >
        {showHeader && (
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-museum-border bg-museum-bg">
            {title ? (
              <h2 className="text-sm font-bold text-party-ink font-serif">{title}</h2>
            ) : (
              <span />
            )}
            {showClose && (
              <button
                onClick={onClose}
                aria-label="关闭"
                className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-party-red-light text-party-ink-light hover:text-party-red transition-all flex items-center justify-center"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="p-5 max-h-[75dvh] overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  )
}
