/**
 * server/lib/security.js
 * 密码哈希 / 令牌 / Cookie 序列化等安全纯函数：无状态、无闭包依赖，可独立测试。
 *
 * 来源：从 index.js 渐进式拆分第二批。
 * 安全说明：密码使用 scrypt 加盐哈希；令牌使用 sha256；字符串比较使用 timingSafeEqual。
 */
const crypto = require('crypto')

/** 密码强度校验：长度 >= 10 且同时含字母与数字 */
function isStrongPassword(password) {
  const value = String(password || '')
  return value.length >= 10 && /[a-zA-Z]/.test(value) && /\d/.test(value)
}

/** scrypt 加盐哈希，返回 `scrypt:<salt>:<hash>` 格式，salt 随机每次不同 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

/** 校验密码与存储哈希是否匹配（常量时间比较） */
function verifyPassword(password, storedHash) {
  const [scheme, salt, hash] = String(storedHash || '').split(':')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const computed = crypto.scryptSync(String(password), salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return computed.length === expected.length && crypto.timingSafeEqual(computed, expected)
}

/** 令牌摘要（用于安全存储/比对，不存明文） */
function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

/** 序列化 Set-Cookie 字符串 */
function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`]
  parts.push(`Path=${options.path || '/'}`)
  if (options.domain) parts.push(`Domain=${options.domain}`)
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`)
  if (options.httpOnly) parts.push('HttpOnly')
  if (options.secure) parts.push('Secure')
  parts.push(`SameSite=${options.sameSite || 'Lax'}`)
  return parts.join('; ')
}

module.exports = {
  isStrongPassword,
  hashPassword,
  verifyPassword,
  hashToken,
  serializeCookie,
}
