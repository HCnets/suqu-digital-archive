/**
 * server/lib/utils.js
 * 纯工具函数：无状态、无副作用、不依赖任何运行时闭包变量，可独立测试。
 *
 * 来源：从 index.js（9479 行单文件）渐进式拆分的第一步。
 * 新增通用工具函数应优先放在这里并补充测试，避免继续堆进 index.js。
 */
const crypto = require('crypto')

/** 清洗文本：剔除控制字符、去首尾空白、截断长度 */
function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength)
}

/** 解析布尔标志：兼容 boolean/number/常见字符串表示 */
function readBooleanFlag(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) return true
    if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) return false
  }
  return Boolean(value)
}

/** 解析 JSON 字符串，失败返回 null */
function safeJsonValue(value) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

/** 解析 JSON 数组，非数组返回 [] */
function safeJsonArray(value) {
  const parsed = safeJsonValue(value)
  return Array.isArray(parsed) ? parsed : []
}

/** 解析正整数，非法时返回 fallback */
function parsePositiveInt(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

/** 钳制到 [min, max] */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

/** 校验致敬数：必须为非负整数，非法返回 null */
function normalizeTributeCount(value) {
  const count = Number(value)
  if (!Number.isInteger(count) || count < 0 || count > Number.MAX_SAFE_INTEGER) return null
  return count
}

/** 校验致敬增量：须为 [-1_000_000, 1_000_000] 整数，非法返回 null */
function normalizeTributeDelta(value) {
  const delta = Number(value)
  if (!Number.isInteger(delta) || delta < -1000000 || delta > 1000000) return null
  return delta
}

/** 生成带时间戳+随机数的 ID */
function makeId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
}

/** 生成基于输入值的内容稳定 ID（同输入同输出） */
function makeStableId(prefix, value) {
  return `${prefix}-${crypto.createHash('sha1').update(String(value)).digest('hex').slice(0, 16)}`
}

module.exports = {
  cleanText,
  readBooleanFlag,
  safeJsonValue,
  safeJsonArray,
  parsePositiveInt,
  clamp,
  normalizeTributeCount,
  normalizeTributeDelta,
  makeId,
  makeStableId,
}
