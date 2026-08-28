/**
 * 小米 MiMo TTS 语音克隆供应商适配器
 *
 * 支持小米官方语音合成 API（OpenAI 兼容 /chat/completions）：
 * - mimo-v2.5-tts              预置音色 + 唱歌
 * - mimo-v2.5-tts-voicedesign  文本描述设计音色
 * - mimo-v2.5-tts-voiceclone   音频样本复刻真人音色（语音克隆）
 *
 * 关键协议事实（已按官方文档核实）：
 * - Base URL: https://api.xiaomimimo.com/v1
 * - 鉴权头:   api-key: <KEY>（注意不是 Bearer）
 * - 合成文本必须放 role: assistant 消息；风格描述放 role: user（可选）
 * - 请求体:   { model, messages:[{user},{assistant}], audio:{ format:'wav', voice:'data:audio/mpeg;base64,<样本>' } }
 * - 返回:     choices[0].message.audio.data = base64 wav
 * - 克隆样本: data:audio/mpeg|mp3|wav;base64,...  ≤10MB
 * - 音频标签: 文本内可写 [笑] / (四川话) 等
 */
const fs = require('fs')
const path = require('path')
const { cleanText, clamp, parsePositiveInt, makeId } = require('./utils')

// 运行期注入（由 index.js 调用 init 传入）
let UPLOAD_DIR = ''
function init(deps) {
  UPLOAD_DIR = deps.UPLOAD_DIR
}

const MIMO_BASE_URL = 'https://api.xiaomimimo.com/v1'

/** 小米官方预置音色（mimo-v2.5-tts 预设模式可选） */
const MIMO_PRESET_VOICES = [
  { id: 'mimo_default', name: '默认音色' },
  { id: '冰糖', name: '冰糖（女声）' },
  { id: '茉莉', name: '茉莉（女声）' },
  { id: '苏打', name: '苏打' },
  { id: '白桦', name: '白桦' },
  { id: 'Mia', name: 'Mia' },
  { id: 'Chloe', name: 'Chloe' },
  { id: 'Milo', name: 'Milo' },
  { id: 'Dean', name: 'Dean' },
]

/** 小米语音合成任务类型（平台 AI 任务表中 TTS 相关） */
const MIMO_TASK_TYPES = ['tts_audio', 'digital_human_video']

/** 小米语音供应商预设（供后台一键套用） */
const MIMO_TTS_PROVIDER_PRESETS = [
  {
    id: 'xiaomi-mimo-tts',
    name: '小米 MiMo TTS（语音合成）',
    providerType: 'mimo_tts',
    baseUrl: MIMO_BASE_URL,
    defaultModel: 'mimo-v2.5-tts',
    models: ['mimo-v2.5-tts', 'mimo-v2.5-tts-voicedesign', 'mimo-v2.5-tts-voiceclone'],
    taskTypes: MIMO_TASK_TYPES,
    voices: MIMO_PRESET_VOICES,
    note: '小米官方语音合成 · 预置音色 / 音色设计 / 样本复刻',
    externalUrl: 'https://platform.xiaomimimo.com',
  },
]

/** 返回全部 TTS 供应商预设（只读，供前端下拉） */
function listTtsProviderPresets() {
  return MIMO_TTS_PROVIDER_PRESETS.map((p) => ({
    ...p,
    voices: p.voices.map((v) => ({ ...v })),
  }))
}

/** 按 id 查 TTS 供应商预设 */
function getTtsProviderPreset(id) {
  const p = MIMO_TTS_PROVIDER_PRESETS.find((item) => item.id === id)
  return p ? { ...p, voices: p.voices.map((v) => ({ ...v })) } : null
}

/** 将 TTS 预设转成可提交给 normalizeAiProviderInput 的草稿（不含 API Key） */
function presetToProviderDraft(id) {
  const p = getTtsProviderPreset(id)
  if (!p) return null
  return {
    name: p.name,
    providerType: p.providerType,
    baseUrl: p.baseUrl,
    defaultModel: p.defaultModel,
    supportedTaskTypes: p.taskTypes,
    note: p.note,
  }
}

/**
 * 真实调用小米 MiMo 语音合成。
 * @returns {{ok:boolean, audio?:Buffer, mimeType?:string, raw?:object, message?:string}}
 */
async function callMimoTts({ provider, mode, text, voice, voiceCloneAudio, stylePrompt, timeoutSeconds }) {
  const baseUrl = cleanText(provider.baseUrl || MIMO_BASE_URL, 500).replace(/\/+$/, '')
  const model =
    mode === 'voice_clone' ? 'mimo-v2.5-tts-voiceclone'
      : mode === 'voice_design' ? 'mimo-v2.5-tts-voicedesign'
        : cleanText(provider.defaultModel || 'mimo-v2.5-tts', 120)

  const messages = []
  if (stylePrompt) messages.push({ role: 'user', content: stylePrompt })
  messages.push({ role: 'assistant', content: text })

  const audio =
    mode === 'voice_clone'
      ? { format: 'wav', voice: voiceCloneAudio }
      : mode === 'voice_design'
        ? { format: 'wav' }
        : { format: 'wav', voice: voice || 'mimo_default' }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutSeconds * 1000)
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 小米官方鉴权头是 api-key（不是 Bearer）
        'api-key': provider.apiKey,
      },
      body: JSON.stringify({ model, messages, audio }),
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      return { ok: false, message: cleanText(payload?.error?.message || `小米语音调用失败：HTTP ${response.status}`, 1000) }
    }
    const audioData = payload?.choices?.[0]?.message?.audio?.data
    if (!audioData) return { ok: false, message: '小米语音返回缺少音频数据。' }
    const audioBuffer = Buffer.from(audioData, 'base64')
    if (!audioBuffer.length) return { ok: false, message: '小米语音返回音频为空。' }
    return { ok: true, audio: audioBuffer, mimeType: 'audio/wav', raw: payload }
  } catch (error) {
    return { ok: false, message: error.name === 'AbortError' ? '小米语音调用超时。' : cleanText(error.message || '小米语音调用失败。', 1000) }
  } finally {
    clearTimeout(timeout)
  }
}

