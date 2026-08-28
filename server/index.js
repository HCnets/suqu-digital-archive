const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { execFile } = require('child_process')
const { cleanText, readBooleanFlag, safeJsonArray, safeJsonValue, parsePositiveInt, clamp, normalizeTributeCount, normalizeTributeDelta, makeId, makeStableId } = require('./lib/utils')
const { isStrongPassword, hashPassword, verifyPassword, hashToken, serializeCookie } = require('./lib/security')
const { requireContentRegionAccessAsync, rowToWorkflow, rowToWorkflowAsync, getNextWorkflowStep, getNextWorkflowStepAsync, getWorkflowStepByIdAsync } = require('./lib/workflow-extra')
const { normalizeAdminUserInputAsync, getUserRegionScopeAsync, canUserAccessContentAsync, publicAdminUserAsync, buildPublicRegionConfigAsync, normalizeAiTaskInputAsync, normalizeAiTaskInputJsonAsync, normalizeAiTaskApplicationInputAsync, normalizeContentRegionDataAsync, rowToContentSummaryAsync, buildReviewSignalsAsync, rowToPublicContent, rowToPublicContentAsync, findPublicArchiveByIdAsync, filterArchiveResultByRegionQueryAsync, rowToPublicArchiveAsync, rowToReviewTaskAsync, normalizeContentInputAsync, normalizeInteractiveContentDataAsync, normalizePartyRouteDataAsync, normalizeLearningCourseDataAsync, normalizeUserRegionIdsInputAsync, listRegionsAsync, userHasAllRegionAccessAsync, listUserAssignedRegionIdsAsync, getDefaultRegionIdAsync, getContentRegionIdAsync, listAllPublicArchiveMapPointsAsync, findAiProviderAsync, findRegionAsync, getRiskTagTemplateMapAsync, findPublishedArchiveContentAsync, getPublicContentSourcesAsync, getWorkflowStepsAsync, normalizeArchivePointDataAsync, getContentModuleDefaultPublishPositionsAsync, normalizeOralHistoryDataAsync, preloadContentSourcesForRowsAsync, findContentAsync, findPendingReviewTaskAsync, listContentReviewTasksAsync } = require('./lib/async-ops')
const { findHelpArticleConfig, saveHelpArticleConfig, saveAllHelpArticleConfigs, listHelpArticlesConfig, normalizeHelpArticleInput, readHelpArticlesOverrideMap, writeHelpArticlesOverrideMap, getDefaultHelpArticlesMap } = require('./lib/help-articles')
const { processMediaUpload, findMediaAssetAsync } = require('./lib/media-ops')
const { normalizeAiProviderInput, normalizeAiTaskInput, normalizeAiTaskInputJson, normalizeAiTaskApplicationInput, rowToAiProvider, encryptSecret, decryptSecret, normalizeAiProviderConfig, findAiProvider, findMediaAsset, normalizeContentInput, getAiSecretKey, normalizeArchivePointData, getContentModuleDefaultPublishPositions, normalizeOralHistoryData, normalizeInteractiveContentData, normalizeArchiveDetailBlocks, findContent, normalizePartyRouteData, normalizeLearningCourseData, normalizeDashboardEntryData, rowToContentSummary, findPendingReviewTask, listContentReviewTasks, findPublicArchiveById, buildReviewSignals, rowToReviewTask, findPublishedArchiveContent, getRiskTagTemplateMap } = require('./lib/ai-ops')
const { getDefaultRegionId, getUserRegionScope, getContentRegionId, canUserAccessContent, normalizeContentRegionData, publicAdminUser, buildPublicRegionConfig, filterArchiveResultByRegionQuery, requirePermission, requireAnyPermission, normalizeUserRegionIdsInput, normalizeAdminUserInput, userHasAllRegionAccess, requireContentRegionAccess, listRegions, listUserAssignedRegionIds, findRegion, getUserPermissionCodes, listAllPublicArchiveMapPoints, requireAuth, getUserPermissionCodesAsync, findAdminUserById, getRolePermissionCodes, rowToPublicArchive, getSessionAuth, findSessionByTokenAsync, hasValidCsrfToken, findAdminUserByIdAsync, getRolePermissionCodesAsync, getPublicContentSources, normalizeArchivePublishPositions, getStaticContentModulePublishDefaults } = require('./lib/region-access')
const { init, getWorkflowStepById, getWorkflowSteps } = require('./lib/workflow')
const { resolveDisplayScopeRegionIds, inferMapView, rowToCheckinProgress } = require('./lib/misc')
const { normalizeAiCapabilities, normalizeAiResultJson, validateAiTaskAgainstProvider, normalizeAiExternalJobInput, normalizeAiCallbackInput, normalizeAiCallbackStatus, normalizeAiResultMediaAsset, testAiProvider, runAiTaskWithProvider, buildAiTaskUserMessage, callOpenAiCompatible } = require('./lib/ai-run')
const { normalizeLongTextLines, normalizeSongData, normalizeFilmData, normalizeResourceHubData, normalizeQuizData, normalizeQuizQuestions, normalizeTourRouteData, normalizeLongMarchData, normalizeDirectorScriptData, normalizeDirectorScenes, normalizePanoramaData, normalizeCheckinData, normalizeCocreationData, normalizeTodaySuquData, normalizePartyOathData, normalizeTimelineData, normalizeTributeCeremonyData } = require('./lib/content-normalize')
const { publicAiProvider, rowToAiTask, publicAiTask, hasMeaningfulAiTaskInput, normalizeProviderPayload, normalizeAiProviderStatus, defaultAiApplyTargetField, isSafeMediaResultUrl, isSafeProviderEndpoint, inferExtensionFromUrl, inferMimeType, aiTaskTypeLabelForServer, buildOpenAiCompatibleEndpoint } = require('./lib/ai-base')
const { rowToRegion, collectRegionAndDescendantIds, rowToMediaAsset, rowToContentVersion, resolveReviewSignalLevel, sortJsonValue, rowToContentSource, sanitizePublicOralHistoryData, parseRegionIdQuery, filterArchivesByRegionIds, hasValidArchiveCoordinates, inferTrustLevelFromSources, rowToPublicMessage, rowToContentModule, rowToRiskTagTemplate, rowToArchive, rowToMessage, mergeCheckinPois, rowToAuditLog, parseDateBoundary, createEmptyAcceptanceManualRecord } = require('./lib/rows')
const { matchesMediaSignature } = require('./lib/media-helpers')
const { normalizeYearText, normalizePositiveInteger, normalizeHeroData, normalizeResourceHubItems, normalizeQuizAnswer, normalizeTourRouteItems, normalizeLongMarchStages, normalizeDirectorWait, normalizeCocreationPrompts, normalizeTodaySuquMetrics, normalizeTodaySuquComparisons, normalizePartyOathSegments, normalizeTimelineYear, normalizeTimelineEvents, normalizeTimelineMarks, normalizeArchiveDisplayTimeline, normalizeArchiveMedia, normalizeStringArray, normalizeSources, normalizeCheckinProgress, normalizeMedia, normalizeMessage, normalizeAcceptanceConclusion } = require('./lib/data-normalize')
const { resolveDataDir, loadOptionalPackage, resolveOptionalBinary, isAdminHost, isLocalAdminPath, normalizePublishPositionsConfig, getBearerToken, getCookieValue, readJson, copyDirectory, getDirectorySize, getSnapshotTables, getImportOnlyTables, publicMediaAsset, isPathInside, getProvidedAdminToken, secureEqual, getClientIp, sendError, stripPrivateMessageFields } = require('./lib/server-helpers')
const { assertSupportedDbClient, getDatabaseConfig, getDatabaseSummary } = require('./db/config')
const { createDatabaseRuntime } = require('./db/runtime')
const { createAiOpsStore } = require('./db/ai-ops-store')
const { createMysqlAiOpsStore } = require('./db/mysql-ai-ops-store')
const { createSnapshotStore } = require('./db/snapshot-store')
const { createMysqlSnapshotStore } = require('./db/mysql-snapshot-store')
const { createRuntimeStores } = require('./db/runtime-store-factory')
const { createSqlDialect } = require('./db/sql-dialect')
const { createRuntimeBootstrap } = require('./db/runtime-bootstrap')
const { buildMysqlCutoverReadiness } = require('./db/mysql-cutover-readiness')
const sharp = loadOptionalPackage('sharp')

const app = express()
const PORT = Number(process.env.PORT || 3001)
const ENV = process.env.NODE_ENV || 'development'
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''
const CORS_ORIGIN = process.env.CORS_ORIGIN || ''
const DB_CONFIG = getDatabaseConfig(process.env)
assertSupportedDbClient(DB_CONFIG.client)
const DATA_DIR = DB_CONFIG.sqlite.dataDir
const DB_FILE = DB_CONFIG.sqlite.file
const BACKUP_DIR = DB_CONFIG.sqlite.backupDir
const ACCEPTANCE_DIR = path.join(DATA_DIR, 'acceptance')
const UPLOAD_DIR = DB_CONFIG.sqlite.uploadDir
const AI_SECRET_FILE = DB_CONFIG.sqlite.aiSecretFile
const HELP_ARTICLES_FILE = path.join(DATA_DIR, 'help-articles.json')
const ACCEPTANCE_MANUAL_RECORD_FILE = path.join(ACCEPTANCE_DIR, 'v1-manual-record.json')
const CONFIGURED_DB_CLIENT = DB_CONFIG.client
const DATABASE_RUNTIME = createDatabaseRuntime(DB_CONFIG)
const RUNTIME_DB_CLIENT = DATABASE_RUNTIME.runtimeClient
const SQL_DIALECT = createSqlDialect(RUNTIME_DB_CLIENT)
const DATABASE_SUMMARY = getDatabaseSummary(process.env)
const PUBLIC_ASSET_DIR = path.join(__dirname, 'public')
const CLIENT_DIST = path.resolve(__dirname, '..', 'client', 'dist-server')
const ADMIN_DIST = path.resolve(__dirname, '..', 'admin', 'dist')
const FFMPEG_BIN = resolveOptionalBinary('FFMPEG_PATH', 'ffmpeg-static', 'ffmpeg')
const FFPROBE_BIN = resolveOptionalBinary('FFPROBE_PATH', 'ffprobe-static', 'ffprobe')

const SEED_ARCHIVES_FILE = path.join(__dirname, 'archives.json')
const SEED_MESSAGES_FILE = path.join(__dirname, 'messages.json')
const SEED_TRIBUTES_FILE = path.join(__dirname, 'tributes.json')
const DEFAULT_TRIBUTE_COUNT = 11990821
const ARCHIVE_TYPES = new Set(['government', 'revolution', 'culture'])
const DEFAULT_SESSION_HOURS = 8
const REMEMBER_SESSION_DAYS = 7
const SESSION_COOKIE_NAME = 'suqu_admin_session'
const SESSION_COOKIE_DOMAIN = cleanText(process.env.SESSION_COOKIE_DOMAIN || '', 200)
const CSRF_HEADER_NAME = 'x-csrf-token'
const SAFE_HTTP_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const LOGIN_LOCK_WINDOW_MS = 15 * 60 * 1000
const LOGIN_MAX_FAILURES = 5
const MAX_MEDIA_UPLOAD_BYTES = 100 * 1024 * 1024
const ALLOWED_MEDIA_TYPES = new Map([
  ['image/png', { kind: 'image', ext: '.png' }],
  ['image/jpeg', { kind: 'image', ext: '.jpg' }],
  ['image/webp', { kind: 'image', ext: '.webp' }],
  ['image/gif', { kind: 'image', ext: '.gif' }],
  ['video/mp4', { kind: 'video', ext: '.mp4' }],
  ['video/quicktime', { kind: 'video', ext: '.mov' }],
  ['video/webm', { kind: 'video', ext: '.webm' }],
  ['audio/mpeg', { kind: 'audio', ext: '.mp3' }],
  ['audio/mp3', { kind: 'audio', ext: '.mp3' }],
  ['audio/wav', { kind: 'audio', ext: '.wav' }],
  ['audio/x-wav', { kind: 'audio', ext: '.wav' }],
  ['audio/ogg', { kind: 'audio', ext: '.ogg' }],
  ['audio/mp4', { kind: 'audio', ext: '.m4a' }],
  ['audio/m4a', { kind: 'audio', ext: '.m4a' }],
  ['audio/x-m4a', { kind: 'audio', ext: '.m4a' }],
  ['audio/aac', { kind: 'audio', ext: '.aac' }],
  ['audio/webm', { kind: 'audio', ext: '.webm' }],
  ['application/pdf', { kind: 'document', ext: '.pdf' }],
])
const REGION_LEVELS = ['province', 'city', 'county', 'town', 'village', 'site']
const REGION_DISPLAY_MODES = ['current', 'overview', 'auto_location']
const REGION_MAP_MODES = ['single', 'aggregate', 'mixed']
const OPTIONAL_SNAPSHOT_TABLES = new Set(['regions', 'user_regions', 'risk_tag_templates', 'ai_providers', 'ai_tasks', 'ai_call_logs'])
const DEFAULT_REGIONS = [
  { id: 'region-guangdong', parentId: null, level: 'province', name: '广东省', fullName: '广东省', code: '440000', description: '省级红色文化资源总览。', displayMode: 'overview', mapMode: 'aggregate', sortOrder: 10, isDefault: false, isActive: true },
  { id: 'region-heyuan', parentId: 'region-guangdong', level: 'city', name: '河源市', fullName: '广东省河源市', code: '441600', description: '河源市红色文化资源节点。', displayMode: 'overview', mapMode: 'aggregate', sortOrder: 20, isDefault: false, isActive: true },
  { id: 'region-zijin', parentId: 'region-heyuan', level: 'county', name: '紫金县', fullName: '广东省河源市紫金县', code: '441621', description: '紫金县红色文化资源节点。', displayMode: 'overview', mapMode: 'mixed', sortOrder: 30, isDefault: false, isActive: true },
  { id: 'region-suqu', parentId: 'region-zijin', level: 'town', name: '苏区镇', fullName: '广东省河源市紫金县苏区镇', code: '441621115', description: '平台当前默认项目地区。', displayMode: 'current', mapMode: 'single', sortOrder: 40, isDefault: true, isActive: true },
]
const DEFAULT_PERMISSIONS = [
  ['users.read', '用户查看', '用户管理'],
  ['users.write', '用户编辑', '用户管理'],
  ['roles.read', '角色查看', '权限管理'],
  ['roles.write', '角色编辑', '权限管理'],
  ['content.create', '内容创建', '内容管理'],
  ['content.edit', '内容编辑', '内容管理'],
  ['content.delete', '内容删除', '内容管理'],
  ['content.review', '内容审核', '审核管理'],
  ['content.final_review', '内容终审', '审核管理'],
  ['content.publish', '发布下架', '审核管理'],
  ['media.manage', '媒体管理', '媒体库'],
  ['import_export.manage', '导入导出', '运维管理'],
  ['backup.restore', '备份恢复', '运维管理'],
  ['audit.read', '日志查看', '运维管理'],
  ['settings.manage', '系统设置', '系统管理'],
  ['batch.manage', '批量编辑', '内容管理'],
  ['trash.purge', '清空回收站', '系统管理'],
  ['regions.manage', '地区项目管理', '系统管理'],
  ['ai.manage', 'AI 配置与任务', 'AI 管理'],
]
const DEFAULT_ROLES = [
  {
    id: 'super_admin',
    name: '超级管理员',
    description: '拥有系统全部权限。',
    permissions: DEFAULT_PERMISSIONS.map(([code]) => code),
  },
  {
    id: 'content_editor',
    name: '内容编辑',
    description: '创建草稿、编辑内容、提交审核、上传媒体。',
    permissions: ['content.create', 'content.edit', 'media.manage'],
  },
  {
    id: 'reviewer',
    name: '审核员',
    description: '审核内容、处理留言、查看来源依据。',
    permissions: ['content.review', 'content.publish', 'audit.read'],
  },
  {
    id: 'data_operator',
    name: '数据运营',
    description: '导入导出、批量编辑、统计查看。',
    permissions: ['content.edit', 'import_export.manage', 'batch.manage'],
  },
  {
    id: 'guide',
    name: '讲解员',
    description: '查看已发布资料，提交修订建议。',
    permissions: ['content.create'],
  },
  {
    id: 'observer',
    name: '只读观察员',
    description: '只读查看后台内容和统计。',
    permissions: ['audit.read'],
  },
]
const CONTENT_MODULES = [
  ['archive', '档案点位'],
  ['message', '群众留言'],
  ['tribute', '致敬计数'],
  ['song', '红歌'],
  ['film', '红色影视'],
  ['hero', '英雄谱'],
  ['oral_history', '口述历史'],
  ['letters', '红色家书'],
  ['slogans', '红军标语'],
  ['decrees', '苏维埃法令'],
  ['martyrs', '英烈名录'],
  ['women', '妇女革命'],
  ['origin', '地名渊源'],
  ['history', '根据地史'],
  ['relics', '文物图鉴'],
  ['quiz', '党史题库'],
  ['party_route', '党日路线'],
  ['panorama', '全景点位'],
  ['tour_route', '导览路线'],
  ['long_march', '长征路线沙盘'],
  ['director_script', '自动讲解脚本'],
  ['checkin', '打卡护照'],
  ['cocreation', '群众共创'],
  ['today_suqu', '今日苏区'],
  ['party_oath', '入党誓词'],
  ['timeline', '历史时间轴'],
  ['tribute_ceremony', '致敬仪式'],
  ['learning_course', '学习课程'],
  ['dashboard_entry', '学习面板入口'],
]
const DEFAULT_CONTENT_MODULE_PUBLISH_POSITIONS = {
  archive: { map: true, list: true, home: false, topic: false, guide: false },
  default: { map: false, list: true, home: false, topic: false, guide: false },
}
const CONTENT_STATUSES = new Set(['draft', 'pending_review', 'in_review', 'published', 'rejected', 'unpublished', 'deleted'])
const SENSITIVE_LEVELS = new Set(['normal', 'attention', 'sensitive', 'critical'])
const RESOURCE_HUB_MODULES = new Set(['letters', 'slogans', 'decrees', 'martyrs', 'women', 'origin', 'history', 'relics'])
const INTERACTIVE_MODULES = new Set(['quiz', 'party_route', 'panorama', 'tour_route', 'long_march', 'director_script', 'checkin', 'cocreation', 'today_suqu', 'party_oath', 'timeline', 'tribute_ceremony', 'learning_course', 'dashboard_entry'])
const ARCHIVE_DETAIL_BLOCK_TYPES = new Set(['basic', 'history', 'oral_history', 'media', 'ai_narration', 'timeline', 'related_people', 'related_events', 'learning_questions', 'route', 'messages', 'sources', 'risk_note'])
const ORAL_AUTHORIZATION_STATUSES = new Set(['authorized', 'pending', 'restricted', 'revoked'])
const ORAL_TRANSCRIPT_REVIEW_STATUSES = new Set(['raw_imported', 'transcribed', 'public_edited', 'review_ready'])
const ORAL_AI_SUMMARY_STATUSES = new Set(['none', 'manual_imported', 'ai_generated', 'editor_checked'])
const AI_TASK_TYPES = new Set(['transcription', 'public_summary', 'risk_hint', 'story_script', 'narration_script', 'tts_audio', 'digital_human_video', 'keyword_extract', 'timeline'])
const RISK_TAG_LEVELS = new Set(['medium', 'high', 'critical'])
const DEFAULT_RISK_TAG_TEMPLATES = [
  { label: 'AI 生成待审', level: 'high', category: 'AI', description: '内容包含 AI 生成或改写结果，发布前必须人工核验。', sortOrder: 10 },
  { label: 'AI 风险提示待审', level: 'high', category: 'AI', description: '风险提示来自 AI 任务，需审核员确认后再保留或改写。', sortOrder: 20 },
  { label: '来源依据不足', level: 'high', category: '来源', description: '事实性内容缺少出处、采集记录或授权材料。', sortOrder: 30 },
  { label: '授权限制', level: 'critical', category: '授权', description: '涉及口述历史、声音、肖像、授权文件限制或撤回。', sortOrder: 40 },
  { label: '敏感片段', level: 'critical', category: '内容安全', description: '存在需脱敏、改写或不得公开的原始片段。', sortOrder: 50 },
  { label: '政治表述需复核', level: 'critical', category: '政治安全', description: '涉及政治表述、历史结论、组织称谓或重大事件判断。', sortOrder: 60 },
]
const HELP_ARTICLE_PAGE_KEYS = ['dashboard', 'create-center', 'contents', 'media', 'regions', 'tributes', 'reviews', 'audit', 'users', 'roles', 'ai', 'ops']
const HELP_ARTICLE_PAGE_SET = new Set(HELP_ARTICLE_PAGE_KEYS)
const DEFAULT_HELP_ARTICLES = {
  dashboard: {
    pageKey: 'dashboard',
    title: '工作台说明',
    summary: '这里集中显示今天要处理的事情、常用入口和系统状态。',
    steps: ['先看待处理事项。', '再点快捷入口进入新建、审核或上传。', '右上角可切换字号、主题和布局模式。'],
    tips: '如不确定下一步做什么，优先从工作台推荐入口进入，不需要先理解模块结构。',
    videoUrl: '',
  },
  'create-center': {
    pageKey: 'create-center',
    title: '新建中心说明',
    summary: '先选要完成的任务，再按准备材料和分步提示进入对应页面。',
    steps: ['先按目标选择入口，例如新增点位、录入口述历史或上传素材。', '根据页面提示准备必需材料，缺项时先补材料再继续。', '完成草稿后进入审核任务继续流转。'],
    tips: '这里是面向普通使用者的推荐入口，能少走很多技术化路径。',
    videoUrl: '',
  },
  contents: {
    pageKey: 'contents',
    title: '内容管理说明',
    summary: '内容创建会逐步引导录入，复杂字段会继续改造成可视化编辑。',
    steps: ['先确定内容类型。', '按步骤补齐基础信息、资料和来源依据。', '保存草稿后再提交审核。'],
    tips: '普通路径优先使用卡片、上传、选择器和拖拽，不建议直接填写技术字段。',
    videoUrl: '',
  },
  media: {
    pageKey: 'media',
    title: '媒体库说明',
    summary: '媒体库用于上传并管理图片、音频、视频和授权文件。',
    steps: ['上传后先补齐分类和说明。', '优先使用自动压缩和水印。', '被引用的素材删除前要先解除关联。'],
    tips: '先入库再选用，比手工复制路径更安全，也更适合后续审核。',
    videoUrl: '',
  },
  regions: {
    pageKey: 'regions',
    title: '地区项目说明',
    summary: '这里用于维护地区树、显示模式和地图边界对应关系。',
    steps: ['先确认当前新增的是省、市、县、镇还是村级节点。', '尽量补齐地区全称和编码，方便地图定位与授权。', '修改默认地区前先确认公开端展示范围。'],
    tips: '地区结构会影响权限、地图和公开展示，请不要随意删除已有节点。',
    videoUrl: '',
  },
  tributes: {
    pageKey: 'tributes',
    title: '致敬计数说明',
    summary: '这里维护致敬统计相关数据和展示入口。',
    steps: ['先确认调整原因。', '如需批量修正，优先留痕并记录操作说明。', '修改后检查公开端数字是否同步。'],
    tips: '涉及公开展示的统计数据，建议和审计日志一起复核。',
    videoUrl: '',
  },
  reviews: {
    pageKey: 'reviews',
    title: '审核任务说明',
    summary: '审核员应优先核查真实性、来源依据和风险提示。',
    steps: ['先查看来源和媒体。', '再看版本差异与风险信号。', '驳回时请选择问题类型并写清退回原因。'],
    tips: '政治敏感内容优先核查来源、授权和表述准确性，不要只看标题就通过。',
    videoUrl: '',
  },
  audit: {
    pageKey: 'audit',
    title: '操作日志说明',
    summary: '这里查看关键操作、风险动作和导出审计记录。',
    steps: ['先按时间或操作人筛选。', '重点查看删除、恢复、导入导出和审核类动作。', '必要时导出留档。'],
    tips: '如遇异常改动，先查日志再回看相关内容版本。',
    videoUrl: '',
  },
  users: {
    pageKey: 'users',
    title: '用户管理说明',
    summary: '这里用于新建账号、配置地区范围和分配角色模板。',
    steps: ['先选择角色模板。', '再配置地区权限。', '敏感权限只给确实需要的人。'],
    tips: '优先用角色模板，不要给普通账号叠加过多敏感权限。',
    videoUrl: '',
  },
  roles: {
    pageKey: 'roles',
    title: '角色权限说明',
    summary: '这里查看和维护角色模板与权限范围。',
    steps: ['先明确岗位职责。', '再复核这个岗位是否真的需要敏感权限。', '调整后让相关账号重新登录检查权限生效。'],
    tips: '权限设计尽量少而清晰，避免后期难以审计。',
    videoUrl: '',
  },
  ai: {
    pageKey: 'ai',
    title: 'AI 中心说明',
    summary: '这里配置 AI 供应商、创建任务并人工核验结果。',
    steps: ['先配置供应商和能力。', '创建任务后不要直接公开，先人工核验结果。', '必要时把结果应用为草稿再提审。'],
    tips: 'AI 结果只能辅助，不能替代人工审核，尤其是口述历史与政治敏感内容。',
    videoUrl: '',
  },
  ops: {
    pageKey: 'ops',
    title: '运维管理说明',
    summary: '导入、恢复、清空回收站等高危操作都在这里进行。',
    steps: ['先确认当前备份是否完整。', '执行高危操作前二次确认。', '完成后检查日志和系统状态。'],
    tips: '任何导入、恢复和清空操作都建议先做一次备份。',
    videoUrl: '',
  },
}
const DASHBOARD_ENTRY_ACTIONS = new Set([
  'heroes',
  'song_player',
  'party_oath',
  'panorama',
  'long_march',
  'oral_history',
  'resource_hub',
  'today_suqu',
  'red_quiz',
  'party_routes',
  'passport',
  'tour_guide',
  'film_archive',
  'cocreation',
])
const DEFAULT_WORKFLOWS = [
  {
    id: 'workflow-archive-default',
    moduleKey: 'archive',
    name: '档案史料双审流程',
    steps: [
      { id: 'step-archive-review', order: 1, name: '审核员初审', permission: 'content.review', roleId: 'reviewer', isFinal: false },
      { id: 'step-archive-final', order: 2, name: '超级管理员终审', permission: 'content.final_review', roleId: 'super_admin', isFinal: true },
    ],
  },
  {
    id: 'workflow-message-default',
    moduleKey: 'message',
    name: '群众留言一审流程',
    steps: [
      { id: 'step-message-review', order: 1, name: '审核员审核', permission: 'content.review', roleId: 'reviewer', isFinal: true },
    ],
  },
  {
    id: 'workflow-default-two-step',
    moduleKey: '*',
    name: '通用双审流程',
    steps: [
      { id: 'step-default-review', order: 1, name: '审核员初审', permission: 'content.review', roleId: 'reviewer', isFinal: false },
      { id: 'step-default-final', order: 2, name: '超级管理员终审', permission: 'content.final_review', roleId: 'super_admin', isFinal: true },
    ],
  },
]

