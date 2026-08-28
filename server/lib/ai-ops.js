/**
 * 从 index.js 拆出的辅助函数
 */
const crypto = require('crypto')
const fs = require('fs')
const { cleanText, readBooleanFlag, safeJsonValue, safeJsonArray, clamp, parsePositiveInt } = require('./utils')
const { normalizeAiCapabilities, validateAiTaskAgainstProvider, normalizeAiResultMediaAsset } = require('./ai-run')
const { hasMeaningfulAiTaskInput, isSafeMediaResultUrl, defaultAiApplyTargetField, isSafeProviderEndpoint } = require('./ai-base')
const { normalizeLongTextLines, normalizeSongData, normalizeFilmData, normalizeResourceHubData, normalizeQuizData, normalizeTourRouteData, normalizeLongMarchData, normalizeDirectorScriptData, normalizePanoramaData, normalizeCheckinData, normalizeCocreationData, normalizeTodaySuquData, normalizePartyOathData, normalizeTimelineData, normalizeTributeCeremonyData } = require('./content-normalize')
const { normalizeStringArray, normalizeSources, normalizeHeroData, normalizeArchiveMedia, normalizeArchiveDisplayTimeline, normalizePositiveInteger } = require('./data-normalize')
const { rowToMediaAsset, hasValidArchiveCoordinates, rowToContentSource, rowToContentVersion, resolveReviewSignalLevel, rowToRiskTagTemplate } = require('./rows')
const { normalizeContentRegionData, getStaticContentModulePublishDefaults, normalizeArchivePublishPositions, findRegion, getDefaultRegionId, rowToPublicArchive } = require('./region-access')
const { getWorkflowSteps } = require('./workflow')
const { buildContentVersionDiff } = require('./diff')

// 运行期注入的依赖（由 index.js 调用 init() 传入）
let ADMIN_TOKEN
let AI_OPS_STORE
let AI_SECRET_FILE
let AI_TASK_TYPES
let ARCHIVE_DETAIL_BLOCK_TYPES
let ARCHIVE_TYPES
let CONTENT_READ_STORE
let DASHBOARD_ENTRY_ACTIONS
let INTERACTIVE_MODULES
let ORAL_AI_SUMMARY_STATUSES
let ORAL_AUTHORIZATION_STATUSES
let ORAL_TRANSCRIPT_REVIEW_STATUSES
let RESOURCE_HUB_MODULES
let RUNTIME_MISC_STORE
let SENSITIVE_LEVELS
function init(deps) {
  ADMIN_TOKEN = deps.ADMIN_TOKEN
  AI_OPS_STORE = deps.AI_OPS_STORE
  AI_SECRET_FILE = deps.AI_SECRET_FILE
  AI_TASK_TYPES = deps.AI_TASK_TYPES
  ARCHIVE_DETAIL_BLOCK_TYPES = deps.ARCHIVE_DETAIL_BLOCK_TYPES
  ARCHIVE_TYPES = deps.ARCHIVE_TYPES
  CONTENT_READ_STORE = deps.CONTENT_READ_STORE
  DASHBOARD_ENTRY_ACTIONS = deps.DASHBOARD_ENTRY_ACTIONS
  INTERACTIVE_MODULES = deps.INTERACTIVE_MODULES
  ORAL_AI_SUMMARY_STATUSES = deps.ORAL_AI_SUMMARY_STATUSES
  ORAL_AUTHORIZATION_STATUSES = deps.ORAL_AUTHORIZATION_STATUSES
  ORAL_TRANSCRIPT_REVIEW_STATUSES = deps.ORAL_TRANSCRIPT_REVIEW_STATUSES
  RESOURCE_HUB_MODULES = deps.RESOURCE_HUB_MODULES
  RUNTIME_MISC_STORE = deps.RUNTIME_MISC_STORE
  SENSITIVE_LEVELS = deps.SENSITIVE_LEVELS
}

