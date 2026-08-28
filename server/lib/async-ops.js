/**
 * 从 index.js 拆出的辅助函数
 */
const { cleanText, safeJsonValue, readBooleanFlag, safeJsonArray } = require('./utils')
const { collectRegionAndDescendantIds, filterArchivesByRegionIds, resolveReviewSignalLevel, sanitizePublicOralHistoryData, hasValidArchiveCoordinates, parseRegionIdQuery, inferTrustLevelFromSources, rowToRegion, rowToRiskTagTemplate, rowToContentSource, rowToContentVersion } = require('./rows')
const { getUserPermissionCodesAsync, getDefaultRegionId, normalizeArchivePublishPositions, listRegions, listUserAssignedRegionIds, findRegion, getStaticContentModulePublishDefaults } = require('./region-access')
const { resolveDisplayScopeRegionIds, inferMapView } = require('./misc')
const { hasMeaningfulAiTaskInput, isSafeMediaResultUrl, defaultAiApplyTargetField } = require('./ai-base')
const { validateAiTaskAgainstProvider, normalizeAiResultMediaAsset } = require('./ai-run')
const { findMediaAssetAsync } = require('./media-ops')
const { normalizeLongTextLines, normalizeSongData, normalizeFilmData, normalizeResourceHubData } = require('./content-normalize')
const { normalizeStringArray, normalizeSources, normalizeHeroData, normalizeArchiveMedia, normalizeArchiveDisplayTimeline, normalizePositiveInteger } = require('./data-normalize')
const { normalizeInteractiveContentData, rowToAiProvider, normalizeArchiveDetailBlocks } = require('./ai-ops')
const { buildContentVersionDiff } = require('./diff')

// 运行期注入的依赖（由 index.js 调用 init() 传入）
let ADMIN_CORE_STORE
let AI_OPS_STORE
let ARCHIVE_TYPES
let CONTENT_READ_STORE
let INTERACTIVE_MODULES
let ORAL_AI_SUMMARY_STATUSES
let ORAL_AUTHORIZATION_STATUSES
let ORAL_TRANSCRIPT_REVIEW_STATUSES
let RESOURCE_HUB_MODULES
let RUNTIME_MISC_STORE
let SENSITIVE_LEVELS
function init(deps) {
  ADMIN_CORE_STORE = deps.ADMIN_CORE_STORE
  AI_OPS_STORE = deps.AI_OPS_STORE
  ARCHIVE_TYPES = deps.ARCHIVE_TYPES
  CONTENT_READ_STORE = deps.CONTENT_READ_STORE
  INTERACTIVE_MODULES = deps.INTERACTIVE_MODULES
  ORAL_AI_SUMMARY_STATUSES = deps.ORAL_AI_SUMMARY_STATUSES
  ORAL_AUTHORIZATION_STATUSES = deps.ORAL_AUTHORIZATION_STATUSES
  ORAL_TRANSCRIPT_REVIEW_STATUSES = deps.ORAL_TRANSCRIPT_REVIEW_STATUSES
  RESOURCE_HUB_MODULES = deps.RESOURCE_HUB_MODULES
  RUNTIME_MISC_STORE = deps.RUNTIME_MISC_STORE
  SENSITIVE_LEVELS = deps.SENSITIVE_LEVELS
}

