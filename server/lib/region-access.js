/**
 * 从 index.js 拆出的辅助函数
 */
const { collectRegionAndDescendantIds, filterArchivesByRegionIds, parseRegionIdQuery, rowToRegion, hasValidArchiveCoordinates, inferTrustLevelFromSources } = require('./rows')
const { cleanText, safeJsonValue } = require('./utils')
const { resolveDisplayScopeRegionIds, inferMapView } = require('./misc')
const { sendError, getBearerToken, getCookieValue, secureEqual } = require('./server-helpers')
const { hashToken } = require('./security')

// 运行期注入的依赖（由 index.js 调用 init() 传入）
let ADMIN_CORE_STORE
let CSRF_HEADER_NAME
let DEFAULT_CONTENT_MODULE_PUBLISH_POSITIONS
let RUNTIME_MISC_STORE
let SAFE_HTTP_METHODS
let SESSION_COOKIE_NAME
function init(deps) {
  ADMIN_CORE_STORE = deps.ADMIN_CORE_STORE
  CSRF_HEADER_NAME = deps.CSRF_HEADER_NAME
  DEFAULT_CONTENT_MODULE_PUBLISH_POSITIONS = deps.DEFAULT_CONTENT_MODULE_PUBLISH_POSITIONS
  RUNTIME_MISC_STORE = deps.RUNTIME_MISC_STORE
  SAFE_HTTP_METHODS = deps.SAFE_HTTP_METHODS
  SESSION_COOKIE_NAME = deps.SESSION_COOKIE_NAME
}

function getDefaultRegionId() {
  const region = listRegions().find((item) => item.isActive && item.isDefault) || listRegions().find((item) => item.isActive)
  return region?.id || 'region-suqu'
}

function getUserRegionScope(user) {
  if (!user) return { allRegions: false, assignedRegionIds: [], scopeRegionIds: [] }
  const activeRegions = listRegions().filter((region) => region.isActive)
  if (userHasAllRegionAccess(user)) {
    return {
      allRegions: true,
      assignedRegionIds: activeRegions.map((region) => region.id),
      scopeRegionIds: activeRegions.map((region) => region.id),
    }
  }

  const assignedRegionIds = listUserAssignedRegionIds(user.id).filter((id) => activeRegions.some((region) => region.id === id))
  const baseIds = assignedRegionIds.length > 0 ? assignedRegionIds : [getDefaultRegionId()]
  const scopeRegionIds = new Set()
  for (const regionId of baseIds) {
    for (const scopedId of collectRegionAndDescendantIds(regionId, activeRegions)) {
      scopeRegionIds.add(scopedId)
    }
  }
  return { allRegions: false, assignedRegionIds: baseIds, scopeRegionIds: [...scopeRegionIds] }
}

function getContentRegionId(content) {
  const data = content?.currentVersion?.data || content?.publishedVersion?.data || content?.data || {}
  return cleanText(data.regionId || data.region_id || '', 120) || getDefaultRegionId()
}

function canUserAccessContent(user, content) {
  if (!content) return false
  const scope = getUserRegionScope(user)
  if (scope.allRegions) return true
  return scope.scopeRegionIds.includes(getContentRegionId(content))
}

function normalizeContentRegionData(input) {
  const source = input && typeof input === 'object' ? input : {}
  const regionId = cleanText(source.regionId || source.region_id || '', 120) || getDefaultRegionId()
  const region = findRegion(regionId)
  if (!region || !region.isActive) return { error: '请选择有效的所属地区。' }

  return {
    data: {
      ...source,
      regionId,
      region_id: regionId,
      regionName: region.fullName || region.name,
      region_name: region.fullName || region.name,
    },
  }
}

function publicAdminUser(user, includePermissions = false) {
  if (!user) return null
  const regionScope = getUserRegionScope(user)
  const payload = {
    id: user.id,
    username: user.username,
    realName: user.real_name || user.realName,
    phone: user.phone || '',
    email: user.email || '',
    department: user.department || '',
    roleId: user.role_id || user.roleId,
    roleName: user.role_name || user.roleName || '',
    status: user.status,
    notes: user.notes || '',
    lastLoginAt: user.last_login_at || null,
    regionIds: regionScope.assignedRegionIds,
    regionScopeIds: regionScope.scopeRegionIds,
    allRegions: regionScope.allRegions,
    createdBy: user.created_by || user.createdBy || null,
    createdAt: user.created_at || user.createdAt,
    updatedAt: user.updated_at || user.updatedAt,
  }
  if (includePermissions) payload.permissions = getUserPermissionCodes(user.id)
  return payload
}

