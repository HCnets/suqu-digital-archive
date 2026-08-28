import type { MediaAsset, SensitiveSegmentRow, AuditLog, AdminUser } from './types'
/**
 * 后台纯工具函数（从 App.tsx 拆分）
 */
export function mediaTypeLabel(type: string) {
  const labels: Record<string, string> = {
    image: '图片',
    video: '视频',
    audio: '音频',
    document: '文档',
  }
  return labels[type] || type
}

export function contentTypeLabel(moduleKey: string) {
  const labels: Record<string, string> = {
    archive: '档案点位',
    oral_history: '口述历史',
    song: '红歌资料',
    hero: '英雄人物',
    film: '红色影片',
    letters: '红色家书',
    slogans: '革命标语',
    decrees: '法令文献',
    martyrs: '英烈名录',
    women: '妇女运动',
    origin: '源流资料',
    history: '历史资料',
    relics: '文物遗迹',
    party_route: '党日路线',
    learning_course: '学习课程',
    dashboard_entry: '学习面板入口',
    tour_route: '导览路线',
    long_march: '长征路线',
    director_script: '讲解脚本',
    quiz: '学习题库',
    panorama: '全景展陈',
    checkin: '打卡任务',
    cocreation: '群众共创',
    today_suqu: '今日苏区',
    party_oath: '入党誓词',
    timeline: '时间轴',
    tribute_ceremony: '致敬仪式',
  }
  return labels[moduleKey] || moduleKey
}

export function normalizeCsvTokens(value: string) {
  return value
    .split(/[\r?\n,，、\s]+/)
    .map(item => item.trim())
    .filter(Boolean)
}

export function parseStringArrayJson(value: string) {
  if (!value.trim()) return [] as string[]
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(item => String(item ?? '')).filter(Boolean) : []
  } catch {
    return value
      .split(/\r?\n|,/)
      .map(item => item.trim())
      .filter(Boolean)
  }
}

export function parseNumberArrayJson(value: string) {
  if (!value.trim()) return [] as number[]
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed
        .map(item => Number(item))
        .filter(item => Number.isFinite(item))
      : []
  } catch {
    return value
      .split(/\r?\n|,/)
      .map(item => Number(item.trim()))
      .filter(item => Number.isFinite(item))
  }
}

export function parseCoordinateDraft(longitude: string, latitude: string): [number, number] | null {
  const lng = Number(longitude)
  const lat = Number(latitude)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null
  return [lng, lat]
}

export function pointInPolygon(point: [number, number], polygon: Array<[number, number]>) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0]
    const yi = polygon[i][1]
    const xj = polygon[j][0]
    const yj = polygon[j][1]
    const intersect = ((yi > point[1]) !== (yj > point[1]))
      && (point[0] < ((xj - xi) * (point[1] - yi)) / ((yj - yi) || Number.EPSILON) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

export function isInsideDistrictBoundaries(point: [number, number], boundaries: Array<Array<[number, number]>>) {
  if (!boundaries.length) return false
  return boundaries.some((boundary) => pointInPolygon(point, boundary))
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export function readText(data: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = data[key]
    if (value !== undefined && value !== null) return String(value).trim()
  }
  return ''
}

export function readTextArray(value: unknown) {
  if (Array.isArray(value)) return value.map(item => String(item || '').trim()).filter(Boolean)
  if (typeof value === 'string') return parseStringArrayJson(value)
  return []
}

export function readBoolean(value: unknown, fallback: boolean) {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'string') return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
  return Boolean(value)
}

export function countChineseText(value: string) {
  return value.replace(/\s+/g, '').length
}

export function authorizationStatusLabel(status: string) {
  const labels: Record<string, string> = {
    authorized: '已授权公开',
    pending: '待补授权',
    restricted: '限制公开',
    revoked: '已撤回授权',
  }
  return labels[status] || '授权状态待定'
}

export function transcriptStatusLabel(status: string) {
  const labels: Record<string, string> = {
    raw_imported: '已录入采访素材',
    transcribed: '已完成转写',
    public_edited: '已编辑公开版本',
    review_ready: '可提交审核',
  }
  return labels[status] || '转写待处理'
}

export function aiSummaryStatusLabel(status: string) {
  const labels: Record<string, string> = {
    none: '未使用 AI 摘要',
    manual_imported: '人工补录摘要',
    ai_generated: 'AI 生成待审',
    editor_checked: '编辑已核对',
  }
  return labels[status] || 'AI 摘要待处理'
}