const rateBuckets = new Map()
let warnedMissingAdminToken = false

let db = DATABASE_RUNTIME.openPrimaryConnection()
const RUNTIME_STORES = createRuntimeStores({
  runtimeClient: RUNTIME_DB_CLIENT,
  ...(RUNTIME_DB_CLIENT === 'mysql'
    ? { mysqlOps: db }
    : { getDb: () => db }),
})
const ADMIN_CORE_STORE = RUNTIME_STORES.adminCore
const CONTENT_READ_STORE = RUNTIME_STORES.contentRead
const CONTENT_WRITE_STORE = RUNTIME_STORES.contentWrite
const AI_OPS_STORE = RUNTIME_DB_CLIENT === 'mysql'
  ? createMysqlAiOpsStore({ ops: db })
  : createAiOpsStore({ getDb: () => db })
const SNAPSHOT_STORE = RUNTIME_DB_CLIENT === 'mysql'
  ? createMysqlSnapshotStore({ getDb: () => db })
  : createSnapshotStore({ getDb: () => db })
const RUNTIME_MISC_STORE = RUNTIME_STORES.runtimeMisc
require('./lib/async-ops').init({ ADMIN_CORE_STORE, AI_OPS_STORE, ARCHIVE_TYPES, CONTENT_READ_STORE, INTERACTIVE_MODULES, ORAL_AI_SUMMARY_STATUSES, ORAL_AUTHORIZATION_STATUSES, ORAL_TRANSCRIPT_REVIEW_STATUSES, RESOURCE_HUB_MODULES, RUNTIME_MISC_STORE, SENSITIVE_LEVELS })
require('./lib/help-articles').init({ DEFAULT_HELP_ARTICLES, HELP_ARTICLES_FILE, HELP_ARTICLE_PAGE_KEYS, HELP_ARTICLE_PAGE_SET })
require('./lib/media-ops').init({ CONTENT_READ_STORE, CONTENT_WRITE_STORE, FFMPEG_BIN, FFPROBE_BIN })
require('./lib/ai-ops').init({ ADMIN_TOKEN, AI_OPS_STORE, AI_SECRET_FILE, AI_TASK_TYPES, ARCHIVE_DETAIL_BLOCK_TYPES, ARCHIVE_TYPES, CONTENT_READ_STORE, DASHBOARD_ENTRY_ACTIONS, INTERACTIVE_MODULES, ORAL_AI_SUMMARY_STATUSES, ORAL_AUTHORIZATION_STATUSES, ORAL_TRANSCRIPT_REVIEW_STATUSES, RESOURCE_HUB_MODULES, RUNTIME_MISC_STORE, SENSITIVE_LEVELS })
require('./lib/region-access').init({ ADMIN_CORE_STORE, CSRF_HEADER_NAME, DEFAULT_CONTENT_MODULE_PUBLISH_POSITIONS, RUNTIME_MISC_STORE, SAFE_HTTP_METHODS, SESSION_COOKIE_NAME })
require('./lib/workflow').init({ CONTENT_READ_STORE })
// 小米 MiMo 语音合成/克隆适配器（需要上传目录用于落盘 TTS 音频）
require('./lib/tts-providers').init({ UPLOAD_DIR })

function runInDatabaseTransaction(action) {
  return DATABASE_RUNTIME.runInTransaction(db, action)
}

async function runInDatabaseTransactionAsync(action) {
  return DATABASE_RUNTIME.runInTransactionAsync(db, action)
}