function normalizeAiProviderInput(input, options = {}) {
  if (!input || typeof input !== 'object') return { error: 'AI 供应商数据格式不正确。' }
  const providerType = cleanText(input.providerType || input.provider_type || 'openai_compatible', 40)
  if (!['openai_compatible', 'manual_only', 'mimo_tts'].includes(providerType)) return { error: 'AI 供应商类型不正确。' }
  const name = cleanText(input.name || '', 120)
  const baseUrl = cleanText(input.baseUrl || input.base_url || '', 500)
  const defaultModel = cleanText(input.defaultModel || input.default_model || '', 120)
  const capabilities = normalizeAiCapabilities(input.capabilities || input.capabilities_json || '')
  const configJson = normalizeAiProviderConfig(input.configJson ?? input.config_json ?? {})
  const apiKey = String(input.apiKey || input.api_key || '').trim()
  const isEnabled = readBooleanFlag(input.isEnabled ?? input.is_enabled, true)
  const keepExistingKey = !apiKey && options.existing?.apiKeyEncrypted

  if (!name) return { error: '请填写 AI 供应商名称。' }
  if (configJson.error) return { error: configJson.error }
  if (providerType !== 'manual_only' && !baseUrl) return { error: '真实调用供应商请填写 API 地址。' }
  if (providerType !== 'manual_only' && !defaultModel) return { error: '真实调用供应商请填写默认模型。' }
  if (options.creating && providerType !== 'manual_only' && !apiKey) return { error: '真实调用供应商请填写 API Key。' }

  return {
    provider: {
      name,
      providerType,
      baseUrl,
      apiKeyEncrypted: keepExistingKey ? options.existing.apiKeyEncrypted : (apiKey ? encryptSecret(apiKey) : ''),
      defaultModel,
      capabilities,
      configJson: configJson.value,
      isEnabled,
    },
  }
}

function normalizeAiTaskInput(input) {
  if (!input || typeof input !== 'object') return { error: 'AI 任务数据格式不正确。' }
  const taskType = cleanText(input.taskType || input.task_type || '', 80)
  const targetType = cleanText(input.targetType || input.target_type || '', 80)
  const targetId = cleanText(input.targetId || input.target_id || '', 120)
  const providerId = cleanText(input.providerId || input.provider_id || '', 120)
  const prompt = cleanText(input.prompt || '', 20000)
  const inputText = cleanText(input.inputText || input.input_text || '', 100000)
  const inputJson = normalizeAiTaskInputJson(input.inputJson ?? input.input_json ?? {})
  if (!taskType) return { error: '请选择 AI 任务类型。' }
  if (!prompt) return { error: '请填写任务提示词。' }
  if (!inputText && !hasMeaningfulAiTaskInput(inputJson)) return { error: '请填写任务输入内容或绑定输入文件。' }
  if (inputJson.error) return { error: inputJson.error }
  const provider = providerId ? findAiProvider(providerId) : null
  if (providerId && !provider) return { error: '选择的 AI 供应商不存在。' }
  if (provider) {
    const providerCheck = validateAiTaskAgainstProvider({ taskType, inputJson: inputJson.value, provider })
    if (providerCheck.error) return { error: providerCheck.error }
  }
  return { task: { taskType, targetType, targetId, providerId, prompt, inputText, inputJson: inputJson.value } }
}

