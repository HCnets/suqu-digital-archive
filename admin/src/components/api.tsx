/**
 * 后台通用组件（从 App.tsx 拆分）
 */

export const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || ''

export const AMAP_SECURITY_JS_CODE = import.meta.env.VITE_AMAP_SECURITY_JS_CODE || ''

export const CSRF_HEADER = 'X-CSRF-Token'

export const SAFE_HTTP_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include' })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(localizeApiError(payload, response.status))
  }
  return response.json() as Promise<T>
}

export function localizeApiError(payload: unknown, status: number) {
  const error = payload && typeof payload === 'object' && 'error' in payload
    ? (payload as { error?: { code?: string; message?: string } }).error
    : null
  const code = error?.code || ''
  const labels: Record<string, string> = {
    WEAK_PASSWORD: '密码至少 10 位，并且必须同时包含字母和数字。',
    INVALID_CREDENTIALS: '用户名或密码不正确。',
    LOGIN_LOCKED: '登录失败次数过多，请稍后再试。',
    USERNAME_EXISTS: '用户名已存在，请换一个用户名。',
    SETUP_CLOSED: '初始化入口已关闭，超级管理员已经创建。',
    UNAUTHENTICATED: '请先登录后台。',
    CSRF_TOKEN_INVALID: '登录校验已失效，请刷新页面或重新登录。',
    FORBIDDEN: '当前账号不能执行这个操作。',
    INVALID_JSON: '业务数据包或补充输入格式不正确，请检查后重试。',
    INVALID_IMPORT: '业务数据包格式不正确。',
    PAYLOAD_TOO_LARGE: '上传内容过大。',
    CONTENT_IDS_REQUIRED: '请至少选择一条内容。',
    MEDIA_IDS_REQUIRED: '请至少选择一个媒体文件。',
    TOO_MANY_ITEMS: '一次最多只能批量处理 50 项。',
    INVALID_BATCH_PATCH: '批量更新字段不正确。',
    BATCH_UPDATE_FAILED: '批量更新失败。',
    INVALID_REGION: '地区信息不正确，请检查必填项和层级关系。',
    REGION_NOT_FOUND: '地区不存在。',
    DEFAULT_REGION_LOCKED: '默认地区不能删除，请先设置其他默认地区。',
    REGION_HAS_CHILDREN: '该地区下仍有子地区，请先处理子地区。',
  }
  if (labels[code]) return labels[code]
  if (error?.message) return error.message
  return `请求失败：HTTP ${status}`
}