export function auditActionLabel(action: string) {
  const labels: Record<string, string> = {
    setup: '初始化管理员',
    login: '登录后台',
    logout: '退出后台',
    create: '新增记录',
    update: '修改记录',
    delete: '删除记录',
    batch_update: '批量修改',
    submit: '提交审核',
    approve: '审核通过',
    reject: '审核退回',
    unpublish: '取消公开',
    trash: '移入回收站',
    restore: '恢复记录',
    purge: '永久删除',
    upload: '上传素材',
    backup: '创建备份',
    export: '迁出业务数据包',
    import: '迁入业务数据包',
    export_review_records: '生成审核记录包',
    update_default_publish_positions: '修改默认发布位置',
    adjust: '调整计数',
    increment: '增加计数',
    test_connection: '测试 AI 服务',
    run: '执行 AI 任务',
    run_failed: 'AI 任务失败',
    manual_import: '人工补录 AI 结果',
    register_external_job: '登记外部任务',
    provider_callback: '接收外部结果',
    apply_ai_result_draft: 'AI 结果写入草稿',
    apply_ai_result_submit: 'AI 结果提交审核',
  }
  return labels[action] || action
}

export function auditEntityTypeLabel(entityType: string) {
  const labels: Record<string, string> = {
    admin_user: '后台账号',
    region: '地区项目',
    help_article: '帮助内容',
    content_module: '内容类型设置',
    risk_tag_template: '风险标签',
    content: '内容记录',
    content_review_task: '审核记录',
    archive: '旧档案记录',
    message: '留言',
    tribute: '致敬计数',
    media_asset: '媒体素材',
    ai_provider: 'AI 服务',
    ai_task: 'AI 任务',
    database: '业务数据包',
    trash: '回收站',
  }
  return labels[entityType] || entityType
}

export function formatAuditObject(item: AuditLog) {
  if (item.entityType === 'database' && item.entityId === 'json') return '业务数据包文件'
  if (item.entityType === 'trash' && item.entityId === 'all') return '回收站全部内容'
  const label = auditEntityTypeLabel(item.entityType)
  return item.entityId ? `${label}：${item.entityId}` : label
}

export function parseSensitiveSegmentRows(value: string): SensitiveSegmentRow[] {
  return value.split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const match = line.match(/^\[([^\]-]*)-([^\]]*)\]\[([^\]]*)\]\s*(.*?)\s*->\s*(.*)$/)
      if (match) {
        return {
          start: match[1].trim(),
          end: match[2].trim(),
          level: match[3].trim() || '待分级',
          text: match[4].trim(),
          action: match[5].trim(),
        }
      }
      return { start: '', end: '', level: '待分级', text: line, action: '' }
    })
}

export function serializeSensitiveSegmentRows(rows: SensitiveSegmentRow[]) {
  return rows
    .map(row => {
      const start = row.start.trim() || '00:00'
      const end = row.end.trim() || '00:00'
      const level = row.level.trim() || '待分级'
      const text = row.text.trim()
      const action = row.action.trim()
      return `[${start}-${end}][${level}] ${text}${action ? ` -> ${action}` : ''}`.trim()
    })
    .filter(Boolean)
    .join('\n')
}

export function stringifyJsonFieldValue(value: unknown) {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

export function formatDraftSavedAt(value: number | null) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export function statusLabel(status: AdminUser['status']) {
  return status === 'active' ? '启用' : status === 'locked' ? '锁定' : '停用'
}

export function regionLevelLabel(level: string) {
  const labels: Record<string, string> = {
    province: '省',
    city: '市',
    county: '县/区',
    town: '镇/街道',
    village: '村/社区',
    site: '点位',
  }
  return labels[level] || level
}

export function displayModeLabel(mode: string) {
  const labels: Record<string, string> = {
    current: '当前地区',
    overview: '地区总览',
    auto_location: '定位切换',
  }
  return labels[mode] || mode
}

export function mapModeLabel(mode: string) {
  const labels: Record<string, string> = {
    single: '单地区',
    aggregate: '聚合',
    mixed: '混合',
  }
  return labels[mode] || mode
}

export function contentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: '草稿',
    pending_review: '待审核',
    in_review: '审核中',
    published: '已发布',
    rejected: '已驳回',
    unpublished: '已下架',
    deleted: '已删除',
  }
  return labels[status] || status
}

export function sensitiveLabel(level: string) {
  const labels: Record<string, string> = {
    normal: '普通',
    attention: '需注意',
    sensitive: '敏感',
    critical: '重大敏感',
  }
  return labels[level] || level
}

