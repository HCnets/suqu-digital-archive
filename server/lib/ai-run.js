/**
 * 从 index.js 拆出的独立辅助函数
 */
const crypto = require('crypto')
const { aiTaskTypeLabelForServer, isSafeMediaResultUrl } = require('./ai-base')
const { normalizeStringArray } = require('./data-normalize')
const { cleanText, safeJsonValue, makeId, clamp, parsePositiveInt } = require('./utils')
const { synthesizeTtsForTask, testMimoTts } = require('./tts-providers')

function normalizeAiCapabilities(value) {
  if (Array.isArray(value)) return normalizeStringArray(value, 20, 80)
  return String(value || '')
    .split(/\r?\n|,/)
    .map(item => cleanText(item, 80))
    .filter(Boolean)
    .slice(0, 20)
}

function normalizeAiResultJson(value, resultText, task) {
  let source = value
  if (typeof source === 'string') {
    source = source.trim() ? safeJsonValue(source) : {}
    if (!source || typeof source !== 'object' || Array.isArray(source)) return { error: 'AI 结果 JSON 格式不正确。' }
  }
  if (!source || typeof source !== 'object' || Array.isArray(source)) source = {}

  const inputJson = task.inputJson && typeof task.inputJson === 'object' ? task.inputJson : {}
  const textUrl = cleanText(resultText || '', 1000)
  const textLooksLikeUrl = isSafeMediaResultUrl(textUrl)
  const mediaUrl = cleanText(
    source.mediaUrl || source.media_url || source.url || source.outputUrl || source.output_url
      || source.audioUrl || source.audio_url || source.videoUrl || source.video_url
      || (['tts_audio', 'digital_human_video'].includes(task.taskType) && textLooksLikeUrl ? textUrl : ''),
    1000,
  )
  const transcriptFileUrl = cleanText(source.transcriptFileUrl || source.transcript_file_url || source.fileUrl || source.file_url || '', 1000)
  const thumbnailUrl = cleanText(source.thumbnailUrl || source.thumbnail_url || '', 1000)
  const sourceMediaUrl = cleanText(source.sourceMediaUrl || source.source_media_url || inputJson.sourceMediaUrl || inputJson.source_media_url || '', 1000)
  const sourceFileUrl = cleanText(source.sourceFileUrl || source.source_file_url || inputJson.sourceFileUrl || inputJson.source_file_url || '', 1000)

  for (const [label, url] of [
    ['媒体结果 URL', mediaUrl],
    ['转写文件 URL', transcriptFileUrl],
    ['缩略图 URL', thumbnailUrl],
    ['源媒体 URL', sourceMediaUrl],
    ['源文件 URL', sourceFileUrl],
  ]) {
    if (url && !isSafeMediaResultUrl(url)) return { error: `${label} 不安全，只支持 http(s) 或 /uploads/ 路径。` }
  }

  const durationSeconds = Number(source.durationSeconds ?? source.duration_seconds ?? 0)
  const sizeBytes = Number(source.sizeBytes ?? source.size_bytes ?? 0)
  const segments = Array.isArray(source.segments) ? source.segments.slice(0, 500) : []

  return {
    value: {
      ...source,
      mediaUrl,
      media_url: mediaUrl,
      url: mediaUrl || cleanText(source.url || '', 1000),
      audioUrl: task.taskType === 'tts_audio' ? mediaUrl : cleanText(source.audioUrl || source.audio_url || '', 1000),
      audio_url: task.taskType === 'tts_audio' ? mediaUrl : cleanText(source.audioUrl || source.audio_url || '', 1000),
      videoUrl: task.taskType === 'digital_human_video' ? mediaUrl : cleanText(source.videoUrl || source.video_url || '', 1000),
      video_url: task.taskType === 'digital_human_video' ? mediaUrl : cleanText(source.videoUrl || source.video_url || '', 1000),
      transcriptFileUrl,
      transcript_file_url: transcriptFileUrl,
      fileUrl: transcriptFileUrl || cleanText(source.fileUrl || source.file_url || '', 1000),
      file_url: transcriptFileUrl || cleanText(source.fileUrl || source.file_url || '', 1000),
      thumbnailUrl,
      thumbnail_url: thumbnailUrl,
      sourceMediaUrl,
      source_media_url: sourceMediaUrl,
      sourceFileUrl,
      source_file_url: sourceFileUrl,
      mimeType: cleanText(source.mimeType || source.mime_type || '', 120),
      mime_type: cleanText(source.mimeType || source.mime_type || '', 120),
      durationSeconds: Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : '',
      duration_seconds: Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : '',
      sizeBytes: Number.isFinite(sizeBytes) && sizeBytes > 0 ? Math.trunc(sizeBytes) : '',
      size_bytes: Number.isFinite(sizeBytes) && sizeBytes > 0 ? Math.trunc(sizeBytes) : '',
      language: cleanText(source.language || source.lang || inputJson.language || '', 80),
      segments,
      taskType: task.taskType,
      task_type: task.taskType,
      normalizedAt: new Date().toISOString(),
      normalized_at: new Date().toISOString(),
    },
  }
}

