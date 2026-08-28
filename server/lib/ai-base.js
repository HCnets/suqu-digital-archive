/**
 * 从 index.js 拆出的独立辅助函数
 */
const { safeJsonValue, cleanText } = require('./utils')

function publicAiProvider(provider) {
  if (!provider) return null
  const { apiKey, apiKeyEncrypted, ...publicProvider } = provider
  return publicProvider
}

function rowToAiTask(row) {
  return {
    id: row.id,
    taskType: row.task_type,
    targetType: row.target_type || '',
    targetId: row.target_id || '',
    providerId: row.provider_id || '',
    providerName: row.provider_name || '',
    prompt: row.prompt || '',
    inputText: row.input_text || '',
    inputJson: safeJsonValue(row.input_json) || null,
    externalJobId: row.external_job_id || '',
    providerStatus: row.provider_status || '',
    providerRequestJson: safeJsonValue(row.provider_request_json) || null,
    providerResponseJson: safeJsonValue(row.provider_response_json) || null,
    hasCallbackToken: Boolean(row.callback_token_hash),
    callbackReceivedAt: row.callback_received_at || null,
    status: row.status,
    resultText: row.result_text || '',
    resultJson: safeJsonValue(row.result_json) || null,
    errorMessage: row.error_message || '',
    createdBy: row.created_by || '',
    createdByUsername: row.created_by_username || '',
    updatedBy: row.updated_by || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at || null,
  }
}

function publicAiTask(task) {
  return task ? { ...task } : null
}

function hasMeaningfulAiTaskInput(input) {
  if (input?.error) return true
  if (!input || typeof input !== 'object') return false
  return Boolean(input.value?.sourceMediaUrl || input.value?.sourceFileUrl || input.value?.mediaAssetId || input.value?.notes)
}

function normalizeProviderPayload(value) {
  let source = value
  if (typeof source === 'string') {
    source = source.trim() ? safeJsonValue(source) : {}
    if (!source || typeof source !== 'object' || Array.isArray(source)) return { error: '供应商 JSON 数据格式不正确。' }
  }
  if (!source || typeof source !== 'object' || Array.isArray(source)) source = {}
  return { value: source }
}

function normalizeAiProviderStatus(value) {
  const status = cleanText(value || 'running', 80).toLowerCase()
  if (['submitted', 'queued', 'running', 'processing', 'completed', 'failed', 'cancelled'].includes(status)) return status
  return status || 'running'
}

function defaultAiApplyTargetField(task, content) {
  if (task.taskType === 'risk_hint') return 'risk_types'
  if (task.taskType === 'transcription') return content.moduleKey === 'oral_history' ? 'oral_transcription_workbench' : 'body'
  if (task.taskType === 'public_summary') return content.moduleKey === 'oral_history' ? 'ai_summary' : 'summary'
  if (task.taskType === 'narration_script') return 'narration_script'
  if (task.taskType === 'tts_audio') return 'tts_audio'
  if (task.taskType === 'digital_human_video') return 'digital_human_video'
  if (task.taskType === 'story_script') return 'body'
  return 'data_note'
}

function isSafeMediaResultUrl(value) {
  return value.startsWith('/uploads/') || value.startsWith('https://') || value.startsWith('http://')
}

function isSafeProviderEndpoint(value) {
  return value.startsWith('/api/') || value.startsWith('https://') || value.startsWith('http://')
}

function inferExtensionFromUrl(value, mediaType) {
  const clean = value.split('?')[0].split('#')[0]
  const match = clean.match(/\.([a-zA-Z0-9]+)$/)
  const ext = cleanText(match?.[1] || '', 12).toLowerCase()
  if (ext) return ext
  return mediaType === 'audio' ? 'mp3' : 'mp4'
}

function inferMimeType(extension, mediaType) {
  const audio = { mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', aac: 'audio/aac', ogg: 'audio/ogg', webm: 'audio/webm' }
  const video = { mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm' }
  return mediaType === 'audio' ? (audio[extension] || 'audio/mpeg') : (video[extension] || 'video/mp4')
}

function aiTaskTypeLabelForServer(taskType) {
  const labels = {
    transcription: '音视频转写',
    public_summary: '公开摘要',
    risk_hint: '风险提示',
    story_script: '故事稿',
    narration_script: '讲解稿',
    tts_audio: 'TTS讲解音频',
    digital_human_video: '数字人视频',
    keyword_extract: '关键词',
    timeline: '事件时间线',
  }
  return labels[taskType] || taskType || 'AI产物'
}

function buildOpenAiCompatibleEndpoint(baseUrl) {
  const url = cleanText(baseUrl || '', 500).replace(/\/+$/, '')
  if (!url) return ''
  if (/\/chat\/completions$/i.test(url)) return url
  return `${url}/chat/completions`
}

module.exports = { publicAiProvider, rowToAiTask, publicAiTask, hasMeaningfulAiTaskInput, normalizeProviderPayload, normalizeAiProviderStatus, defaultAiApplyTargetField, isSafeMediaResultUrl, isSafeProviderEndpoint, inferExtensionFromUrl, inferMimeType, aiTaskTypeLabelForServer, buildOpenAiCompatibleEndpoint }