function normalizeAiTaskInputJson(value) {
  let source = value
  if (typeof source === 'string') {
    source = source.trim() ? safeJsonValue(source) : {}
    if (!source || typeof source !== 'object' || Array.isArray(source)) return { error: 'AI 任务输入 JSON 格式不正确。' }
  }
  if (!source || typeof source !== 'object' || Array.isArray(source)) source = {}

  const mediaAssetId = cleanText(source.mediaAssetId || source.media_asset_id || '', 120)
  let mediaAsset = null
  if (mediaAssetId) {
    mediaAsset = findMediaAsset(mediaAssetId)
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

function normalizeAiTaskApplicationInput(input, task, content, userId = '') {
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

  const normalized = normalizeContentInput({
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

function rowToAiProvider(row, includePrivate = false) {
  const provider = {
    id: row.id,
    name: row.name,
    providerType: row.provider_type,
    baseUrl: row.base_url || '',
    defaultModel: row.default_model || '',
    capabilities: safeJsonArray(row.capabilities_json),
    configJson: safeJsonValue(row.config_json) || {},
    isEnabled: Boolean(row.is_enabled),
    hasApiKey: Boolean(row.api_key_encrypted),
    lastTestedAt: row.last_tested_at || null,
    lastTestStatus: row.last_test_status || '',
    lastTestMessage: row.last_test_message || '',
    createdBy: row.created_by || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
  if (includePrivate) {
    provider.apiKey = row.api_key_encrypted ? decryptSecret(row.api_key_encrypted) : ''
    provider.apiKeyEncrypted = row.api_key_encrypted || ''
  }
  return provider
}

function encryptSecret(value) {
  const text = String(value || '')
  if (!text) return ''
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', getAiSecretKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv, tag, encrypted].map(part => part.toString('base64')).join(':')
}

function decryptSecret(value) {
  try {
    const [ivText, tagText, encryptedText] = String(value || '').split(':')
    if (!ivText || !tagText || !encryptedText) return ''
    const decipher = crypto.createDecipheriv('aes-256-gcm', getAiSecretKey(), Buffer.from(ivText, 'base64'))
    decipher.setAuthTag(Buffer.from(tagText, 'base64'))
    return Buffer.concat([decipher.update(Buffer.from(encryptedText, 'base64')), decipher.final()]).toString('utf8')
  } catch {
    return ''
  }
}

function normalizeAiProviderConfig(value) {
  let source = value
  if (typeof source === 'string') {
    source = source.trim() ? safeJsonValue(source) : {}
    if (!source || typeof source !== 'object' || Array.isArray(source)) return { error: 'AI 供应商任务配置 JSON 格式不正确。' }
  }
  if (!source || typeof source !== 'object' || Array.isArray(source)) source = {}

  const supportedTaskTypes = normalizeStringArray(source.supportedTaskTypes || source.supported_task_types || source.taskTypes || source.task_types || [], 30, 80)
    .filter(item => AI_TASK_TYPES.has(item))
  const inputModes = normalizeStringArray(source.inputModes || source.input_modes || [], 20, 40)
  const outputFormats = normalizeStringArray(source.outputFormats || source.output_formats || [], 30, 40)
  const acceptedInputExtensions = normalizeStringArray(source.acceptedInputExtensions || source.accepted_input_extensions || [], 50, 20)
    .map(item => item.replace(/^\./, '').toLowerCase())
    .filter(Boolean)
  const acceptedInputMimeTypes = normalizeStringArray(source.acceptedInputMimeTypes || source.accepted_input_mime_types || [], 50, 120)
    .map(item => item.toLowerCase())
  const resultMode = cleanText(source.resultMode || source.result_mode || 'sync', 40)
  if (resultMode && !['sync', 'async_polling', 'callback', 'manual'].includes(resultMode)) return { error: 'AI 供应商结果模式不正确。' }

  const pollingEndpoint = cleanText(source.pollingEndpoint || source.polling_endpoint || '', 500)
  const callbackPath = cleanText(source.callbackPath || source.callback_path || '', 200)
  if (pollingEndpoint && !isSafeProviderEndpoint(pollingEndpoint)) return { error: 'AI 供应商轮询地址不安全，只支持 http(s) 或 /api/ 路径。' }
  if (callbackPath && !callbackPath.startsWith('/api/')) return { error: 'AI 供应商回调路径必须以 /api/ 开头。' }

  const maxFileSizeMb = clamp(parsePositiveInt(source.maxFileSizeMb || source.max_file_size_mb, 0), 0, 2048)
  const timeoutSeconds = clamp(parsePositiveInt(source.timeoutSeconds || source.timeout_seconds, 45), 5, 600)
  const extra = source.extra && typeof source.extra === 'object' && !Array.isArray(source.extra) ? source.extra : {}

  return {
    value: {
      supportedTaskTypes,
      supported_task_types: supportedTaskTypes,
      inputModes,
      input_modes: inputModes,
      outputFormats,
      output_formats: outputFormats,
      fileInputEnabled: readBooleanFlag(source.fileInputEnabled ?? source.file_input_enabled, true),
      file_input_enabled: readBooleanFlag(source.fileInputEnabled ?? source.file_input_enabled, true),
      acceptedInputExtensions,
      accepted_input_extensions: acceptedInputExtensions,
      acceptedInputMimeTypes,
      accepted_input_mime_types: acceptedInputMimeTypes,
      resultMode,
      result_mode: resultMode,
      pollingEndpoint,
      polling_endpoint: pollingEndpoint,
      callbackPath,
      callback_path: callbackPath,
      maxFileSizeMb,
      max_file_size_mb: maxFileSizeMb,
      timeoutSeconds,
      timeout_seconds: timeoutSeconds,
      requireAuthorizationForVoice: readBooleanFlag(source.requireAuthorizationForVoice ?? source.require_authorization_for_voice, true),
      require_authorization_for_voice: readBooleanFlag(source.requireAuthorizationForVoice ?? source.require_authorization_for_voice, true),
      extra,
    },
  }
}

function findAiProvider(id, includePrivate = false) {
  const row = AI_OPS_STORE.findAiProviderRow(id)
  return row ? rowToAiProvider(row, includePrivate) : null
}

function findMediaAsset(id, includePrivate = false) {
  const row = CONTENT_READ_STORE.findMediaAssetRow(id)
  return row ? rowToMediaAsset(row, includePrivate) : null
}

function normalizeContentInput(input) {
  if (!input || typeof input !== 'object') return { error: 'Content payload must be an object.' }

  const moduleKey = cleanText(input.moduleKey || input.module_key || 'archive', 80)
  const module = RUNTIME_MISC_STORE.findContentModuleRow(moduleKey)
  const title = cleanText(input.title, 300)
  const summary = cleanText(input.summary || '', 2000)
  const body = cleanText(input.body || '', 100000)
  const category = cleanText(input.category || '', 120)
  const sensitiveLevel = cleanText(input.sensitiveLevel || input.sensitive_level || 'normal', 20)
  const tags = normalizeStringArray(input.tags, 30, 40)
  const riskTypes = normalizeStringArray(input.riskTypes || input.risk_types, 20, 80)
  let data = input.data && typeof input.data === 'object' ? input.data : {}
  const sources = normalizeSources(input.sources || [])
  const regionData = normalizeContentRegionData(data)

  if (!module) return { error: 'Content module is invalid.' }
  if (!title) return { error: 'Content title is required.' }
  if (!SENSITIVE_LEVELS.has(sensitiveLevel)) return { error: 'Sensitive level is invalid.' }
  if (sources.error) return { error: sources.error }
  if (regionData.error) return { error: regionData.error }
  data = regionData.data
  if (moduleKey === 'archive') {
    const archiveData = normalizeArchivePointData(data, category, getContentModuleDefaultPublishPositions(moduleKey))
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
    const oralData = normalizeOralHistoryData(data, { title, summary, body, category })
    if (oralData.error) return { error: oralData.error }
    data = oralData.data
  } else if (RESOURCE_HUB_MODULES.has(moduleKey)) {
    const resourceData = normalizeResourceHubData(data, { title, summary, body, category })
    if (resourceData.error) return { error: resourceData.error }
    data = resourceData.data
  } else if (INTERACTIVE_MODULES.has(moduleKey)) {
    const interactiveData = normalizeInteractiveContentData(moduleKey, data, { title, summary, body, category })
    if (interactiveData.error) return { error: interactiveData.error }
    data = interactiveData.data
  }

  return {
    content: {
      moduleKey,
      title,
      summary,
      body,
      category,
      tags,
      sensitiveLevel,
      riskTypes,
      data,
    },
    sources: sources.items,
  }
}

function getAiSecretKey() {
  const configured = process.env.AI_SECRET_KEY || ADMIN_TOKEN
  if (configured) return crypto.createHash('sha256').update(String(configured)).digest()
  if (!fs.existsSync(AI_SECRET_FILE)) {
    fs.writeFileSync(AI_SECRET_FILE, crypto.randomBytes(32).toString('hex'), { mode: 0o600 })
  }
  const localSecret = fs.readFileSync(AI_SECRET_FILE, 'utf8').trim()
  return crypto.createHash('sha256').update(localSecret).digest()
}

function normalizeArchivePointData(input, category, defaultPublishPositions = getStaticContentModulePublishDefaults('archive')) {
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
  const region = regionId ? findRegion(regionId) : null

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
    },
  }
}

function getContentModuleDefaultPublishPositions(moduleKey) {
  const row = RUNTIME_MISC_STORE.findContentModuleRow(moduleKey)
  if (!row) return getStaticContentModulePublishDefaults(moduleKey)
  return {
    map: Boolean(row.default_publish_map),
    list: Boolean(row.default_publish_list),
    home: Boolean(row.default_publish_home),
    topic: Boolean(row.default_publish_topic),
    guide: Boolean(row.default_publish_guide),
  }
}

function normalizeOralHistoryData(input, content) {
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
    const relatedArchive = findContent(relatedArchiveId, true)
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

function normalizeInteractiveContentData(moduleKey, input, content) {
  if (moduleKey === 'quiz') return normalizeQuizData(input, content)
  if (moduleKey === 'party_route') return normalizePartyRouteData(input, content)
  if (moduleKey === 'tour_route') return normalizeTourRouteData(input, content)
  if (moduleKey === 'long_march') return normalizeLongMarchData(input, content)
  if (moduleKey === 'director_script') return normalizeDirectorScriptData(input, content)
  if (moduleKey === 'panorama') return normalizePanoramaData(input, content)
  if (moduleKey === 'checkin') return normalizeCheckinData(input, content)
  if (moduleKey === 'cocreation') return normalizeCocreationData(input, content)
  if (moduleKey === 'today_suqu') return normalizeTodaySuquData(input, content)
  if (moduleKey === 'party_oath') return normalizePartyOathData(input, content)
  if (moduleKey === 'timeline') return normalizeTimelineData(input, content)
  if (moduleKey === 'tribute_ceremony') return normalizeTributeCeremonyData(input, content)
  if (moduleKey === 'learning_course') return normalizeLearningCourseData(input, content)
  if (moduleKey === 'dashboard_entry') return normalizeDashboardEntryData(input, content)
  return { data: input && typeof input === 'object' ? input : {} }
}

function normalizeArchiveDetailBlocks(value) {
  if (!Array.isArray(value)) return { error: '详情板块配置必须是数组。' }
  if (value.length > 30) return { error: '详情板块最多 30 项。' }

  const items = []
  const seen = new Set()
  for (const [index, entry] of value.entries()) {
    const labelText = `详情板块第 ${index + 1} 项`
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return { error: `${labelText}格式不正确。` }
    const type = cleanText(entry.type || entry.key || '', 60)
    const title = cleanText(entry.title || '', 120)
    const enabled = entry.enabled === undefined ? true : Boolean(entry.enabled)
    const orderValue = Number(entry.order ?? index + 1)
    if (!ARCHIVE_DETAIL_BLOCK_TYPES.has(type)) return { error: `${labelText}类型不正确。` }
    if (!title) return { error: `${labelText}请填写标题。` }
    if (seen.has(type)) return { error: `${labelText}类型重复。` }
    if (!Number.isInteger(orderValue) || orderValue < 1 || orderValue > 999) return { error: `${labelText}排序不正确。` }
    seen.add(type)
    items.push({
      type,
      key: type,
      title,
      order: orderValue,
      enabled,
    })
  }

  return { items: items.sort((a, b) => a.order - b.order) }
}

function findContent(id, includeDetails = false) {
  const row = CONTENT_READ_STORE.findContentSummaryRow(id)
  if (!row) return null

  const content = rowToContentSummary(row)
  if (!includeDetails) return content

  const versions = CONTENT_READ_STORE.listContentVersionRows(content.id)
  const currentVersion = versions.find((item) => item.id === row.current_version_id) || versions[0] || null
  const publishedVersion = versions.find((item) => item.id === row.published_version_id) || null
  const sources = CONTENT_READ_STORE.listContentSourceRows(content.id, currentVersion?.id || '').map(rowToContentSource)
  const pendingTask = findPendingReviewTask(content.id)
  const reviewTasks = listContentReviewTasks(content.id)
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
    workflowSteps: getWorkflowSteps(content.workflowId),
    versionDiff: buildContentVersionDiff(currentVersionPayload, publishedVersionPayload, versionItems),
  }
}

function normalizePartyRouteData(input, content) {
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
    if (!findPublicArchiveById(poiId)) return { error: `党日路线包含无效点位 ID：${poiId}` }
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

function normalizeLearningCourseData(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const title = cleanText(source.title || content.title, 300)
  const subtitle = cleanText(source.subtitle || source.description || content.summary || content.body || '', 500)
  const archiveId = cleanText(source.archiveId || source.archive_id || source.poiId || source.poi_id || '', 120)
  const orderNumber = Number(source.order ?? source.sortOrder ?? source.sort_order ?? 0)
  const archive = archiveId ? findPublicArchiveById(archiveId) : null

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

function normalizeDashboardEntryData(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const label = cleanText(source.label || source.title || content.title, 120)
  const actionKey = cleanText(source.actionKey || source.action_key || '', 80)
  const groupKey = cleanText(source.groupKey || source.group_key || content.category || 'general', 80)
  const groupTitle = cleanText(source.groupTitle || source.group_title || content.category || '功能入口', 120)
  const iconKey = cleanText(source.iconKey || source.icon_key || 'chevron', 80)
  const sectionIconKey = cleanText(source.sectionIconKey || source.section_icon_key || iconKey, 80)
  const badgeMode = cleanText(source.badgeMode || source.badge_mode || '', 80)
  const orderNumber = Number(source.order ?? source.sortOrder ?? source.sort_order ?? 0)

  if (!label) return { error: '学习面板入口请填写按钮名称。' }
  if (!actionKey) return { error: '学习面板入口请选择点击后打开的位置。' }
  if (!DASHBOARD_ENTRY_ACTIONS.has(actionKey)) return { error: `暂不支持打开这个位置：${actionKey}` }
  if (!groupKey) return { error: '学习面板入口请填写所属分组。' }
  if (!Number.isFinite(orderNumber)) return { error: '学习面板入口排序必须是数字。' }

  return {
    data: {
      ...source,
      label,
      title: label,
      actionKey,
      action_key: actionKey,
      groupKey,
      group_key: groupKey,
      groupTitle,
      group_title: groupTitle,
      iconKey,
      icon_key: iconKey,
      sectionIconKey,
      section_icon_key: sectionIconKey,
      description: cleanText(source.description || content.summary || content.body || '', 500),
      badgeMode,
      badge_mode: badgeMode,
      order: Math.trunc(orderNumber),
      sortOrder: Math.trunc(orderNumber),
      sort_order: Math.trunc(orderNumber),
    },
  }
}

function rowToContentSummary(row) {
  const currentData = safeJsonValue(row.current_data_json) || {}
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
    regionId: currentData.regionId || currentData.region_id || getDefaultRegionId(),
    regionName: currentData.regionName || currentData.region_name || '',
    updatedBy: row.updated_by,
    updatedByUsername: row.updated_by_username || '',
    submittedAt: row.submitted_at,
    publishedAt: row.published_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewSignals: buildReviewSignals({
      moduleKey: row.module_key,
      sensitiveLevel: row.sensitive_level,
      riskTypes: safeJsonArray(row.risk_types_json),
      data: currentData,
    }),
  }
}

function findPendingReviewTask(contentId) {
  const row = CONTENT_READ_STORE.findPendingReviewTaskRow(contentId)
  return row ? rowToReviewTask(row) : null
}

function listContentReviewTasks(contentId) {
  return CONTENT_READ_STORE.listContentReviewTaskRows(contentId).map(rowToReviewTask)
}

function findPublicArchiveById(id) {
  const archiveId = cleanText(id, 120)
  if (!archiveId) return null
  const publishedArchive = findPublishedArchiveContent(archiveId)
  if (publishedArchive && hasValidArchiveCoordinates(publishedArchive)) return publishedArchive
  return null
}

function buildReviewSignals({ moduleKey = '', sensitiveLevel = 'normal', riskTypes = [], data = {} }) {
  const source = data && typeof data === 'object' ? data : {}
  const normalizedRiskTypes = normalizeStringArray(riskTypes, 20, 80)
  const riskTagTemplates = getRiskTagTemplateMap()
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
  if (aiTaskId) aiFields.push(`任务 ${aiTaskId}`)
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

function rowToReviewTask(row) {
  const stepOrder = row.step_order
  const currentData = safeJsonValue(row.current_data_json) || {}
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
    returnSteps: getWorkflowSteps(row.workflow_id).filter((step) => step.stepOrder <= stepOrder),
    reviewSignals: buildReviewSignals({
      moduleKey: row.module_key,
      sensitiveLevel: row.sensitive_level,
      riskTypes: safeJsonArray(row.risk_types_json),
      data: currentData,
    }),
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  }
}

function findPublishedArchiveContent(id) {
  const row = RUNTIME_MISC_STORE.findPublishedArchiveRow(id)
  return row ? rowToPublicArchive(row) : null
}

function getRiskTagTemplateMap() {
  const rows = RUNTIME_MISC_STORE.listActiveRiskTagTemplateRows()
  const map = new Map()
  for (const row of rows) map.set(row.label, rowToRiskTagTemplate(row))
  return map
}

module.exports = { init, normalizeAiProviderInput, normalizeAiTaskInput, normalizeAiTaskInputJson, normalizeAiTaskApplicationInput, rowToAiProvider, encryptSecret, decryptSecret, normalizeAiProviderConfig, findAiProvider, findMediaAsset, normalizeContentInput, getAiSecretKey, normalizeArchivePointData, getContentModuleDefaultPublishPositions, normalizeOralHistoryData, normalizeInteractiveContentData, normalizeArchiveDetailBlocks, findContent, normalizePartyRouteData, normalizeLearningCourseData, normalizeDashboardEntryData, rowToContentSummary, findPendingReviewTask, listContentReviewTasks, findPublicArchiveById, buildReviewSignals, rowToReviewTask, findPublishedArchiveContent, getRiskTagTemplateMap }