function buildPublicRegionConfig(regionId = '') {
  const regions = listRegions()
  const activeRegions = regions.filter((region) => region.isActive)
  const requestedRegionId = cleanText(regionId, 120)
  const requestedRegion = requestedRegionId ? activeRegions.find((region) => region.id === requestedRegionId) : null
  const defaultRegion = requestedRegion || activeRegions.find((region) => region.isDefault) || activeRegions[0] || null
  const displayMode = defaultRegion?.displayMode || 'current'
  const mapMode = defaultRegion?.mapMode || 'single'
  const scopeRegionIds = resolveDisplayScopeRegionIds(defaultRegion, activeRegions)
  const archives = listAllPublicArchiveMapPoints()
  const scopedArchives = filterArchivesByRegionIds(archives, scopeRegionIds)

  return {
    defaultRegion,
    regions: activeRegions,
    displayMode,
    mapMode,
    scopeRegionIds,
    mapView: inferMapView(scopedArchives.length > 0 ? scopedArchives : archives, mapMode),
    generatedAt: Date.now(),
  }
}

function filterArchiveResultByRegionQuery(result, query) {
  const requestedRegionIds = parseRegionIdQuery(query.regionId || query.regionIds)
  if (requestedRegionIds.length === 0) return result

  const activeRegions = listRegions().filter((region) => region.isActive)
  const scopeRegionIds = new Set()
  for (const regionId of requestedRegionIds) {
    const region = activeRegions.find((item) => item.id === regionId)
    if (!region) continue
    for (const scopedId of collectRegionAndDescendantIds(region.id, activeRegions)) {
      scopeRegionIds.add(scopedId)
    }
  }

  const items = scopeRegionIds.size > 0 ? filterArchivesByRegionIds(result.items, [...scopeRegionIds]) : []
  return {
    ...result,
    items,
    total: items.length,
    paginated: true,
  }
}

function requirePermission(permissionCode) {
  return async (req, res, next) => {
    await requireAuth(req, res, () => {})
    if (res.headersSent || !req.user) return
    const permissions = await getUserPermissionCodesAsync(req.user.id)
    req.userPermissions = permissions
    if (!permissions.includes(permissionCode)) {
      return sendError(res, 403, 'FORBIDDEN', 'You do not have permission to perform this action.')
    }
    next()
  }
}

function requireAnyPermission(permissionCodes) {
  return async (req, res, next) => {
    await requireAuth(req, res, () => {})
    if (res.headersSent || !req.user) return
    const permissions = await getUserPermissionCodesAsync(req.user.id)
    req.userPermissions = permissions
    if (!permissionCodes.some((code) => permissions.includes(code))) {
      return sendError(res, 403, 'FORBIDDEN', 'You do not have permission to perform this action.')
    }
    next()
  }
}

function normalizeUserRegionIdsInput(value) {
  const raw = Array.isArray(value) ? value : String(value || '').split(',')
  const ids = Array.from(new Set(raw.map((item) => cleanText(item, 120)).filter(Boolean)))
  if (ids.length > 100) return { error: '最多只能为一个账号分配 100 个地区。' }

  for (const id of ids) {
    const region = findRegion(id)
    if (!region || !region.isActive) return { error: `地区权限不存在或已停用：${id}` }
  }
  return { items: ids }
}

function normalizeAdminUserInput(input, options = {}) {
  if (!input || typeof input !== 'object') return { error: 'User payload must be an object.' }

  const username = cleanText(input.username, 80).toLowerCase()
  const realName = cleanText(input.realName || input.real_name || input.name || username, 80)
  const phone = cleanText(input.phone || '', 30)
  const email = cleanText(input.email || '', 120)
  const department = cleanText(input.department || '', 120)
  const roleId = cleanText(input.roleId || input.role_id || 'content_editor', 80)
  const status = cleanText(input.status || 'active', 20)
  const notes = cleanText(input.notes || '', 1000)
  const regionIds = normalizeUserRegionIdsInput(input.regionIds || input.region_ids || input.regions || [])

  if (!/^[a-zA-Z0-9_.-]{3,80}$/.test(username)) {
    return { error: '用户名需为 3-80 位，只能包含字母、数字、下划线、点和短横线。' }
  }
  if (!realName) return { error: '请填写真实姓名。' }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Email is invalid.' }
  if (!['active', 'disabled', 'locked'].includes(status)) return { error: 'User status is invalid.' }
  if (regionIds.error) return { error: regionIds.error }
  if (options.requirePassword && !input.password) return { error: '请填写密码。' }

  return {
    user: {
      username,
      realName,
      phone,
      email,
      department,
      roleId,
      status,
      notes,
      regionIds: regionIds.items,
    },
  }
}