function ensurePrimarySchema() {
  if (RUNTIME_DB_CLIENT !== 'sqlite') return

  db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS archives (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT,
    type TEXT NOT NULL CHECK(type IN ('government', 'revolution', 'culture')),
    year INTEGER NOT NULL,
    longitude REAL NOT NULL,
    latitude REAL NOT NULL,
    media_json TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_archives_type ON archives(type);
  CREATE INDEX IF NOT EXISTS idx_archives_year ON archives(year);

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    identity TEXT NOT NULL,
    text TEXT NOT NULL,
    in_reply_to TEXT,
    created_at INTEGER NOT NULL,
    ip TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

  CREATE TABLE IF NOT EXISTS checkin_progress (
    visitor_id TEXT PRIMARY KEY,
    visited_pois_json TEXT NOT NULL DEFAULT '[]',
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_checkin_progress_updated ON checkin_progress(updated_at DESC);

  CREATE TABLE IF NOT EXISTS tributes (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    count INTEGER NOT NULL CHECK(count >= 0)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    before_json TEXT,
    after_json TEXT,
    actor TEXT,
    ip TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

  CREATE TABLE IF NOT EXISTS media_assets (
    id TEXT PRIMARY KEY,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK(media_type IN ('image', 'video', 'audio', 'document')),
    mime_type TEXT NOT NULL,
    extension TEXT NOT NULL,
    size_bytes INTEGER NOT NULL CHECK(size_bytes >= 0),
    width INTEGER,
    height INTEGER,
    duration_seconds REAL,
    category TEXT,
    alt_text TEXT,
    caption TEXT,
    original_url TEXT,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    original_storage_path TEXT,
    storage_path TEXT NOT NULL,
    checksum_sha256 TEXT NOT NULL,
    watermark_text TEXT,
    auto_compress INTEGER NOT NULL DEFAULT 0,
    processing_status TEXT NOT NULL CHECK(processing_status IN ('stored', 'queued', 'processed', 'failed')),
    processing_note TEXT,
    uploaded_by TEXT,
    deleted_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(media_type);
  CREATE INDEX IF NOT EXISTS idx_media_assets_category ON media_assets(category);
  CREATE INDEX IF NOT EXISTS idx_media_assets_created ON media_assets(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_media_assets_deleted ON media_assets(deleted_at);

  CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    real_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    department TEXT,
    role_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('active', 'disabled', 'locked')),
    notes TEXT,
    last_login_at INTEGER,
    created_by TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
  CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role_id);

  CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS permissions (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    group_name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS role_permissions (
    role_id TEXT NOT NULL,
    permission_code TEXT NOT NULL,
    PRIMARY KEY (role_id, permission_code),
    FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY(permission_code) REFERENCES permissions(code) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_role_overrides (
    user_id TEXT NOT NULL,
    permission_code TEXT NOT NULL,
    effect TEXT NOT NULL CHECK(effect IN ('allow', 'deny')),
    PRIMARY KEY (user_id, permission_code),
    FOREIGN KEY(user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    FOREIGN KEY(permission_code) REFERENCES permissions(code) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_regions (
    user_id TEXT NOT NULL,
    region_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, region_id),
    FOREIGN KEY(user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    FOREIGN KEY(region_id) REFERENCES regions(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_user_regions_region ON user_regions(region_id);

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    csrf_token TEXT,
    ip TEXT,
    user_agent TEXT,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    last_seen_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES admin_users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

  CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    ip TEXT,
    success INTEGER NOT NULL,
    reason TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_login_attempts_lookup ON login_attempts(username, ip, created_at);

  CREATE TABLE IF NOT EXISTS content_modules (
    module_key TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    default_publish_map INTEGER NOT NULL DEFAULT 0,
    default_publish_list INTEGER NOT NULL DEFAULT 1,
    default_publish_home INTEGER NOT NULL DEFAULT 0,
    default_publish_topic INTEGER NOT NULL DEFAULT 0,
    default_publish_guide INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS review_workflows (
    id TEXT PRIMARY KEY,
    module_key TEXT NOT NULL,
    name TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS review_workflow_steps (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    name TEXT NOT NULL,
    required_permission TEXT NOT NULL,
    role_id TEXT,
    is_final INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(workflow_id) REFERENCES review_workflows(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_workflow_steps_order ON review_workflow_steps(workflow_id, step_order);

  CREATE TABLE IF NOT EXISTS contents (
    id TEXT PRIMARY KEY,
    module_key TEXT NOT NULL,
    category TEXT,
    tags_json TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL CHECK(status IN ('draft', 'pending_review', 'in_review', 'published', 'rejected', 'unpublished', 'deleted')),
    title TEXT NOT NULL,
    summary TEXT,
    sensitive_level TEXT NOT NULL CHECK(sensitive_level IN ('normal', 'attention', 'sensitive', 'critical')),
    risk_types_json TEXT NOT NULL DEFAULT '[]',
    current_version_id TEXT,
    published_version_id TEXT,
    workflow_id TEXT,
    current_step_id TEXT,
    created_by TEXT,
    updated_by TEXT,
    submitted_at INTEGER,
    published_at INTEGER,
    deleted_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(module_key) REFERENCES content_modules(module_key),
    FOREIGN KEY(workflow_id) REFERENCES review_workflows(id)
  );

  CREATE INDEX IF NOT EXISTS idx_contents_module ON contents(module_key);
  CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status);
  CREATE INDEX IF NOT EXISTS idx_contents_updated ON contents(updated_at DESC);

  CREATE TABLE IF NOT EXISTS content_versions (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    body TEXT,
    data_json TEXT NOT NULL DEFAULT '{}',
    created_by TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(content_id) REFERENCES contents(id) ON DELETE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_content_versions_number ON content_versions(content_id, version_number);

  CREATE TABLE IF NOT EXISTS content_sources (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL,
    version_id TEXT,
    source_type TEXT,
    source_title TEXT,
    source_url TEXT,
    archive_ref TEXT,
    page_ref TEXT,
    collector TEXT,
    collected_at TEXT,
    trust_level TEXT,
    attachment_media_id TEXT,
    notes TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(content_id) REFERENCES contents(id) ON DELETE CASCADE,
    FOREIGN KEY(version_id) REFERENCES content_versions(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_content_sources_content ON content_sources(content_id);

  CREATE TABLE IF NOT EXISTS content_review_tasks (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    workflow_id TEXT NOT NULL,
    step_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')),
    assignee_role_id TEXT,
    reviewer_id TEXT,
    comment TEXT,
    created_at INTEGER NOT NULL,
    reviewed_at INTEGER,
    FOREIGN KEY(content_id) REFERENCES contents(id) ON DELETE CASCADE,
    FOREIGN KEY(version_id) REFERENCES content_versions(id) ON DELETE CASCADE,
    FOREIGN KEY(workflow_id) REFERENCES review_workflows(id),
    FOREIGN KEY(step_id) REFERENCES review_workflow_steps(id)
  );

  CREATE INDEX IF NOT EXISTS idx_review_tasks_status ON content_review_tasks(status, assignee_role_id);
  CREATE INDEX IF NOT EXISTS idx_review_tasks_content ON content_review_tasks(content_id);

  CREATE TABLE IF NOT EXISTS regions (
    id TEXT PRIMARY KEY,
    parent_id TEXT,
    level TEXT NOT NULL CHECK(level IN ('province', 'city', 'county', 'town', 'village', 'site')),
    name TEXT NOT NULL,
    full_name TEXT,
    code TEXT,
    description TEXT,
    display_mode TEXT NOT NULL DEFAULT 'current',
    map_mode TEXT NOT NULL DEFAULT 'single',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_default INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(parent_id) REFERENCES regions(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_regions_parent ON regions(parent_id);
  CREATE INDEX IF NOT EXISTS idx_regions_level ON regions(level);
  CREATE INDEX IF NOT EXISTS idx_regions_active ON regions(is_active);

  CREATE TABLE IF NOT EXISTS ai_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL,
    base_url TEXT,
    api_key_encrypted TEXT,
    default_model TEXT,
    capabilities_json TEXT NOT NULL DEFAULT '[]',
    config_json TEXT NOT NULL DEFAULT '{}',
    is_enabled INTEGER NOT NULL DEFAULT 0,
    last_tested_at INTEGER,
    last_test_status TEXT,
    last_test_message TEXT,
    created_by TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_ai_providers_enabled ON ai_providers(is_enabled);

  CREATE TABLE IF NOT EXISTS ai_tasks (
    id TEXT PRIMARY KEY,
    task_type TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    provider_id TEXT,
    prompt TEXT,
    input_text TEXT,
    input_json TEXT,
    external_job_id TEXT,
    provider_status TEXT,
    provider_request_json TEXT,
    provider_response_json TEXT,
    callback_token_hash TEXT,
    callback_received_at INTEGER,
    status TEXT NOT NULL CHECK(status IN ('draft', 'pending', 'running', 'completed', 'failed', 'imported')),
    result_text TEXT,
    result_json TEXT,
    error_message TEXT,
    created_by TEXT,
    updated_by TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    completed_at INTEGER,
    FOREIGN KEY(provider_id) REFERENCES ai_providers(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(status);
  CREATE INDEX IF NOT EXISTS idx_ai_tasks_type ON ai_tasks(task_type);
  CREATE INDEX IF NOT EXISTS idx_ai_tasks_target ON ai_tasks(target_type, target_id);

  CREATE TABLE IF NOT EXISTS ai_call_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id TEXT,
    task_id TEXT,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    request_summary TEXT,
    response_summary TEXT,
    error_message TEXT,
    duration_ms INTEGER,
    created_by TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_ai_call_logs_created ON ai_call_logs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_ai_call_logs_provider ON ai_call_logs(provider_id);
  CREATE INDEX IF NOT EXISTS idx_ai_call_logs_task ON ai_call_logs(task_id);

  CREATE TABLE IF NOT EXISTS risk_tag_templates (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL UNIQUE,
    level TEXT NOT NULL CHECK(level IN ('medium', 'high', 'critical')),
    category TEXT,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_risk_tag_templates_active ON risk_tag_templates(is_active, sort_order);
`)
}

const RUNTIME_BOOTSTRAP = createRuntimeBootstrap({
  runtimeClient: RUNTIME_DB_CLIENT,
  configuredClient: CONFIGURED_DB_CLIENT,
  ensurePrimarySchema,
  ensureRuntimeMigrations: ensureDatabaseMigrations,
  seedDatabase,
  seedAccessControl,
  seedRegions,
  seedContentSystem,
  seedRiskTagTemplates,
  seedArchiveContentsFromLegacyStore,
})

function applyRuntimeBootstrap(reason) {
  return RUNTIME_BOOTSTRAP.apply(reason)
}

applyRuntimeBootstrap('startup')

app.disable('x-powered-by')
app.set('trust proxy', true)
app.use(cors(buildCorsOptions()))
app.use(express.json({ limit: '50mb' }))
app.use(securityHeaders)

app.get('/api/health', async (req, res) => {
  const { archiveCount, messageCount } = await DATABASE_RUNTIME.getHealthSnapshot(db)
  const tributeCount = await getTributeCountAsync()
  const targetStatus = await DATABASE_RUNTIME.inspectConfiguredTarget()
  const mode = DATABASE_RUNTIME.getRuntimeModeSummary(targetStatus)

  res.json({
    ok: true,
    service: 'suqu-digital-archive-api',
    store: mode.runtimeClient,
    configuredStore: mode.configuredClient,
    compatibilityMode: mode.compatibilityMode,
    archiveCount,
    messageCount,
    tributeCount,
    adminProtected: true,
    legacyAdminTokenConfigured: Boolean(ADMIN_TOKEN),
    uptime: process.uptime(),
    timestamp: Date.now(),
    database: {
      runtimeClient: mode.runtimeClient,
      configuredClient: mode.configuredClient,
      runtimeAligned: mode.runtimeAligned,
      readyForRuntimeSwitch: mode.readyForRuntimeSwitch,
      targetReady: mode.targetReady,
      targetReachable: mode.targetReachable,
      schemaReady: mode.schemaReady,
      coreTablesPresent: mode.coreTablesPresent,
      blockers: mode.blockers,
      nextAction: mode.nextAction,
      sqliteFile: DATABASE_SUMMARY.sqliteFile,
      mysqlHost: DATABASE_SUMMARY.mysqlHost,
      mysqlPort: DATABASE_SUMMARY.mysqlPort,
      mysqlDatabase: DATABASE_SUMMARY.mysqlDatabase,
      targetStatus,
    },
  })
})

app.get('/api/admin/database/runtime-status', requirePermission('backup.restore'), async (req, res) => {
  const targetStatus = await DATABASE_RUNTIME.inspectConfiguredTarget()
  const mode = DATABASE_RUNTIME.getRuntimeModeSummary(targetStatus)

  res.json({
    runtimeClient: mode.runtimeClient,
    configuredClient: mode.configuredClient,
    compatibilityMode: mode.compatibilityMode,
    runtimeAligned: mode.runtimeAligned,
    readyForRuntimeSwitch: mode.readyForRuntimeSwitch,
    targetReady: mode.targetReady,
    targetReachable: mode.targetReachable,
    schemaReady: mode.schemaReady,
    coreTablesPresent: mode.coreTablesPresent,
    blockers: mode.blockers,
    nextAction: mode.nextAction,
    targetStatus,
    checkedAt: Date.now(),
  })
})

app.get('/api/admin/database/cutover-readiness', requirePermission('backup.restore'), async (req, res) => {
  const targetStatus = await DATABASE_RUNTIME.inspectConfiguredTarget()
  const mode = DATABASE_RUNTIME.getRuntimeModeSummary(targetStatus)
  const cutoverReadiness = await buildMysqlCutoverReadiness(DB_CONFIG)
  const blockers = Array.from(new Set([
    ...mode.blockers,
    ...cutoverReadiness.blockers,
  ]))

  res.json({
    runtimeClient: mode.runtimeClient,
    configuredClient: mode.configuredClient,
    compatibilityMode: mode.compatibilityMode,
    runtimeAligned: mode.runtimeAligned,
    readyForRuntimeSwitch: mode.readyForRuntimeSwitch,
    targetReady: mode.targetReady,
    nextAction: mode.nextAction,
    blockers,
    targetStatus,
    cutoverReadiness,
    checkedAt: Date.now(),
  })
})

app.get('/api/setup/status', async (req, res) => {
  res.json({ needsSetup: await needsInitialSetupAsync() })
})

app.post('/api/setup/admin', rateLimit('setup-admin', 60_000, 10), async (req, res) => {
  if (!await needsInitialSetupAsync()) {
    return sendError(res, 409, 'SETUP_CLOSED', 'Initial administrator has already been created.')
  }

  const result = await normalizeAdminUserInputAsync(req.body, { creating: true, requirePassword: true })
  if (result.error) return sendError(res, 400, 'INVALID_ADMIN_USER', result.error)
  if (!isStrongPassword(req.body.password)) {
    return sendError(res, 400, 'WEAK_PASSWORD', '密码至少 10 位，并且必须同时包含字母和数字。')
  }

  const now = Date.now()
  const user = {
    ...result.user,
    id: makeId('user'),
    roleId: 'super_admin',
    status: 'active',
    passwordHash: hashPassword(req.body.password),
    createdBy: 'setup',
    createdAt: now,
    updatedAt: now,
  }

  await insertAdminUserAsync(user)
  await writeAuditAsync(req, 'setup', 'admin_user', user.id, null, await publicAdminUserAsync(user))
  const session = await createSessionAsync(req, user.id, Boolean(req.body.rememberMe))
  setSessionCookie(res, session)
  res.status(201).json({ csrfToken: session.csrfToken, user: await publicAdminUserAsync(await findAdminUserByIdAsync(user.id), true) })
})

app.post('/api/auth/login', rateLimit('auth-login', 60_000, 30), async (req, res) => {
  const username = cleanText(req.body?.username, 80)
  const password = String(req.body?.password || '')
  const ip = getClientIp(req)

  if (!username || !password) {
    await recordLoginAttemptAsync(username, ip, false, 'missing_credentials')
    return sendError(res, 400, 'INVALID_CREDENTIALS', '请输入用户名和密码。')
  }
  if (await isLoginLockedAsync(username, ip)) {
    await recordLoginAttemptAsync(username, ip, false, 'locked')
    return sendError(res, 423, 'LOGIN_LOCKED', '登录失败次数过多，请稍后再试。')
  }

  const user = await findAdminUserByUsernameAsync(username)
  if (!user || !verifyPassword(password, user.password_hash || user.passwordHash)) {
    await recordLoginAttemptAsync(username, ip, false, 'invalid_credentials')
    return sendError(res, 401, 'INVALID_CREDENTIALS', '用户名或密码不正确。')
  }
  if (user.status !== 'active') {
    await recordLoginAttemptAsync(username, ip, false, `status_${user.status}`)
    return sendError(res, 403, 'USER_DISABLED', 'This account is not active.')
  }

  await recordLoginAttemptAsync(username, ip, true, 'ok')
  await ADMIN_CORE_STORE.touchAdminUserLogin(user.id, Date.now())
  const session = await createSessionAsync(req, user.id, Boolean(req.body.rememberMe))
  await writeAuditAsync(req, 'login', 'admin_user', user.id, null, { username: user.username })
  setSessionCookie(res, session)
  res.json({ csrfToken: session.csrfToken, user: await publicAdminUserAsync(await findAdminUserByIdAsync(user.id), true) })
})

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  await ADMIN_CORE_STORE.deleteSessionById(req.session.id)
  clearSessionCookie(res)
  await writeAuditAsync(req, 'logout', 'admin_user', req.user.id, null, { username: req.user.username })
  res.status(204).end()
})

app.post('/api/auth/refresh', requireAuth, async (req, res) => {
  const expiresAt = Date.now() + DEFAULT_SESSION_HOURS * 60 * 60 * 1000
  await ADMIN_CORE_STORE.updateSessionExpiry(req.session.id, expiresAt, Date.now())
  res.json({ expiresAt, csrfToken: req.session.csrf_token || '', user: await publicAdminUserAsync(req.user, true) })
})

app.get('/api/auth/me', requireAuth, async (req, res) => {
  res.json({ csrfToken: req.session.csrf_token || '', user: await publicAdminUserAsync(req.user, true) })
})

app.get('/api/admin/permissions', requirePermission('roles.read'), async (req, res) => {
  const permissions = await ADMIN_CORE_STORE.listPermissions()
  res.json(permissions.map((item) => ({ code: item.code, name: item.name, group: item.group_name })))
})

app.get('/api/admin/roles', requirePermission('roles.read'), async (req, res) => {
  res.json(await listRolesAsync())
})

app.get('/api/admin/users', requirePermission('users.read'), async (req, res) => {
  const q = cleanText(req.query.q || '', 80)
  const status = cleanText(req.query.status || '', 20)
  const rows = await ADMIN_CORE_STORE.listAdminUsers({ q, status, limit: 200 })
  res.json(await Promise.all(rows.map((row) => publicAdminUserAsync(row))))
})

app.post('/api/admin/users', requirePermission('users.write'), rateLimit('admin-user-write', 60_000, 60), async (req, res) => {
  const result = await normalizeAdminUserInputAsync(req.body, { creating: true, requirePassword: true })
  if (result.error) return sendError(res, 400, 'INVALID_ADMIN_USER', result.error)
  if (!isStrongPassword(req.body.password)) {
    return sendError(res, 400, 'WEAK_PASSWORD', '密码至少 10 位，并且必须同时包含字母和数字。')
  }
  if (await findAdminUserByUsernameAsync(result.user.username)) {
    return sendError(res, 409, 'USERNAME_EXISTS', '用户名已存在。')
  }
  if (!await findRoleAsync(result.user.roleId)) {
    return sendError(res, 400, 'INVALID_ROLE', 'Role does not exist.')
  }

  const now = Date.now()
  const user = {
    ...result.user,
    id: makeId('user'),
    status: result.user.status || 'active',
    passwordHash: hashPassword(req.body.password),
    createdBy: req.user.id,
    createdAt: now,
    updatedAt: now,
  }
  await insertAdminUserAsync(user)
  await replaceUserRegionsAsync(user.id, result.user.regionIds)
  const saved = await findAdminUserByIdAsync(user.id)
  const payload = await publicAdminUserAsync(saved)
  await writeAuditAsync(req, 'create', 'admin_user', user.id, null, payload)
  res.status(201).json(payload)
})

app.put('/api/admin/users/:id', requirePermission('users.write'), rateLimit('admin-user-write', 60_000, 60), async (req, res) => {
  const before = await findAdminUserByIdAsync(req.params.id)
  if (!before) return sendError(res, 404, 'ADMIN_USER_NOT_FOUND', 'Admin user not found.')

  const existingRegionIds = await listUserAssignedRegionIdsAsync(before.id)
  const result = await normalizeAdminUserInputAsync({
    ...before,
    ...req.body,
    roleId: req.body.roleId || req.body.role_id || before.role_id,
    regionIds: req.body.regionIds ?? req.body.region_ids ?? existingRegionIds,
  }, { creating: false })
  if (result.error) return sendError(res, 400, 'INVALID_ADMIN_USER', result.error)
  if (!await findRoleAsync(result.user.roleId)) return sendError(res, 400, 'INVALID_ROLE', 'Role does not exist.')

  await ADMIN_CORE_STORE.updateAdminUser(before.id, {
    ...result.user,
    updatedAt: Date.now(),
  })

  await replaceUserRegionsAsync(before.id, result.user.regionIds)
  const afterWithRegions = await findAdminUserByIdAsync(before.id)
  await writeAuditAsync(req, 'update', 'admin_user', before.id, await publicAdminUserAsync(before), await publicAdminUserAsync(afterWithRegions))
  res.json(await publicAdminUserAsync(afterWithRegions))
})

app.get('/api/admin/regions', requirePermission('regions.manage'), async (req, res) => {
  res.json(await listRegionsAsync())
})

app.get('/api/admin/region-options', requireAnyPermission(['content.create', 'content.edit', 'regions.manage']), async (req, res) => {
  const regions = (await listRegionsAsync()).filter((region) => region.isActive)
  const scope = await getUserRegionScopeAsync(req.user)
  if (scope.allRegions) return res.json(regions)
  res.json(regions.filter((region) => scope.scopeRegionIds.includes(region.id)))
})

app.get('/api/regions/public-config', async (req, res) => {
  try {
    res.json(await buildPublicRegionConfigAsync(req.query.regionId || req.query.region_id))
  } catch (e) {
    console.error('[regions] buildPublicRegionConfig 失败', e && e.stack ? e.stack : e)
    sendError(res, 500, 'REGION_CONFIG_ERROR', '地区配置加载失败。')
  }
})

app.post('/api/admin/regions', requirePermission('regions.manage'), rateLimit('region-write', 60_000, 60), async (req, res) => {
  const result = await normalizeRegionInputAsync(req.body)
  if (result.error) return sendError(res, 400, 'INVALID_REGION', result.error)

  const now = Date.now()
  const region = {
    ...result.region,
    id: makeId('region'),
    createdAt: now,
    updatedAt: now,
  }
  await insertRegionAsync(region)
  const saved = await findRegionAsync(region.id)
  await writeAuditAsync(req, 'create', 'region', region.id, null, saved)
  res.status(201).json(saved)
})

app.put('/api/admin/regions/:id', requirePermission('regions.manage'), rateLimit('region-write', 60_000, 60), async (req, res) => {
  const before = await findRegionAsync(req.params.id)
  if (!before) return sendError(res, 404, 'REGION_NOT_FOUND', '地区不存在。')

  const result = await normalizeRegionInputAsync({ ...before, ...req.body }, before.id)
  if (result.error) return sendError(res, 400, 'INVALID_REGION', result.error)

  await updateRegionAsync(before.id, result.region)
  const after = await findRegionAsync(before.id)
  await writeAuditAsync(req, 'update', 'region', before.id, before, after)
  res.json(after)
})

app.delete('/api/admin/regions/:id', requirePermission('regions.manage'), rateLimit('region-write', 60_000, 60), async (req, res) => {
  const before = await findRegionAsync(req.params.id)
  if (!before) return sendError(res, 404, 'REGION_NOT_FOUND', '地区不存在。')
  if (before.isDefault) return sendError(res, 400, 'DEFAULT_REGION_LOCKED', '默认地区不能删除，请先设置其他默认地区。')

  const childCount = await ADMIN_CORE_STORE.countChildRegions(before.id)
  if (childCount > 0) return sendError(res, 400, 'REGION_HAS_CHILDREN', '该地区下仍有子地区，请先处理子地区。')

  await ADMIN_CORE_STORE.deleteRegion(before.id)
  await writeAuditAsync(req, 'delete', 'region', before.id, before, null)
  res.status(204).end()
})

app.get('/api/admin/content-modules', requirePermission('content.edit'), async (req, res) => {
  const modules = await RUNTIME_MISC_STORE.listContentModuleRows()
  res.json(modules.map(rowToContentModule))
})

app.get('/api/admin/help-articles', requireAuth, async (req, res) => {
  res.json(listHelpArticlesConfig())
})

app.put('/api/admin/help-articles/:pageKey', requirePermission('settings.manage'), rateLimit('help-articles', 60_000, 60), async (req, res) => {
  const pageKey = cleanText(req.params.pageKey || '', 80)
  const before = findHelpArticleConfig(pageKey)
  if (!before) return sendError(res, 404, 'HELP_ARTICLE_NOT_FOUND', '帮助页面不存在。')
  const normalized = normalizeHelpArticleInput(req.body, pageKey)
  if (normalized.error) return sendError(res, 400, 'INVALID_HELP_ARTICLE', normalized.error)
  const after = saveHelpArticleConfig(normalized.article)
  await writeAuditAsync(req, 'update', 'help_article', pageKey, before, after)
  res.json(after)
})

app.put('/api/admin/content-modules/:key/default-publish-positions', requirePermission('settings.manage'), rateLimit('content-module-settings', 60_000, 60), async (req, res) => {
  const moduleKey = cleanText(req.params.key || '', 80)
  const beforeRow = await RUNTIME_MISC_STORE.findContentModuleRow(moduleKey)
  if (!beforeRow) return sendError(res, 404, 'CONTENT_MODULE_NOT_FOUND', '内容类型不存在。')

  const normalized = normalizePublishPositionsConfig(req.body?.defaultPublishPositions || req.body)
  if (normalized.error) return sendError(res, 400, 'INVALID_PUBLISH_POSITIONS', normalized.error)

  await RUNTIME_MISC_STORE.updateContentModuleDefaultPublishPositions(moduleKey, normalized.positions)

  const afterRow = await RUNTIME_MISC_STORE.findContentModuleRow(moduleKey)
  const before = rowToContentModule(beforeRow)
  const after = rowToContentModule(afterRow)
  await writeAuditAsync(req, 'update_default_publish_positions', 'content_module', moduleKey, before, after)
  res.json(after)
})

app.get('/api/admin/risk-tags', requireAnyPermission(['settings.manage', 'content.edit', 'content.review', 'content.final_review']), async (req, res) => {
  res.json(await listRiskTagTemplatesAsync({ includeInactive: req.query.includeInactive === 'true' }))
})

app.post('/api/admin/risk-tags', requirePermission('settings.manage'), rateLimit('risk-tags', 60_000, 60), async (req, res) => {
  const normalized = await normalizeRiskTagTemplateInputAsync(req.body)
  if (normalized.error) return sendError(res, 400, 'INVALID_RISK_TAG', normalized.error)
  const now = Date.now()
  const item = {
    id: makeId('risk_tag'),
    ...normalized.item,
    createdBy: req.user.id,
    createdAt: now,
    updatedAt: now,
  }
  await insertRiskTagTemplateAsync(item)
  const after = await findRiskTagTemplateAsync(item.id)
  await writeAuditAsync(req, 'create', 'risk_tag_template', item.id, null, after)
  res.status(201).json(after)
})

app.put('/api/admin/risk-tags/:id', requirePermission('settings.manage'), rateLimit('risk-tags', 60_000, 60), async (req, res) => {
  const before = await findRiskTagTemplateAsync(req.params.id)
  if (!before) return sendError(res, 404, 'RISK_TAG_NOT_FOUND', '风险标签不存在。')
  const normalized = await normalizeRiskTagTemplateInputAsync(req.body, before)
  if (normalized.error) return sendError(res, 400, 'INVALID_RISK_TAG', normalized.error)
  await updateRiskTagTemplateAsync(before.id, normalized.item)
  const after = await findRiskTagTemplateAsync(before.id)
  await writeAuditAsync(req, 'update', 'risk_tag_template', before.id, before, after)
  res.json(after)
})

app.delete('/api/admin/risk-tags/:id', requirePermission('settings.manage'), rateLimit('risk-tags', 60_000, 60), async (req, res) => {
  const before = await findRiskTagTemplateAsync(req.params.id)
  if (!before) return sendError(res, 404, 'RISK_TAG_NOT_FOUND', '风险标签不存在。')
  await RUNTIME_MISC_STORE.deleteRiskTagTemplate(before.id)
  await writeAuditAsync(req, 'delete', 'risk_tag_template', before.id, before, null)
  res.status(204).end()
})

app.get('/api/admin/review-workflows', requirePermission('content.review'), async (req, res) => {
  const workflows = await CONTENT_READ_STORE.listReviewWorkflowRows()
  res.json(await Promise.all(workflows.map((row) => rowToWorkflowAsync(row))))
})

app.get('/api/admin/review-tasks', requireAnyPermission(['content.review', 'content.final_review']), async (req, res) => {
  const status = cleanText(req.query.status || 'pending', 20)
  const userPermissions = req.userPermissions || await getUserPermissionCodesAsync(req.user.id)
  const rows = await CONTENT_READ_STORE.listReviewTaskRows({ status, limit: 200 })
  const tasks = await Promise.all(rows.map((row) => rowToReviewTaskAsync(row)))
  const visibleTasks = []
  for (const task of tasks) {
    if (!userPermissions.includes(task.requiredPermission)) continue
    const content = await findContentAsync(task.contentId, true)
    if (content && await canUserAccessContentAsync(req.user, content)) {
      visibleTasks.push(task)
    }
  }
  res.json(visibleTasks)
})

app.get('/api/admin/review-records/export', requireAnyPermission(['content.review', 'content.final_review']), rateLimit('review-export', 60_000, 20), async (req, res) => {
  const payload = await buildReviewRecordExportAsync(req.user)
  await writeAuditAsync(req, 'export_review_records', 'content_review_task', 'json', null, { count: payload.items.length })
  res.setHeader('Content-Disposition', `attachment; filename="suqu-review-records-${new Date().toISOString().slice(0, 10)}.json"`)
  res.json(payload)
})

app.get('/api/admin/contents', requirePermission('content.edit'), async (req, res) => {
  const result = await listContentsAsync(req.query, req.user)
  res.json(result)
})

app.post('/api/admin/contents', requirePermission('content.create'), rateLimit('content-write', 60_000, 120), async (req, res) => {
  const normalized = await normalizeContentInputAsync(req.body)
  if (normalized.error) return sendError(res, 400, 'INVALID_CONTENT', normalized.error)
  if (!await canUserAccessContentAsync(req.user, { data: normalized.content.data })) {
    return sendError(res, 403, 'REGION_FORBIDDEN', '不能在未授权地区创建内容。')
  }

  const now = Date.now()
  const contentId = makeId('content')
  const versionId = makeId('version')
  const workflow = await findWorkflowForModuleAsync(normalized.content.moduleKey)

  await runInDatabaseTransactionAsync(async () => {
    await CONTENT_WRITE_STORE.insertContent({
      id: contentId,
      moduleKey: normalized.content.moduleKey,
      category: normalized.content.category,
      tagsJson: JSON.stringify(normalized.content.tags),
      status: 'draft',
      title: normalized.content.title,
      summary: normalized.content.summary,
      sensitiveLevel: normalized.content.sensitiveLevel,
      riskTypesJson: JSON.stringify(normalized.content.riskTypes),
      currentVersionId: versionId,
      publishedVersionId: null,
      workflowId: workflow?.id || null,
      currentStepId: null,
      createdBy: req.user.id,
      updatedBy: req.user.id,
      submittedAt: null,
      publishedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    await insertContentVersionAsync(versionId, contentId, 1, normalized.content, req.user.id, now)
    await replaceContentSourcesAsync(contentId, versionId, normalized.sources)
  })

  const content = await findContentAsync(contentId)
  await writeAuditAsync(req, 'create', 'content', contentId, null, content)
  res.status(201).json(content)
})

app.get('/api/admin/contents/:id', requireAnyPermission(['content.edit', 'content.review', 'content.final_review']), async (req, res) => {
  const content = await findContentAsync(req.params.id, true)
  if (!content) return sendError(res, 404, 'CONTENT_NOT_FOUND', 'Content not found.')
  if (!await requireContentRegionAccessAsync(req, res, content)) return
  res.json(content)
})

app.put('/api/admin/contents/:id', requirePermission('content.edit'), rateLimit('content-write', 60_000, 120), async (req, res) => {
  const before = await findContentAsync(req.params.id, true)
  if (!before) return sendError(res, 404, 'CONTENT_NOT_FOUND', 'Content not found.')
  if (!await requireContentRegionAccessAsync(req, res, before)) return
  if (before.status === 'deleted') return sendError(res, 409, 'CONTENT_DELETED', 'Deleted content must be restored before editing.')

  const normalized = await normalizeContentInputAsync({
    ...before.currentVersion,
    ...req.body,
    moduleKey: req.body.moduleKey || before.moduleKey,
    sources: req.body.sources === undefined ? before.sources : req.body.sources,
  })
  if (normalized.error) return sendError(res, 400, 'INVALID_CONTENT', normalized.error)
  if (!await canUserAccessContentAsync(req.user, { data: normalized.content.data })) {
    return sendError(res, 403, 'REGION_FORBIDDEN', '不能将内容改到未授权地区。')
  }

  const now = Date.now()
  const nextVersion = before.status === 'published' || before.status === 'unpublished'
    ? (before.latestVersionNumber + 1)
    : before.currentVersion.versionNumber
  const versionId = before.status === 'published' || before.status === 'unpublished' ? makeId('version') : before.currentVersion.id
  const status = 'draft'

  await runInDatabaseTransactionAsync(async () => {
    if (versionId === before.currentVersion.id) {
      await updateContentVersionAsync(versionId, normalized.content, req.user.id, now)
    } else {
      await insertContentVersionAsync(versionId, before.id, nextVersion, normalized.content, req.user.id, now)
    }
    await CONTENT_WRITE_STORE.updateContentFields(before.id, {
      category: normalized.content.category,
      tagsJson: JSON.stringify(normalized.content.tags),
      status,
      title: normalized.content.title,
      summary: normalized.content.summary,
      sensitiveLevel: normalized.content.sensitiveLevel,
      riskTypesJson: JSON.stringify(normalized.content.riskTypes),
      currentVersionId: versionId,
      currentStepId: null,
      updatedBy: req.user.id,
      updatedAt: now,
    })
    await replaceContentSourcesAsync(before.id, versionId, normalized.sources)
    await cancelPendingReviewTasksAsync(before.id)
  })

  const after = await findContentAsync(before.id, true)
  await writeAuditAsync(req, 'update', 'content', before.id, before, after)
  res.json(after)
})

app.put('/api/admin/contents/actions/batch', requirePermission('batch.manage'), rateLimit('content-write', 60_000, 20), async (req, res) => {
  const ids = Array.from(new Set((Array.isArray(req.body?.ids) ? req.body.ids : []).map((id) => cleanText(id, 80)).filter(Boolean)))
  if (!ids.length) return sendError(res, 400, 'CONTENT_IDS_REQUIRED', 'At least one content id is required.')
  if (ids.length > 50) return sendError(res, 400, 'TOO_MANY_ITEMS', 'Batch updates support at most 50 items.')

  const patchResult = normalizeContentBatchPatch(req.body?.patch ?? req.body)
  if (patchResult.error) return sendError(res, 400, 'INVALID_BATCH_PATCH', patchResult.error)

  const befores = []
  for (const id of ids) {
    const before = await findContentAsync(id, true)
    if (!before) return sendError(res, 404, 'CONTENT_NOT_FOUND', `Content not found: ${id}`)
    if (!await requireContentRegionAccessAsync(req, res, before)) return
    if (before.status === 'deleted') return sendError(res, 409, 'CONTENT_DELETED', 'Deleted content must be restored before editing.')
    befores.push(before)
  }

  const now = Date.now()
  const entries = []

  try {
    await runInDatabaseTransactionAsync(async () => {
    for (const before of befores) {
      const normalized = await normalizeContentInputAsync({
        ...before.currentVersion,
        moduleKey: patchResult.patch.moduleKey ?? before.moduleKey,
        title: before.currentVersion.title,
        summary: before.currentVersion.summary,
        body: before.currentVersion.body,
        category: patchResult.patch.category !== undefined ? patchResult.patch.category : before.category,
        sensitiveLevel: patchResult.patch.sensitiveLevel ?? before.sensitiveLevel,
        tags: patchResult.patch.tags !== undefined ? patchResult.patch.tags : before.tags,
        riskTypes: patchResult.patch.riskTypes !== undefined ? patchResult.patch.riskTypes : before.riskTypes,
        sources: before.sources,
      })
      if (normalized.error) throw new Error(normalized.error)
      const after = await applyContentUpdateAsync(before, normalized, req.user.id, now)
      entries.push({ before, after })
    }
    })
  } catch (error) {
    return sendError(res, 400, 'BATCH_UPDATE_FAILED', error.message || 'Batch update failed.')
  }

  for (const entry of entries) {
    await writeAuditAsync(req, 'batch_update', 'content', entry.before.id, entry.before, entry.after)
  }

  res.json({ items: entries.map((entry) => entry.after), total: entries.length })
})

app.post('/api/admin/contents/:id/submit', requirePermission('content.edit'), rateLimit('content-review', 60_000, 120), async (req, res) => {
  const content = await findContentAsync(req.params.id, true)
  if (!content) return sendError(res, 404, 'CONTENT_NOT_FOUND', '内容不存在。')
  if (!await requireContentRegionAccessAsync(req, res, content)) return
  if (!['draft', 'rejected'].includes(content.status)) return sendError(res, 409, 'INVALID_CONTENT_STATUS', '只有草稿或已驳回内容可以提交审核。')

  const firstStep = (await getWorkflowStepsAsync(content.workflowId))[0]
  if (!firstStep) return sendError(res, 400, 'WORKFLOW_NOT_CONFIGURED', '审核流程没有配置节点。')
  const returnStep = content.status === 'rejected' && content.currentStepId
    ? await getWorkflowStepByIdAsync(content.workflowId, content.currentStepId)
    : null
  const targetStep = returnStep || firstStep

  await runInDatabaseTransactionAsync(async () => {
    await cancelPendingReviewTasksAsync(content.id)
    await createReviewTaskAsync(content.id, content.currentVersion.id, content.workflowId, targetStep, req.user.id)
    const now = Date.now()
    await CONTENT_WRITE_STORE.updateContentFields(content.id, {
      status: 'pending_review',
      currentStepId: targetStep.id,
      submittedAt: now,
      updatedBy: req.user.id,
      updatedAt: now,
    })
  })

  const after = await findContentAsync(content.id, true)
  await writeAuditAsync(req, 'submit', 'content', content.id, content, after)
  res.json(after)
})

app.post('/api/admin/contents/:id/review', requireAnyPermission(['content.review', 'content.final_review']), rateLimit('content-review', 60_000, 120), async (req, res) => {
  const decision = cleanText(req.body?.decision, 20)
  const comment = cleanText(req.body?.comment || '', 2000)
  const returnStepId = cleanText(req.body?.returnStepId || req.body?.return_step_id || '', 120)
  if (!['approve', 'reject'].includes(decision)) return sendError(res, 400, 'INVALID_REVIEW_DECISION', '审核决定不正确。')
  if (decision === 'reject' && !comment) return sendError(res, 400, 'REJECT_REASON_REQUIRED', '驳回必须填写原因。')

  const content = await findContentAsync(req.params.id, true)
  if (!content) return sendError(res, 404, 'CONTENT_NOT_FOUND', '内容不存在。')
  if (!await requireContentRegionAccessAsync(req, res, content)) return
  const task = await findPendingReviewTaskAsync(content.id)
  if (!task) return sendError(res, 409, 'NO_PENDING_REVIEW', '当前内容没有待审核任务。')

  const permissions = req.userPermissions || await getUserPermissionCodesAsync(req.user.id)
  if (!permissions.includes(task.requiredPermission)) {
    return sendError(res, 403, 'FORBIDDEN_REVIEW_STEP', '你没有当前审核节点权限。')
  }
  let returnStep = null
  if (decision === 'reject') {
    returnStep = returnStepId ? await getWorkflowStepByIdAsync(content.workflowId, returnStepId) : await getWorkflowStepByIdAsync(content.workflowId, task.stepId)
    if (!returnStep) return sendError(res, 400, 'RETURN_STEP_INVALID', '退回节点不存在。')
    if (returnStep.stepOrder > task.stepOrder) return sendError(res, 400, 'RETURN_STEP_INVALID', '退回节点不能晚于当前审核节点。')
  }

  await runInDatabaseTransactionAsync(async () => {
    const now = Date.now()
    await CONTENT_WRITE_STORE.updateReviewTaskFields(task.id, {
      status: decision === 'approve' ? 'approved' : 'rejected',
      reviewerId: req.user.id,
      comment,
      reviewedAt: now,
    })

    if (decision === 'reject') {
      await CONTENT_WRITE_STORE.updateContentFields(content.id, {
        status: 'rejected',
        currentStepId: returnStep.id,
        updatedBy: req.user.id,
        updatedAt: now,
      })
    } else if (task.isFinal) {
      await CONTENT_WRITE_STORE.updateContentFields(content.id, {
        status: 'published',
        publishedVersionId: content.currentVersion.id,
        currentStepId: null,
        publishedAt: now,
        updatedBy: req.user.id,
        updatedAt: now,
      })
    } else {
      const nextStep = await getNextWorkflowStepAsync(content.workflowId, task.stepOrder)
      if (!nextStep) {
        await CONTENT_WRITE_STORE.updateContentFields(content.id, {
          status: 'published',
          publishedVersionId: content.currentVersion.id,
          currentStepId: null,
          publishedAt: now,
          updatedBy: req.user.id,
          updatedAt: now,
        })
      } else {
        await createReviewTaskAsync(content.id, content.currentVersion.id, content.workflowId, nextStep, req.user.id)
        await CONTENT_WRITE_STORE.updateContentFields(content.id, {
          status: 'in_review',
          currentStepId: nextStep.id,
          updatedBy: req.user.id,
          updatedAt: now,
        })
      }
    }
  })

  const after = await findContentAsync(content.id, true)
  await writeAuditAsync(req, decision === 'approve' ? 'approve' : 'reject', 'content', content.id, content, after)
  res.json(after)
})

app.post('/api/admin/contents/:id/unpublish', requirePermission('content.publish'), async (req, res) => {
  const before = await findContentAsync(req.params.id, true)
  if (!before) return sendError(res, 404, 'CONTENT_NOT_FOUND', 'Content not found.')
  if (!await requireContentRegionAccessAsync(req, res, before)) return
  await CONTENT_WRITE_STORE.updateContentFields(before.id, {
    status: 'unpublished',
    updatedBy: req.user.id,
    updatedAt: Date.now(),
  })
  const after = await findContentAsync(before.id, true)
  await writeAuditAsync(req, 'unpublish', 'content', before.id, before, after)
  res.json(after)
})

app.post('/api/admin/contents/:id/trash', requirePermission('content.delete'), async (req, res) => {
  const before = await findContentAsync(req.params.id, true)
  if (!before) return sendError(res, 404, 'CONTENT_NOT_FOUND', 'Content not found.')
  if (!await requireContentRegionAccessAsync(req, res, before)) return
  await cancelPendingReviewTasksAsync(before.id)
  const now = Date.now()
  await CONTENT_WRITE_STORE.updateContentFields(before.id, {
    status: 'deleted',
    deletedAt: now,
    updatedBy: req.user.id,
    updatedAt: now,
  })
  const after = await findContentAsync(before.id, true)
  await writeAuditAsync(req, 'trash', 'content', before.id, before, after)
  res.json(after)
})

app.post('/api/admin/contents/:id/restore', requirePermission('content.delete'), async (req, res) => {
  const before = await findContentAsync(req.params.id, true)
  if (!before) return sendError(res, 404, 'CONTENT_NOT_FOUND', 'Content not found.')
  if (!await requireContentRegionAccessAsync(req, res, before)) return
  await CONTENT_WRITE_STORE.updateContentFields(before.id, {
    status: before.publishedVersionId ? 'unpublished' : 'draft',
    deletedAt: null,
    updatedBy: req.user.id,
    updatedAt: Date.now(),
  })
  const after = await findContentAsync(before.id, true)
  await writeAuditAsync(req, 'restore', 'content', before.id, before, after)
  res.json(after)
})

app.delete('/api/admin/contents/:id', requirePermission('trash.purge'), rateLimit('trash-purge', 60_000, 30), async (req, res) => {
  const before = await findContentAsync(req.params.id, true)
  if (!before) return sendError(res, 404, 'CONTENT_NOT_FOUND', 'Content not found.')
  if (!await requireContentRegionAccessAsync(req, res, before)) return
  if (before.status !== 'deleted' && !before.deletedAt) {
    return sendError(res, 409, 'CONTENT_NOT_TRASHED', 'Content must be moved to trash before permanent deletion.')
  }

  await cancelPendingReviewTasksAsync(before.id)
  await CONTENT_WRITE_STORE.deleteContent(before.id)
  await writeAuditAsync(req, 'purge', 'content', before.id, before, null)
  res.status(204).end()
})

app.get('/api/contents', async (req, res) => {
  const moduleKey = cleanText(req.query.moduleKey || req.query.module_key || '', 80)
  const regionId = cleanText(req.query.regionId || req.query.region_id || '', 120)
  const page = parsePositiveInt(req.query.page, 1)
  const pageSize = clamp(parsePositiveInt(req.query.pageSize, 50), 1, 100)
  const offset = (page - 1) * pageSize
  const where = ["c.status = 'published'", 'c.published_version_id IS NOT NULL']
  const params = []

  if (moduleKey) {
    where.push('c.module_key = ?')
    params.push(moduleKey)
  }
  if (moduleKey === 'oral_history') {
    where.push(`${SQL_DIALECT.jsonText('v.data_json', '$.authorizationStatus')} = 'authorized'`)
  }
  const requestedRegionFilter = await buildRequestedContentRegionWhereAsync(regionId, 'v.data_json')
  if (requestedRegionFilter.where) {
    where.push(requestedRegionFilter.where)
    params.push(...requestedRegionFilter.params)
  }

  const whereSql = `WHERE ${where.join(' AND ')}`
  const { total, rows } = await RUNTIME_MISC_STORE.listPublicContentRows({
    whereSql,
    params,
    pageSize,
    offset,
  })

  const items = (await Promise.all(rows.map((row) => rowToPublicContentAsync(row)))).filter(Boolean)
  res.json({ items, total: moduleKey === 'oral_history' ? items.length : total, page, pageSize })
})

app.get('/api/contents/:id', async (req, res) => {
  const row = await RUNTIME_MISC_STORE.findPublishedContentRow(req.params.id)

  if (!row) return sendError(res, 404, 'CONTENT_NOT_FOUND', 'Published content not found.')
  const content = await rowToPublicContentAsync(row)
  if (!content) return sendError(res, 404, 'CONTENT_NOT_FOUND', 'Published content not found.')
  res.json(content)
})

app.get('/api/archives', async (req, res) => {
  // 公开归档点位数据低频变化，5 分钟浏览器缓存可显著降低后端查询压力
  res.set('Cache-Control', 'public, max-age=300')
  const publishedArchives = await listPublishedArchiveContentsAsync(req.query)
  const filtered = await filterArchiveResultByRegionQueryAsync(publishedArchives, req.query)
  res.json(filtered.paginated ? filtered : filtered.items)
})

app.get('/api/archives/:id', async (req, res) => {
  const publishedArchive = await findPublishedArchiveContentAsync(req.params.id)
  if (publishedArchive && hasValidArchiveCoordinates(publishedArchive)) return res.json(publishedArchive)

  return sendError(res, 404, 'ARCHIVE_NOT_FOUND', 'Published archive not found.')
})

app.post('/api/archives', requireAdmin, rateLimit('archive-write', 60_000, 60), async (req, res) => {
  const normalized = normalizeArchive(req.body)
  if (normalized.error) return sendError(res, 400, 'INVALID_ARCHIVE', normalized.error)

  const existing = await findArchiveAsync(normalized.archive.id)
  if (existing) return sendError(res, 409, 'ARCHIVE_EXISTS', 'Archive id already exists.')

  const now = Date.now()
  const archive = { ...normalized.archive, createdAt: now, updatedAt: now }
  await RUNTIME_MISC_STORE.insertLegacyArchive(archive)

  await writeAuditAsync(req, 'create', 'archive', archive.id, null, archive)
  res.status(201).json(archive)
})

app.put('/api/archives/:id', requireAdmin, rateLimit('archive-write', 60_000, 60), async (req, res) => {
  const before = await findArchiveAsync(req.params.id)
  if (!before) return sendError(res, 404, 'ARCHIVE_NOT_FOUND', 'Archive not found.')

  const normalized = normalizeArchive({ ...before, ...req.body, id: req.params.id })
  if (normalized.error) return sendError(res, 400, 'INVALID_ARCHIVE', normalized.error)

  const archive = {
    ...normalized.archive,
    createdAt: before.createdAt,
    updatedAt: Date.now(),
  }

  await RUNTIME_MISC_STORE.updateLegacyArchive(archive.id, archive)

  await writeAuditAsync(req, 'update', 'archive', archive.id, before, archive)
  res.json(archive)
})

app.delete('/api/archives/:id', requireAdmin, rateLimit('archive-write', 60_000, 60), async (req, res) => {
  const before = await findArchiveAsync(req.params.id)
  if (!before) return sendError(res, 404, 'ARCHIVE_NOT_FOUND', 'Archive not found.')

  await RUNTIME_MISC_STORE.deleteLegacyArchive(req.params.id)
  await writeAuditAsync(req, 'delete', 'archive', req.params.id, before, null)
  res.status(204).end()
})

app.get('/api/messages', async (req, res) => {
  const publishedMessages = await listPublishedMessageContentsAsync(req.query)
  res.json(publishedMessages.paginated ? publishedMessages : publishedMessages.items)
})

app.post('/api/messages', rateLimit('message-write', 60_000, 12), async (req, res) => {
  const normalized = normalizeMessage(req.body)
  if (normalized.error) return sendError(res, 400, 'INVALID_MESSAGE', normalized.error)

  const workflow = await findWorkflowForModuleAsync('message')
  const workflowSteps = workflow ? await getWorkflowStepsAsync(workflow.id) : []
  const firstStep = workflowSteps[0] || null
  if (!workflow || !firstStep) return sendError(res, 500, 'WORKFLOW_NOT_CONFIGURED', 'Message review workflow is not configured.')

  const message = {
    ...normalized.message,
    id: `msg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    createdAt: Date.now(),
    ip: getClientIp(req),
  }

  const contentId = `content-message-${message.id}`
  const versionId = `version-message-${message.id}-1`
  const content = {
    moduleKey: 'message',
    title: `${message.name} 的留言`,
    summary: message.text.slice(0, 120),
    body: message.text,
    category: message.identity,
    tags: ['public-submission'],
    sensitiveLevel: 'attention',
    riskTypes: ['群众投稿待审核'],
    data: message,
  }

  await runInDatabaseTransactionAsync(async () => {
    await CONTENT_WRITE_STORE.insertContent({
      id: contentId,
      moduleKey: 'message',
      category: message.identity,
      tagsJson: JSON.stringify(content.tags),
      status: 'pending_review',
      title: content.title,
      summary: content.summary,
      sensitiveLevel: content.sensitiveLevel,
      riskTypesJson: JSON.stringify(content.riskTypes),
      currentVersionId: versionId,
      publishedVersionId: null,
      workflowId: workflow.id,
      currentStepId: firstStep.id,
      createdBy: 'public',
      updatedBy: 'public',
      submittedAt: message.createdAt,
      publishedAt: null,
      deletedAt: null,
      createdAt: message.createdAt,
      updatedAt: message.createdAt,
    })
    await insertContentVersionAsync(versionId, contentId, 1, content, 'public', message.createdAt)
    await createReviewTaskAsync(contentId, versionId, workflow.id, firstStep, 'public')
  })

  await writeAuditAsync(req, 'create', 'message', message.id, null, message)
  res.status(202).json({ pendingReview: true, message: stripPrivateMessageFields(message) })
})

app.delete('/api/messages/:id', requireAdmin, rateLimit('message-admin', 60_000, 120), async (req, res) => {
  const before = await findMessageAsync(req.params.id)
  if (!before) return sendError(res, 404, 'MESSAGE_NOT_FOUND', 'Message not found.')

  await RUNTIME_MISC_STORE.deleteMessage(req.params.id)
  await writeAuditAsync(req, 'delete', 'message', req.params.id, before, null)
  res.status(204).end()
})

app.get('/api/checkin/progress', async (req, res) => {
  const visitorId = cleanText(req.get('x-visitor-id') || req.query.visitorId || '', 120)
  if (!visitorId) {
    return res.json({ visitorId: '', visitedPois: [], updatedAt: null })
  }
  const progress = await findCheckinProgressAsync(visitorId)
  res.json(progress || { visitorId, visitedPois: [], updatedAt: null })
})

app.post('/api/checkin/progress', rateLimit('checkin-progress', 60_000, 120), async (req, res) => {
  const visitorId = cleanText(req.get('x-visitor-id') || req.body?.visitorId || '', 120)
  if (!visitorId) return sendError(res, 400, 'CHECKIN_VISITOR_REQUIRED', 'Visitor id is required.')

  const normalized = normalizeCheckinProgress(req.body)
  if (normalized.error) return sendError(res, 400, 'INVALID_CHECKIN_PROGRESS', normalized.error)

  const current = await findCheckinProgressAsync(visitorId)
  const merged = mergeCheckinPois(current?.visitedPois || [], normalized.visitedPois)
  const updatedAt = Date.now()

  await RUNTIME_MISC_STORE.upsertCheckinProgress(visitorId, JSON.stringify(merged), updatedAt)

  res.json({ visitorId, visitedPois: merged, updatedAt })
})

app.get('/api/admin/tributes', requireAnyPermission(['content.edit', 'settings.manage']), async (req, res) => {
  res.json({ count: await getTributeCountAsync(), updatedAt: Date.now() })
})

app.put('/api/admin/tributes', requirePermission('settings.manage'), rateLimit('tribute-admin', 60_000, 60), async (req, res) => {
  const count = normalizeTributeCount(req.body?.count)
  if (count === null) return sendError(res, 400, 'INVALID_TRIBUTE_COUNT', 'Tribute count must be a non-negative integer.')

  const before = { count: await getTributeCountAsync() }
  await RUNTIME_MISC_STORE.setTributeCount(count)
  const after = { count: await getTributeCountAsync() }
  await writeAuditAsync(req, 'update', 'tribute', '1', before, after)
  res.json(after)
})

app.post('/api/admin/tributes/adjust', requirePermission('settings.manage'), rateLimit('tribute-admin', 60_000, 60), async (req, res) => {
  const delta = normalizeTributeDelta(req.body?.delta)
  if (delta === null) return sendError(res, 400, 'INVALID_TRIBUTE_DELTA', 'Tribute delta must be an integer between -1000000 and 1000000.')

  const before = { count: await getTributeCountAsync() }
  const nextCount = Math.max(0, before.count + delta)
  await RUNTIME_MISC_STORE.setTributeCount(nextCount)
  const after = { count: await getTributeCountAsync(), delta }
  await writeAuditAsync(req, 'adjust', 'tribute', '1', before, after)
  res.json({ count: after.count })
})

app.get('/api/tributes', async (req, res) => {
  res.json({ count: await getTributeCountAsync() })
})

app.post('/api/tributes', rateLimit('tribute-write', 10_000, 20), async (req, res) => {
  await RUNTIME_MISC_STORE.incrementTributeCount()
  const count = await getTributeCountAsync()
  await writeAuditAsync(req, 'increment', 'tribute', '1', null, { count })
  res.json({ count })
})

app.get('/api/admin/media-assets', requirePermission('media.manage'), async (req, res) => {
  res.json(await listMediaAssetsAsync(req.query))
})

app.get('/api/admin/media-assets/:id', requirePermission('media.manage'), async (req, res) => {
  const asset = await findMediaAssetAsync(req.params.id)
  if (!asset) return sendError(res, 404, 'MEDIA_NOT_FOUND', 'Media asset not found.')
  res.json(asset)
})

app.post(
  '/api/admin/media-assets/upload',
  requirePermission('media.manage'),
  rateLimit('media-upload', 60_000, 30),
  express.raw({ type: '*/*', limit: MAX_MEDIA_UPLOAD_BYTES }),
  async (req, res, next) => {
    const normalized = normalizeMediaUpload(req)
    if (normalized.error) return sendError(res, 400, 'INVALID_MEDIA_UPLOAD', normalized.error)

    const now = Date.now()
    const id = makeId('media')
    const datePath = new Date(now).toISOString().slice(0, 7).replace('-', '/')
    const targetDir = path.join(UPLOAD_DIR, datePath)
    const originalsDir = path.join(UPLOAD_DIR, 'originals', datePath)
    fs.mkdirSync(targetDir, { recursive: true })
    fs.mkdirSync(originalsDir, { recursive: true })

    const storedName = `${id}${normalized.extension}`
    const originalStoragePath = path.join(originalsDir, storedName)
    fs.writeFileSync(originalStoragePath, normalized.buffer)

    try {
      const processed = await processMediaUpload({
        id,
        normalized,
        targetDir,
        datePath,
        storedName,
        originalStoragePath,
      })
      const asset = {
        id,
        originalName: normalized.originalName,
        storedName: processed.storedName,
        mediaType: normalized.mediaType,
        mimeType: processed.mimeType,
        extension: processed.extension,
        sizeBytes: processed.sizeBytes,
        width: processed.width || null,
        height: processed.height || null,
        durationSeconds: processed.durationSeconds || null,
        category: normalized.category,
        altText: normalized.altText,
        caption: normalized.caption,
        originalUrl: `/uploads/originals/${datePath}/${storedName}`.replace(/\\/g, '/'),
        url: processed.url,
        thumbnailUrl: processed.thumbnailUrl,
        originalStoragePath,
        storagePath: processed.storagePath,
        checksumSha256: crypto.createHash('sha256').update(normalized.buffer).digest('hex'),
        watermarkText: normalized.watermarkText,
        autoCompress: normalized.autoCompress,
        processingStatus: processed.processingStatus,
        processingNote: processed.processingNote,
        uploadedBy: req.user.id,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      }

      await insertMediaAssetAsync(asset)
      const after = await findMediaAssetAsync(id)
      await writeAuditAsync(req, 'upload', 'media_asset', id, null, after)
      res.status(201).json(after)
    } catch (error) {
      try { fs.rmSync(originalStoragePath, { force: true }) } catch {}
      console.error('[media] 上传处理失败', error && error.stack ? error.stack : error)
      return sendError(res, 500, 'MEDIA_UPLOAD_PROCESSING_ERROR', '媒体文件处理失败，请稍后重试。')
    }
  },
)

app.put('/api/admin/media-assets/:id', requirePermission('media.manage'), rateLimit('media-manage', 60_000, 120), async (req, res) => {
  const before = await findMediaAssetAsync(req.params.id)
  if (!before) return sendError(res, 404, 'MEDIA_NOT_FOUND', 'Media asset not found.')
  if (before.deletedAt) return sendError(res, 409, 'MEDIA_DELETED', 'Deleted media must be restored before editing.')

  const metadata = normalizeMediaMetadata(req.body)
  if (metadata.error) return sendError(res, 400, 'INVALID_MEDIA_METADATA', metadata.error)

  await CONTENT_WRITE_STORE.updateMediaAssetFields(before.id, {
    category: metadata.category,
    altText: metadata.altText,
    caption: metadata.caption,
    watermarkText: metadata.watermarkText,
    autoCompress: metadata.autoCompress ? 1 : 0,
    updatedAt: Date.now(),
  })
  const after = await findMediaAssetAsync(before.id)
  await writeAuditAsync(req, 'update', 'media_asset', before.id, before, after)
  res.json(after)
})

app.put('/api/admin/media-assets/actions/batch', requirePermission('batch.manage'), rateLimit('media-manage', 60_000, 20), async (req, res) => {
  const ids = Array.from(new Set((Array.isArray(req.body?.ids) ? req.body.ids : []).map((id) => cleanText(id, 80)).filter(Boolean)))
  if (!ids.length) return sendError(res, 400, 'MEDIA_IDS_REQUIRED', 'At least one media asset id is required.')
  if (ids.length > 50) return sendError(res, 400, 'TOO_MANY_ITEMS', 'Batch updates support at most 50 items.')

  const patchResult = normalizeMediaBatchPatch(req.body?.patch ?? req.body)
  if (patchResult.error) return sendError(res, 400, 'INVALID_BATCH_PATCH', patchResult.error)

  const befores = []
  for (const id of ids) {
    const before = await findMediaAssetAsync(id)
    if (!before) return sendError(res, 404, 'MEDIA_NOT_FOUND', `Media asset not found: ${id}`)
    if (before.deletedAt) return sendError(res, 409, 'MEDIA_DELETED', 'Deleted media must be restored before editing.')
    befores.push(before)
  }

  const now = Date.now()
  const entries = []

  try {
    await runInDatabaseTransactionAsync(async () => {
      for (const before of befores) {
        const after = await applyMediaMetadataUpdateAsync(before, patchResult.patch, now)
        entries.push({ before, after })
      }
    })
  } catch (error) {
    return sendError(res, 400, 'BATCH_UPDATE_FAILED', error.message || 'Batch update failed.')
  }

  for (const entry of entries) {
    await writeAuditAsync(req, 'batch_update', 'media_asset', entry.before.id, publicMediaAsset(entry.before), entry.after)
  }

  res.json({ items: entries.map((entry) => entry.after), total: entries.length })
})

app.delete('/api/admin/media-assets/:id', requirePermission('media.manage'), rateLimit('media-manage', 60_000, 120), async (req, res) => {
  const before = await findMediaAssetAsync(req.params.id)
  if (!before) return sendError(res, 404, 'MEDIA_NOT_FOUND', 'Media asset not found.')
  if (before.deletedAt) return res.json(before)
  const now = Date.now()
  await CONTENT_WRITE_STORE.updateMediaAssetFields(before.id, {
    deletedAt: now,
    updatedAt: now,
  })
  const after = await findMediaAssetAsync(before.id)
  await writeAuditAsync(req, 'trash', 'media_asset', before.id, before, after)
  res.json(after)
})

app.post('/api/admin/media-assets/:id/restore', requirePermission('media.manage'), rateLimit('media-manage', 60_000, 120), async (req, res) => {
  const before = await findMediaAssetAsync(req.params.id, true)
  if (!before) return sendError(res, 404, 'MEDIA_NOT_FOUND', 'Media asset not found.')
  if (!mediaFilesExist(before)) return sendError(res, 409, 'MEDIA_FILE_MISSING', 'Media files are missing and cannot be restored.')
  await CONTENT_WRITE_STORE.updateMediaAssetFields(before.id, {
    deletedAt: null,
    updatedAt: Date.now(),
  })
  const after = await findMediaAssetAsync(before.id)
  await writeAuditAsync(req, 'restore', 'media_asset', before.id, publicMediaAsset(before), after)
  res.json(after)
})

app.delete('/api/admin/media-assets/:id/permanent', requirePermission('trash.purge'), rateLimit('trash-purge', 60_000, 30), async (req, res) => {
  const before = await findMediaAssetAsync(req.params.id, true)
  if (!before) return sendError(res, 404, 'MEDIA_NOT_FOUND', 'Media asset not found.')
  if (!before.deletedAt) return sendError(res, 409, 'MEDIA_NOT_TRASHED', 'Media asset must be moved to trash before permanent deletion.')

  await CONTENT_WRITE_STORE.deleteMediaAsset(before.id)
  removeMediaFiles({
    storage_path: before.storagePath,
    original_storage_path: before.originalStoragePath,
    thumbnail_url: before.thumbnailUrl,
  })
  await writeAuditAsync(req, 'purge', 'media_asset', before.id, publicMediaAsset(before), null)
  res.status(204).end()
})

// AI 域路由（已迁至 lib/ai-route.js，防膨胀；新增 AI 接口请加到该模块）
require('./lib/ai-route')(app, {
  requirePermission, rateLimit, sendError,
  listAiProvidersAsync, insertAiProviderAsync, findAiProviderAsync, updateAiProviderAsync,
  listAiTasksAsync, insertAiTaskAsync, findAiTaskAsync, setAiTaskRunningAsync,
  completeAiTaskAsync, registerAiExternalJobAsync, updateAiExternalJobStatusAsync,
  insertAiCallLogAsync, listAiCallLogsAsync, writeAuditAsync,
  getUserPermissionCodesAsync, findContentAsync, requireContentRegionAccessAsync,
  insertMediaAssetAsync, applyContentUpdateAsync, findWorkflowForModuleAsync,
  getWorkflowStepByIdAsync, getWorkflowStepsAsync, cancelPendingReviewTasksAsync,
  createReviewTaskAsync, runInDatabaseTransactionAsync,
  AI_OPS_STORE, CONTENT_WRITE_STORE,
})

app.get('/api/audit-logs', requirePermission('audit.read'), rateLimit('audit-read', 60_000, 120), async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1)
  const pageSize = clamp(parsePositiveInt(req.query.pageSize, 50), 1, 200)
  const offset = (page - 1) * pageSize
  const where = []
  const params = []
  const action = cleanText(req.query.action || '', 80)
  const entityType = cleanText(req.query.entityType || req.query.entity_type || '', 80)
  const actor = cleanText(req.query.actor || '', 120)
  const q = cleanText(req.query.q || '', 120)
  const createdFrom = parseDateBoundary(req.query.from || req.query.createdFrom, 'start')
  const createdTo = parseDateBoundary(req.query.to || req.query.createdTo, 'end')

  if (action) {
    where.push('action = ?')
    params.push(action)
  }
  if (entityType) {
    where.push('entity_type = ?')
    params.push(entityType)
  }
  if (actor) {
    where.push('actor LIKE ?')
    params.push(`%${actor}%`)
  }
  if (q) {
    where.push('(action LIKE ? OR entity_type LIKE ? OR entity_id LIKE ? OR actor LIKE ? OR ip LIKE ?)')
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`)
  }
  if (createdFrom !== null) {
    where.push('created_at >= ?')
    params.push(createdFrom)
  }
  if (createdTo !== null) {
    where.push('created_at <= ?')
    params.push(createdTo)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const { total, rows } = await AI_OPS_STORE.listAuditLogRows({
    whereSql,
    params,
    pageSize,
    offset,
  })
  const items = rows.map(rowToAuditLog)

  res.json({ items, total, page, pageSize })
})

app.get('/api/admin/backups', requirePermission('backup.restore'), rateLimit('backup', 60_000, 60), async (req, res) => {
  res.json({ items: listBackupFiles() })
})

app.get('/api/admin/acceptance-evidence', requirePermission('backup.restore'), rateLimit('backup', 60_000, 60), async (req, res) => {
  res.json({ items: listAcceptanceEvidenceFiles() })
})

app.get('/api/admin/acceptance-manual-record', requirePermission('backup.restore'), rateLimit('backup', 60_000, 60), async (req, res) => {
  res.json(readAcceptanceManualRecord())
})

app.put('/api/admin/acceptance-manual-record', requirePermission('backup.restore'), rateLimit('backup', 60_000, 20), async (req, res, next) => {
  try {
    const record = saveAcceptanceManualRecord(req.body || {}, req.adminActor || req.user?.username || 'admin')
    await writeAuditAsync(req, 'update', 'acceptance_record', 'v1-manual-record', null, {
      conclusion: record.conclusion,
      environment: record.environment,
      owner: record.owner,
    })
    res.json(record)
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/backup', requirePermission('backup.restore'), rateLimit('backup', 60_000, 10), async (req, res, next) => {
  try {
    const item = await createBackupSet()
    await writeAuditAsync(req, 'backup', 'database', item.name, null, item)
    res.status(201).json(item)
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/backups/:name/restore', requirePermission('backup.restore'), rateLimit('backup', 60_000, 5), async (req, res, next) => {
  try {
    const target = describeBackupFile(path.join(BACKUP_DIR, req.params.name))
    if (!target) return sendError(res, 404, 'BACKUP_NOT_FOUND', 'Backup file not found.')
    const item = await restoreDatabaseFromBackup(target.path)
    await writeAuditAsync(req, 'restore', 'database', item.backup.name, null, item.backup)
    res.json(item.backup)
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/export', requirePermission('import_export.manage'), rateLimit('export', 60_000, 20), async (req, res) => {
  const payload = await buildExportPayloadAsync()
  await writeAuditAsync(req, 'export', 'database', 'json', null, { tableCount: Object.keys(payload.tables).length })
  res.setHeader('Content-Disposition', `attachment; filename="suqu-export-${new Date().toISOString().slice(0, 10)}.json"`)
  res.json(payload)
})

app.post('/api/admin/import', requirePermission('import_export.manage'), rateLimit('import', 60_000, 10), async (req, res, next) => {
  try {
    const result = await importSnapshotPayloadAsync(req.body)
    if (result.error) {
      return sendError(res, 400, 'INVALID_IMPORT', result.error)
    }
    applyRuntimeBootstrap('import')
    await writeAuditAsync(req, 'import', 'database', 'json', null, result.counts)
    res.json({ importedAt: Date.now(), counts: result.counts, sessionInvalidated: true })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/trash/purge', requirePermission('trash.purge'), rateLimit('trash-purge', 60_000, 10), async (req, res) => {
  const deletedMedia = await AI_OPS_STORE.listDeletedMediaFileRows()
  const deletedContent = await AI_OPS_STORE.listDeletedContentIdRows()

  await runInDatabaseTransactionAsync(async () => {
    await AI_OPS_STORE.purgeDeletedContentAndMedia()
  })

  for (const item of deletedMedia) removeMediaFiles(item)
  const after = { contentPurged: deletedContent.length, mediaPurged: deletedMedia.length }
  await writeAuditAsync(req, 'purge', 'trash', 'all', null, after)
  res.json(after)
})

app.get(/^\/uploads\/.+/, async (req, res) => {
  const requestedPath = req.path.replace(/\\/g, '/')
  const row = await RUNTIME_MISC_STORE.findMediaAssetFileRowByRequestedPath(requestedPath)
  if (!row) return sendError(res, 404, 'MEDIA_FILE_NOT_FOUND', 'Media file not found.')

  // 若登记时未写入 storage_path（如 AI 结果本地产物），按 UPLOAD_DIR 直接映射（下方仍有前缀+存在性校验兜底）
  const filePath = requestedPath === row.url
    ? (row.storage_path || path.join(UPLOAD_DIR, requestedPath.replace(/^\/uploads\//, '')))
    : path.join(UPLOAD_DIR, requestedPath.replace(/^\/uploads\//, ''))
  const resolved = path.resolve(filePath)
  if (!resolved.startsWith(path.resolve(UPLOAD_DIR)) || !fs.existsSync(resolved)) {
    return sendError(res, 404, 'MEDIA_FILE_NOT_FOUND', 'Media file not found.')
  }
  res.setHeader('Cache-Control', ENV === 'production' ? 'public, max-age=604800' : 'no-cache')
  res.sendFile(resolved)
})

app.use('/api', (req, res) => {
  sendError(res, 404, 'API_NOT_FOUND', 'API endpoint not found.')
})

if (fs.existsSync(PUBLIC_ASSET_DIR)) {
  const imagesRoot = path.join(PUBLIC_ASSET_DIR, 'images')

  // WebP 内容协商：当浏览器支持 webp 且存在对应 .webp 副本时，优先返回 WebP。
  // 前端零改动、原图保留；不支持 webp 的客户端自动回退原图。
  app.use('/images', (req, res, next) => {
    if (!/\bimage\/webp\b/.test(req.headers.accept || '')) return next()
    const extMatch = req.path.match(/\.(jpe?g|png)$/i)
    if (!extMatch) return next()

    const webpPath = path.resolve(imagesRoot, `.${req.path.slice(0, -extMatch[0].length)}.webp`)
    const safePrefix = path.resolve(imagesRoot) + path.sep
    if (!webpPath.startsWith(safePrefix) || !fs.existsSync(webpPath)) return next()

    res.setHeader('Content-Type', 'image/webp')
    res.setHeader('Cache-Control', ENV === 'production' ? 'public, max-age=604800' : 'no-cache')
    res.sendFile(webpPath)
  })

  app.use('/images', express.static(imagesRoot, {
    dotfiles: 'deny',
    etag: true,
    maxAge: ENV === 'production' ? '7d' : 0,
  }))
}

if (fs.existsSync(ADMIN_DIST)) {
  const adminStatic = express.static(ADMIN_DIST, {
    etag: true,
    maxAge: ENV === 'production' ? '1h' : 0,
  })
  const adminAssetsDir = path.join(ADMIN_DIST, 'admin-assets')

  if (fs.existsSync(adminAssetsDir)) {
    app.use('/admin-assets', express.static(adminAssetsDir, {
      etag: true,
      maxAge: ENV === 'production' ? '1h' : 0,
    }))
  }

  app.use((req, res, next) => {
    if (!isAdminHost(req) && !isLocalAdminPath(req)) return next()
    adminStatic(req, res, (error) => {
      if (error) return next(error)
      res.sendFile(path.join(ADMIN_DIST, 'index.html'))
    })
  })
}

if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST, {
    etag: true,
    maxAge: ENV === 'production' ? '1h' : 0,
  }))
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'))
  })
}

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  if (error.type === 'entity.too.large') {
    return sendError(res, 413, 'PAYLOAD_TOO_LARGE', 'Uploaded payload is too large.')
  }
  if (error.type === 'entity.parse.failed' || error instanceof SyntaxError) {
    const detail = ENV === 'production' ? undefined : error.message
    return sendError(res, 400, 'INVALID_JSON', 'Request body must be valid JSON.', detail)
  }
  console.error('[api] 未处理异常', error && error.stack ? error.stack : error)
  const detail = ENV === 'production' ? undefined : error.message
  sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error.', detail)
})

const server = app.listen(PORT, () => {
  console.log(`[SYS] Suqu Digital Archive API is running at http://localhost:${PORT}`)
  console.log(`[SYS] Runtime database client: ${RUNTIME_DB_CLIENT}`)
  console.log(`[SYS] Configured database client: ${CONFIGURED_DB_CLIENT}`)
  console.log(`[SYS] SQLite database: ${DB_FILE}`)
  if (CONFIGURED_DB_CLIENT === 'mysql') {
    console.log(`[SYS] MySQL target: ${DATABASE_SUMMARY.mysqlHost}:${DATABASE_SUMMARY.mysqlPort}/${DATABASE_SUMMARY.mysqlDatabase}`)
    void DATABASE_RUNTIME.inspectConfiguredTarget().then((targetStatus) => {
      const mode = DATABASE_RUNTIME.getRuntimeModeSummary(targetStatus)
      if (targetStatus.reachable) {
        console.log(`[SYS] MySQL target reachable: ${targetStatus.version || 'unknown version'}, tables=${targetStatus.tableCount}, migrationRuns=${targetStatus.migrationRuns}`)
      } else {
        console.warn(`[WARN] MySQL target check failed: ${targetStatus.error || 'unknown error'}`)
      }
      if (mode.readyForRuntimeSwitch) {
        console.warn('[WARN] MySQL target is ready, but runtime is still in SQLite compatibility mode. The final runtime switch is not enabled yet.')
      } else if (mode.compatibilityMode) {
        console.warn(`[WARN] MySQL target is configured but not ready for runtime switch. blockers=${mode.blockers.join(',') || 'unknown'}`)
      }
    })
  }
  console.log('[SYS] API: /api/health /api/archives /api/tributes /api/messages')
  if (!ADMIN_TOKEN) {
    console.warn('[WARN] ADMIN_TOKEN is not set. Admin writes are open in development and blocked in production.')
  }
  if (fs.existsSync(CLIENT_DIST)) {
    console.log(`[SYS] Serving frontend from ${CLIENT_DIST}`)
  }
  if (fs.existsSync(ADMIN_DIST)) {
    console.log(`[SYS] Serving admin frontend from ${ADMIN_DIST}`)
  }
})


function buildCorsOptions() {
  if (!CORS_ORIGIN) return { origin: false, credentials: true }
  const allowed = CORS_ORIGIN.split(',').map((item) => item.trim()).filter(Boolean)

  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowed.includes(origin)) return callback(null, true)
      return callback(new Error('Origin is not allowed by CORS.'))
    },
  }
}



function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains')
  }
  next()
}



function ensureDatabaseMigrations() {
  ensureColumn('media_assets', 'original_url', 'TEXT')
  ensureColumn('media_assets', 'original_storage_path', 'TEXT')
  ensureColumn('media_assets', 'duration_seconds', 'REAL')
  ensureMediaAssetsTypeConstraint()
  ensureColumn('messages', 'in_reply_to', 'TEXT')
  ensureColumn('sessions', 'csrf_token', 'TEXT')
  ensureColumn('ai_providers', 'config_json', "TEXT NOT NULL DEFAULT '{}'")
  ensureColumn('ai_tasks', 'input_json', 'TEXT')
  ensureColumn('ai_tasks', 'external_job_id', 'TEXT')
  ensureColumn('ai_tasks', 'provider_status', 'TEXT')
  ensureColumn('ai_tasks', 'provider_request_json', 'TEXT')
  ensureColumn('ai_tasks', 'provider_response_json', 'TEXT')
  ensureColumn('ai_tasks', 'callback_token_hash', 'TEXT')
  ensureColumn('ai_tasks', 'callback_received_at', 'INTEGER')
  const addedContentModulePublishColumns = [
    ensureColumn('content_modules', 'default_publish_map', 'INTEGER NOT NULL DEFAULT 0'),
    ensureColumn('content_modules', 'default_publish_list', 'INTEGER NOT NULL DEFAULT 1'),
    ensureColumn('content_modules', 'default_publish_home', 'INTEGER NOT NULL DEFAULT 0'),
    ensureColumn('content_modules', 'default_publish_topic', 'INTEGER NOT NULL DEFAULT 0'),
    ensureColumn('content_modules', 'default_publish_guide', 'INTEGER NOT NULL DEFAULT 0'),
  ].some(Boolean)
  if (addedContentModulePublishColumns) applyContentModulePublishPositionDefaults()
}

function ensureMediaAssetsTypeConstraint() {
  const table = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'media_assets'").get()
  const createSql = String(table?.sql || '')
  if (createSql.includes("'audio'") && createSql.includes("'document'")) return

  db.exec('PRAGMA foreign_keys = OFF')
  db.exec('BEGIN')
  try {
    db.exec(`
      CREATE TABLE media_assets_next (
        id TEXT PRIMARY KEY,
        original_name TEXT NOT NULL,
        stored_name TEXT NOT NULL,
        media_type TEXT NOT NULL CHECK(media_type IN ('image', 'video', 'audio', 'document')),
        mime_type TEXT NOT NULL,
        extension TEXT NOT NULL,
        size_bytes INTEGER NOT NULL CHECK(size_bytes >= 0),
        width INTEGER,
        height INTEGER,
        duration_seconds REAL,
        category TEXT,
        alt_text TEXT,
        caption TEXT,
        original_url TEXT,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        original_storage_path TEXT,
        storage_path TEXT NOT NULL,
        checksum_sha256 TEXT NOT NULL,
        watermark_text TEXT,
        auto_compress INTEGER NOT NULL DEFAULT 0,
        processing_status TEXT NOT NULL CHECK(processing_status IN ('stored', 'queued', 'processed', 'failed')),
        processing_note TEXT,
        uploaded_by TEXT,
        deleted_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      INSERT INTO media_assets_next
        (id, original_name, stored_name, media_type, mime_type, extension, size_bytes, width, height, duration_seconds,
         category, alt_text, caption, original_url, url, thumbnail_url, original_storage_path, storage_path,
         checksum_sha256, watermark_text, auto_compress, processing_status, processing_note, uploaded_by,
         deleted_at, created_at, updated_at)
      SELECT
        id, original_name, stored_name, media_type, mime_type, extension, size_bytes, width, height, duration_seconds,
        category, alt_text, caption, original_url, url, thumbnail_url, original_storage_path, storage_path,
        checksum_sha256, watermark_text, auto_compress, processing_status, processing_note, uploaded_by,
        deleted_at, created_at, updated_at
      FROM media_assets;

      DROP TABLE media_assets;
      ALTER TABLE media_assets_next RENAME TO media_assets;
      CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(media_type);
      CREATE INDEX IF NOT EXISTS idx_media_assets_category ON media_assets(category);
      CREATE INDEX IF NOT EXISTS idx_media_assets_created ON media_assets(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_media_assets_deleted ON media_assets(deleted_at);
    `)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  } finally {
    db.exec('PRAGMA foreign_keys = ON')
  }
}

function ensureColumn(tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all()
  if (columns.some((column) => column.name === columnName)) return false
  db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run()
  return true
}

function applyContentModulePublishPositionDefaults() {
  const update = db.prepare(`
    UPDATE content_modules
    SET default_publish_map = ?, default_publish_list = ?, default_publish_home = ?,
        default_publish_topic = ?, default_publish_guide = ?
    WHERE module_key = ?
  `)
  for (const [moduleKey] of CONTENT_MODULES) {
    const defaults = getStaticContentModulePublishDefaults(moduleKey)
    update.run(
      defaults.map ? 1 : 0,
      defaults.list ? 1 : 0,
      defaults.home ? 1 : 0,
      defaults.topic ? 1 : 0,
      defaults.guide ? 1 : 0,
      moduleKey,
    )
  }
}





function seedDatabase() {
  if (RUNTIME_DB_CLIENT !== 'sqlite') return
  seedArchives()
  seedMessages()
  seedTributes()
}

function seedArchives() {
  if (RUNTIME_DB_CLIENT !== 'sqlite') return
  const count = db.prepare('SELECT count(*) AS count FROM archives').get().count
  if (count > 0) return

  const seed = readJson(SEED_ARCHIVES_FILE, {})
  const archives = Array.isArray(seed) ? seed : Object.values(seed)
  const now = Date.now()
  const insert = db.prepare(`
    INSERT OR IGNORE INTO archives
      (id, title, description, content, type, year, longitude, latitude, media_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  db.exec('BEGIN')
  try {
    for (const item of archives) {
      const normalized = normalizeArchive(item)
      if (normalized.error) continue
      const archive = normalized.archive
      insert.run(
        archive.id,
        archive.title,
        archive.description,
        archive.content || '',
        archive.type,
        archive.year,
        archive.longitude,
        archive.latitude,
        JSON.stringify(archive.media || []),
        Number(item.createdAt || item.created_at || now),
        Number(item.updatedAt || item.updated_at || now),
      )
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function seedMessages() {
  if (RUNTIME_DB_CLIENT !== 'sqlite') return
  const count = db.prepare('SELECT count(*) AS count FROM messages').get().count
  if (count > 0) return

  const seed = readJson(SEED_MESSAGES_FILE, [])
  const messages = Array.isArray(seed) ? seed : []
  const insert = db.prepare(`
    INSERT OR IGNORE INTO messages (id, name, identity, text, in_reply_to, created_at, ip)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  db.exec('BEGIN')
  try {
    for (const item of messages) {
      const normalized = normalizeMessage(item)
      if (normalized.error) continue
      insert.run(
        String(item.id || `msg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`),
        normalized.message.name,
        normalized.message.identity,
        normalized.message.text,
        normalized.message.inReplyTo || null,
        Number(item.createdAt || item.created_at || Date.now()),
        item.ip || null,
      )
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function seedTributes() {
  if (RUNTIME_DB_CLIENT !== 'sqlite') return
  const existing = db.prepare('SELECT count FROM tributes WHERE id = 1').get()
  if (existing) return

  const seed = readJson(SEED_TRIBUTES_FILE, { count: DEFAULT_TRIBUTE_COUNT })
  const count = Number.isFinite(Number(seed.count)) ? Math.max(0, Math.floor(Number(seed.count))) : DEFAULT_TRIBUTE_COUNT
  db.prepare('INSERT INTO tributes (id, count) VALUES (1, ?)').run(count)
}

function seedAccessControl() {
  if (RUNTIME_DB_CLIENT !== 'sqlite') return
  const now = Date.now()
  const insertPermission = db.prepare('INSERT OR IGNORE INTO permissions (code, name, group_name) VALUES (?, ?, ?)')
  const insertRole = db.prepare(`
    INSERT OR IGNORE INTO roles (id, name, description, is_system, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const insertRolePermission = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_code) VALUES (?, ?)')

  db.exec('BEGIN')
  try {
    for (const [code, name, group] of DEFAULT_PERMISSIONS) {
      insertPermission.run(code, name, group)
    }
    for (const role of DEFAULT_ROLES) {
      insertRole.run(role.id, role.name, role.description, 1, now, now)
      for (const permission of role.permissions) {
        insertRolePermission.run(role.id, permission)
      }
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function seedRegions() {
  if (RUNTIME_DB_CLIENT !== 'sqlite') return
  const count = db.prepare('SELECT count(*) AS count FROM regions').get().count
  if (count > 0) return

  const now = Date.now()
  const insert = db.prepare(`
    INSERT OR IGNORE INTO regions
      (id, parent_id, level, name, full_name, code, description, display_mode, map_mode, sort_order, is_default, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  db.exec('BEGIN')
  try {
    for (const region of DEFAULT_REGIONS) {
      insert.run(
        region.id,
        region.parentId,
        region.level,
        region.name,
        region.fullName,
        region.code,
        region.description,
        region.displayMode,
        region.mapMode,
        region.sortOrder,
        region.isDefault ? 1 : 0,
        region.isActive ? 1 : 0,
        now,
        now,
      )
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function seedContentSystem() {
  if (RUNTIME_DB_CLIENT !== 'sqlite') return
  const now = Date.now()
  const insertModule = db.prepare(`
    INSERT OR IGNORE INTO content_modules
      (module_key, name, default_publish_map, default_publish_list, default_publish_home, default_publish_topic, default_publish_guide)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const insertWorkflow = db.prepare(`
    INSERT OR IGNORE INTO review_workflows (id, module_key, name, is_default, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const insertStep = db.prepare(`
    INSERT OR IGNORE INTO review_workflow_steps
      (id, workflow_id, step_order, name, required_permission, role_id, is_final)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  db.exec('BEGIN')
  try {
    for (const [moduleKey, name] of CONTENT_MODULES) {
      const defaults = getStaticContentModulePublishDefaults(moduleKey)
      insertModule.run(
        moduleKey,
        name,
        defaults.map ? 1 : 0,
        defaults.list ? 1 : 0,
        defaults.home ? 1 : 0,
        defaults.topic ? 1 : 0,
        defaults.guide ? 1 : 0,
      )
    }
    for (const workflow of DEFAULT_WORKFLOWS) {
      insertWorkflow.run(workflow.id, workflow.moduleKey, workflow.name, 1, now, now)
      for (const step of workflow.steps) {
        insertStep.run(step.id, workflow.id, step.order, step.name, step.permission, step.roleId, step.isFinal ? 1 : 0)
      }
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function seedRiskTagTemplates() {
  if (RUNTIME_DB_CLIENT !== 'sqlite') return
  const now = Date.now()
  const insert = db.prepare(`
    INSERT OR IGNORE INTO risk_tag_templates
      (id, label, level, category, description, is_active, sort_order, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, 'system', ?, ?)
  `)
  db.exec('BEGIN')
  try {
    for (const item of DEFAULT_RISK_TAG_TEMPLATES) {
      insert.run(
        makeStableId('risk_tag', item.label),
        item.label,
        item.level,
        item.category,
        item.description,
        item.sortOrder,
        now,
        now,
      )
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function seedArchiveContentsFromLegacyStore() {
  if (RUNTIME_DB_CLIENT !== 'sqlite') return
  const existing = db.prepare("SELECT count(*) AS count FROM contents WHERE module_key = 'archive'").get()
  if (existing.count > 0) return

  const archives = db.prepare(`
    SELECT id, title, description, content, type, year, longitude, latitude, media_json, created_at, updated_at
    FROM archives
    ORDER BY year ASC, title ASC
  `).all()
  if (archives.length === 0) return

  const workflow = findWorkflowForModule('archive')
  const insertContent = db.prepare(`
    INSERT INTO contents
      (id, module_key, category, tags_json, status, title, summary, sensitive_level, risk_types_json,
       current_version_id, published_version_id, workflow_id, current_step_id, created_by, updated_by,
       submitted_at, published_at, deleted_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  db.exec('BEGIN')
  try {
    for (const archive of archives) {
      const contentId = `content-archive-${archive.id}`
      const versionId = `version-archive-${archive.id}-1`
      const now = Date.now()
      const content = {
        title: archive.title,
        summary: archive.description || '',
        body: archive.content || '',
        data: {
          legacyId: archive.id,
          type: archive.type,
          year: archive.year,
          longitude: archive.longitude,
          latitude: archive.latitude,
          media: safeJsonArray(archive.media_json),
        },
      }
      insertContent.run(
        contentId,
        'archive',
        archive.type,
        JSON.stringify(['legacy-migrated']),
        'draft',
        archive.title,
        archive.description || '',
        'attention',
        JSON.stringify(['史实来源待复核']),
        versionId,
        null,
        workflow?.id || null,
        null,
        'system-migration',
        'system-migration',
        null,
        null,
        null,
        archive.created_at || now,
        archive.updated_at || now,
      )
      insertContentVersion(versionId, contentId, 1, content, 'system-migration', archive.created_at || now)
    }
    db.exec('COMMIT')
    console.log(`[SYS] Migrated ${archives.length} legacy archives into draft CMS contents.`)
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function needsInitialSetup() {
  const row = db.prepare("SELECT count(*) AS count FROM admin_users WHERE role_id = 'super_admin'").get()
  return row.count === 0
}

async function needsInitialSetupAsync() {
  const users = await ADMIN_CORE_STORE.listAdminUsers({ limit: 200 })
  return !users.some((user) => (user.role_id || user.roleId) === 'super_admin')
}


function insertAdminUser(user) {
  ADMIN_CORE_STORE.insertAdminUser(user)
}

async function insertAdminUserAsync(user) {
  await ADMIN_CORE_STORE.insertAdminUser(user)
}

function findAdminUserByUsername(username) {
  return ADMIN_CORE_STORE.findAdminUserByUsername(username)
}

async function findAdminUserByUsernameAsync(username) {
  return await ADMIN_CORE_STORE.findAdminUserByUsername(username)
}



function findRole(id) {
  return ADMIN_CORE_STORE.findRole(id)
}

async function findRoleAsync(id) {
  return await ADMIN_CORE_STORE.findRole(id)
}

function listRoles() {
  const roles = ADMIN_CORE_STORE.listRoles()
  return roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: Boolean(role.is_system),
    permissions: getRolePermissionCodes(role.id),
    createdAt: role.created_at,
    updatedAt: role.updated_at,
  }))
}

async function listRolesAsync() {
  const roles = await ADMIN_CORE_STORE.listRoles()
  return await Promise.all(roles.map(async (role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: Boolean(role.is_system),
    permissions: await getRolePermissionCodesAsync(role.id),
    createdAt: role.created_at,
    updatedAt: role.updated_at,
  })))
}










function replaceUserRegions(userId, regionIds) {
  const now = Date.now()
  const ids = Array.from(new Set((regionIds || []).map((id) => cleanText(id, 120)).filter(Boolean)))
  ADMIN_CORE_STORE.replaceUserRegions(userId, ids, now)
}

async function replaceUserRegionsAsync(userId, regionIds) {
  const now = Date.now()
  const ids = Array.from(new Set((regionIds || []).map((id) => cleanText(id, 120)).filter(Boolean)))
  await ADMIN_CORE_STORE.replaceUserRegions(userId, ids, now)
}







function buildContentRegionWhere(user, dataColumnSql) {
  if (!user) return { where: '', params: [] }
  const scope = getUserRegionScope(user)
  if (scope.allRegions) return { where: '', params: [] }
  const ids = scope.scopeRegionIds.length > 0 ? scope.scopeRegionIds : [getDefaultRegionId()]
  const placeholders = ids.map(() => '?').join(', ')
  const regionIdSql = SQL_DIALECT.jsonText(dataColumnSql, '$.regionId')
  const legacyRegionIdSql = SQL_DIALECT.jsonText(dataColumnSql, '$.region_id')
  return {
    where: `COALESCE(${regionIdSql}, ${legacyRegionIdSql}, ?) IN (${placeholders})`,
    params: [getDefaultRegionId(), ...ids],
  }
}

async function buildContentRegionWhereAsync(user, dataColumnSql) {
  if (!user) return { where: '', params: [] }
  const scope = await getUserRegionScopeAsync(user)
  if (scope.allRegions) return { where: '', params: [] }
  const defaultRegionId = await getDefaultRegionIdAsync()
  const ids = scope.scopeRegionIds.length > 0 ? scope.scopeRegionIds : [defaultRegionId]
  const placeholders = ids.map(() => '?').join(', ')
  const regionIdSql = SQL_DIALECT.jsonText(dataColumnSql, '$.regionId')
  const legacyRegionIdSql = SQL_DIALECT.jsonText(dataColumnSql, '$.region_id')
  return {
    where: `COALESCE(${regionIdSql}, ${legacyRegionIdSql}, ?) IN (${placeholders})`,
    params: [defaultRegionId, ...ids],
  }
}

function buildRequestedContentRegionWhere(regionId, dataColumnSql) {
  const requestedRegionId = cleanText(regionId || '', 120)
  if (!requestedRegionId) return { where: '', params: [] }
  const region = findRegion(requestedRegionId)
  if (!region || !region.isActive) {
    return { where: '1 = 0', params: [] }
  }
  const activeRegions = listRegions().filter((item) => item.isActive)
  const ids = collectRegionAndDescendantIds(region.id, activeRegions)
  const placeholders = ids.map(() => '?').join(', ')
  const regionIdSql = SQL_DIALECT.jsonText(dataColumnSql, '$.regionId')
  const legacyRegionIdSql = SQL_DIALECT.jsonText(dataColumnSql, '$.region_id')
  return {
    where: `COALESCE(${regionIdSql}, ${legacyRegionIdSql}, ?) IN (${placeholders})`,
    params: [getDefaultRegionId(), ...ids],
  }
}

async function buildRequestedContentRegionWhereAsync(regionId, dataColumnSql) {
  const requestedRegionId = cleanText(regionId || '', 120)
  if (!requestedRegionId) return { where: '', params: [] }
  const region = await findRegionAsync(requestedRegionId)
  if (!region || !region.isActive) {
    return { where: '1 = 0', params: [] }
  }
  const activeRegions = (await listRegionsAsync()).filter((item) => item.isActive)
  const ids = collectRegionAndDescendantIds(region.id, activeRegions)
  const placeholders = ids.map(() => '?').join(', ')
  const regionIdSql = SQL_DIALECT.jsonText(dataColumnSql, '$.regionId')
  const legacyRegionIdSql = SQL_DIALECT.jsonText(dataColumnSql, '$.region_id')
  const defaultRegionId = await getDefaultRegionIdAsync()
  return {
    where: `COALESCE(${regionIdSql}, ${legacyRegionIdSql}, ?) IN (${placeholders})`,
    params: [defaultRegionId, ...ids],
  }
}



















function normalizeRegionInput(input, currentId = '') {
  if (!input || typeof input !== 'object') return { error: '地区数据不能为空。' }

  const parentId = cleanText(input.parentId || input.parent_id || '', 120) || null
  const level = cleanText(input.level || 'town', 20)
  const name = cleanText(input.name, 120)
  const fullNameInput = cleanText(input.fullName || input.full_name || '', 240)
  const code = cleanText(input.code || '', 80)
  const description = cleanText(input.description || '', 1000)
  const displayMode = cleanText(input.displayMode || input.display_mode || 'current', 40)
  const mapMode = cleanText(input.mapMode || input.map_mode || 'single', 40)
  const sortOrder = Number(input.sortOrder ?? input.sort_order ?? 0)
  const isDefault = Boolean(input.isDefault ?? input.is_default)
  const isActive = input.isActive === undefined && input.is_active === undefined ? true : Boolean(input.isActive ?? input.is_active)

  if (!name) return { error: '请填写地区名称。' }
  if (!REGION_LEVELS.includes(level)) return { error: '地区层级不正确。' }
  if (!REGION_DISPLAY_MODES.includes(displayMode)) return { error: '前端展示模式不正确。' }
  if (!REGION_MAP_MODES.includes(mapMode)) return { error: '地图模式不正确。' }
  if (!Number.isInteger(sortOrder) || sortOrder < -100000 || sortOrder > 100000) return { error: '排序值必须是 -100000 到 100000 之间的整数。' }
  if (parentId && parentId === currentId) return { error: '上级地区不能选择自己。' }

  const parent = parentId ? findRegion(parentId) : null
  if (parentId && !parent) return { error: '上级地区不存在。' }

  if (parentId && currentId && isRegionDescendant(parentId, currentId)) {
    return { error: '上级地区不能选择自己的下级地区。' }
  }

  if (code) {
    const duplicate = ADMIN_CORE_STORE.findRegionCodeDuplicate(code, currentId || '')
    if (duplicate) return { error: '地区编码已存在，请更换编码。' }
  }

  return {
    region: {
      parentId,
      level,
      name,
      fullName: fullNameInput || (parent ? `${parent.fullName}${name}` : name),
      code,
      description,
      displayMode,
      mapMode,
      sortOrder,
      isDefault,
      isActive,
    },
  }
}

async function normalizeRegionInputAsync(input, currentId = '') {
  if (!input || typeof input !== 'object') return { error: '地区数据不能为空。' }

  const parentId = cleanText(input.parentId || input.parent_id || '', 120) || null
  const level = cleanText(input.level || 'town', 20)
  const name = cleanText(input.name, 120)
  const fullNameInput = cleanText(input.fullName || input.full_name || '', 240)
  const code = cleanText(input.code || '', 80)
  const description = cleanText(input.description || '', 1000)
  const displayMode = cleanText(input.displayMode || input.display_mode || 'current', 40)
  const mapMode = cleanText(input.mapMode || input.map_mode || 'single', 40)
  const sortOrder = Number(input.sortOrder ?? input.sort_order ?? 0)
  const isDefault = Boolean(input.isDefault ?? input.is_default)
  const isActive = input.isActive === undefined && input.is_active === undefined ? true : Boolean(input.isActive ?? input.is_active)

  if (!name) return { error: '请填写地区名称。' }
  if (!REGION_LEVELS.includes(level)) return { error: '地区层级不正确。' }
  if (!REGION_DISPLAY_MODES.includes(displayMode)) return { error: '前端展示模式不正确。' }
  if (!REGION_MAP_MODES.includes(mapMode)) return { error: '地图模式不正确。' }
  if (!Number.isInteger(sortOrder) || sortOrder < -100000 || sortOrder > 100000) return { error: '排序值必须是 -100000 到 100000 之间的整数。' }
  if (parentId && parentId === currentId) return { error: '上级地区不能选择自己。' }

  const parent = parentId ? await findRegionAsync(parentId) : null
  if (parentId && !parent) return { error: '上级地区不存在。' }

  if (parentId && currentId && await isRegionDescendantAsync(parentId, currentId)) {
    return { error: '上级地区不能选择自己的下级地区。' }
  }

  if (code) {
    const duplicate = await ADMIN_CORE_STORE.findRegionCodeDuplicate(code, currentId || '')
    if (duplicate) return { error: '地区编码已存在，请更换编码。' }
  }

  return {
    region: {
      parentId,
      level,
      name,
      fullName: fullNameInput || (parent ? `${parent.fullName}${name}` : name),
      code,
      description,
      displayMode,
      mapMode,
      sortOrder,
      isDefault,
      isActive,
    },
  }
}
function isRegionDescendant(candidateId, ancestorId) {
  let current = cleanText(candidateId, 120)
  const target = cleanText(ancestorId, 120)
  const seen = new Set()

  while (current && !seen.has(current)) {
    if (current === target) return true
    seen.add(current)
    current = ADMIN_CORE_STORE.findRegionParentId(current)
  }
  return false
}

async function isRegionDescendantAsync(candidateId, ancestorId) {
  let current = cleanText(candidateId, 120)
  const target = cleanText(ancestorId, 120)
  const seen = new Set()

  while (current && !seen.has(current)) {
    if (current === target) return true
    seen.add(current)
    current = await ADMIN_CORE_STORE.findRegionParentId(current)
  }
  return false
}

function insertRegion(region) {
  ADMIN_CORE_STORE.insertRegion(region)
}

function updateRegion(id, region) {
  ADMIN_CORE_STORE.updateRegion(id, region, Date.now())
}

async function insertRegionAsync(region) {
  if (!RUNTIME_STORES.isAsyncRuntime) {
    ADMIN_CORE_STORE.insertRegion(region)
    return
  }
  await runInDatabaseTransactionAsync(async () => {
    if (region.isDefault && typeof ADMIN_CORE_STORE.clearDefaultRegion === 'function') {
      await ADMIN_CORE_STORE.clearDefaultRegion()
    }
    await ADMIN_CORE_STORE.insertRegion(region)
  })
}

async function updateRegionAsync(id, region) {
  if (!RUNTIME_STORES.isAsyncRuntime) {
    ADMIN_CORE_STORE.updateRegion(id, region, Date.now())
    return
  }
  await runInDatabaseTransactionAsync(async () => {
    if (region.isDefault && typeof ADMIN_CORE_STORE.clearDefaultRegionExcept === 'function') {
      await ADMIN_CORE_STORE.clearDefaultRegionExcept(id)
    }
    await ADMIN_CORE_STORE.updateRegion(id, region, Date.now())
  })
}

function createSession(req, userId, rememberMe = false) {
  const token = crypto.randomBytes(32).toString('base64url')
  const tokenHash = hashToken(token)
  const csrfToken = crypto.randomBytes(24).toString('base64url')
  const now = Date.now()
  const expiresAt = now + (rememberMe ? REMEMBER_SESSION_DAYS * 24 : DEFAULT_SESSION_HOURS) * 60 * 60 * 1000
  const id = makeId('sess')
  ADMIN_CORE_STORE.insertSession({
    id,
    userId,
    tokenHash,
    csrfToken,
    ip: getClientIp(req),
    userAgent: cleanText(req.get('user-agent') || '', 500),
    expiresAt,
    createdAt: now,
    lastSeenAt: now,
  })
  return { id, token, csrfToken, expiresAt }
}

async function createSessionAsync(req, userId, rememberMe = false) {
  const token = crypto.randomBytes(32).toString('base64url')
  const tokenHash = hashToken(token)
  const csrfToken = crypto.randomBytes(24).toString('base64url')
  const now = Date.now()
  const expiresAt = now + (rememberMe ? REMEMBER_SESSION_DAYS * 24 : DEFAULT_SESSION_HOURS) * 60 * 60 * 1000
  const id = makeId('sess')
  await ADMIN_CORE_STORE.insertSession({
    id,
    userId,
    tokenHash,
    csrfToken,
    ip: getClientIp(req),
    userAgent: cleanText(req.get('user-agent') || '', 500),
    expiresAt,
    createdAt: now,
    lastSeenAt: now,
  })
  return { id, token, csrfToken, expiresAt }
}




function setSessionCookie(res, session) {
  const maxAge = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000))
  res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE_NAME, session.token, {
    httpOnly: true,
    secure: ENV === 'production',
    sameSite: 'Lax',
    domain: SESSION_COOKIE_DOMAIN || undefined,
    maxAge,
  }))
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: ENV === 'production',
    sameSite: 'Lax',
    domain: SESSION_COOKIE_DOMAIN || undefined,
    maxAge: 0,
  }))
}


function findSessionByToken(token) {
  if (!token) return null
  const row = ADMIN_CORE_STORE.findSessionByTokenHash(hashToken(token))
  if (!row || row.expires_at <= Date.now()) {
    if (row) ADMIN_CORE_STORE.deleteSessionById(row.id)
    return null
  }
  return row
}





function recordLoginAttempt(username, ip, success, reason) {
  ADMIN_CORE_STORE.insertLoginAttempt({
    username: cleanText(username || '', 80),
    ip,
    success,
    reason,
    createdAt: Date.now(),
  })
}

async function recordLoginAttemptAsync(username, ip, success, reason) {
  await ADMIN_CORE_STORE.insertLoginAttempt({
    username: cleanText(username || '', 80),
    ip,
    success,
    reason,
    createdAt: Date.now(),
  })
}

function isLoginLocked(username, ip) {
  const since = Date.now() - LOGIN_LOCK_WINDOW_MS
  return ADMIN_CORE_STORE.countRecentFailedLoginAttempts(cleanText(username || '', 80), ip, since) >= LOGIN_MAX_FAILURES
}

async function isLoginLockedAsync(username, ip) {
  const since = Date.now() - LOGIN_LOCK_WINDOW_MS
  return await ADMIN_CORE_STORE.countRecentFailedLoginAttempts(cleanText(username || '', 80), ip, since) >= LOGIN_MAX_FAILURES
}


function listMediaAssets(query) {
  const page = parsePositiveInt(query.page, 1)
  const pageSize = clamp(parsePositiveInt(query.pageSize, 48), 1, 100)
  const offset = (page - 1) * pageSize
  const deletedFilter = cleanText(query.deleted || '', 20)
  const where = [deletedFilter === 'true' ? 'deleted_at IS NOT NULL' : 'deleted_at IS NULL']
  const params = []
  const q = cleanText(query.q || '', 100)
  const mediaType = cleanText(query.mediaType || query.media_type || '', 20)
  const category = cleanText(query.category || '', 80)

  if (q) {
    where.push('(original_name LIKE ? OR alt_text LIKE ? OR caption LIKE ?)')
    params.push(`%${q}%`, `%${q}%`, `%${q}%`)
  }
  if (mediaType) {
    where.push('media_type = ?')
    params.push(mediaType)
  }
  if (category) {
    where.push('category = ?')
    params.push(category)
  }

  const whereSql = `WHERE ${where.join(' AND ')}`
  const { total, rows } = CONTENT_READ_STORE.listMediaAssetRows({
    whereSql,
    params,
    pageSize,
    offset,
  })

  return { items: rows.map(rowToMediaAsset), total, page, pageSize }
}

async function listMediaAssetsAsync(query) {
  const page = parsePositiveInt(query.page, 1)
  const pageSize = clamp(parsePositiveInt(query.pageSize, 48), 1, 100)
  const offset = (page - 1) * pageSize
  const deletedFilter = cleanText(query.deleted || '', 20)
  const where = [deletedFilter === 'true' ? 'deleted_at IS NOT NULL' : 'deleted_at IS NULL']
  const params = []
  const q = cleanText(query.q || '', 100)
  const mediaType = cleanText(query.mediaType || query.media_type || '', 20)
  const category = cleanText(query.category || '', 80)

  if (q) {
    where.push('(original_name LIKE ? OR alt_text LIKE ? OR caption LIKE ?)')
    params.push(`%${q}%`, `%${q}%`, `%${q}%`)
  }
  if (mediaType) {
    where.push('media_type = ?')
    params.push(mediaType)
  }
  if (category) {
    where.push('category = ?')
    params.push(category)
  }

  const whereSql = `WHERE ${where.join(' AND ')}`
  const { total, rows } = await CONTENT_READ_STORE.listMediaAssetRows({
    whereSql,
    params,
    pageSize,
    offset,
  })

  return { items: rows.map(rowToMediaAsset), total, page, pageSize }
}



function insertMediaAsset(asset) {
  CONTENT_WRITE_STORE.insertMediaAsset({
    ...asset,
    autoCompress: asset.autoCompress ? 1 : 0,
  })
}

async function insertMediaAssetAsync(asset) {
  await CONTENT_WRITE_STORE.insertMediaAsset({
    ...asset,
    autoCompress: asset.autoCompress ? 1 : 0,
  })
}


function listAiProviders() {
  return AI_OPS_STORE.listAiProviderRows().map(row => rowToAiProvider(row))
}

async function listAiProvidersAsync() {
  return (await AI_OPS_STORE.listAiProviderRows()).map(row => rowToAiProvider(row))
}








function insertAiProvider(provider) {
  AI_OPS_STORE.insertAiProvider({
    ...provider,
    capabilitiesJson: JSON.stringify(provider.capabilities || []),
    configJson: JSON.stringify(provider.configJson || {}),
  })
}

async function insertAiProviderAsync(provider) {
  await AI_OPS_STORE.insertAiProvider({
    ...provider,
    capabilitiesJson: JSON.stringify(provider.capabilities || []),
    configJson: JSON.stringify(provider.configJson || {}),
  })
}

function updateAiProvider(id, provider) {
  AI_OPS_STORE.updateAiProvider(id, {
    ...provider,
    capabilitiesJson: JSON.stringify(provider.capabilities || []),
    configJson: JSON.stringify(provider.configJson || {}),
    updatedAt: Date.now(),
  })
}

async function updateAiProviderAsync(id, provider) {
  await AI_OPS_STORE.updateAiProvider(id, {
    ...provider,
    capabilitiesJson: JSON.stringify(provider.capabilities || []),
    configJson: JSON.stringify(provider.configJson || {}),
    updatedAt: Date.now(),
  })
}

function listAiTasks(query) {
  const page = parsePositiveInt(query.page, 1)
  const pageSize = clamp(parsePositiveInt(query.pageSize, 50), 1, 100)
  const offset = (page - 1) * pageSize
  const status = cleanText(query.status || '', 30)
  const taskType = cleanText(query.taskType || query.task_type || '', 60)
  const where = []
  const params = []
  if (status) {
    where.push('t.status = ?')
    params.push(status)
  }
  if (taskType) {
    where.push('t.task_type = ?')
    params.push(taskType)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const { total, rows } = AI_OPS_STORE.listAiTaskRows({
    whereSql,
    params,
    pageSize,
    offset,
  })
  return { items: rows.map(rowToAiTask), total, page, pageSize }
}

async function listAiTasksAsync(query) {
  const page = parsePositiveInt(query.page, 1)
  const pageSize = clamp(parsePositiveInt(query.pageSize, 50), 1, 100)
  const offset = (page - 1) * pageSize
  const status = cleanText(query.status || '', 30)
  const taskType = cleanText(query.taskType || query.task_type || '', 60)
  const where = []
  const params = []
  if (status) {
    where.push('t.status = ?')
    params.push(status)
  }
  if (taskType) {
    where.push('t.task_type = ?')
    params.push(taskType)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const { total, rows } = await AI_OPS_STORE.listAiTaskRows({
    whereSql,
    params,
    pageSize,
    offset,
  })
  return { items: rows.map(rowToAiTask), total, page, pageSize }
}

function findAiTask(id, includePrivate = false) {
  const row = AI_OPS_STORE.findAiTaskRow(id)
  return row ? rowToAiTask(row, includePrivate) : null
}

async function findAiTaskAsync(id, includePrivate = false) {
  const row = await AI_OPS_STORE.findAiTaskRow(id)
  return row ? rowToAiTask(row, includePrivate) : null
}
























function insertAiTask(task) {
  AI_OPS_STORE.insertAiTask({
    ...task,
    inputJson: task.inputJson ? JSON.stringify(task.inputJson) : null,
    resultJson: task.resultJson ? JSON.stringify(task.resultJson) : null,
  })
}

async function insertAiTaskAsync(task) {
  await AI_OPS_STORE.insertAiTask({
    ...task,
    inputJson: task.inputJson ? JSON.stringify(task.inputJson) : null,
    resultJson: task.resultJson ? JSON.stringify(task.resultJson) : null,
  })
}

function setAiTaskRunning(id, updatedBy) {
  AI_OPS_STORE.updateAiTaskFields(id, {
    status: 'running',
    errorMessage: '',
    updatedBy,
    updatedAt: Date.now(),
  })
}

async function setAiTaskRunningAsync(id, updatedBy) {
  await AI_OPS_STORE.updateAiTaskFields(id, {
    status: 'running',
    errorMessage: '',
    updatedBy,
    updatedAt: Date.now(),
  })
}

function completeAiTask(id, patch) {
  AI_OPS_STORE.updateAiTaskFields(id, {
    status: patch.status,
    resultText: patch.resultText || '',
    resultJson: patch.resultJson ? JSON.stringify(patch.resultJson) : null,
    errorMessage: patch.errorMessage || '',
    updatedBy: patch.updatedBy,
    updatedAt: Date.now(),
    completedAt: Date.now(),
    ...(patch.providerStatus !== undefined ? { providerStatus: patch.providerStatus || null } : {}),
    ...(patch.providerResponseJson !== undefined ? { providerResponseJson: patch.providerResponseJson ? JSON.stringify(patch.providerResponseJson) : null } : {}),
    ...(patch.callbackReceivedAt !== undefined ? { callbackReceivedAt: patch.callbackReceivedAt || null } : {}),
  })
}

async function completeAiTaskAsync(id, patch) {
  await AI_OPS_STORE.updateAiTaskFields(id, {
    status: patch.status,
    resultText: patch.resultText || '',
    resultJson: patch.resultJson ? JSON.stringify(patch.resultJson) : null,
    errorMessage: patch.errorMessage || '',
    updatedBy: patch.updatedBy,
    updatedAt: Date.now(),
    completedAt: Date.now(),
    ...(patch.providerStatus !== undefined ? { providerStatus: patch.providerStatus || null } : {}),
    ...(patch.providerResponseJson !== undefined ? { providerResponseJson: patch.providerResponseJson ? JSON.stringify(patch.providerResponseJson) : null } : {}),
    ...(patch.callbackReceivedAt !== undefined ? { callbackReceivedAt: patch.callbackReceivedAt || null } : {}),
  })
}

function registerAiExternalJob(taskId, patch) {
  AI_OPS_STORE.updateAiTaskFields(taskId, {
    externalJobId: patch.externalJobId,
    providerStatus: patch.providerStatus,
    providerRequestJson: patch.providerRequestJson ? JSON.stringify(patch.providerRequestJson) : null,
    providerResponseJson: patch.providerResponseJson ? JSON.stringify(patch.providerResponseJson) : null,
    callbackTokenHash: patch.callbackTokenHash || null,
    updatedBy: patch.updatedBy,
    updatedAt: Date.now(),
  })
}

async function registerAiExternalJobAsync(taskId, patch) {
  await AI_OPS_STORE.updateAiTaskFields(taskId, {
    externalJobId: patch.externalJobId,
    providerStatus: patch.providerStatus,
    providerRequestJson: patch.providerRequestJson ? JSON.stringify(patch.providerRequestJson) : null,
    providerResponseJson: patch.providerResponseJson ? JSON.stringify(patch.providerResponseJson) : null,
    callbackTokenHash: patch.callbackTokenHash || null,
    updatedBy: patch.updatedBy,
    updatedAt: Date.now(),
  })
}

function updateAiExternalJobStatus(taskId, patch) {
  AI_OPS_STORE.updateAiTaskFields(taskId, {
    providerStatus: patch.providerStatus,
    providerResponseJson: patch.providerResponseJson ? JSON.stringify(patch.providerResponseJson) : null,
    errorMessage: patch.errorMessage || '',
    updatedBy: patch.updatedBy || null,
    updatedAt: Date.now(),
    ...(patch.callbackReceivedAt !== undefined ? { callbackReceivedAt: patch.callbackReceivedAt || null } : {}),
  })
}

async function updateAiExternalJobStatusAsync(taskId, patch) {
  await AI_OPS_STORE.updateAiTaskFields(taskId, {
    providerStatus: patch.providerStatus,
    providerResponseJson: patch.providerResponseJson ? JSON.stringify(patch.providerResponseJson) : null,
    errorMessage: patch.errorMessage || '',
    updatedBy: patch.updatedBy || null,
    updatedAt: Date.now(),
    ...(patch.callbackReceivedAt !== undefined ? { callbackReceivedAt: patch.callbackReceivedAt || null } : {}),
  })
}

function listAiCallLogs(query) {
  const page = parsePositiveInt(query.page, 1)
  const pageSize = clamp(parsePositiveInt(query.pageSize, 50), 1, 100)
  const offset = (page - 1) * pageSize
  const rows = AI_OPS_STORE.listAiCallLogRows({ pageSize, offset })
  const total = AI_OPS_STORE.countAiCallLogs()
  return {
    items: rows.map(row => ({
      id: row.id,
      providerId: row.provider_id || '',
      providerName: row.provider_name || '',
      taskId: row.task_id || '',
      taskType: row.task_type || '',
      action: row.action,
      status: row.status,
      requestSummary: row.request_summary || '',
      responseSummary: row.response_summary || '',
      errorMessage: row.error_message || '',
      durationMs: row.duration_ms || 0,
      createdBy: row.created_by || '',
      createdAt: row.created_at,
    })),
    total,
    page,
    pageSize,
  }
}

async function listAiCallLogsAsync(query) {
  const page = parsePositiveInt(query.page, 1)
  const pageSize = clamp(parsePositiveInt(query.pageSize, 50), 1, 100)
  const offset = (page - 1) * pageSize
  const rows = await AI_OPS_STORE.listAiCallLogRows({ pageSize, offset })
  const total = await AI_OPS_STORE.countAiCallLogs()
  return {
    items: rows.map(row => ({
      id: row.id,
      providerId: row.provider_id || '',
      providerName: row.provider_name || '',
      taskId: row.task_id || '',
      taskType: row.task_type || '',
      action: row.action,
      status: row.status,
      requestSummary: row.request_summary || '',
      responseSummary: row.response_summary || '',
      errorMessage: row.error_message || '',
      durationMs: row.duration_ms || 0,
      createdBy: row.created_by || '',
      createdAt: row.created_at,
    })),
    total,
    page,
    pageSize,
  }
}

function insertAiCallLog(entry) {
  AI_OPS_STORE.insertAiCallLog({
    providerId: entry.providerId || null,
    taskId: entry.taskId || null,
    action: entry.action,
    status: entry.status,
    requestSummary: cleanText(entry.requestSummary || '', 1000),
    responseSummary: cleanText(entry.responseSummary || '', 2000),
    errorMessage: cleanText(entry.errorMessage || '', 2000),
    durationMs: Number(entry.durationMs || 0),
    createdBy: entry.createdBy || null,
    createdAt: Date.now(),
  })
}

async function insertAiCallLogAsync(entry) {
  await AI_OPS_STORE.insertAiCallLog({
    providerId: entry.providerId || null,
    taskId: entry.taskId || null,
    action: entry.action,
    status: entry.status,
    requestSummary: cleanText(entry.requestSummary || '', 1000),
    responseSummary: cleanText(entry.responseSummary || '', 2000),
    errorMessage: cleanText(entry.errorMessage || '', 2000),
    durationMs: Number(entry.durationMs || 0),
    createdBy: entry.createdBy || null,
    createdAt: Date.now(),
  })
}









function normalizeMediaUpload(req) {
  const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0)
  if (buffer.length === 0) return { error: 'Upload body is empty.' }
  if (buffer.length > MAX_MEDIA_UPLOAD_BYTES) return { error: 'Upload is too large.' }

  const mimeType = cleanText(String(req.get('content-type') || '').split(';')[0].toLowerCase(), 100)
  const allowed = ALLOWED_MEDIA_TYPES.get(mimeType)
  if (!allowed) return { error: 'Unsupported media type.' }
  if (!matchesMediaSignature(buffer, mimeType)) return { error: 'Upload content does not match the declared media type.' }

  const rawName = decodeHeaderText(req.get('x-file-name') || 'upload')
  const originalName = sanitizeFileName(rawName)
  const metadata = normalizeMediaMetadata({
    category: decodeHeaderText(req.get('x-media-category') || ''),
    altText: decodeHeaderText(req.get('x-alt-text') || ''),
    caption: decodeHeaderText(req.get('x-caption') || ''),
    watermarkText: decodeHeaderText(req.get('x-watermark-text') || ''),
    autoCompress: req.get('x-auto-compress') === 'true',
  })
  if (metadata.error) return metadata

  return {
    buffer,
    mimeType,
    mediaType: allowed.kind,
    extension: allowed.ext,
    originalName,
    ...metadata,
  }
}














function listContents(query, user = null) {
  const page = parsePositiveInt(query.page, 1)
  const pageSize = clamp(parsePositiveInt(query.pageSize, 50), 1, 100)
  const offset = (page - 1) * pageSize
  const where = []
  const params = []
  const q = cleanText(query.q || '', 100)
  const status = cleanText(query.status || '', 40)
  const moduleKey = cleanText(query.moduleKey || query.module_key || '', 80)
  const regionId = cleanText(query.regionId || query.region_id || '', 120)

  if (q) {
    where.push('(c.title LIKE ? OR c.summary LIKE ?)')
    params.push(`%${q}%`, `%${q}%`)
  }
  if (status) {
    where.push('c.status = ?')
    params.push(status)
  }
  if (moduleKey) {
    where.push('c.module_key = ?')
    params.push(moduleKey)
  }
  const regionFilter = buildContentRegionWhere(user, 'cv.data_json')
  if (regionFilter.where) {
    where.push(regionFilter.where)
    params.push(...regionFilter.params)
  }
  const requestedRegionFilter = buildRequestedContentRegionWhere(regionId, 'cv.data_json')
  if (requestedRegionFilter.where) {
    where.push(requestedRegionFilter.where)
    params.push(...requestedRegionFilter.params)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const { total, rows } = CONTENT_READ_STORE.listContentSummaryRows({
    whereSql,
    params,
    pageSize,
    offset,
  })

  return { items: rows.map((row) => rowToContentSummary(row)), total, page, pageSize }
}

async function listContentsAsync(query, user = null) {
  const page = parsePositiveInt(query.page, 1)
  const pageSize = clamp(parsePositiveInt(query.pageSize, 50), 1, 100)
  const offset = (page - 1) * pageSize
  const where = []
  const params = []
  const q = cleanText(query.q || '', 100)
  const status = cleanText(query.status || '', 40)
  const moduleKey = cleanText(query.moduleKey || query.module_key || '', 80)
  const regionId = cleanText(query.regionId || query.region_id || '', 120)

  if (q) {
    where.push('(c.title LIKE ? OR c.summary LIKE ?)')
    params.push(`%${q}%`, `%${q}%`)
  }
  if (status) {
    where.push('c.status = ?')
    params.push(status)
  }
  if (moduleKey) {
    where.push('c.module_key = ?')
    params.push(moduleKey)
  }
  const regionFilter = await buildContentRegionWhereAsync(user, 'cv.data_json')
  if (regionFilter.where) {
    where.push(regionFilter.where)
    params.push(...regionFilter.params)
  }
  const requestedRegionFilter = await buildRequestedContentRegionWhereAsync(regionId, 'cv.data_json')
  if (requestedRegionFilter.where) {
    where.push(requestedRegionFilter.where)
    params.push(...requestedRegionFilter.params)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const { total, rows } = await CONTENT_READ_STORE.listContentSummaryRows({
    whereSql,
    params,
    pageSize,
    offset,
  })

  return { items: await Promise.all(rows.map((row) => rowToContentSummaryAsync(row))), total, page, pageSize }
}




















































function normalizeContentBatchPatch(input) {
  if (!input || typeof input !== 'object') return { error: 'Batch patch must be an object.' }

  const patch = {}

  if (input.moduleKey !== undefined) {
    const moduleKey = cleanText(input.moduleKey, 80)
    if (!moduleKey) return { error: 'Content module is invalid.' }
    const module = RUNTIME_MISC_STORE.findContentModuleRow(moduleKey)
    if (!module) return { error: 'Content module is invalid.' }
    patch.moduleKey = moduleKey
  }
  if (input.category !== undefined) patch.category = cleanText(input.category, 120)
  if (input.sensitiveLevel !== undefined) {
    const sensitiveLevel = cleanText(input.sensitiveLevel, 20)
    if (!SENSITIVE_LEVELS.has(sensitiveLevel)) return { error: 'Sensitive level is invalid.' }
    patch.sensitiveLevel = sensitiveLevel
  }
  if (input.tags !== undefined) patch.tags = normalizeStringArray(input.tags, 30, 40)
  if (input.riskTypes !== undefined || input.risk_types !== undefined) {
    patch.riskTypes = normalizeStringArray(input.riskTypes || input.risk_types, 20, 80)
  }

  if (!Object.keys(patch).length) return { error: 'No batch fields provided.' }
  return { patch }
}

function applyContentUpdate(before, normalized, userId, now) {
  const nextVersion = before.status === 'published' || before.status === 'unpublished'
    ? (before.latestVersionNumber + 1)
    : before.currentVersion.versionNumber
  const versionId = before.status === 'published' || before.status === 'unpublished' ? makeId('version') : before.currentVersion.id

  if (versionId === before.currentVersion.id) {
    updateContentVersion(versionId, normalized.content, userId, now)
  } else {
    insertContentVersion(versionId, before.id, nextVersion, normalized.content, userId, now)
  }

  CONTENT_WRITE_STORE.updateContentFields(before.id, {
    category: normalized.content.category,
    tagsJson: JSON.stringify(normalized.content.tags),
    status: 'draft',
    title: normalized.content.title,
    summary: normalized.content.summary,
    sensitiveLevel: normalized.content.sensitiveLevel,
    riskTypesJson: JSON.stringify(normalized.content.riskTypes),
    currentVersionId: versionId,
    currentStepId: null,
    updatedBy: userId,
    updatedAt: now,
  })
  replaceContentSources(before.id, versionId, normalized.sources)
  cancelPendingReviewTasks(before.id)
  return findContent(before.id, true)
}

async function applyContentUpdateAsync(before, normalized, userId, now) {
  const nextVersion = before.status === 'published' || before.status === 'unpublished'
    ? (before.latestVersionNumber + 1)
    : before.currentVersion.versionNumber
  const versionId = before.status === 'published' || before.status === 'unpublished' ? makeId('version') : before.currentVersion.id

  if (versionId === before.currentVersion.id) {
    await updateContentVersionAsync(versionId, normalized.content, userId, now)
  } else {
    await insertContentVersionAsync(versionId, before.id, nextVersion, normalized.content, userId, now)
  }

  await CONTENT_WRITE_STORE.updateContentFields(before.id, {
    category: normalized.content.category,
    tagsJson: JSON.stringify(normalized.content.tags),
    status: 'draft',
    title: normalized.content.title,
    summary: normalized.content.summary,
    sensitiveLevel: normalized.content.sensitiveLevel,
    riskTypesJson: JSON.stringify(normalized.content.riskTypes),
    currentVersionId: versionId,
    currentStepId: null,
    updatedBy: userId,
    updatedAt: now,
  })
  await replaceContentSourcesAsync(before.id, versionId, normalized.sources)
  await cancelPendingReviewTasksAsync(before.id)
  return findContentAsync(before.id, true)
}



function insertContentVersion(versionId, contentId, versionNumber, content, userId, now) {
  CONTENT_WRITE_STORE.insertContentVersion({
    id: versionId,
    contentId,
    versionNumber,
    title: content.title,
    summary: content.summary,
    body: content.body,
    dataJson: JSON.stringify(content.data || {}),
    createdBy: userId,
    createdAt: now,
  })
}

async function insertContentVersionAsync(versionId, contentId, versionNumber, content, userId, now) {
  await CONTENT_WRITE_STORE.insertContentVersion({
    id: versionId,
    contentId,
    versionNumber,
    title: content.title,
    summary: content.summary,
    body: content.body,
    dataJson: JSON.stringify(content.data || {}),
    createdBy: userId,
    createdAt: now,
  })
}

function updateContentVersion(versionId, content, userId, now) {
  CONTENT_WRITE_STORE.updateContentVersion(versionId, {
    title: content.title,
    summary: content.summary,
    body: content.body,
    dataJson: JSON.stringify(content.data || {}),
    createdBy: userId,
    createdAt: now,
  })
}

async function updateContentVersionAsync(versionId, content, userId, now) {
  await CONTENT_WRITE_STORE.updateContentVersion(versionId, {
    title: content.title,
    summary: content.summary,
    body: content.body,
    dataJson: JSON.stringify(content.data || {}),
    createdBy: userId,
    createdAt: now,
  })
}

function replaceContentSources(contentId, versionId, sources) {
  CONTENT_WRITE_STORE.replaceContentSources(contentId, versionId, sources.map((source) => ({
    id: makeId('source'),
    sourceType: source.sourceType,
    sourceTitle: source.sourceTitle,
    sourceUrl: source.sourceUrl,
    archiveRef: source.archiveRef,
    pageRef: source.pageRef,
    collector: source.collector,
    collectedAt: source.collectedAt,
    trustLevel: source.trustLevel,
    attachmentMediaId: source.attachmentMediaId,
    notes: source.notes,
    createdAt: Date.now(),
  })))
}

async function replaceContentSourcesAsync(contentId, versionId, sources) {
  await CONTENT_WRITE_STORE.replaceContentSources(contentId, versionId, sources.map((source) => ({
    id: makeId('source'),
    sourceType: source.sourceType,
    sourceTitle: source.sourceTitle,
    sourceUrl: source.sourceUrl,
    archiveRef: source.archiveRef,
    pageRef: source.pageRef,
    collector: source.collector,
    collectedAt: source.collectedAt,
    trustLevel: source.trustLevel,
    attachmentMediaId: source.attachmentMediaId,
    notes: source.notes,
    createdAt: Date.now(),
  })))
}
















function listPublishedArchiveContents(query) {
  const page = parsePositiveInt(query.page, 1)
  const pageSize = clamp(parsePositiveInt(query.pageSize, 100), 1, 100)
  const offset = (page - 1) * pageSize
  const mapPublishTypeSql = SQL_DIALECT.jsonType('v.data_json', '$.publishPositions.map')
  const mapPublishFlagSql = SQL_DIALECT.jsonText('v.data_json', '$.publishPositions.map')
  const legacyMapPublishFlagSql = SQL_DIALECT.jsonText('v.data_json', '$.publish_positions.map')
  const longitudeSql = SQL_DIALECT.jsonNumber('v.data_json', '$.longitude')
  const latitudeSql = SQL_DIALECT.jsonNumber('v.data_json', '$.latitude')
  const mapVisibleSql = `(
    ${mapPublishTypeSql} IS NULL
    OR ${mapPublishFlagSql} != '0'
    OR ${legacyMapPublishFlagSql} != '0'
  )`
  const validCoordinateSql = `(
    ${longitudeSql} BETWEEN -180 AND 180
    AND ${latitudeSql} BETWEEN -90 AND 90
    AND NOT (
      ${longitudeSql} = 0
      AND ${latitudeSql} = 0
    )
  )`
  const where = ["c.module_key = 'archive'", "c.status = 'published'", 'c.published_version_id IS NOT NULL', mapVisibleSql, validCoordinateSql]
  const params = []

  if (query.type) {
    where.push('c.category = ?')
    params.push(String(query.type))
  }
  if (query.q) {
    const q = `%${String(query.q).trim()}%`
    where.push('(v.title LIKE ? OR v.summary LIKE ? OR v.body LIKE ?)')
    params.push(q, q, q)
  }

  const whereSql = `WHERE ${where.join(' AND ')}`
  const totalPublished = RUNTIME_MISC_STORE.countPublicArchiveRows({
    whereSql: `WHERE c.module_key = 'archive' AND c.status = 'published' AND c.published_version_id IS NOT NULL AND ${mapVisibleSql} AND ${validCoordinateSql}`,
    params: [],
  })
  const total = RUNTIME_MISC_STORE.countPublicArchiveRows({ whereSql, params })
  const rows = RUNTIME_MISC_STORE.listPublicArchiveRows({ whereSql, params, pageSize, offset })

  return {
    items: rows.map(rowToPublicArchive),
    total,
    page,
    pageSize,
    paginated: ['page', 'pageSize', 'type', 'q'].some((key) => query[key] !== undefined),
    hasPublishedArchiveContent: totalPublished > 0,
  }
}

async function listPublishedArchiveContentsAsync(query) {
  const page = parsePositiveInt(query.page, 1)
  const pageSize = clamp(parsePositiveInt(query.pageSize, 100), 1, 100)
  const offset = (page - 1) * pageSize
  const mapPublishTypeSql = SQL_DIALECT.jsonType('v.data_json', '$.publishPositions.map')
  const mapPublishFlagSql = SQL_DIALECT.jsonText('v.data_json', '$.publishPositions.map')
  const legacyMapPublishFlagSql = SQL_DIALECT.jsonText('v.data_json', '$.publish_positions.map')
  const longitudeSql = SQL_DIALECT.jsonNumber('v.data_json', '$.longitude')
  const latitudeSql = SQL_DIALECT.jsonNumber('v.data_json', '$.latitude')
  const mapVisibleSql = `(
    ${mapPublishTypeSql} IS NULL
    OR ${mapPublishFlagSql} != '0'
    OR ${legacyMapPublishFlagSql} != '0'
  )`
  const validCoordinateSql = `(
    ${longitudeSql} BETWEEN -180 AND 180
    AND ${latitudeSql} BETWEEN -90 AND 90
    AND NOT (
      ${longitudeSql} = 0
      AND ${latitudeSql} = 0
    )
  )`
  const where = ["c.module_key = 'archive'", "c.status = 'published'", 'c.published_version_id IS NOT NULL', mapVisibleSql, validCoordinateSql]
  const params = []

  if (query.type) {
    where.push('c.category = ?')
    params.push(String(query.type))
  }
  if (query.q) {
    const q = `%${String(query.q).trim()}%`
    where.push('(v.title LIKE ? OR v.summary LIKE ? OR v.body LIKE ?)')
    params.push(q, q, q)
  }

  const whereSql = `WHERE ${where.join(' AND ')}`
  const totalPublished = await RUNTIME_MISC_STORE.countPublicArchiveRows({
    whereSql: `WHERE c.module_key = 'archive' AND c.status = 'published' AND c.published_version_id IS NOT NULL AND ${mapVisibleSql} AND ${validCoordinateSql}`,
    params: [],
  })
  const total = await RUNTIME_MISC_STORE.countPublicArchiveRows({ whereSql, params })
  const rows = await RUNTIME_MISC_STORE.listPublicArchiveRows({ whereSql, params, pageSize, offset })

  // 批量加载 sources，消除 N+1 查询（45 次 → 1 次 IN 查询）
  const sourcesByContentId = await preloadContentSourcesForRowsAsync(rows)
  const items = await Promise.all(
    rows.map((row) => rowToPublicArchiveAsync(row, sourcesByContentId.get(row.id) || []))
  )

  return {
    items,
    total,
    page,
    pageSize,
    paginated: ['page', 'pageSize', 'type', 'q'].some((key) => query[key] !== undefined),
    hasPublishedArchiveContent: totalPublished > 0,
  }
}
















function listPublishedMessageContents(query) {
  const page = parsePositiveInt(query.page, 1)
  const pageSize = clamp(parsePositiveInt(query.pageSize, 50), 1, 100)
  const offset = (page - 1) * pageSize
  const { total: totalPublished, rows } = RUNTIME_MISC_STORE.listPublicMessageRows({ pageSize, offset })

  return {
    items: rows.map(rowToPublicMessage),
    total: totalPublished,
    page,
    pageSize,
    paginated: query.page !== undefined || query.pageSize !== undefined,
    hasPublishedMessageContent: totalPublished > 0,
  }
}

async function listPublishedMessageContentsAsync(query) {
  const page = parsePositiveInt(query.page, 1)
  const pageSize = clamp(parsePositiveInt(query.pageSize, 50), 1, 100)
  const offset = (page - 1) * pageSize
  const { total: totalPublished, rows } = await RUNTIME_MISC_STORE.listPublicMessageRows({ pageSize, offset })

  return {
    items: rows.map(rowToPublicMessage),
    total: totalPublished,
    page,
    pageSize,
    paginated: query.page !== undefined || query.pageSize !== undefined,
    hasPublishedMessageContent: totalPublished > 0,
  }
}



function listRiskTagTemplates({ includeInactive = false } = {}) {
  return RUNTIME_MISC_STORE.listRiskTagTemplateRows({ includeInactive }).map(rowToRiskTagTemplate)
}

async function listRiskTagTemplatesAsync({ includeInactive = false } = {}) {
  const rows = await RUNTIME_MISC_STORE.listRiskTagTemplateRows({ includeInactive })
  return rows.map(rowToRiskTagTemplate)
}

function findRiskTagTemplate(id) {
  const row = RUNTIME_MISC_STORE.findRiskTagTemplateRow(id)
  return row ? rowToRiskTagTemplate(row) : null
}

async function findRiskTagTemplateAsync(id) {
  const row = await RUNTIME_MISC_STORE.findRiskTagTemplateRow(id)
  return row ? rowToRiskTagTemplate(row) : null
}




function normalizeRiskTagTemplateInput(input, existing = null) {
  if (!input || typeof input !== 'object') return { error: '风险标签数据格式不正确。' }
  const label = cleanText(input.label ?? existing?.label ?? '', 80)
  const level = cleanText(input.level ?? existing?.level ?? 'high', 20)
  const category = cleanText(input.category ?? existing?.category ?? '', 80)
  const description = cleanText(input.description ?? existing?.description ?? '', 1000)
  const sortOrder = Number(input.sortOrder ?? input.sort_order ?? existing?.sortOrder ?? 0)
  const isActive = readBooleanFlag(input.isActive ?? input.is_active ?? existing?.isActive ?? true, true)
  if (!label) return { error: '请填写风险标签名称。' }
  if (!RISK_TAG_LEVELS.has(level)) return { error: '风险等级必须是 medium、high 或 critical。' }
  if (!Number.isFinite(sortOrder)) return { error: '排序必须是数字。' }
  const duplicate = RUNTIME_MISC_STORE.findRiskTagTemplateDuplicate(label, existing?.id || '')
  if (duplicate) return { error: '风险标签名称已存在。' }
  return {
    item: {
      label,
      level,
      category,
      description,
      isActive,
      sortOrder: Math.trunc(sortOrder),
    },
  }
}

async function normalizeRiskTagTemplateInputAsync(input, existing = null) {
  if (!input || typeof input !== 'object') return { error: '风险标签数据格式不正确。' }
  const label = cleanText(input.label ?? existing?.label ?? '', 80)
  const level = cleanText(input.level ?? existing?.level ?? 'high', 20)
  const category = cleanText(input.category ?? existing?.category ?? '', 80)
  const description = cleanText(input.description ?? existing?.description ?? '', 1000)
  const sortOrder = Number(input.sortOrder ?? input.sort_order ?? existing?.sortOrder ?? 0)
  const isActive = readBooleanFlag(input.isActive ?? input.is_active ?? existing?.isActive ?? true, true)
  if (!label) return { error: '请填写风险标签名称。' }
  if (!RISK_TAG_LEVELS.has(level)) return { error: '风险等级必须是 medium、high 或 critical。' }
  if (!Number.isFinite(sortOrder)) return { error: '排序必须是数字。' }
  const duplicate = await RUNTIME_MISC_STORE.findRiskTagTemplateDuplicate(label, existing?.id || '')
  if (duplicate) return { error: '风险标签名称已存在。' }
  return {
    item: {
      label,
      level,
      category,
      description,
      isActive,
      sortOrder: Math.trunc(sortOrder),
    },
  }
}
function insertRiskTagTemplate(item) {
  RUNTIME_MISC_STORE.insertRiskTagTemplate(item)
}

function updateRiskTagTemplate(id, item) {
  RUNTIME_MISC_STORE.updateRiskTagTemplate(id, item, Date.now())
}

async function insertRiskTagTemplateAsync(item) {
  await RUNTIME_MISC_STORE.insertRiskTagTemplate(item)
}

async function updateRiskTagTemplateAsync(id, item) {
  await RUNTIME_MISC_STORE.updateRiskTagTemplate(id, item, Date.now())
}







function buildReviewRecordExport(user) {
  const rows = RUNTIME_MISC_STORE.listReviewRecordRows(5000)
  const items = rows
    .map(row => ({ row, content: findContent(row.content_id, true) }))
    .filter(item => item.content && canUserAccessContent(user, item.content))
    .map(({ row }) => ({
      id: row.id,
      contentId: row.content_id,
      contentTitle: row.title || '',
      moduleKey: row.module_key || '',
      contentStatus: row.content_status || '',
      sensitiveLevel: row.sensitive_level || '',
      riskTypes: safeJsonArray(row.risk_types_json),
      workflowId: row.workflow_id,
      stepId: row.step_id,
      stepName: row.step_name || '',
      stepOrder: row.step_order,
      requiredPermission: row.required_permission,
      assigneeRoleId: row.assignee_role_id || '',
      assigneeRoleName: row.assignee_role_name || '',
      status: row.status,
      reviewerId: row.reviewer_id || '',
      reviewerUsername: row.reviewer_username || '',
      comment: row.comment || '',
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at || null,
    }))
  return { exportedAt: Date.now(), count: items.length, items }
}

async function buildReviewRecordExportAsync(user) {
  const rows = await RUNTIME_MISC_STORE.listReviewRecordRows(5000)
  const items = []
  for (const row of rows) {
    const content = await findContentAsync(row.content_id, true)
    if (!content) continue
    if (!await canUserAccessContentAsync(user, content)) continue
    items.push({
      id: row.id,
      contentId: row.content_id,
      contentTitle: row.title || '',
      moduleKey: row.module_key || '',
      contentStatus: row.content_status || '',
      sensitiveLevel: row.sensitive_level || '',
      riskTypes: safeJsonArray(row.risk_types_json),
      workflowId: row.workflow_id,
      stepId: row.step_id,
      stepName: row.step_name || '',
      stepOrder: row.step_order,
      requiredPermission: row.required_permission,
      assigneeRoleId: row.assignee_role_id || '',
      assigneeRoleName: row.assignee_role_name || '',
      status: row.status,
      reviewerId: row.reviewer_id || '',
      reviewerUsername: row.reviewer_username || '',
      comment: row.comment || '',
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at || null,
    })
  }
  return { exportedAt: Date.now(), count: items.length, items }
}

function findWorkflowForModule(moduleKey) {
  return RUNTIME_MISC_STORE.findWorkflowRow(moduleKey)
}

async function findWorkflowForModuleAsync(moduleKey) {
  return await RUNTIME_MISC_STORE.findWorkflowRow(moduleKey)
}







function createReviewTask(contentId, versionId, workflowId, step, actorId) {
  CONTENT_WRITE_STORE.insertReviewTask({
    id: makeId('review'),
    contentId,
    versionId,
    workflowId,
    stepId: step.id,
    status: 'pending',
    assigneeRoleId: step.roleId || null,
    reviewerId: null,
    comment: '',
    createdAt: Date.now(),
    reviewedAt: null,
  })
  return actorId
}

async function createReviewTaskAsync(contentId, versionId, workflowId, step, actorId) {
  await CONTENT_WRITE_STORE.insertReviewTask({
    id: makeId('review'),
    contentId,
    versionId,
    workflowId,
    stepId: step.id,
    status: 'pending',
    assigneeRoleId: step.roleId || null,
    reviewerId: null,
    comment: '',
    createdAt: Date.now(),
    reviewedAt: null,
  })
  return actorId
}

function cancelPendingReviewTasks(contentId) {
  CONTENT_WRITE_STORE.cancelPendingReviewTasks(contentId)
}

async function cancelPendingReviewTasksAsync(contentId) {
  await CONTENT_WRITE_STORE.cancelPendingReviewTasks(contentId)
}



function listArchives(query) {
  const where = []
  const params = []

  if (query.type) {
    where.push('type = ?')
    params.push(String(query.type))
  }
  if (query.yearFrom !== undefined) {
    where.push('year >= ?')
    params.push(Number(query.yearFrom))
  }
  if (query.yearTo !== undefined) {
    where.push('year <= ?')
    params.push(Number(query.yearTo))
  }
  if (query.q) {
    const q = `%${String(query.q).trim()}%`
    where.push('(title LIKE ? OR description LIKE ? OR content LIKE ?)')
    params.push(q, q, q)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const page = parsePositiveInt(query.page, 1)
  const pageSize = clamp(parsePositiveInt(query.pageSize, 100), 1, 100)
  const hasListParams = ['page', 'pageSize', 'type', 'yearFrom', 'yearTo', 'q'].some((key) => query[key] !== undefined)
  const offset = (page - 1) * pageSize
  const total = RUNTIME_MISC_STORE.countLegacyArchiveRows({ whereSql, params })
  const rows = RUNTIME_MISC_STORE.listLegacyArchiveRows({ whereSql, params, pageSize, offset })

  return {
    items: rows.map(rowToArchive),
    total,
    page,
    pageSize,
    paginated: hasListParams,
  }
}

function findArchive(id) {
  const row = RUNTIME_MISC_STORE.findLegacyArchiveRow(id)
  return row ? rowToArchive(row) : null
}

async function findArchiveAsync(id) {
  const row = await RUNTIME_MISC_STORE.findLegacyArchiveRow(id)
  return row ? rowToArchive(row) : null
}

function findMessage(id) {
  const row = RUNTIME_MISC_STORE.findMessageRow(id)
  return row ? rowToMessage(row, true) : null
}

async function findMessageAsync(id) {
  const row = await RUNTIME_MISC_STORE.findMessageRow(id)
  return row ? rowToMessage(row, true) : null
}



function findCheckinProgress(visitorId) {
  const row = RUNTIME_MISC_STORE.findCheckinProgressRow(visitorId)
  return row ? rowToCheckinProgress(row) : null
}

async function findCheckinProgressAsync(visitorId) {
  const row = await RUNTIME_MISC_STORE.findCheckinProgressRow(visitorId)
  return row ? rowToCheckinProgress(row) : null
}





function normalizeArchive(input) {
  if (!input || typeof input !== 'object') return { error: 'Archive payload must be an object.' }

  const id = cleanText(input.id || makeId('archive'), 80)
  const title = cleanText(input.title, 200)
  const description = cleanText(input.description, 2000)
  const content = cleanText(input.content || '', 50000)
  const type = cleanText(input.type || 'revolution', 40)
  const year = Number(input.year)
  const longitude = Number(input.longitude)
  const latitude = Number(input.latitude)

  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) return { error: 'Archive id may only contain letters, numbers, underscores, and hyphens.' }
  if (!title) return { error: 'Archive title is required.' }
  if (!description) return { error: 'Archive description is required.' }
  if (!ARCHIVE_TYPES.has(type)) return { error: 'Archive type is invalid.' }
  if (!Number.isInteger(year) || year < 1000 || year > 2200) return { error: 'Archive year is invalid.' }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return { error: 'Archive longitude is invalid.' }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return { error: 'Archive latitude is invalid.' }

  const media = normalizeMedia(input.media)
  if (media.error) return media

  return {
    archive: {
      id,
      title,
      description,
      content,
      type,
      year,
      longitude,
      latitude,
      media: media.items,
    },
  }
}



function getTributeCount() {
  const count = RUNTIME_MISC_STORE.getTributeCount()
  return count === null ? DEFAULT_TRIBUTE_COUNT : count
}

async function getTributeCountAsync() {
  const count = await RUNTIME_MISC_STORE.getTributeCount()
  return count === null ? DEFAULT_TRIBUTE_COUNT : count
}


function listBackupFiles() {
  if (!fs.existsSync(BACKUP_DIR)) return []
  return fs.readdirSync(BACKUP_DIR)
    .filter((name) => name.endsWith('.db'))
    .filter((name) => !name.startsWith('recovery-'))
    .map((name) => describeBackupFile(path.join(BACKUP_DIR, name)))
    .filter(Boolean)
    .sort((a, b) => b.createdAt - a.createdAt)
}

function listAcceptanceEvidenceFiles() {
  if (!fs.existsSync(ACCEPTANCE_DIR)) return []
  return fs.readdirSync(ACCEPTANCE_DIR)
    .filter((name) => /^v1-acceptance-evidence-.+\.json$/.test(name))
    .map((name) => describeAcceptanceEvidenceFile(path.join(ACCEPTANCE_DIR, name)))
    .filter(Boolean)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

function describeAcceptanceEvidenceFile(filePath) {
  const resolved = path.resolve(filePath)
  if (!isPathInside(resolved, ACCEPTANCE_DIR)) return null
  if (!fs.existsSync(resolved)) return null
  const stat = fs.statSync(resolved)
  const item = {
    name: path.basename(resolved),
    sizeBytes: stat.size,
    createdAt: stat.birthtimeMs || stat.ctimeMs,
    updatedAt: stat.mtimeMs,
    checkedAt: '',
    ok: false,
    failedChecks: [],
    mysqlTarget: '',
    healthStore: '',
    runtimeClient: '',
    runtimeAligned: false,
    markdownName: path.basename(resolved).replace(/\.json$/, '.md'),
  }

  try {
    const payload = JSON.parse(fs.readFileSync(resolved, 'utf8'))
    const failedChecks = Array.isArray(payload.checks)
      ? payload.checks.filter(check => !check?.ok).map(check => String(check?.key || check?.label || '未命名检查'))
      : []
    return {
      ...item,
      checkedAt: String(payload.checkedAt || ''),
      ok: failedChecks.length === 0,
      failedChecks,
      mysqlTarget: String(payload.mysqlTarget || ''),
      healthStore: String(payload.health?.store || ''),
      runtimeClient: String(payload.health?.database?.runtimeClient || ''),
      runtimeAligned: Boolean(payload.health?.database?.runtimeAligned),
    }
  } catch {
    return {
      ...item,
      failedChecks: ['证据文件无法读取'],
    }
  }
}

function readAcceptanceManualRecord() {
  const fallback = createEmptyAcceptanceManualRecord()
  if (!fs.existsSync(ACCEPTANCE_MANUAL_RECORD_FILE)) return fallback
  try {
    const payload = JSON.parse(fs.readFileSync(ACCEPTANCE_MANUAL_RECORD_FILE, 'utf8'))
    return {
      ...fallback,
      conclusion: normalizeAcceptanceConclusion(payload.conclusion),
      environment: cleanText(payload.environment, 120),
      owner: cleanText(payload.owner, 80),
      governmentRepresentative: cleanText(payload.governmentRepresentative, 80),
      narratorRepresentative: cleanText(payload.narratorRepresentative, 80),
      technicalOperator: cleanText(payload.technicalOperator, 80),
      testedAt: cleanText(payload.testedAt, 40),
      mobileResult: cleanText(payload.mobileResult, 120),
      publicDomainResult: cleanText(payload.publicDomainResult, 120),
      realMaterialResult: cleanText(payload.realMaterialResult, 120),
      blockers: cleanText(payload.blockers, 1000),
      followUps: cleanText(payload.followUps, 1000),
      notes: cleanText(payload.notes, 1000),
      updatedAt: Number(payload.updatedAt || 0) || null,
      updatedBy: cleanText(payload.updatedBy, 80),
    }
  } catch {
    return fallback
  }
}

function saveAcceptanceManualRecord(input, actor) {
  const current = readAcceptanceManualRecord()
  const now = Date.now()
  const record = {
    ...current,
    conclusion: normalizeAcceptanceConclusion(input.conclusion),
    environment: cleanText(input.environment, 120),
    owner: cleanText(input.owner, 80),
    governmentRepresentative: cleanText(input.governmentRepresentative, 80),
    narratorRepresentative: cleanText(input.narratorRepresentative, 80),
    technicalOperator: cleanText(input.technicalOperator, 80),
    testedAt: cleanText(input.testedAt, 40),
    mobileResult: cleanText(input.mobileResult, 120),
    publicDomainResult: cleanText(input.publicDomainResult, 120),
    realMaterialResult: cleanText(input.realMaterialResult, 120),
    blockers: cleanText(input.blockers, 1000),
    followUps: cleanText(input.followUps, 1000),
    notes: cleanText(input.notes, 1000),
    updatedAt: now,
    updatedBy: cleanText(actor, 80) || 'admin',
  }
  fs.mkdirSync(ACCEPTANCE_DIR, { recursive: true })
  fs.writeFileSync(ACCEPTANCE_MANUAL_RECORD_FILE, JSON.stringify(record, null, 2), 'utf8')
  return record
}



function describeBackupFile(filePath) {
  const resolved = path.resolve(filePath)
  if (!isPathInside(resolved, BACKUP_DIR)) return null
  if (!fs.existsSync(resolved)) return null
  const stat = fs.statSync(resolved)
  const uploadsPath = getUploadsBackupPath(resolved)
  const hasUploads = fs.existsSync(uploadsPath)
  return {
    name: path.basename(resolved),
    path: resolved,
    sizeBytes: stat.size,
    uploadSizeBytes: hasUploads ? getDirectorySize(uploadsPath) : 0,
    hasUploads,
    createdAt: stat.birthtimeMs || stat.ctimeMs,
    updatedAt: stat.mtimeMs,
  }
}

async function createBackupSet() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  const backupFile = path.join(BACKUP_DIR, `suqu-${new Date().toISOString().replace(/[:.]/g, '-')}.db`)
  if (RUNTIME_DB_CLIENT === 'mysql') {
    const payload = await buildExportPayloadAsync()
    fs.writeFileSync(backupFile, JSON.stringify(payload, null, 2))
  } else {
    await DATABASE_RUNTIME.createBackup(db, backupFile)
  }

  const uploadsPath = getUploadsBackupPath(backupFile)
  if (fs.existsSync(UPLOAD_DIR)) {
    copyDirectory(UPLOAD_DIR, uploadsPath)
  }

  return describeBackupFile(backupFile)
}

function getUploadsBackupPath(dbBackupPath) {
  const resolved = path.resolve(dbBackupPath)
  return path.join(path.dirname(resolved), `${path.basename(resolved, '.db')}-uploads`)
}



function replaceUploadsDirectoryFrom(sourcePath) {
  const resolvedUploadDir = path.resolve(UPLOAD_DIR)
  if (!isPathInside(resolvedUploadDir, DATA_DIR)) {
    throw new Error('Upload directory is outside the configured data directory.')
  }

  fs.rmSync(resolvedUploadDir, { recursive: true, force: true })
  fs.mkdirSync(resolvedUploadDir, { recursive: true })
  if (sourcePath && fs.existsSync(sourcePath)) {
    copyDirectory(sourcePath, resolvedUploadDir)
  }
}

function reopenDatabaseConnection() {
  db = DATABASE_RUNTIME.reopenPrimaryConnection(db)
  DATABASE_RUNTIME.invalidateTargetCache()
}











function buildExportPayload() {
  return {
    exportedAt: Date.now(),
    format: 'suqu-cms-json-v1',
    tables: SNAPSHOT_STORE.listSnapshotTables(getSnapshotTables()),
    meta: {
      helpArticles: listHelpArticlesConfig(),
    },
  }
}

async function buildExportPayloadAsync() {
  return {
    exportedAt: Date.now(),
    format: 'suqu-cms-json-v1',
    tables: await SNAPSHOT_STORE.listSnapshotTables(getSnapshotTables()),
    meta: {
      helpArticles: listHelpArticlesConfig(),
    },
  }
}

function validateSnapshotPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { error: 'Import payload must be an object.' }
  }
  if (payload.format !== 'suqu-cms-json-v1') {
    return { error: 'Unsupported import format.' }
  }
  if (!payload.tables || typeof payload.tables !== 'object' || Array.isArray(payload.tables)) {
    return { error: 'Import payload tables are invalid.' }
  }

  for (const table of getSnapshotTables()) {
    if (!Array.isArray(payload.tables[table])) {
      if (OPTIONAL_SNAPSHOT_TABLES.has(table) && payload.tables[table] === undefined) {
        payload.tables[table] = []
      } else {
        return { error: `Import table ${table} is missing or invalid.` }
      }
    }
  }

  return { tables: payload.tables }
}

function importSnapshotPayload(payload) {
  const validation = validateSnapshotPayload(payload)
  if (validation.error) return validation

  const tables = validation.tables
  const result = SNAPSHOT_STORE.replaceSnapshotTables({
    snapshotTableNames: getSnapshotTables(),
    importOnlyTableNames: getImportOnlyTables(),
    tables,
  })
  if (!result?.error && payload?.meta?.helpArticles) {
    saveAllHelpArticleConfigs(payload.meta.helpArticles)
  }
  return result
}

async function importSnapshotPayloadAsync(payload) {
  const validation = validateSnapshotPayload(payload)
  if (validation.error) return validation

  const tables = validation.tables
  const result = await SNAPSHOT_STORE.replaceSnapshotTables({
    snapshotTableNames: getSnapshotTables(),
    importOnlyTableNames: getImportOnlyTables(),
    tables,
  })
  if (!result?.error && payload?.meta?.helpArticles) {
    saveAllHelpArticleConfigs(payload.meta.helpArticles)
  }
  return result
}

async function restoreDatabaseFromBackup(filePath) {
  const resolved = path.resolve(filePath)
  const backupItem = describeBackupFile(resolved)
  if (!backupItem) throw new Error('Backup file not found.')

  if (RUNTIME_DB_CLIENT === 'mysql') {
    const recoveryFile = path.join(BACKUP_DIR, `recovery-${Date.now()}.db`)
    const recoveryUploadsPath = getUploadsBackupPath(recoveryFile)
    const backupUploadsPath = getUploadsBackupPath(resolved)
    const recoveryPayload = await buildExportPayloadAsync()

    fs.writeFileSync(recoveryFile, JSON.stringify(recoveryPayload, null, 2))
    if (fs.existsSync(UPLOAD_DIR)) {
      copyDirectory(UPLOAD_DIR, recoveryUploadsPath)
    }

    try {
      const payload = JSON.parse(fs.readFileSync(resolved, 'utf8'))
      const result = await importSnapshotPayloadAsync(payload)
      if (result.error) throw new Error(result.error)
      if (fs.existsSync(backupUploadsPath)) {
        replaceUploadsDirectoryFrom(backupUploadsPath)
      }
      applyRuntimeBootstrap('restore')
      return { backup: backupItem }
    } catch (error) {
      try {
        const recoverySnapshot = JSON.parse(fs.readFileSync(recoveryFile, 'utf8'))
        const recoveryResult = await importSnapshotPayloadAsync(recoverySnapshot)
        if (recoveryResult.error) throw new Error(recoveryResult.error)
        if (fs.existsSync(recoveryUploadsPath)) {
          replaceUploadsDirectoryFrom(recoveryUploadsPath)
        }
        applyRuntimeBootstrap('restore_recovery')
      } catch (recoveryError) {
        console.error('[WARN] Failed to roll back database restore:', recoveryError)
      }
      throw error
    } finally {
      try {
        if (fs.existsSync(recoveryFile)) fs.rmSync(recoveryFile, { force: true })
        if (fs.existsSync(recoveryUploadsPath)) fs.rmSync(recoveryUploadsPath, { recursive: true, force: true })
      } catch {}
    }
  }

  const recoveryFile = path.join(BACKUP_DIR, `recovery-${Date.now()}.db`)
  const recoveryUploadsPath = getUploadsBackupPath(recoveryFile)
  const backupUploadsPath = getUploadsBackupPath(resolved)
  await DATABASE_RUNTIME.createBackup(db, recoveryFile)
  if (fs.existsSync(UPLOAD_DIR)) {
    copyDirectory(UPLOAD_DIR, recoveryUploadsPath)
  }

  try {
    try {
      db.close()
    } catch {}
    fs.copyFileSync(resolved, DB_FILE)
    if (fs.existsSync(backupUploadsPath)) {
      replaceUploadsDirectoryFrom(backupUploadsPath)
    }
    reopenDatabaseConnection()
    applyRuntimeBootstrap('restore')
    return { backup: backupItem }
  } catch (error) {
    try {
      try {
        db.close()
      } catch {}
      fs.copyFileSync(recoveryFile, DB_FILE)
      if (fs.existsSync(recoveryUploadsPath)) {
        replaceUploadsDirectoryFrom(recoveryUploadsPath)
      }
      reopenDatabaseConnection()
      applyRuntimeBootstrap('restore_recovery')
    } catch (recoveryError) {
      console.error('[WARN] Failed to roll back database restore:', recoveryError)
    }
    throw error
  } finally {
    try {
      if (fs.existsSync(recoveryFile)) fs.rmSync(recoveryFile, { force: true })
      if (fs.existsSync(recoveryUploadsPath)) fs.rmSync(recoveryUploadsPath, { recursive: true, force: true })
    } catch {}
  }
}

function removeMediaFiles(item) {
  const candidates = [
    item.storage_path,
    item.original_storage_path,
    item.thumbnail_url ? path.join(UPLOAD_DIR, String(item.thumbnail_url).replace(/^\/uploads\//, '')) : '',
  ].filter(Boolean)

  const root = path.resolve(UPLOAD_DIR)
  for (const candidate of candidates) {
    const resolved = path.resolve(candidate)
    if (!isPathInside(resolved, root)) continue
    try { fs.rmSync(resolved, { force: true }) } catch {}
  }
}

function mediaFilesExist(asset) {
  const candidates = [asset.storagePath, asset.originalStoragePath].filter(Boolean)
  if (asset.thumbnailUrl) candidates.push(path.join(UPLOAD_DIR, String(asset.thumbnailUrl).replace(/^\/uploads\//, '')))
  const root = path.resolve(UPLOAD_DIR)
  return candidates.some((candidate) => {
    const resolved = path.resolve(candidate)
    return isPathInside(resolved, root) && fs.existsSync(resolved)
  })
}



function writeAudit(req, action, entityType, entityId, before, after) {
  try {
    AI_OPS_STORE.insertAuditLog({
      action,
      entityType,
      entityId: entityId || null,
      beforeJson: before ? JSON.stringify(before) : null,
      afterJson: after ? JSON.stringify(after) : null,
      actor: req.adminActor || 'public',
      ip: getClientIp(req),
      createdAt: Date.now(),
    })
  } catch (error) {
    console.warn(`[WARN] Failed to write audit log: ${error.message}`)
  }
}

async function writeAuditAsync(req, action, entityType, entityId, before, after) {
  try {
    await AI_OPS_STORE.insertAuditLog({
      action,
      entityType,
      entityId: entityId || null,
      beforeJson: before ? JSON.stringify(before) : null,
      afterJson: after ? JSON.stringify(after) : null,
      actor: req.adminActor || 'public',
      ip: getClientIp(req),
      createdAt: Date.now(),
    })
  } catch (error) {
    console.warn(`[WARN] Failed to write audit log: ${error.message}`)
  }
}

async function requireAdmin(req, res, next) {
  const auth = getSessionAuth(req)
  const session = await findSessionByTokenAsync(auth.token)
  if (session) {
    if (auth.source === 'cookie' && !SAFE_HTTP_METHODS.has(req.method) && !hasValidCsrfToken(req, session)) {
      return sendError(res, 403, 'CSRF_TOKEN_INVALID', 'CSRF token is missing or invalid.')
    }
    const user = await findAdminUserByIdAsync(session.user_id)
    if (user && user.status === 'active') {
      const permissions = await getUserPermissionCodesAsync(user.id)
      if (user.role_id === 'super_admin' || permissions.some((code) => ['content.edit', 'content.delete', 'backup.restore', 'users.write'].includes(code))) {
        req.session = session
        req.authSource = auth.source
        req.user = user
        req.adminActor = user.username
        return next()
      }
      return sendError(res, 403, 'FORBIDDEN', 'You do not have permission to perform this action.')
    }
  }

  if (!ADMIN_TOKEN) {
    warnMissingAdminToken()
    return sendError(res, 503, 'ADMIN_TOKEN_REQUIRED', 'Admin token is not configured.')
  }

  const provided = getProvidedAdminToken(req)
  if (!provided || !secureEqual(provided, ADMIN_TOKEN)) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Admin token is required.')
  }

  req.adminActor = 'admin'
  next()
}



function warnMissingAdminToken() {
  if (warnedMissingAdminToken) return
  warnedMissingAdminToken = true
  console.warn('[WARN] ADMIN_TOKEN is not set. Admin routes are writable in development.')
}

function rateLimit(name, windowMs, maxHits) {
  return (req, res, next) => {
    const now = Date.now()
    const key = `${name}:${getClientIp(req)}`
    const bucket = rateBuckets.get(key)

    if (!bucket || bucket.resetAt <= now) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }

    bucket.count += 1
    if (bucket.count > maxHits) {
      res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)))
      return sendError(res, 429, 'RATE_LIMITED', 'Too many requests.')
    }

    next()
  }
}




process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

function shutdown() {
  server.close(() => {
    db.close()
    process.exit(0)
  })
}


