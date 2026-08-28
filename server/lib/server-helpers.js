/**
 * 从 index.js 拆出的独立辅助函数
 */
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

function resolveDataDir(value) {
  if (!value) return path.join(__dirname, 'data')
  return path.isAbsolute(value) ? value : path.resolve(__dirname, value)
}

function loadOptionalPackage(packageName) {
  try {
    return require(packageName)
  } catch (error) {
    console.warn(`[WARN] Optional package ${packageName} is unavailable: ${error.message}`)
    return null
  }
}

function resolveOptionalBinary(envName, packageName, fallbackCommand) {
  if (process.env[envName]) return process.env[envName]
  try {
    const resolved = require(packageName)
    return typeof resolved === 'string' ? resolved : resolved?.path || fallbackCommand
  } catch {
    return fallbackCommand
  }
}

function isAdminHost(req) {
  const host = String(req.headers.host || '').split(':')[0].toLowerCase()
  return host === 'admin.szht.online' || host === 'admin.localhost' || host.startsWith('admin.')
}

function isLocalAdminPath(req) {
  return req.path === '/admin' || req.path.startsWith('/admin/')
}

function normalizePublishPositionsConfig(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: '发布位置配置格式不正确。' }
  const readFlag = (key) => {
    const raw = input[key]
    if (typeof raw === 'boolean') return raw
    if (raw === 0 || raw === 1) return Boolean(raw)
    if (typeof raw === 'string') {
      const value = raw.toLowerCase()
      if (['1', 'true', 'yes', 'on'].includes(value)) return true
      if (['0', 'false', 'no', 'off'].includes(value)) return false
    }
    return null
  }
  const positions = {
    map: readFlag('map'),
    list: readFlag('list'),
    home: readFlag('home'),
    topic: readFlag('topic'),
    guide: readFlag('guide'),
  }
  if (Object.values(positions).some((value) => value === null)) return { error: '发布位置必须是布尔值。' }
  return { positions }
}

function getBearerToken(req) {
  const auth = req.get('authorization') || ''
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim()
  return ''
}

function getCookieValue(req, name) {
  const raw = req.get('cookie') || ''
  const pairs = raw.split(';')
  for (const pair of pairs) {
    const index = pair.indexOf('=')
    if (index < 0) continue
    const key = pair.slice(0, index).trim()
    if (key !== name) continue
    try {
      return decodeURIComponent(pair.slice(index + 1).trim())
    } catch {
      return pair.slice(index + 1).trim()
    }
  }
  return ''
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    console.warn(`[WARN] Could not read JSON seed ${filePath}: ${error.message}`)
    return fallback
  }
}

function copyDirectory(source, target) {
  const resolvedSource = path.resolve(source)
  const resolvedTarget = path.resolve(target)
  if (!fs.existsSync(resolvedSource)) return

  fs.mkdirSync(resolvedTarget, { recursive: true })
  for (const entry of fs.readdirSync(resolvedSource, { withFileTypes: true })) {
    const sourcePath = path.join(resolvedSource, entry.name)
    const targetPath = path.join(resolvedTarget, entry.name)
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath)
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath)
    }
  }
}

function getDirectorySize(dirPath) {
  const resolved = path.resolve(dirPath)
  if (!fs.existsSync(resolved)) return 0
  return fs.readdirSync(resolved, { withFileTypes: true }).reduce((total, entry) => {
    const entryPath = path.join(resolved, entry.name)
    if (entry.isDirectory()) return total + getDirectorySize(entryPath)
    if (entry.isFile()) return total + fs.statSync(entryPath).size
    return total
  }, 0)
}

function getSnapshotTables() {
  return [
    'archives',
    'messages',
    'tributes',
    'admin_users',
    'roles',
    'permissions',
    'role_permissions',
    'regions',
    'user_regions',
    'risk_tag_templates',
    'content_modules',
    'review_workflows',
    'review_workflow_steps',
    'contents',
    'content_versions',
    'content_sources',
    'content_review_tasks',
    'media_assets',
    'ai_providers',
    'ai_tasks',
    'ai_call_logs',
    'audit_logs',
  ]
}

function getImportOnlyTables() {
  return ['sessions', 'login_attempts']
}

function publicMediaAsset(asset) {
  if (!asset || typeof asset !== 'object') return asset
  const { storagePath, originalStoragePath, ...publicAsset } = asset
  return publicAsset
}

function isPathInside(targetPath, rootPath) {
  const root = path.resolve(rootPath)
  const target = path.resolve(targetPath)
  const relative = path.relative(root, target)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function getProvidedAdminToken(req) {
  const auth = req.get('authorization') || ''
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim()
  return req.get('x-admin-token') || ''
}

function secureEqual(a, b) {
  const left = Buffer.from(String(a))
  const right = Buffer.from(String(b))
  return left.length === right.length && crypto.timingSafeEqual(left, right)
}

function getClientIp(req) {
  const forwarded = req.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.ip || req.socket.remoteAddress || 'unknown'
}

function sendError(res, status, code, message, detail) {
  const payload = { error: { code, message } }
  if (detail !== undefined) payload.error.detail = detail
  res.status(status).json(payload)
}

function stripPrivateMessageFields(message) {
  return {
    id: message.id,
    name: message.name,
    identity: message.identity,
    text: message.text,
    inReplyTo: message.inReplyTo || '',
    createdAt: message.createdAt,
  }
}

module.exports = { resolveDataDir, loadOptionalPackage, resolveOptionalBinary, isAdminHost, isLocalAdminPath, normalizePublishPositionsConfig, getBearerToken, getCookieValue, readJson, copyDirectory, getDirectorySize, getSnapshotTables, getImportOnlyTables, publicMediaAsset, isPathInside, getProvidedAdminToken, secureEqual, getClientIp, sendError, stripPrivateMessageFields }