export function reviewStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: '待处理',
    approved: '已通过',
    rejected: '已驳回',
    cancelled: '已取消',
  }
  return labels[status] || status
}

export function mediaProcessingText(asset: MediaAsset) {
  const note = asset.processingNote || ''
  const statusLabels: Record<string, string> = {
    stored: '已保存源文件',
    queued: '等待处理',
    processed: '处理完成',
    failed: '处理失败',
  }
  if (!note) return statusLabels[asset.processingStatus] || asset.processingStatus
  if (/Image compressed to WebP with watermark/i.test(note)) return '图片已压缩为 WebP，并已添加水印。'
  if (/Image compressed to WebP/i.test(note)) return '图片已压缩为 WebP。'
  if (/Watermark skipped because image is too small/i.test(note)) return '图片尺寸过小，已跳过水印。'
  if (/GIF stored without watermark\/compression/i.test(note)) return 'GIF 已原样保存，暂未进行水印或压缩处理。'
  if (/Image processor sharp is unavailable/i.test(note)) return '图片处理组件不可用，已保存原图。'
  if (/Video transcoded to H\.264 MP4/i.test(note)) return '视频已转码为 H.264 MP4。'
  if (/Video stored with metadata and thumbnail processing/i.test(note)) return '视频已保存，并已处理元数据和缩略图。'
  if (/Video processor unavailable or failed/i.test(note)) return `视频处理失败：${note.replace(/^Video processor unavailable or failed:\s*/i, '')}`
  if (/Audio transcoded to MP3/i.test(note)) return '音频已压缩转码为 MP3。'
  if (/Audio stored with metadata processing/i.test(note)) return '音频已保存，并已读取基础元数据。'
  if (/Audio processor unavailable or failed/i.test(note)) return `音频处理失败：${note.replace(/^Audio processor unavailable or failed:\s*/i, '')}`
  if (/Document stored after signature validation/i.test(note)) return '文档已通过签名校验并保存。'
  return note
}

export function aiTaskTypeLabel(type: string) {
  const labels: Record<string, string> = {
    transcription: '音视频转写',
    public_summary: '可公开摘要',
    risk_hint: '风险提示',
    story_script: '故事稿',
    narration_script: '讲解稿',
    tts_audio: 'TTS 讲解音频',
    digital_human_video: '数字人视频',
    keyword_extract: '关键词',
    timeline: '事件时间线',
  }
  return labels[type] || type
}

export function aiProviderTypeLabel(type: string) {
  const labels: Record<string, string> = {
    openai_compatible: '通用大模型服务',
    mimo_tts: '小米 MiMo 语音（TTS）',
    manual_only: '仅人工补录',
  }
  return labels[type] || type
}

export function aiTargetTypeLabel(type: string) {
  const labels: Record<string, string> = {
    oral_history: '口述历史',
    archive: '档案点位',
    content: '普通内容',
  }
  return labels[type] || type
}

export function riskLevelLabel(level: string) {
  const labels: Record<string, string> = {
    medium: '中',
    high: '高',
    critical: '重大',
  }
  return labels[level] || level
}

export function aiTaskStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: '草稿',
    pending: '待处理',
    running: '运行中',
    completed: '已完成',
    failed: '失败',
    imported: '人工补录',
  }
  return labels[status] || status
}

export function aiProviderTestStatusLabel(status: string) {
  const labels: Record<string, string> = {
    ok: '测试通过',
    failed: '测试失败',
  }
  return labels[status] || '-'
}

export function aiCallStatusLabel(status: string) {
  const labels: Record<string, string> = {
    ok: '成功',
    failed: '失败',
  }
  return labels[status] || status || '-'
}

export function aiLogActionLabel(action: string) {
  const labels: Record<string, string> = {
    test_connection: '测试服务',
    run_task: '运行任务',
    manual_import: '人工补录',
    apply_result_draft: '应用为草稿',
    apply_result_submit: '应用并提交审核',
  }
  return labels[action] || action
}

export function transcriptionSourceLabel(source: string) {
  const labels: Record<string, string> = {
    ai_task: 'AI 转写任务',
    manual: '人工录入',
    import: '外部资料录入',
  }
  return labels[source] || source || '-'
}

export function formatStructuredData(data: Record<string, unknown>) {
  if (!data || !Object.keys(data).length) return '暂无补充信息'
  return JSON.stringify(data, null, 2)
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

export function formatReadableTimeValue(value: string) {
  if (!value) return ''
  const parsed = Number(value)
  const date = Number.isFinite(parsed) && parsed > 0 ? new Date(parsed) : new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