function userHasAllRegionAccess(user) {
  if (!user) return false
  const roleId = user.role_id || user.roleId
  if (roleId === 'super_admin') return true
  return getUserPermissionCodes(user.id).includes('regions.manage')
}

function requireContentRegionAccess(req, res, content) {
  if (canUserAccessContent(req.user, content)) return true
  sendError(res, 403, 'REGION_FORBIDDEN', '该内容不在你的地区权限范围内。')
  return false
}

function listRegions() {
  const rows = ADMIN_CORE_STORE.listRegions()
  return rows.map(rowToRegion)
}

function listUserAssignedRegionIds(userId) {
  return ADMIN_CORE_STORE.listUserAssignedRegionIds(userId)
}

function findRegion(id) {
  const row = ADMIN_CORE_STORE.findRegion(id)
  return row ? rowToRegion(row) : null
}

function getUserPermissionCodes(userId) {
  const user = findAdminUserById(userId)
  if (!user) return []
  const permissions = new Set(getRolePermissionCodes(user.role_id))
  const overrides = ADMIN_CORE_STORE.listUserPermissionOverrides(userId)
  for (const override of overrides) {
    if (override.effect === 'allow') permissions.add(override.permission_code)
    if (override.effect === 'deny') permissions.delete(override.permission_code)
  }
  return [...permissions].sort()
}

function listAllPublicArchiveMapPoints() {
  const publishedRows = RUNTIME_MISC_STORE.listPublicArchiveMapRows()

  return publishedRows.map(rowToPublicArchive).filter(hasValidArchiveCoordinates)
}

async function requireAuth(req, res, next) {
  const auth = getSessionAuth(req)
  const session = await findSessionByTokenAsync(auth.token)
  if (!session) return sendError(res, 401, 'UNAUTHENTICATED', 'Authentication is required.')
  if (auth.source === 'cookie' && !SAFE_HTTP_METHODS.has(req.method) && !hasValidCsrfToken(req, session)) {
    return sendError(res, 403, 'CSRF_TOKEN_INVALID', 'CSRF token is missing or invalid.')
  }
  const user = await findAdminUserByIdAsync(session.user_id)
  if (!user || user.status !== 'active') return sendError(res, 403, 'USER_DISABLED', 'This account is not active.')
  await ADMIN_CORE_STORE.touchSessionLastSeen(session.id, Date.now())
  req.session = session
  req.authSource = auth.source
  req.user = user
  req.adminActor = user.username
  next()
}

async function getUserPermissionCodesAsync(userId) {
  const user = await findAdminUserByIdAsync(userId)
  if (!user) return []
  const permissions = new Set(await getRolePermissionCodesAsync(user.role_id))
  const overrides = await ADMIN_CORE_STORE.listUserPermissionOverrides(userId)
  for (const override of overrides) {
    if (override.effect === 'allow') permissions.add(override.permission_code)
    if (override.effect === 'deny') permissions.delete(override.permission_code)
  }
  return [...permissions].sort()
}

function findAdminUserById(id) {
  return ADMIN_CORE_STORE.findAdminUserById(id)
}

function getRolePermissionCodes(roleId) {
  return ADMIN_CORE_STORE.listRolePermissionCodes(roleId)
}

