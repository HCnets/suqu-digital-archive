/**
 * 前端环境配置：API 地址与后端开关（统一入口，避免多处复制）
 */

export const API_BASE = import.meta.env.VITE_API_BASE || '/api'

/** 是否启用后端 API（?api=static 或 localStorage 开关可关闭，用于纯静态演示模式） */
export const shouldUseBackend = (): boolean => {
  if (typeof window === 'undefined') return true
  const params = new URLSearchParams(window.location.search)
  return params.get('api') !== 'static' && localStorage.getItem('suqu_disable_backend') !== 'true'
}
