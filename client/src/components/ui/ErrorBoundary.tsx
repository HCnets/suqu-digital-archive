import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[苏区镇数字化档案] 渲染错误:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          className="w-screen h-screen flex flex-col items-center justify-center gap-6"
          style={{ backgroundColor: '#FEFAF6' }}
        >
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <rect x="4" y="4" width="64" height="64" rx="16" stroke="#E8DFD5" strokeWidth="2" />
            <path d="M36 20V40" stroke="#C41E3A" strokeWidth="3" strokeLinecap="round" />
            <circle cx="36" cy="50" r="2.5" fill="#C41E3A" />
          </svg>
          <div className="flex flex-col items-center gap-3 text-center">
            <h2 className="text-xl font-bold text-[#C41E3A] font-serif tracking-wider">
              页面加载异常
            </h2>
            <p className="text-[#5C5C5C] text-sm max-w-md leading-relaxed">
              数字化展厅组件遇到了临时故障，请尝试刷新页面恢复访问。
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-medium tracking-wider transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: '#C41E3A' }}
          >
            重新加载
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