function rowToPublicArchive(row) {
  const data = safeJsonValue(row.data_json) || {}
  const sources = row.id ? getPublicContentSources(row.id) : []
  const publishPositions = normalizeArchivePublishPositions(data.publishPositions || data.publish_positions || {})
  const detailBlocks = Array.isArray(data.detailBlocks)
    ? data.detailBlocks
    : Array.isArray(data.detail_blocks)
      ? data.detail_blocks
      : []
  return {
    id: data.legacyId || row.id,
    title: row.version_title || row.title,
    description: row.version_summary || row.summary || '',
    content: row.body || '',
    regionId: data.regionId || data.region_id || '',
    regionName: data.regionName || data.region_name || '',
    type: data.archiveType || data.archive_type || data.type || row.category || 'revolution',
    year: Number(data.year || 0),
    longitude: Number(data.longitude || 0),
    latitude: Number(data.latitude || 0),
    address: data.address || data.location || '',
    historyPeriod: data.historyPeriod || data.history_period || '',
    relatedPeople: Array.isArray(data.relatedPeople) ? data.relatedPeople : Array.isArray(data.related_people) ? data.related_people : [],
    relatedEvents: Array.isArray(data.relatedEvents) ? data.relatedEvents : Array.isArray(data.related_events) ? data.related_events : [],
    publishPositions,
    detailBlocks,
    oralHistories: Array.isArray(data.oralHistories)
      ? data.oralHistories
      : Array.isArray(data.oral_histories)
        ? data.oral_histories
        : Array.isArray(data.oralHistory)
          ? data.oralHistory
          : [],
    aiNarration: data.aiNarration || data.ai_narration || null,
    learningQuestions: Array.isArray(data.learningQuestions)
      ? data.learningQuestions
      : Array.isArray(data.learning_questions)
        ? data.learning_questions
        : [],
    routeTips: Array.isArray(data.routeTips)
      ? data.routeTips
      : Array.isArray(data.route_tips)
        ? data.route_tips
        : [],
    publicMessages: Array.isArray(data.publicMessages)
      ? data.publicMessages
      : Array.isArray(data.public_messages)
        ? data.public_messages
        : [],
    coverImage: data.coverImage || data.cover_image || '',
    media: Array.isArray(data.media) ? data.media : [],
    displayTimeline: Array.isArray(data.displayTimeline) ? data.displayTimeline : Array.isArray(data.display_timeline) ? data.display_timeline : [],
    sources,
    trustLevel: data.trustLevel || data.trust_level || inferTrustLevelFromSources(sources),
    auditStatus: 'published',
    publishedAt: row.published_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function getSessionAuth(req) {
  const bearer = getBearerToken(req)
  if (bearer) return { token: bearer, source: 'bearer' }
  const cookieToken = getCookieValue(req, SESSION_COOKIE_NAME)
  return cookieToken ? { token: cookieToken, source: 'cookie' } : { token: '', source: 'none' }
}

async function findSessionByTokenAsync(token) {
  if (!token) return null
  const row = await ADMIN_CORE_STORE.findSessionByTokenHash(hashToken(token))
  if (!row || row.expires_at <= Date.now()) {
    if (row) await ADMIN_CORE_STORE.deleteSessionById(row.id)
    return null
  }
  return row
}

function hasValidCsrfToken(req, session) {
  if (!session?.csrf_token) return false
  const provided = req.get(CSRF_HEADER_NAME) || ''
  return secureEqual(provided, session.csrf_token)
}

async function findAdminUserByIdAsync(id) {
  return await ADMIN_CORE_STORE.findAdminUserById(id)
}

async function getRolePermissionCodesAsync(roleId) {
  return await ADMIN_CORE_STORE.listRolePermissionCodes(roleId)
}

function getPublicContentSources(contentId) {
  return RUNTIME_MISC_STORE.listPublicContentSourceRows(contentId).map((row) => ({
    sourceType: row.source_type || '',
    sourceTitle: row.source_title || '',
    sourceUrl: row.source_url || '',
    archiveRef: row.archive_ref || '',
    pageRef: row.page_ref || '',
    collector: row.collector || '',
    collectedAt: row.collected_at || '',
    trustLevel: row.trust_level || '',
    notes: row.notes || '',
    createdAt: row.created_at,
  }))
}

function normalizeArchivePublishPositions(value, defaults = getStaticContentModulePublishDefaults('archive')) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const readFlag = (camelKey, snakeKey, fallback = false) => {
    const raw = source[camelKey] ?? source[snakeKey]
    if (raw === undefined || raw === null || raw === '') return fallback
    if (typeof raw === 'string') return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase())
    return Boolean(raw)
  }
  return {
    map: readFlag('map', 'map', defaults.map),
    list: readFlag('list', 'list', defaults.list),
    home: readFlag('home', 'home', defaults.home),
    topic: readFlag('topic', 'topic', defaults.topic),
    guide: readFlag('guide', 'guide', defaults.guide),
  }
}

function getStaticContentModulePublishDefaults(moduleKey) {
  return DEFAULT_CONTENT_MODULE_PUBLISH_POSITIONS[moduleKey] || DEFAULT_CONTENT_MODULE_PUBLISH_POSITIONS.default
}

module.exports = { init, getDefaultRegionId, getUserRegionScope, getContentRegionId, canUserAccessContent, normalizeContentRegionData, publicAdminUser, buildPublicRegionConfig, filterArchiveResultByRegionQuery, requirePermission, requireAnyPermission, normalizeUserRegionIdsInput, normalizeAdminUserInput, userHasAllRegionAccess, requireContentRegionAccess, listRegions, listUserAssignedRegionIds, findRegion, getUserPermissionCodes, listAllPublicArchiveMapPoints, requireAuth, getUserPermissionCodesAsync, findAdminUserById, getRolePermissionCodes, rowToPublicArchive, getSessionAuth, findSessionByTokenAsync, hasValidCsrfToken, findAdminUserByIdAsync, getRolePermissionCodesAsync, getPublicContentSources, normalizeArchivePublishPositions, getStaticContentModulePublishDefaults }