function validateAiTaskAgainstProvider({ taskType, inputJson, provider }) {
  const config = provider.configJson && typeof provider.configJson === 'object' ? provider.configJson : {}
  const supportedTaskTypes = normalizeStringArray(config.supportedTaskTypes || config.supported_task_types || [], 30, 80)
  if (supportedTaskTypes.length && !supportedTaskTypes.includes(taskType)) {
    return { error: `当前 AI 供应商未声明支持“${aiTaskTypeLabelForServer(taskType)}”任务。` }
  }

  const hasFileInput = Boolean(inputJson?.sourceMediaUrl || inputJson?.sourceFileUrl || inputJson?.mediaAssetId)
  if (hasFileInput && config.fileInputEnabled === false) return { error: '当前 AI 供应商未启用文件输入能力。' }

  const acceptedExtensions = normalizeStringArray(config.acceptedInputExtensions || config.accepted_input_extensions || [], 50, 20)
    .map(item => item.replace(/^\./, '').toLowerCase())
  if (hasFileInput && acceptedExtensions.length) {
    const inputUrl = cleanText(inputJson.sourceMediaUrl || inputJson.sourceFileUrl || '', 1000)
    const extension = inputUrl ? inferExtensionFromUrl(inputUrl, cleanText(inputJson.mediaType || inputJson.media_type || 'document', 40)) : ''
    if (extension && !acceptedExtensions.includes(extension)) {
      return { error: `当前 AI 供应商不支持 .${extension} 输入文件。` }
    }
  }

  const outputFormats = normalizeStringArray(config.outputFormats || config.output_formats || [], 30, 40).map(item => item.toLowerCase())
  const outputFormat = cleanText(inputJson?.outputFormat || inputJson?.output_format || '', 40).toLowerCase()
  if (outputFormat && outputFormats.length && !outputFormats.includes(outputFormat)) {
    return { error: `当前 AI 供应商不支持 ${outputFormat} 输出格式。` }
  }

  const requiresVoiceAuthorization = config.requireAuthorizationForVoice !== false && config.require_authorization_for_voice !== false
  if (requiresVoiceAuthorization && ['tts_audio', 'digital_human_video'].includes(taskType) && inputJson?.speakerName && !inputJson.authorizationFile) {
    return { error: '涉及具体声音对象的 TTS/数字人任务必须绑定授权文件。' }
  }

  return { ok: true }
}

function normalizeAiExternalJobInput(input) {
  if (!input || typeof input !== 'object') return { error: '外部 AI 任务数据格式不正确。' }
  const externalJobId = cleanText(input.externalJobId || input.external_job_id || input.jobId || input.job_id || '', 200)
  if (!externalJobId) return { error: '请填写供应商外部任务 ID。' }
  const providerStatus = normalizeAiProviderStatus(input.providerStatus || input.provider_status || input.status || 'submitted')
  const providerRequestJson = normalizeProviderPayload(input.providerRequestJson ?? input.provider_request_json ?? input.requestJson ?? input.request_json ?? {})
  const providerResponseJson = normalizeProviderPayload(input.providerResponseJson ?? input.provider_response_json ?? input.responseJson ?? input.response_json ?? {})
  if (providerRequestJson.error) return { error: providerRequestJson.error }
  if (providerResponseJson.error) return { error: providerResponseJson.error }
  return {
    value: {
      externalJobId,
      providerStatus,
      providerRequestJson: providerRequestJson.value,
      providerResponseJson: providerResponseJson.value,
    },
  }
}