async function normalizeAdminUserInputAsync(input, options = {}) {
  if (!input || typeof input !== 'object') return { error: 'User payload must be an object.' }

  const username = cleanText(input.username, 80).toLowerCase()
  const realName = cleanText(input.realName || input.real_name || input.name || username, 80)
  const phone = cleanText(input.phone || '', 30)
  const email = cleanText(input.email || '', 120)
  const department = cleanText(input.department || '', 120)
  const roleId = cleanText(input.roleId || input.role_id || 'content_editor', 80)
  const status = cleanText(input.status || 'active', 20)
  const notes = cleanText(input.notes || '', 1000)
  const regionIds = await normalizeUserRegionIdsInputAsync(input.regionIds || input.region_ids || input.regions || [])

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

async function getUserRegionScopeAsync(user) {
  if (!user) return { allRegions: false, assignedRegionIds: [], scopeRegionIds: [] }
  const activeRegions = (await listRegionsAsync()).filter((region) => region.isActive)
  if (await userHasAllRegionAccessAsync(user)) {
    return {
      allRegions: true,
      assignedRegionIds: activeRegions.map((region) => region.id),
      scopeRegionIds: activeRegions.map((region) => region.id),
    }
  }

  const assignedRegionIds = (await listUserAssignedRegionIdsAsync(user.id))
    .filter((id) => activeRegions.some((region) => region.id === id))
  const baseIds = assignedRegionIds.length > 0 ? assignedRegionIds : [await getDefaultRegionIdAsync()]
  const scopeRegionIds = new Set()
  for (const regionId of baseIds) {
    for (const scopedId of collectRegionAndDescendantIds(regionId, activeRegions)) {
      scopeRegionIds.add(scopedId)
    }
  }
  return { allRegions: false, assignedRegionIds: baseIds, scopeRegionIds: [...scopeRegionIds] }
}

async function canUserAccessContentAsync(user, content) {
  if (!content) return false
  const scope = await getUserRegionScopeAsync(user)
  if (scope.allRegions) return true
  return scope.scopeRegionIds.includes(await getContentRegionIdAsync(content))
}

async function publicAdminUserAsync(user, includePermissions = false) {
  if (!user) return null
  const regionScope = await getUserRegionScopeAsync(user)
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
  if (includePermissions) payload.permissions = await getUserPermissionCodesAsync(user.id)
  return payload
}

async function buildPublicRegionConfigAsync(regionId = '') {
  const regions = await listRegionsAsync()
  const activeRegions = regions.filter((region) => region.isActive)
  const requestedRegionId = cleanText(regionId, 120)
  const requestedRegion = requestedRegionId ? activeRegions.find((region) => region.id === requestedRegionId) : null
  const defaultRegion = requestedRegion || activeRegions.find((region) => region.isDefault) || activeRegions[0] || null
  const displayMode = defaultRegion?.displayMode || 'current'
  const mapMode = defaultRegion?.mapMode || 'single'
  const scopeRegionIds = resolveDisplayScopeRegionIds(defaultRegion, activeRegions)
  const archives = await listAllPublicArchiveMapPointsAsync()
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

async function normalizeAiTaskInputAsync(input) {
  if (!input || typeof input !== 'object') return { error: 'AI 任务数据格式不正确。' }
  const taskType = cleanText(input.taskType || input.task_type || '', 80)
  const targetType = cleanText(input.targetType || input.target_type || '', 80)
  const targetId = cleanText(input.targetId || input.target_id || '', 120)
  const providerId = cleanText(input.providerId || input.provider_id || '', 120)
  const prompt = cleanText(input.prompt || '', 20000)
  const inputText = cleanText(input.inputText || input.input_text || '', 100000)
  const inputJson = await normalizeAiTaskInputJsonAsync(input.inputJson ?? input.input_json ?? {})
  if (!taskType) return { error: '请选择 AI 任务类型。' }
  if (!prompt) return { error: '请填写任务提示词。' }
  if (!inputText && !hasMeaningfulAiTaskInput(inputJson)) return { error: '请填写任务输入内容或绑定输入文件。' }
  if (inputJson.error) return { error: inputJson.error }
  const provider = providerId ? await findAiProviderAsync(providerId) : null
  if (providerId && !provider) return { error: '选择的 AI 供应商不存在。' }
  if (provider) {
    const providerCheck = validateAiTaskAgainstProvider({ taskType, inputJson: inputJson.value, provider })
    if (providerCheck.error) return { error: providerCheck.error }
  }
  return { task: { taskType, targetType, targetId, providerId, prompt, inputText, inputJson: inputJson.value } }
}

async function normalizeAiTaskInputJsonAsync(value) {
  let source = value
  if (typeof source === 'string') {
    source = source.trim() ? safeJsonValue(source) : {}
    if (!source || typeof source !== 'object' || Array.isArray(source)) return { error: 'AI 任务输入 JSON 格式不正确。' }
  }
  if (!source || typeof source !== 'object' || Array.isArray(source)) source = {}

  const mediaAssetId = cleanText(source.mediaAssetId || source.media_asset_id || '', 120)
  let mediaAsset = null
  if (mediaAssetId) {
    mediaAsset = await findMediaAssetAsync(mediaAssetId)
    if (!mediaAsset || mediaAsset.deletedAt) return { error: '选择的输入媒体不存在或已删除。' }
  }
  const sourceMediaUrl = cleanText(source.sourceMediaUrl || source.source_media_url || source.mediaUrl || source.media_url || mediaAsset?.url || '', 1000)
  const sourceFileUrl = cleanText(source.sourceFileUrl || source.source_file_url || source.fileUrl || source.file_url || '', 1000)
  const expectedOutput = cleanText(source.expectedOutput || source.expected_output || '', 200)
  const outputFormat = cleanText(source.outputFormat || source.output_format || '', 120)
  const language = cleanText(source.language || source.lang || '', 80)
  const speakerName = cleanText(source.speakerName || source.speaker_name || '', 120)
  const authorizationFile = cleanText(source.authorizationFile || source.authorization_file || '', 1000)
  const notes = cleanText(source.notes || '', 2000)
  const segments = Array.isArray(source.segments) ? source.segments.slice(0, 200) : []
  const extra = source.extra && typeof source.extra === 'object' && !Array.isArray(source.extra) ? source.extra : {}

  if (sourceMediaUrl && !isSafeMediaResultUrl(sourceMediaUrl)) return { error: '输入媒体 URL 不安全，只支持 http(s) 或 /uploads/ 路径。' }
  if (sourceFileUrl && !isSafeMediaResultUrl(sourceFileUrl)) return { error: '输入文件 URL 不安全，只支持 http(s) 或 /uploads/ 路径。' }
  if (authorizationFile && !isSafeMediaResultUrl(authorizationFile)) return { error: '授权文件 URL 不安全，只支持 http(s) 或 /uploads/ 路径。' }

  return {
    value: {
      mediaAssetId,
      media_asset_id: mediaAssetId,
      mediaType: mediaAsset?.mediaType || cleanText(source.mediaType || source.media_type || '', 40),
      media_type: mediaAsset?.mediaType || cleanText(source.mediaType || source.media_type || '', 40),
      sourceMediaUrl,
      source_media_url: sourceMediaUrl,
      sourceFileUrl,
      source_file_url: sourceFileUrl,
      expectedOutput,
      expected_output: expectedOutput,
      outputFormat,
      output_format: outputFormat,
      language,
      speakerName,
      speaker_name: speakerName,
      authorizationFile,
      authorization_file: authorizationFile,
      notes,
      segments,
      extra,
    },
  }
}

async function normalizeAiTaskApplicationInputAsync(input, task, content, userId = '') {
  const source = input && typeof input === 'object' ? input : {}
  const targetField = cleanText(source.targetField || source.target_field || defaultAiApplyTargetField(task, content), 80)
  const allowedFields = new Set(['summary', 'body', 'ai_summary', 'public_transcript', 'raw_transcript', 'oral_transcription_workbench', 'risk_types', 'narration_script', 'tts_audio', 'digital_human_video', 'data_note'])
  if (!allowedFields.has(targetField)) return { error: 'AI 结果应用位置不正确。' }

  const resultText = cleanText(source.resultText || source.result_text || task.resultText || '', 100000)
  if (!resultText) return { error: 'AI 结果为空。' }
  const submitForReview = readBooleanFlag(source.submitForReview ?? source.submit_for_review, false)
  const currentVersion = content.currentVersion
  if (!currentVersion) return { error: '目标内容缺少当前版本。' }

  const appliedAt = new Date().toISOString()
  const data = {
    ...(currentVersion.data || {}),
    aiGenerated: true,
    ai_generated: true,
    aiTaskId: task.id,
    ai_task_id: task.id,
    aiTaskType: task.taskType,
    ai_task_type: task.taskType,
    aiAppliedAt: appliedAt,
    ai_applied_at: appliedAt,
  }
  let summary = currentVersion.summary || content.summary || ''
  let body = currentVersion.body || ''
  let riskTypes = Array.isArray(content.riskTypes) ? [...content.riskTypes] : []
  const mediaAssets = []

  if (targetField === 'summary') {
    summary = cleanText(resultText, 2000)
  } else if (targetField === 'body') {
    body = resultText
  } else if (targetField === 'risk_types') {
    const generatedRisks = normalizeLongTextLines(resultText, 20, 80)
      .flatMap(line => line.split(/[，,;；]/).map(item => cleanText(item, 80)).filter(Boolean))
      .slice(0, 20)
    riskTypes = Array.from(new Set([...riskTypes, ...generatedRisks, 'AI 风险提示待审'])).slice(0, 20)
    data.aiRiskHint = resultText
    data.ai_risk_hint = resultText
  } else if (targetField === 'ai_summary') {
    data.aiSummary = resultText
    data.ai_summary = resultText
    data.aiSummaryStatus = 'ai_generated'
    data.ai_summary_status = 'ai_generated'
    if (content.moduleKey !== 'oral_history' && !summary) summary = cleanText(resultText, 2000)
  } else if (targetField === 'public_transcript') {
    data.publicTranscript = resultText
    data.public_transcript = resultText
    data.publicVersion = resultText
    data.public_version = resultText
    data.content = resultText
    data.transcript = resultText
    body = resultText
    data.transcriptReviewStatus = 'public_edited'
    data.transcript_review_status = 'public_edited'
  } else if (targetField === 'raw_transcript' || targetField === 'oral_transcription_workbench') {
    if (targetField === 'oral_transcription_workbench' && content.moduleKey !== 'oral_history') {
      return { error: '只有口述历史内容可以应用到转写工作台。' }
    }
    data.rawTranscript = resultText
    data.raw_transcript = resultText
    data.originalTranscript = resultText
    data.original_transcript = resultText
    data.transcriptReviewStatus = 'transcribed'
    data.transcript_review_status = 'transcribed'
    if (content.moduleKey === 'oral_history') {
      const transcriptionJson = task.resultJson && typeof task.resultJson === 'object' ? task.resultJson : {}
      data.aiTranscriptionTaskId = task.id
      data.ai_transcription_task_id = task.id
      data.aiTranscriptionTaskType = task.taskType
      data.ai_transcription_task_type = task.taskType
      data.aiTranscriptionAppliedAt = appliedAt
      data.ai_transcription_applied_at = appliedAt
      data.transcriptionSource = 'ai_task'
      data.transcription_source = 'ai_task'
      data.aiTranscriptionProviderId = task.providerId || ''
      data.ai_transcription_provider_id = task.providerId || ''
      data.aiTranscriptionProviderName = task.providerName || ''
      data.ai_transcription_provider_name = task.providerName || ''
      data.aiTranscriptionResultJson = transcriptionJson
      data.ai_transcription_result_json = transcriptionJson
      data.transcriptionSegments = Array.isArray(transcriptionJson.segments) ? transcriptionJson.segments : data.transcriptionSegments || data.transcription_segments || []
      data.transcription_segments = data.transcriptionSegments
      data.transcriptionLanguage = cleanText(transcriptionJson.language || transcriptionJson.lang || data.transcriptionLanguage || data.transcription_language || '', 80)
      data.transcription_language = data.transcriptionLanguage
      data.transcriptionDurationSeconds = Number(transcriptionJson.durationSeconds || transcriptionJson.duration_seconds || data.transcriptionDurationSeconds || data.transcription_duration_seconds || 0) || ''
      data.transcription_duration_seconds = data.transcriptionDurationSeconds
      data.transcriptionSourceMediaUrl = cleanText(transcriptionJson.sourceMediaUrl || transcriptionJson.source_media_url || transcriptionJson.mediaUrl || transcriptionJson.media_url || data.audioUrl || data.audio_url || data.videoUrl || data.video_url || '', 1000)
      data.transcription_source_media_url = data.transcriptionSourceMediaUrl
      data.transcriptionFileUrl = cleanText(transcriptionJson.transcriptFileUrl || transcriptionJson.transcript_file_url || transcriptionJson.fileUrl || transcriptionJson.file_url || '', 1000)
      data.transcription_file_url = data.transcriptionFileUrl
    }
  } else if (targetField === 'narration_script') {
    data.aiNarrationScript = resultText
    data.ai_narration_script = resultText
  } else if (targetField === 'tts_audio') {
    const media = normalizeAiResultMediaAsset({ task, source, content, mediaType: 'audio', uploadedBy: userId })
    if (media.error) return { error: media.error }
    if (content.moduleKey === 'oral_history') {
      const authorizationStatus = cleanText(data.authorizationStatus || data.authorization_status || '', 40)
      const authorizationFile = cleanText(data.authorizationFile || data.authorization_file || '', 1000)
      if (authorizationStatus !== 'authorized' || !authorizationFile) {
        return { error: '口述历史声音模拟或 TTS 讲解音频必须先完成授权，并上传授权文件。' }
      }
      data.aiVoiceAuthorizationStatus = authorizationStatus
      data.ai_voice_authorization_status = authorizationStatus
      data.aiVoiceAuthorizationFile = authorizationFile
      data.ai_voice_authorization_file = authorizationFile
    }
    mediaAssets.push(media.asset)
    data.ttsAudioMediaId = media.asset.id
    data.tts_audio_media_id = media.asset.id
    data.ttsAudioUrl = media.asset.url
    data.tts_audio_url = media.asset.url
    data.aiNarrationAudioUrl = media.asset.url
    data.ai_narration_audio_url = media.asset.url
    data.aiTtsResultText = resultText
    data.ai_tts_result_text = resultText
  } else if (targetField === 'digital_human_video') {
    const media = normalizeAiResultMediaAsset({ task, source, content, mediaType: 'video', uploadedBy: userId })
    if (media.error) return { error: media.error }
    mediaAssets.push(media.asset)
    data.digitalHumanVideoMediaId = media.asset.id
    data.digital_human_video_media_id = media.asset.id
    data.digitalHumanVideoUrl = media.asset.url
    data.digital_human_video_url = media.asset.url
    data.aiDigitalHumanResultText = resultText
    data.ai_digital_human_result_text = resultText
  } else {
    data.aiNote = resultText
    data.ai_note = resultText
  }

  const normalized = await normalizeContentInputAsync({
    moduleKey: content.moduleKey,
    title: currentVersion.title || content.title,
    summary,
    body,
    category: content.category || '',
    sensitiveLevel: content.sensitiveLevel,
    tags: content.tags || [],
    riskTypes,
    data,
    sources: content.sources || [],
  })
  if (normalized.error) return { error: normalized.error }
  return { contentInput: normalized, targetField, submitForReview, mediaAssets }
}

async function normalizeContentRegionDataAsync(input) {
  const source = input && typeof input === 'object' ? input : {}
  const regionId = cleanText(source.regionId || source.region_id || '', 120) || await getDefaultRegionIdAsync()
  const region = await findRegionAsync(regionId)
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

async function rowToContentSummaryAsync(row) {
  const currentData = safeJsonValue(row.current_data_json) || {}
  const defaultRegionId = await getDefaultRegionIdAsync()
  return {
    id: row.id,
    moduleKey: row.module_key,
    moduleName: row.module_name || row.module_key,
    category: row.category || '',
    tags: safeJsonArray(row.tags_json),
    status: row.status,
    title: row.title,
    summary: row.summary || '',
    sensitiveLevel: row.sensitive_level,
    riskTypes: safeJsonArray(row.risk_types_json),
    currentVersionId: row.current_version_id,
    publishedVersionId: row.published_version_id,
    workflowId: row.workflow_id,
    currentStepId: row.current_step_id,
    regionId: currentData.regionId || currentData.region_id || defaultRegionId,
    regionName: currentData.regionName || currentData.region_name || '',
    updatedBy: row.updated_by,
    updatedByUsername: row.updated_by_username || '',
    submittedAt: row.submitted_at,
    publishedAt: row.published_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewSignals: await buildReviewSignalsAsync({
      moduleKey: row.module_key,
      sensitiveLevel: row.sensitive_level,
      riskTypes: safeJsonArray(row.risk_types_json),
      data: currentData,
    }),
  }
}

async function buildReviewSignalsAsync({ moduleKey = '', sensitiveLevel = 'normal', riskTypes = [], data = {} }) {
  const source = data && typeof data === 'object' ? data : {}
  const normalizedRiskTypes = normalizeStringArray(riskTypes, 20, 80)
  const riskTagTemplates = await getRiskTagTemplateMapAsync()
  const levelLabels = {
    normal: '普通',
    attention: '需注意',
    sensitive: '敏感',
    critical: '重大敏感',
  }
  const items = []
  const addItem = (type, level, label, detail = '') => {
    items.push({ type, level, label, detail })
  }

  if (sensitiveLevel && sensitiveLevel !== 'normal') {
    addItem('sensitive_level', sensitiveLevel === 'critical' ? 'critical' : sensitiveLevel === 'sensitive' ? 'high' : 'medium', `敏感等级：${levelLabels[sensitiveLevel] || sensitiveLevel}`)
  }
  for (const risk of normalizedRiskTypes) {
    const template = riskTagTemplates.get(risk)
    addItem('risk_tag', template?.level || (sensitiveLevel === 'critical' ? 'critical' : 'high'), `风险标签：${risk}`, template?.description || template?.category || '')
  }

  const aiSummaryStatus = cleanText(source.aiSummaryStatus || source.ai_summary_status || '', 40)
  const aiGenerated = readBooleanFlag(source.aiGenerated ?? source.ai_generated ?? source.generatedByAi ?? source.generated_by_ai, false)
  const aiTaskId = cleanText(source.aiTaskId || source.ai_task_id || source.sourceAiTaskId || source.source_ai_task_id || '', 120)
  const aiSummary = cleanText(source.aiSummary || source.ai_summary || '', 4000)
  const aiFields = []
  if (aiGenerated) aiFields.push('正文/结构化内容')
  if (aiSummaryStatus) aiFields.push('AI 摘要')
  if (aiTaskId) aiFields.push(`浠诲姟 ${aiTaskId}`)
  if (aiSummary && !aiSummaryStatus) aiFields.push('摘要文本')
  const aiUsed = aiGenerated || Boolean(aiSummaryStatus) || Boolean(aiTaskId)
  if (aiSummaryStatus === 'ai_generated') {
    addItem('ai_content', 'critical', 'AI 摘要待人工核对', 'AI 生成内容不得直接公开，需编辑核对并进入审核。')
  } else if (aiUsed) {
    addItem('ai_content', aiSummaryStatus === 'editor_checked' ? 'medium' : 'high', aiSummaryStatus === 'editor_checked' ? 'AI 内容已标记为编辑核对' : '存在 AI 辅助内容', aiFields.join('、'))
  }

  const sensitiveSegments = normalizeLongTextLines(source.sensitiveSegments || source.sensitive_segments || '', 200, 1000)
  if (sensitiveSegments.length) {
    addItem('sensitive_segments', sensitiveLevel === 'critical' ? 'critical' : 'high', `敏感片段：${sensitiveSegments.length} 条`, sensitiveSegments.slice(0, 3).join('；'))
  }

  const transcriptReviewStatus = cleanText(source.transcriptReviewStatus || source.transcript_review_status || '', 40)
  if (moduleKey === 'oral_history' && transcriptReviewStatus && transcriptReviewStatus !== 'review_ready') {
    addItem('transcript_review', 'medium', '口述历史转写未标记为可提交审核', transcriptReviewStatus)
  }

  const authorizationStatus = cleanText(source.authorizationStatus || source.authorization_status || '', 40)
  if (moduleKey === 'oral_history' && authorizationStatus && authorizationStatus !== 'authorized') {
    addItem('authorization', authorizationStatus === 'revoked' ? 'critical' : 'high', `授权状态：${authorizationStatus}`)
  }

  return {
    sensitiveLevel,
    sensitiveLabel: levelLabels[sensitiveLevel] || sensitiveLevel || '普通',
    riskTypes: normalizedRiskTypes,
    aiUsed,
    aiSummaryStatus,
    aiFields,
    sensitiveSegmentsCount: sensitiveSegments.length,
    items,
    highestLevel: resolveReviewSignalLevel(items),
  }
}

function rowToPublicContent(row) {
  const data = safeJsonValue(row.data_json) || {}
  if (row.module_key === 'oral_history' && data.authorizationStatus !== 'authorized' && data.authorization_status !== 'authorized') {
    return null
  }
  const publicData = row.module_key === 'oral_history' ? sanitizePublicOralHistoryData(data) : data
  const publicBody = row.module_key === 'oral_history'
    ? cleanText(publicData.publicTranscript || publicData.public_transcript || publicData.transcript || publicData.content || '', 100000)
    : row.body || ''
  return {
    id: row.id,
    moduleKey: row.module_key,
    moduleName: row.module_name || row.module_key,
    category: row.category || '',
    tags: safeJsonArray(row.tags_json),
    title: row.version_title || row.title,
    summary: row.version_summary || row.summary || '',
    body: publicBody,
    data: publicData,
    regionId: publicData.regionId || publicData.region_id || getDefaultRegionId(),
    regionName: publicData.regionName || publicData.region_name || '',
    sensitiveLevel: row.sensitive_level,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  }
}

async function rowToPublicContentAsync(row) {
  const data = safeJsonValue(row.data_json) || {}
  if (row.module_key === 'oral_history' && data.authorizationStatus !== 'authorized' && data.authorization_status !== 'authorized') {
    return null
  }
  const publicData = row.module_key === 'oral_history' ? sanitizePublicOralHistoryData(data) : data
  const publicBody = row.module_key === 'oral_history'
    ? cleanText(publicData.publicTranscript || publicData.public_transcript || publicData.transcript || publicData.content || '', 100000)
    : row.body || ''
  return {
    id: row.id,
    moduleKey: row.module_key,
    moduleName: row.module_name || row.module_key,
    category: row.category || '',
    tags: safeJsonArray(row.tags_json),
    title: row.version_title || row.title,
    summary: row.version_summary || row.summary || '',
    body: publicBody,
    data: publicData,
    regionId: publicData.regionId || publicData.region_id || await getDefaultRegionIdAsync(),
    regionName: publicData.regionName || publicData.region_name || '',
    sensitiveLevel: row.sensitive_level,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  }
}

async function findPublicArchiveByIdAsync(id) {
  const archiveId = cleanText(id, 120)
  if (!archiveId) return null
  const publishedArchive = await findPublishedArchiveContentAsync(archiveId)
  if (publishedArchive && hasValidArchiveCoordinates(publishedArchive)) return publishedArchive
  return null
}

async function filterArchiveResultByRegionQueryAsync(result, query) {
  const requestedRegionIds = parseRegionIdQuery(query.regionId || query.regionIds)
  if (requestedRegionIds.length === 0) return result

  const activeRegions = (await listRegionsAsync()).filter((region) => region.isActive)
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

async function rowToPublicArchiveAsync(row, preloadedSources) {
  const data = safeJsonValue(row.data_json) || {}
  const sources = preloadedSources !== undefined ? preloadedSources : (row.id ? await getPublicContentSourcesAsync(row.id) : [])
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

async function rowToReviewTaskAsync(row) {
  const stepOrder = row.step_order
  const currentData = safeJsonValue(row.current_data_json) || {}
  const workflowSteps = await getWorkflowStepsAsync(row.workflow_id)
  return {
    id: row.id,
    contentId: row.content_id,
    versionId: row.version_id,
    workflowId: row.workflow_id,
    stepId: row.step_id,
    stepName: row.step_name || '',
    stepOrder,
    requiredPermission: row.required_permission,
    assigneeRoleId: row.assignee_role_id || '',
    assigneeRoleName: row.assignee_role_name || '',
    status: row.status,
    reviewerId: row.reviewer_id,
    reviewerUsername: row.reviewer_username || '',
    comment: row.comment || '',
    contentTitle: row.title || '',
    moduleKey: row.module_key || '',
    isFinal: Boolean(row.is_final),
    returnSteps: workflowSteps.filter((step) => step.stepOrder <= stepOrder),
    reviewSignals: await buildReviewSignalsAsync({
      moduleKey: row.module_key,
      sensitiveLevel: row.sensitive_level,
      riskTypes: safeJsonArray(row.risk_types_json),
      data: currentData,
    }),
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  }
}

async function normalizeContentInputAsync(input) {
  if (!input || typeof input !== 'object') return { error: 'Content payload must be an object.' }

  const moduleKey = cleanText(input.moduleKey || input.module_key || 'archive', 80)
  const module = await RUNTIME_MISC_STORE.findContentModuleRow(moduleKey)
  const title = cleanText(input.title, 300)
  const summary = cleanText(input.summary || '', 2000)
  const body = cleanText(input.body || '', 100000)
  const category = cleanText(input.category || '', 120)
  const sensitiveLevel = cleanText(input.sensitiveLevel || input.sensitive_level || 'normal', 20)
  const tags = normalizeStringArray(input.tags, 30, 40)
  const riskTypes = normalizeStringArray(input.riskTypes || input.risk_types, 20, 80)
  let data = input.data && typeof input.data === 'object' ? input.data : {}
  const sources = normalizeSources(input.sources || [])
  const regionData = await normalizeContentRegionDataAsync(data)

  if (!module) return { error: 'Content module is invalid.' }
  if (!title) return { error: 'Content title is required.' }
  if (!SENSITIVE_LEVELS.has(sensitiveLevel)) return { error: 'Sensitive level is invalid.' }
  if (sources.error) return { error: sources.error }
  if (regionData.error) return { error: regionData.error }
  data = regionData.data
  if (moduleKey === 'archive') {
    const archiveData = await normalizeArchivePointDataAsync(data, category, await getContentModuleDefaultPublishPositionsAsync(moduleKey))
    if (archiveData.error) return { error: archiveData.error }
    data = archiveData.data
  } else if (moduleKey === 'song') {
    const songData = normalizeSongData(data, { title, summary, body, category })
    if (songData.error) return { error: songData.error }
    data = songData.data
  } else if (moduleKey === 'hero') {
    const heroData = normalizeHeroData(data, { title, summary, body, category })
    if (heroData.error) return { error: heroData.error }
    data = heroData.data
  } else if (moduleKey === 'film') {
    const filmData = normalizeFilmData(data, { title, summary, body, category })
    if (filmData.error) return { error: filmData.error }
    data = filmData.data
  } else if (moduleKey === 'oral_history') {
    const oralData = await normalizeOralHistoryDataAsync(data, { title, summary, body, category })
    if (oralData.error) return { error: oralData.error }
    data = oralData.data
  } else if (RESOURCE_HUB_MODULES.has(moduleKey)) {
    const resourceData = normalizeResourceHubData(data, { title, summary, body, category })
    if (resourceData.error) return { error: resourceData.error }
    data = resourceData.data
  } else if (INTERACTIVE_MODULES.has(moduleKey)) {
    const interactiveData = await normalizeInteractiveContentDataAsync(moduleKey, data, { title, summary, body, category })
    if (interactiveData.error) return { error: interactiveData.error }
    data = interactiveData.data
  }

  return {
    content: {
      moduleKey,
      category,
      tags,
      title,
      summary,
      body,
      sensitiveLevel,
      riskTypes,
      data,
    },
    sources: sources.items,
  }
}

async function normalizeInteractiveContentDataAsync(moduleKey, input, content) {
  if (moduleKey === 'party_route') return await normalizePartyRouteDataAsync(input, content)
  if (moduleKey === 'learning_course') return await normalizeLearningCourseDataAsync(input, content)
  return normalizeInteractiveContentData(moduleKey, input, content)
}

async function normalizePartyRouteDataAsync(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const pois = normalizeStringArray(source.pois || source.poiIds || source.poi_ids, 50, 120)
  const description = cleanText(source.description || content.body || content.summary || '', 100000)
  const title = cleanText(source.title || content.title, 300)
  const subtitle = cleanText(source.subtitle || content.summary || '', 300)
  const target = cleanText(source.target || '', 200)
  const duration = cleanText(source.duration || '', 120)
  const opening = cleanText(source.opening || '', 4000)

  if (!title) return { error: '党日路线请填写标题。' }
  if (!subtitle) return { error: '党日路线请填写副标题或摘要。' }
  if (!target) return { error: '党日路线请填写适用对象。' }
  if (!duration) return { error: '党日路线请填写预计时长。' }
  if (!pois.length) return { error: '党日路线请至少填写一个点位 ID。' }
  for (const poiId of pois) {
    if (!await findPublicArchiveByIdAsync(poiId)) return { error: `党日路线包含无效点位 ID：${poiId}` }
  }
  if (!description) return { error: '党日路线请填写路线说明。' }
  if (!opening) return { error: '党日路线请填写开场讲解词。' }

  return {
    data: {
      ...source,
      id: cleanText(source.id || '', 120),
      title,
      subtitle,
      target,
      duration,
      iconKey: cleanText(source.iconKey || source.icon_key || content.category || '', 80),
      icon_key: cleanText(source.iconKey || source.icon_key || content.category || '', 80),
      color: cleanText(source.color || '#C41E3A', 40),
      pois,
      poiIds: pois,
      poi_ids: pois,
      description,
      opening,
    },
  }
}

async function normalizeLearningCourseDataAsync(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const title = cleanText(source.title || content.title, 300)
  const subtitle = cleanText(source.subtitle || source.description || content.summary || content.body || '', 500)
  const archiveId = cleanText(source.archiveId || source.archive_id || source.poiId || source.poi_id || '', 120)
  const orderNumber = Number(source.order ?? source.sortOrder ?? source.sort_order ?? 0)
  const archive = archiveId ? await findPublicArchiveByIdAsync(archiveId) : null

  if (!title) return { error: '学习课程请填写标题。' }
  if (!subtitle) return { error: '学习课程请填写副标题或说明。' }
  if (!archiveId || !archive) return { error: '学习课程请绑定有效的档案点位 ID。' }
  if (!Number.isInteger(orderNumber) || orderNumber < 0 || orderNumber > 1000) return { error: '学习课程排序需填写 0 到 1000 之间的整数。' }

  return {
    data: {
      ...source,
      title,
      subtitle,
      archiveId,
      archive_id: archiveId,
      archiveTitle: archive.title,
      archive_title: archive.title,
      order: orderNumber || 0,
      sortOrder: orderNumber || 0,
      sort_order: orderNumber || 0,
    },
  }
}

async function normalizeUserRegionIdsInputAsync(value) {
  const raw = Array.isArray(value) ? value : String(value || '').split(',')
  const ids = Array.from(new Set(raw.map((item) => cleanText(item, 120)).filter(Boolean)))
  if (ids.length > 100) return { error: '最多只能为一个账号分配 100 个地区。' }

  for (const id of ids) {
    const region = await findRegionAsync(id)
    if (!region || !region.isActive) return { error: `地区权限不存在或已停用：${id}` }
  }
  return { items: ids }
}

async function listRegionsAsync() {
  const rows = await ADMIN_CORE_STORE.listRegions()
  return rows.map(rowToRegion)
}

async function userHasAllRegionAccessAsync(user) {
  if (!user) return false
  const roleId = user.role_id || user.roleId
  if (roleId === 'super_admin') return true
  return (await getUserPermissionCodesAsync(user.id)).includes('regions.manage')
}

async function listUserAssignedRegionIdsAsync(userId) {
  return await ADMIN_CORE_STORE.listUserAssignedRegionIds(userId)
}

async function getDefaultRegionIdAsync() {
  const regions = await listRegionsAsync()
  const region = regions.find((item) => item.isActive && item.isDefault) || regions.find((item) => item.isActive)
  return region?.id || 'region-suqu'
}

async function getContentRegionIdAsync(content) {
  const data = content?.currentVersion?.data || content?.publishedVersion?.data || content?.data || {}
  return cleanText(data.regionId || data.region_id || '', 120) || await getDefaultRegionIdAsync()
}

async function listAllPublicArchiveMapPointsAsync() {
  const publishedRows = await RUNTIME_MISC_STORE.listPublicArchiveMapRows()
  const sourcesByContentId = await preloadContentSourcesForRowsAsync(publishedRows)
  const archives = await Promise.all(
    publishedRows.map((row) => rowToPublicArchiveAsync(row, sourcesByContentId.get(row.id) || []))
  )
  return archives.filter((archive) => archive && hasValidArchiveCoordinates(archive))
}

async function findAiProviderAsync(id, includePrivate = false) {
  const row = await AI_OPS_STORE.findAiProviderRow(id)
  return row ? rowToAiProvider(row, includePrivate) : null
}

async function findRegionAsync(id) {
  const row = await ADMIN_CORE_STORE.findRegion(id)
  return row ? rowToRegion(row) : null
}

async function getRiskTagTemplateMapAsync() {
  const rows = await RUNTIME_MISC_STORE.listActiveRiskTagTemplateRows()
  const map = new Map()
  for (const row of rows) map.set(row.label, rowToRiskTagTemplate(row))
  return map
}

async function findPublishedArchiveContentAsync(id) {
  const row = await RUNTIME_MISC_STORE.findPublishedArchiveRow(id)
  return row ? rowToPublicArchiveAsync(row) : null
}

async function getPublicContentSourcesAsync(contentId) {
  const rows = await RUNTIME_MISC_STORE.listPublicContentSourceRows(contentId)
  return rows.map((row) => ({
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

async function getWorkflowStepsAsync(workflowId) {
  if (!workflowId) return []
  const rows = await CONTENT_READ_STORE.listWorkflowStepRows(workflowId)
  return rows.map((row) => ({
    id: row.id,
    workflowId: row.workflow_id,
    stepOrder: row.step_order,
    name: row.name,
    requiredPermission: row.required_permission,
    roleId: row.role_id,
    isFinal: Boolean(row.is_final),
  }))
}

async function normalizeArchivePointDataAsync(input, category, defaultPublishPositions = getStaticContentModulePublishDefaults('archive')) {
  const source = input && typeof input === 'object' ? input : {}
  const regionId = cleanText(source.regionId || source.region_id || '', 120)
  const archiveType = cleanText(source.archiveType || source.archive_type || source.type || category || 'revolution', 40)
  const year = Number(source.year)
  const longitude = Number(source.longitude)
  const latitude = Number(source.latitude)
  const address = cleanText(source.address || source.location || '', 300)
  const historyPeriod = cleanText(source.historyPeriod || source.history_period || '', 200)
  const relatedPeople = normalizeStringArray(source.relatedPeople || source.related_people || [], 50, 120)
  const relatedEvents = normalizeStringArray(source.relatedEvents || source.related_events || [], 50, 160)
  const publishPositions = normalizeArchivePublishPositions(source.publishPositions || source.publish_positions || {}, defaultPublishPositions)
  const detailBlocks = normalizeArchiveDetailBlocks(source.detailBlocks || source.detail_blocks || [])
  const coverImage = cleanText(source.coverImage || source.cover_image || '', 1000)
  const media = normalizeArchiveMedia(source.media)
  const displayTimeline = normalizeArchiveDisplayTimeline(source.displayTimeline || source.display_timeline || source.timeline || [])
  const region = regionId ? await findRegionAsync(regionId) : null

  if (!regionId || !region) return { error: '请选择有效的所属地区。' }
  if (!ARCHIVE_TYPES.has(archiveType)) return { error: '档案类型不正确。' }
  if (!Number.isInteger(year) || year < 1800 || year > 2100) return { error: '请填写 1800 到 2100 之间的档案年份。' }
  if (!hasValidArchiveCoordinates({ longitude, latitude })) return { error: '请填写有效的经纬度，且不能为 0,0。' }
  if (!address) return { error: '档案点位请填写详细地址或位置说明。' }
  if (!historyPeriod) return { error: '档案点位请填写历史时期。' }
  if (!Object.values(publishPositions).some(Boolean)) return { error: '档案点位请至少选择一个发布位置。' }
  if (detailBlocks.error) return { error: detailBlocks.error }
  if (!detailBlocks.items.length) return { error: '档案点位请至少配置一个详情板块。' }
  if (!detailBlocks.items.some((item) => item.enabled)) return { error: '档案点位请至少启用一个详情板块。' }
  if (media.error) return { error: media.error }
  if (displayTimeline.error) return { error: displayTimeline.error }
  if (!displayTimeline.items.length) return { error: '档案点位请至少填写一条展陈时间线。' }

  return {
    data: {
      ...source,
      regionId,
      region_id: regionId,
      regionName: region.fullName || region.name,
      region_name: region.fullName || region.name,
      archiveType,
      archive_type: archiveType,
      type: archiveType,
      year,
      longitude,
      latitude,
      address,
      location: address,
      historyPeriod,
      history_period: historyPeriod,
      relatedPeople,
      related_people: relatedPeople,
      relatedEvents,
      related_events: relatedEvents,
      publishPositions,
      publish_positions: publishPositions,
      detailBlocks: detailBlocks.items,
      detail_blocks: detailBlocks.items,
      coverImage,
      cover_image: coverImage,
      media: media.items,
      displayTimeline: displayTimeline.items,
      display_timeline: displayTimeline.items,
      timeline: displayTimeline.items,
    },
  }
}

async function getContentModuleDefaultPublishPositionsAsync(moduleKey) {
  const row = await RUNTIME_MISC_STORE.findContentModuleRow(moduleKey)
  if (!row) return getStaticContentModulePublishDefaults(moduleKey)
  return {
    map: Boolean(row.default_publish_map),
    list: Boolean(row.default_publish_list),
    home: Boolean(row.default_publish_home),
    topic: Boolean(row.default_publish_topic),
    guide: Boolean(row.default_publish_guide),
  }
}

async function normalizeOralHistoryDataAsync(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const age = normalizePositiveInteger(source.age, '讲述人年龄', 130)
  if (age.error) return { error: age.error }

  const narrator = cleanText(source.narrator || source.name || '', 120)
  const identity = cleanText(source.identity || source.role || '', 200)
  const collectionLocation = cleanText(source.collectionLocation || source.collection_location || source.location || '', 300)
  const interviewer = cleanText(source.interviewer || source.collector || '', 120)
  const rawTranscript = cleanText(source.rawTranscript || source.raw_transcript || source.originalTranscript || source.original_transcript || source.transcript || source.content || content.body || '', 100000)
  const publicTranscript = cleanText(source.publicTranscript || source.public_transcript || source.publicVersion || source.public_version || source.transcript || source.content || content.body || '', 100000)
  const aiSummary = cleanText(source.aiSummary || source.ai_summary || '', 4000)
  const date = cleanText(source.date || source.recordedAt || source.recorded_at || '', 120)
  const emotion = cleanText(source.emotion || content.category || '', 120)
  const authorizationStatus = cleanText(source.authorizationStatus || source.authorization_status || '', 40)
  const normalizedAuthorizationStatus = ORAL_AUTHORIZATION_STATUSES.has(authorizationStatus) ? authorizationStatus : ''
  const authorizationFile = cleanText(source.authorizationFile || source.authorization_file || source.consentFile || source.consent_file || '', 1000)
  const authorizationScope = cleanText(source.authorizationScope || source.authorization_scope || '', 1000)
  const authorizationExpiresAt = cleanText(source.authorizationExpiresAt || source.authorization_expires_at || '', 120)
  const authorizationNote = cleanText(source.authorizationNote || source.authorization_note || source.revocationReason || source.revocation_reason || '', 1000)
  const transcriptReviewStatus = cleanText(source.transcriptReviewStatus || source.transcript_review_status || '', 40)
  const normalizedTranscriptReviewStatus = ORAL_TRANSCRIPT_REVIEW_STATUSES.has(transcriptReviewStatus) ? transcriptReviewStatus : 'raw_imported'
  const aiSummaryStatus = cleanText(source.aiSummaryStatus || source.ai_summary_status || '', 40)
  const normalizedAiSummaryStatus = ORAL_AI_SUMMARY_STATUSES.has(aiSummaryStatus) ? aiSummaryStatus : (aiSummary ? 'manual_imported' : 'none')
  const relatedArchiveId = cleanText(source.relatedArchiveId || source.related_archive_id || source.archiveId || source.archive_id || '', 120)
  const sensitiveSegments = normalizeLongTextLines(source.sensitiveSegments || source.sensitive_segments || '', 80, 1000)
  const videoUrl = cleanText(source.videoUrl || source.video_url || '', 1000)
  const audioUrl = cleanText(source.audioUrl || source.audio_url || '', 1000)

  if (relatedArchiveId) {
    const relatedArchive = await findContentAsync(relatedArchiveId, true)
    if (!relatedArchive || relatedArchive.moduleKey !== 'archive' || relatedArchive.status === 'deleted') {
      return { error: '关联档案点位不存在或不可用。' }
    }
  }

  if (!narrator) return { error: '口述历史请填写讲述人。' }
  if (!identity) return { error: '口述历史请填写年龄/身份说明。' }
  if (!collectionLocation) return { error: '口述历史请填写采集地点。' }
  if (!interviewer) return { error: '口述历史请填写采访人。' }
  if (!rawTranscript) return { error: '口述历史请填写原始转写文本。' }
  if (!publicTranscript) return { error: '口述历史请填写可公开版本。' }
  if (!date) return { error: '口述历史请填写采集时间。' }
  if (!emotion) return { error: '口述历史请填写情感标签。' }
  if (!normalizedAuthorizationStatus) return { error: '口述历史请选择授权状态。' }
  if (normalizedAuthorizationStatus === 'authorized' && !authorizationFile) return { error: '口述历史已授权公开时请填写授权文件路径。' }

  return {
    data: {
      ...source,
      narrator,
      name: narrator,
      age: age.value,
      identity,
      role: identity,
      title: cleanText(source.title || content.title, 300),
      collectionLocation,
      collection_location: collectionLocation,
      location: collectionLocation,
      interviewer,
      collector: interviewer,
      rawTranscript,
      raw_transcript: rawTranscript,
      originalTranscript: rawTranscript,
      original_transcript: rawTranscript,
      publicTranscript,
      public_transcript: publicTranscript,
      publicVersion: publicTranscript,
      public_version: publicTranscript,
      content: publicTranscript,
      transcript: publicTranscript,
      aiSummary,
      ai_summary: aiSummary,
      sensitiveSegments,
      sensitive_segments: sensitiveSegments,
      relatedArchiveId,
      related_archive_id: relatedArchiveId,
      archiveId: relatedArchiveId,
      archive_id: relatedArchiveId,
      authorizationStatus: normalizedAuthorizationStatus,
      authorization_status: normalizedAuthorizationStatus,
      authorizationFile,
      authorization_file: authorizationFile,
      consentFile: authorizationFile,
      consent_file: authorizationFile,
      authorizationScope,
      authorization_scope: authorizationScope,
      authorizationExpiresAt,
      authorization_expires_at: authorizationExpiresAt,
      authorizationNote,
      authorization_note: authorizationNote,
      revocationReason: authorizationNote,
      revocation_reason: authorizationNote,
      transcriptReviewStatus: normalizedTranscriptReviewStatus,
      transcript_review_status: normalizedTranscriptReviewStatus,
      aiSummaryStatus: normalizedAiSummaryStatus,
      ai_summary_status: normalizedAiSummaryStatus,
      date,
      recordedAt: date,
      recorded_at: date,
      emotion,
      audioUrl,
      audio_url: audioUrl,
      videoUrl,
      video_url: videoUrl,
    },
  }
}

async function preloadContentSourcesForRowsAsync(rows) {
  // 批量加载多个内容的 sources，消除 N+1 查询（N 次 → 1 次 IN 查询）
  const sourceRows = await RUNTIME_MISC_STORE.listPublicContentSourceRowsByContentIds(rows.map((r) => r.id))
  const byContentId = new Map()
  for (const s of sourceRows) {
    const list = byContentId.get(s.content_id) || []
    list.push({
      sourceType: s.source_type || '',
      sourceTitle: s.source_title || '',
      sourceUrl: s.source_url || '',
      archiveRef: s.archive_ref || '',
      pageRef: s.page_ref || '',
      collector: s.collector || '',
      collectedAt: s.collected_at || '',
      trustLevel: s.trust_level || '',
      notes: s.notes || '',
      createdAt: s.created_at,
    })
    byContentId.set(s.content_id, list)
  }
  return byContentId
}

async function findContentAsync(id, includeDetails = false) {
  const row = await CONTENT_READ_STORE.findContentSummaryRow(id)
  if (!row) return null

  const content = await rowToContentSummaryAsync(row)
  if (!includeDetails) return content

  const versions = await CONTENT_READ_STORE.listContentVersionRows(content.id)
  const currentVersion = versions.find((item) => item.id === row.current_version_id) || versions[0] || null
  const publishedVersion = versions.find((item) => item.id === row.published_version_id) || null
  const sourceRows = await CONTENT_READ_STORE.listContentSourceRows(content.id, currentVersion?.id || '')
  const sources = sourceRows.map(rowToContentSource)
  const pendingTask = await findPendingReviewTaskAsync(content.id)
  const reviewTasks = await listContentReviewTasksAsync(content.id)
  const versionItems = versions.map(rowToContentVersion)
  const currentVersionPayload = currentVersion ? rowToContentVersion(currentVersion) : null
  const publishedVersionPayload = publishedVersion ? rowToContentVersion(publishedVersion) : null

  return {
    ...content,
    currentVersion: currentVersionPayload,
    publishedVersion: publishedVersionPayload,
    versions: versionItems,
    latestVersionNumber: versions[0]?.version_number || 0,
    sources,
    pendingTask,
    reviewTasks,
    workflowSteps: await getWorkflowStepsAsync(content.workflowId),
    versionDiff: buildContentVersionDiff(currentVersionPayload, publishedVersionPayload, versionItems),
  }
}

async function findPendingReviewTaskAsync(contentId) {
  const row = await CONTENT_READ_STORE.findPendingReviewTaskRow(contentId)
  return row ? rowToReviewTaskAsync(row) : null
}

async function listContentReviewTasksAsync(contentId) {
  const rows = await CONTENT_READ_STORE.listContentReviewTaskRows(contentId)
  return await Promise.all(rows.map((row) => rowToReviewTaskAsync(row)))
}

module.exports = { init, normalizeAdminUserInputAsync, getUserRegionScopeAsync, canUserAccessContentAsync, publicAdminUserAsync, buildPublicRegionConfigAsync, normalizeAiTaskInputAsync, normalizeAiTaskInputJsonAsync, normalizeAiTaskApplicationInputAsync, normalizeContentRegionDataAsync, rowToContentSummaryAsync, buildReviewSignalsAsync, rowToPublicContent, rowToPublicContentAsync, findPublicArchiveByIdAsync, filterArchiveResultByRegionQueryAsync, rowToPublicArchiveAsync, rowToReviewTaskAsync, normalizeContentInputAsync, normalizeInteractiveContentDataAsync, normalizePartyRouteDataAsync, normalizeLearningCourseDataAsync, normalizeUserRegionIdsInputAsync, listRegionsAsync, userHasAllRegionAccessAsync, listUserAssignedRegionIdsAsync, getDefaultRegionIdAsync, getContentRegionIdAsync, listAllPublicArchiveMapPointsAsync, findAiProviderAsync, findRegionAsync, getRiskTagTemplateMapAsync, findPublishedArchiveContentAsync, getPublicContentSourcesAsync, getWorkflowStepsAsync, normalizeArchivePointDataAsync, getContentModuleDefaultPublishPositionsAsync, normalizeOralHistoryDataAsync, preloadContentSourcesForRowsAsync, findContentAsync, findPendingReviewTaskAsync, listContentReviewTasksAsync }