/** 把音频 Buffer 落盘到 uploads/ai/tts/ 并返回 /uploads/ 相对 URL */
function saveTtsAudio(audioBuffer, ext = 'wav') {
  const relDir = 'ai/tts'
  const dir = path.join(UPLOAD_DIR, relDir)
  fs.mkdirSync(dir, { recursive: true })
  const filename = `${makeId('tts')}.${ext}`
  fs.writeFileSync(path.join(dir, filename), audioBuffer)
  return `/uploads/${relDir}/${filename}`.replace(/\\/g, '/')
}

/**
 * 编排一个 TTS 类 AI 任务的真实调用，返回与 runAiTaskWithProvider 一致的 { ok, text, raw }。
 *  - task.taskType ∈ { tts_audio, digital_human_video }
 *  - 克隆样本优先取 inputJson.voiceCloneAudio（data URI），否则走预置音色
 *  - 涉及真实声音（speakerName / 克隆样本）必须绑定授权文件（authorizationFile）
 */
async function synthesizeTtsForTask(task, provider) {
  if (!UPLOAD_DIR) return { ok: false, message: '语音合成模块尚未初始化（UPLOAD_DIR 未注入）。' }
  const config = provider.configJson && typeof provider.configJson === 'object' ? provider.configJson : {}
  const inputJson = task.inputJson && typeof task.inputJson === 'object' ? task.inputJson : {}

  const text = cleanText(task.inputText || inputJson.text || inputJson.content || '', 100000)
  if (!text) return { ok: false, message: 'TTS 任务缺少要朗读的文本（请填写输入正文 inputText）。' }

  const speakerName = cleanText(inputJson.speakerName || inputJson.speaker_name || '', 120)
  const authorizationFile = cleanText(inputJson.authorizationFile || inputJson.authorization_file || '', 1000)
  const voiceCloneAudio = cleanText(inputJson.voiceCloneAudio || inputJson.voice_clone_audio || inputJson.voiceSample || inputJson.voice_sample || '', 200000)
  const hasCloneSample = Boolean(voiceCloneAudio)

  // 授权红线：涉及具体真实声音（具名讲述人 / 克隆样本）必须绑定授权文件
  if ((speakerName || hasCloneSample) && !authorizationFile) {
    return { ok: false, message: '涉及真实声音对象的 TTS 任务必须绑定授权文件（authorizationFile）。' }
  }

  const mode = hasCloneSample ? 'voice_clone' : (config.mode === 'voice_design' ? 'voice_design' : 'preset')
  const voice = hasCloneSample ? '' : cleanText(inputJson.voice || config.voice || 'mimo_default', 120)
  const stylePrompt = cleanText(inputJson.stylePrompt || inputJson.style_prompt || config.stylePrompt || config.style_prompt || '', 2000)
  const timeoutSeconds = clamp(parsePositiveInt(config.timeoutSeconds || config.timeout_seconds, 120), 5, 600)

  const result = await callMimoTts({ provider, mode, text, voice, voiceCloneAudio, stylePrompt, timeoutSeconds })
  if (!result.ok) return { ok: false, message: result.message }

  const mediaUrl = saveTtsAudio(result.audio, 'wav')
  return {
    ok: true,
    text: `${speakerName ? `讲述人：${speakerName}。` : ''}${text}`.slice(0, 500),
    raw: {
      mediaUrl,
      mimeType: 'audio/wav',
      sizeBytes: result.audio.length,
      voice: speakerName || voice || '',
      mode,
      sourceText: text.slice(0, 500),
    },
  }
}

/** 小米语音连接测试（用预置音色合成一句极短文本） */
async function testMimoTts(provider) {
  if (!provider.apiKey) return { ok: false, message: '供应商未配置 API Key。' }
  const timeoutSeconds = clamp(parsePositiveInt(provider.configJson?.timeoutSeconds || provider.configJson?.timeout_seconds, 45), 5, 600)
  const result = await callMimoTts({
    provider,
    mode: 'preset',
    text: '连接测试',
    voice: 'mimo_default',
    timeoutSeconds,
  })
  return result.ok ? { ok: true, message: '小米语音连接测试成功（已合成测试音频）。' } : { ok: false, message: result.message }
}

module.exports = {
  init,
  listTtsProviderPresets,
  presetToProviderDraft,
  callMimoTts,
  saveTtsAudio,
  synthesizeTtsForTask,
  testMimoTts,
}