function normalizeAiCallbackInput(input, task) {
  if (!input || typeof input !== 'object') return { error: 'AI 回调数据格式不正确。' }
  const status = normalizeAiCallbackStatus(input.status || input.providerStatus || input.provider_status || '')
  const providerStatus = normalizeAiProviderStatus(input.providerStatus || input.provider_status || input.status || status)
  const resultText = cleanText(input.resultText || input.result_text || input.text || input.outputText || input.output_text || '', 100000)
  const errorMessage = cleanText(input.errorMessage || input.error_message || input.message || '', 2000)
  const providerResponseJson = normalizeProviderPayload(input.providerResponseJson ?? input.provider_response_json ?? input.responseJson ?? input.response_json ?? input)
  if (providerResponseJson.error) return { error: providerResponseJson.error }

  if (status === 'completed') {
    if (!resultText) return { error: '完成状态的 AI 回调必须包含结果文本。' }
    const rawResultJson = input.resultJson ?? input.result_json ?? providerResponseJson.value
    const normalizedResultJson = normalizeAiResultJson(rawResultJson || {}, resultText, task)
    if (normalizedResultJson.error) return { error: normalizedResultJson.error }
    return {
      value: {
        status,
        providerStatus,
        resultText,
        resultJson: normalizedResultJson.value,
        providerResponseJson: providerResponseJson.value,
        errorMessage: '',
      },
    }
  }

  if (status === 'failed') {
    return {
      value: {
        status,
        providerStatus,
        resultText: '',
        resultJson: null,
        providerResponseJson: providerResponseJson.value,
        errorMessage: errorMessage || 'AI 供应商回调失败。',
      },
    }
  }

  return {
    value: {
      status: 'running',
      providerStatus,
      resultText: '',
      resultJson: null,
      providerResponseJson: providerResponseJson.value,
      errorMessage: '',
    },
  }
}

function normalizeAiCallbackStatus(value) {
  const status = normalizeAiProviderStatus(value)
  if (['completed', 'success', 'succeeded', 'done'].includes(status)) return 'completed'
  if (['failed', 'error', 'cancelled'].includes(status)) return 'failed'
  return 'running'
}

