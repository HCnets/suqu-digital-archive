/**
 * 国内主流大模型供应商预设（OpenAI 兼容端点）
 * 用于后台创建 AI 供应商时一键填充（API 地址/默认模型/能力），避免手填出错。
 * 均可通过 callOpenAiCompatible（lib/ai-run.js）的 OpenAI 兼容协议直接调用。
 */

const LLM_TASK_TYPES = ['public_summary', 'risk_hint', 'story_script', 'narration_script', 'keyword_extract', 'timeline']

const LLM_PROVIDER_PRESETS = [
  {
    id: 'deepseek',
    name: 'DeepSeek（深度求索）',
    providerType: 'openai_compatible',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    taskTypes: LLM_TASK_TYPES,
    note: '国内合规 · OpenAI 兼容 · 文本生成/摘要/脚本',
    externalUrl: 'https://platform.deepseek.com',
  },
  {
    id: 'qwen',
    name: '通义千问（阿里云百炼）',
    providerType: 'openai_compatible',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    models: ['qwen-plus', 'qwen-max', 'qwen-turbo', 'qwen-long'],
    taskTypes: LLM_TASK_TYPES,
    note: '国内合规 · OpenAI 兼容 · 阿里云百炼',
    externalUrl: 'https://bailian.console.aliyun.com',
  },
  {
    id: 'zhipu',
    name: '智谱 GLM（BigModel）',
    providerType: 'openai_compatible',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
    models: ['glm-4-flash', 'glm-4-air', 'glm-4-plus', 'glm-4'],
    taskTypes: LLM_TASK_TYPES,
    note: '国内合规 · OpenAI 兼容 · 智谱开放平台',
    externalUrl: 'https://open.bigmodel.cn',
  },
  {
    id: 'moonshot',
    name: '月之暗面 Kimi',
    providerType: 'openai_compatible',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    taskTypes: LLM_TASK_TYPES,
    note: '国内合规 · OpenAI 兼容 · 长文本友好',
    externalUrl: 'https://platform.moonshot.cn',
  },
]

/** 返回全部预设（只读列表，供前端下拉） */
function listLlmProviderPresets() {
  return LLM_PROVIDER_PRESETS.map((p) => ({ ...p }))
}

/** 按 id 查预设，不存在返回 null */
function getLlmProviderPreset(id) {
  return LLM_PROVIDER_PRESETS.find((p) => p.id === id) || null
}

/**
 * 将预设转成可提交给 normalizeAiProviderInput 的草稿形状。
 * 返回 null 表示预设不存在；返回对象不含 API Key（由用户填写）。
 */
function presetToProviderDraft(id) {
  const p = getLlmProviderPreset(id)
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

module.exports = { listLlmProviderPresets, presetToProviderDraft }