function normalizeAiResultMediaAsset({ task, source, content, mediaType, uploadedBy }) {
  const resultJson = task.resultJson && typeof task.resultJson === 'object' ? task.resultJson : {}
  const mediaUrl = cleanText(
    source.mediaUrl || source.media_url || source.url
      || resultJson.mediaUrl || resultJson.media_url || resultJson.url || resultJson.outputUrl || resultJson.output_url
      || (mediaType === 'audio' ? resultJson.audioUrl || resultJson.audio_url : resultJson.videoUrl || resultJson.video_url)
      || task.resultText || '',
    1000,
  )
  if (!mediaUrl) return { error: 'AI 媒体结果缺少音频或视频 URL。' }
  if (!isSafeMediaResultUrl(mediaUrl)) return { error: 'AI 媒体结果 URL 不安全，只支持 http(s) 或 /uploads/ 路径。' }

  const extension = inferExtensionFromUrl(mediaUrl, mediaType)
  const mimeType = cleanText(source.mimeType || source.mime_type || resultJson.mimeType || resultJson.mime_type || inferMimeType(extension, mediaType), 120)
  const now = Date.now()
  const title = cleanText(source.title || resultJson.title || `${aiTaskTypeLabelForServer(task.taskType)}-${content.id}`, 180)
  const id = makeId('media')
  const sizeBytes = Number(source.sizeBytes ?? source.size_bytes ?? resultJson.sizeBytes ?? resultJson.size_bytes ?? 0)
  const durationSeconds = Number(source.durationSeconds ?? source.duration_seconds ?? resultJson.durationSeconds ?? resultJson.duration_seconds ?? 0)

  return {
    asset: {
      id,
      originalName: `${title}.${extension}`,
      storedName: `${id}.${extension}`,
      mediaType,
      mimeType,
      extension,
      sizeBytes: Number.isFinite(sizeBytes) && sizeBytes >= 0 ? Math.trunc(sizeBytes) : 0,
      width: null,
      height: null,
      durationSeconds: Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : null,
      category: mediaType === 'audio' ? 'ai-tts' : 'ai-digital-human',
      altText: title,
      caption: cleanText(source.caption || resultJson.caption || `AI 任务 ${task.id} 生成产物，需经审核后公开。`, 300),
      originalUrl: mediaUrl,
      url: mediaUrl,
      thumbnailUrl: cleanText(source.thumbnailUrl || source.thumbnail_url || resultJson.thumbnailUrl || resultJson.thumbnail_url || '', 1000),
      originalStoragePath: '',
      storagePath: '',
      checksumSha256: crypto.createHash('sha256').update(mediaUrl).digest('hex'),
      watermarkText: '',
      autoCompress: false,
      processingStatus: 'stored',
      processingNote: 'AI 结果登记到媒体库；如为远程 URL，请在正式发布前确认文件可访问和授权。',
      uploadedBy,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  }
}

async function testAiProvider(provider) {
  if (provider.providerType === 'manual_only') return { ok: true, message: '手动导入供应商无需测试连接。' }
  if (provider.providerType === 'mimo_tts') return testMimoTts(provider)
  if (!provider.apiKey) return { ok: false, message: '供应商未配置 API Key。' }
  const timeoutSeconds = clamp(parsePositiveInt(provider.configJson?.timeoutSeconds || provider.configJson?.timeout_seconds, 45), 5, 600)
  const result = await callOpenAiCompatible(provider, [
    { role: 'system', content: '你是一个连接测试助手。' },
    { role: 'user', content: '请只回复 OK。' },
  ], { maxTokens: 8, timeoutSeconds })
  return result.ok ? { ok: true, message: '连接测试成功。' } : { ok: false, message: result.message }
}

async function runAiTaskWithProvider(task, provider) {
  if (provider.providerType === 'manual_only') return { ok: false, message: '手动导入供应商不能执行真实调用。' }
  if (provider.providerType === 'mimo_tts') {
    if (!['tts_audio', 'digital_human_video'].includes(task.taskType)) {
      return { ok: false, message: '小米语音供应商仅支持 TTS/数字人任务，不支持文本生成。' }
    }
    return synthesizeTtsForTask(task, provider)
  }
  if (!provider.apiKey) return { ok: false, message: '供应商未配置 API Key。' }
  const config = provider.configJson && typeof provider.configJson === 'object' ? provider.configJson : {}
  const resultMode = cleanText(config.resultMode || config.result_mode || 'sync', 40)
  if (resultMode !== 'sync') return { ok: false, message: '当前通用执行器只支持同步 OpenAI 兼容调用；异步轮询或回调供应商请先手动导入结果，或接入专用适配器。' }
  const timeoutSeconds = clamp(parsePositiveInt(config.timeoutSeconds || config.timeout_seconds, 45), 5, 600)
  const result = await callOpenAiCompatible(provider, [
    { role: 'system', content: task.prompt },
    { role: 'user', content: buildAiTaskUserMessage(task) },
  ], { maxTokens: 2000, timeoutSeconds })
  return result
}

function buildAiTaskUserMessage(task) {
  const inputJson = task.inputJson && typeof task.inputJson === 'object' ? task.inputJson : {}
  const lines = [
    `任务类型：${aiTaskTypeLabelForServer(task.taskType)}`,
    task.targetType ? `目标类型：${task.targetType}` : '',
    task.targetId ? `目标 ID：${task.targetId}` : '',
    inputJson.sourceMediaUrl ? `源媒体 URL：${inputJson.sourceMediaUrl}` : '',
    inputJson.sourceFileUrl ? `源文件 URL：${inputJson.sourceFileUrl}` : '',
    inputJson.mediaAssetId ? `媒体库 ID：${inputJson.mediaAssetId}` : '',
    inputJson.language ? `语言：${inputJson.language}` : '',
    inputJson.speakerName ? `讲述人/声音对象：${inputJson.speakerName}` : '',
    inputJson.expectedOutput ? `期望产物：${inputJson.expectedOutput}` : '',
    inputJson.outputFormat ? `输出格式：${inputJson.outputFormat}` : '',
    inputJson.authorizationFile ? `授权文件：${inputJson.authorizationFile}` : '',
    inputJson.notes ? `输入备注：${inputJson.notes}` : '',
    task.inputText ? `输入正文：\n${task.inputText}` : '',
  ].filter(Boolean)

  if (inputJson.segments?.length) {
    lines.push(`已有分段：\n${JSON.stringify(inputJson.segments, null, 2)}`)
  }
  if (inputJson.extra && Object.keys(inputJson.extra).length) {
    lines.push(`额外参数：\n${JSON.stringify(inputJson.extra, null, 2)}`)
  }
  return lines.join('\n\n')
}

async function callOpenAiCompatible(provider, messages, options = {}) {
  const endpoint = buildOpenAiCompatibleEndpoint(provider.baseUrl)
  if (!endpoint) return { ok: false, message: 'AI API 地址不正确。' }
  const controller = new AbortController()
  const timeoutSeconds = clamp(parsePositiveInt(options.timeoutSeconds, 45), 5, 600)
  const timeout = setTimeout(() => controller.abort(), timeoutSeconds * 1000)
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.defaultModel,
        messages,
        temperature: 0.2,
        max_tokens: options.maxTokens || 1000,
      }),
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      return { ok: false, message: cleanText(payload?.error?.message || `AI 调用失败：HTTP ${response.status}`, 1000) }
    }
    const text = cleanText(payload?.choices?.[0]?.message?.content || payload?.output_text || '', 100000)
    if (!text) return { ok: false, message: 'AI 返回结果为空。' }
    return { ok: true, text, raw: payload }
  } catch (error) {
    return { ok: false, message: error.name === 'AbortError' ? 'AI 调用超时。' : cleanText(error.message || 'AI 调用失败。', 1000) }
  } finally {
    clearTimeout(timeout)
  }
}

module.exports = { normalizeAiCapabilities, normalizeAiResultJson, validateAiTaskAgainstProvider, normalizeAiExternalJobInput, normalizeAiCallbackInput, normalizeAiCallbackStatus, normalizeAiResultMediaAsset, testAiProvider, runAiTaskWithProvider, buildAiTaskUserMessage, callOpenAiCompatible }
