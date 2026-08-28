/**
 * 后台通用组件（从 App.tsx 拆分）
 */
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type {  ManagedContent, AiProvider, AiTask, RiskTagTemplate, AiCallLog, Api } from '../types'
import {  AI_PROVIDER_TASK_TYPE_OPTIONS, AI_PROVIDER_OUTPUT_FORMAT_OPTIONS, AI_PROVIDER_INPUT_EXTENSION_OPTIONS, AI_PROVIDER_CAPABILITY_OPTIONS, AI_TARGET_TYPE_OPTIONS, AI_PROVIDER_TYPE_OPTIONS, AI_RESULT_MODE_OPTIONS, RISK_LEVEL_OPTIONS } from '../constants'
import {  normalizeCsvTokens, aiTaskTypeLabel, aiProviderTypeLabel, aiTargetTypeLabel, riskLevelLabel, aiTaskStatusLabel, aiProviderTestStatusLabel, aiCallStatusLabel, aiLogActionLabel, formatTime } from '../utils'
import { uploadMediaAsset } from './panels'
import { Input, CheckboxPillGroup, InlineChoiceField, DataTable } from './fields'
import { OptionCardSelect, ProviderBindingSelect, ContentBindingSelect } from './bindings'
import { MediaPickerField } from './media'
import { JsonRowsEditor, AiResultJsonEditor } from './editors'

/** 大模型供应商预设（来自 GET /admin/ai/provider-presets；小米语音预设复用此结构） */
interface LlmProviderPreset {
  id: string
  name: string
  providerType: string
  baseUrl: string
  defaultModel: string
  models: string[]
  taskTypes: string[]
  note: string
  externalUrl: string
  voices?: { id: string; name: string }[]
}

export function normalizeAiProviderConfig(config: Record<string, unknown> | null | undefined) {
  const source = config || {}
  const supportedTaskTypes = Array.isArray(source.supportedTaskTypes)
    ? source.supportedTaskTypes
    : Array.isArray(source.supported_task_types)
      ? source.supported_task_types
      : []
  const outputFormats = Array.isArray(source.outputFormats)
    ? source.outputFormats
    : Array.isArray(source.output_formats)
      ? source.output_formats
      : []
  const acceptedInputExtensions = Array.isArray(source.acceptedInputExtensions)
    ? source.acceptedInputExtensions
    : Array.isArray(source.accepted_input_extensions)
      ? source.accepted_input_extensions
      : []
  const resultMode = typeof source.resultMode === 'string'
    ? source.resultMode
    : typeof source.result_mode === 'string'
      ? source.result_mode
      : 'sync'
  return {
    supportedTaskTypes: supportedTaskTypes.map(item => String(item)),
    outputFormats: outputFormats.map(item => String(item)),
    acceptedInputExtensions: acceptedInputExtensions.map(item => String(item)),
    fileInputEnabled: source.fileInputEnabled !== false && source.file_input_enabled !== false,
    resultMode,
  }
}

export function AiCenterPage({ api }: { api: Api }) {
  const emptyProviderForm = {
    name: '',
    providerType: 'openai_compatible',
    baseUrl: '',
    defaultModel: '',
    apiKey: '',
    capabilities: ['大模型', '语音转写', 'TTS'],
    customCapabilities: '',
    supportedTaskTypes: ['transcription', 'public_summary', 'risk_hint', 'story_script', 'narration_script', 'tts_audio'],
    outputFormats: ['json', 'txt', 'mp3'],
    acceptedInputExtensions: ['mp3', 'wav', 'm4a', 'mp4', 'mov', 'webm'],
    customOutputFormats: '',
    customAcceptedInputExtensions: '',
    fileInputEnabled: true,
    resultMode: 'sync',
    configJson: '',
    isEnabled: true,
  }
  const emptyTaskForm = {
    taskType: 'public_summary',
    targetType: 'oral_history',
    targetId: '',
    providerId: '',
    prompt: '请基于输入内容生成可供编辑审核的公开摘要，避免新增未经证实的信息。',
    inputText: '',
    sourceMediaUrl: '',
    sourceFileUrl: '',
    expectedOutput: '',
    outputFormat: '',
    language: 'zh-CN',
    speakerName: '',
    authorizationFile: '',
    transcriptionSegmentsJson: '',
    diarizationEnabled: false,
    inputJson: '',
  }
  const emptyRiskTagForm: { label: string; level: RiskTagTemplate['level']; category: string; description: string; sortOrder: string; isActive: boolean } = { label: '', level: 'high', category: '', description: '', sortOrder: '100', isActive: true }
  const [providers, setProviders] = useState<AiProvider[]>([])
  const [providerPresets, setProviderPresets] = useState<LlmProviderPreset[]>([])
  const [ttsProviderPresets, setTtsProviderPresets] = useState<LlmProviderPreset[]>([])
  const [presetId, setPresetId] = useState('')
  const [ttsPresetId, setTtsPresetId] = useState('')
  const [tasks, setTasks] = useState<AiTask[]>([])
  const [logs, setLogs] = useState<AiCallLog[]>([])
  const [riskTags, setRiskTags] = useState<RiskTagTemplate[]>([])
  const [targetContents, setTargetContents] = useState<ManagedContent[]>([])
  const [providerForm, setProviderForm] = useState(emptyProviderForm)
  const [editingProviderId, setEditingProviderId] = useState('')
  const [taskForm, setTaskForm] = useState(emptyTaskForm)
  const [riskTagForm, setRiskTagForm] = useState(emptyRiskTagForm)
  const [editingRiskTagId, setEditingRiskTagId] = useState('')
  const [manualResults, setManualResults] = useState<Record<string, string>>({})
  const [manualResultJsons, setManualResultJsons] = useState<Record<string, string>>({})
  const [applyTargets, setApplyTargets] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState('')
  const [aiUploadBusy, setAiUploadBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    const [providerRows, presetRows, ttsPresetRows, taskPayload, logPayload, riskTagRows, contentPayload] = await Promise.all([
      api<AiProvider[]>('/admin/ai/providers'),
      api<{ presets: LlmProviderPreset[] }>('/admin/ai/provider-presets').catch(() => ({ presets: [] })),
      api<{ presets: LlmProviderPreset[] }>('/admin/ai/tts-providers').catch(() => ({ presets: [] })),
      api<{ items: AiTask[] }>('/admin/ai/tasks?pageSize=100'),
      api<{ items: AiCallLog[] }>('/admin/ai/call-logs?pageSize=80'),
      api<RiskTagTemplate[]>('/admin/risk-tags?includeInactive=true'),
      api<{ items: ManagedContent[] }>('/admin/contents?pageSize=200'),
    ])
    setProviders(providerRows)
    setProviderPresets(presetRows.presets || [])
    setTtsProviderPresets(ttsPresetRows.presets || [])
    setTasks(taskPayload.items)
    setLogs(logPayload.items)
    setRiskTags(riskTagRows)
    setTargetContents(contentPayload.items.filter(item => item.status !== 'deleted'))
  }, [api])

  useEffect(() => {
    load().catch(err => setError(err instanceof Error ? err.message : '加载失败'))
  }, [load])

  const saveProvider = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy('provider')
    try {
      const supportedTaskTypes = Array.from(new Set(providerForm.supportedTaskTypes))
      const outputFormats = Array.from(new Set([
        ...providerForm.outputFormats,
        ...normalizeCsvTokens(providerForm.customOutputFormats),
      ]))
      const acceptedInputExtensions = Array.from(new Set([
        ...providerForm.acceptedInputExtensions,
        ...normalizeCsvTokens(providerForm.customAcceptedInputExtensions),
      ]))
      const configJson = {
        supportedTaskTypes,
        fileInputEnabled: providerForm.fileInputEnabled,
        acceptedInputExtensions,
        outputFormats,
        resultMode: providerForm.resultMode,
      }
      const payload = {
        ...providerForm,
        capabilities: Array.from(new Set([
          ...providerForm.capabilities,
          ...normalizeCsvTokens(providerForm.customCapabilities),
        ])),
        configJson: JSON.stringify(configJson, null, 2),
      }
      if (editingProviderId) {
        await api<AiProvider>(`/admin/ai/providers/${editingProviderId}`, { method: 'PUT', body: JSON.stringify(payload) })
        setNotice('AI 服务已更新，服务凭据不会在后台明文显示。')
      } else {
        await api<AiProvider>('/admin/ai/providers', { method: 'POST', body: JSON.stringify(payload) })
        setNotice('AI 服务已创建。')
      }
      setProviderForm(emptyProviderForm)
      setEditingProviderId('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setBusy('')
    }
  }

  const applyPreset = async (nextPresetId: string) => {
    setPresetId(nextPresetId)
    if (!nextPresetId) {
      setProviderForm(prev => ({ ...prev, name: '', providerType: 'openai_compatible', baseUrl: '', defaultModel: '' }))
      return
    }
    try {
      const draft = await api<{ name: string; providerType: string; baseUrl: string; defaultModel: string; supportedTaskTypes: string[]; note: string }>(
        `/admin/ai/provider-presets/${nextPresetId}/draft`,
        { method: 'POST' },
      )
      setProviderForm(prev => ({
        ...prev,
        name: draft.name,
        providerType: draft.providerType,
        baseUrl: draft.baseUrl,
        defaultModel: draft.defaultModel,
        supportedTaskTypes: draft.supportedTaskTypes,
      }))
      setNotice(`已套用预设：${draft.name}。请填写服务凭据后保存。`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '套用预设失败')
    }
  }

  const applyTtsPreset = async (nextPresetId: string) => {
    setTtsPresetId(nextPresetId)
    if (!nextPresetId) {
      setProviderForm(prev => ({ ...prev, name: '', providerType: 'openai_compatible', baseUrl: '', defaultModel: '' }))
      return
    }
    try {
      const draft = await api<{ name: string; providerType: string; baseUrl: string; defaultModel: string; supportedTaskTypes: string[]; note: string }>(
        `/admin/ai/tts-providers/${nextPresetId}/draft`,
        { method: 'POST' },
      )
      setProviderForm(prev => ({
        ...prev,
        name: draft.name,
        providerType: draft.providerType,
        baseUrl: draft.baseUrl,
        defaultModel: draft.defaultModel,
        supportedTaskTypes: draft.supportedTaskTypes,
      }))
      setNotice(`已套用语音预设：${draft.name}。请填写小米服务凭据后保存。`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '套用语音预设失败')
    }
  }

  const editProvider = (provider: AiProvider) => {
    const normalizedConfig = normalizeAiProviderConfig(provider.configJson)
    const knownOutputFormats = new Set<string>(AI_PROVIDER_OUTPUT_FORMAT_OPTIONS.map(item => item.value))
    const knownInputExtensions = new Set<string>(AI_PROVIDER_INPUT_EXTENSION_OPTIONS.map(item => item.value))
    setEditingProviderId(provider.id)
    setProviderForm({
      name: provider.name,
      providerType: provider.providerType,
      baseUrl: provider.baseUrl,
      defaultModel: provider.defaultModel,
      apiKey: '',
      capabilities: provider.capabilities.filter(item => AI_PROVIDER_CAPABILITY_OPTIONS.some(option => option.value === item)),
      customCapabilities: provider.capabilities.filter(item => !AI_PROVIDER_CAPABILITY_OPTIONS.some(option => option.value === item)).join(','),
      supportedTaskTypes: normalizedConfig.supportedTaskTypes,
      outputFormats: normalizedConfig.outputFormats.filter(item => knownOutputFormats.has(item)),
      acceptedInputExtensions: normalizedConfig.acceptedInputExtensions.filter(item => knownInputExtensions.has(item)),
      customOutputFormats: normalizedConfig.outputFormats.filter(item => !knownOutputFormats.has(item)).join(','),
      customAcceptedInputExtensions: normalizedConfig.acceptedInputExtensions.filter(item => !knownInputExtensions.has(item)).join(','),
      fileInputEnabled: normalizedConfig.fileInputEnabled,
      resultMode: normalizedConfig.resultMode,
      configJson: provider.configJson ? JSON.stringify(provider.configJson, null, 2) : '',
      isEnabled: provider.isEnabled,
    })
  }

  const saveRiskTag = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy('risk-tag')
    try {
      const payload = {
        ...riskTagForm,
        sortOrder: Number(riskTagForm.sortOrder || 0),
      }
      if (editingRiskTagId) {
        await api<RiskTagTemplate>(`/admin/risk-tags/${editingRiskTagId}`, { method: 'PUT', body: JSON.stringify(payload) })
        setNotice('风险标签已更新。')
      } else {
        await api<RiskTagTemplate>('/admin/risk-tags', { method: 'POST', body: JSON.stringify(payload) })
        setNotice('风险标签已创建。')
      }
      setRiskTagForm(emptyRiskTagForm)
      setEditingRiskTagId('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存风险标签失败')
    } finally {
      setBusy('')
    }
  }

  const editRiskTag = (tag: RiskTagTemplate) => {
    setEditingRiskTagId(tag.id)
    setRiskTagForm({
      label: tag.label,
      level: tag.level,
      category: tag.category,
      description: tag.description,
      sortOrder: String(tag.sortOrder),
      isActive: tag.isActive,
    })
  }

  const deleteRiskTag = async (tag: RiskTagTemplate) => {
    setError('')
    setNotice('')
    setBusy(`risk-delete:${tag.id}`)
    try {
      await api<void>(`/admin/risk-tags/${tag.id}`, { method: 'DELETE' })
      setNotice('风险标签已删除。')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除风险标签失败')
    } finally {
      setBusy('')
    }
  }

  const testProvider = async (id: string) => {
    setError('')
    setNotice('')
    setBusy(`test:${id}`)
    try {
      const result = await api<{ ok: boolean; message: string; durationMs: number }>(`/admin/ai/providers/${id}/test`, { method: 'POST' })
      setNotice(`${result.ok ? '连接成功' : '连接失败'}：${result.message}`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '测试失败')
    } finally {
      setBusy('')
    }
  }

  const createTask = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy('task')
    try {
      const extraInput = taskForm.inputJson.trim() ? JSON.parse(taskForm.inputJson) : {}
      const transcriptionSegments = taskForm.transcriptionSegmentsJson.trim() ? JSON.parse(taskForm.transcriptionSegmentsJson) : []
      await api<AiTask>('/admin/ai/tasks', {
        method: 'POST',
        body: JSON.stringify({
          taskType: taskForm.taskType,
          targetType: taskForm.targetType,
          targetId: taskForm.targetId,
          providerId: taskForm.providerId,
          prompt: taskForm.prompt,
          inputText: taskForm.inputText,
          inputJson: {
            ...extraInput,
            sourceMediaUrl: taskForm.sourceMediaUrl,
            sourceFileUrl: taskForm.sourceFileUrl,
            expectedOutput: taskForm.expectedOutput,
            outputFormat: taskForm.outputFormat,
            language: taskForm.language,
            speakerName: taskForm.speakerName,
            authorizationFile: taskForm.authorizationFile,
            diarization: taskForm.diarizationEnabled,
            segments: transcriptionSegments,
          },
        }),
      })
      setTaskForm(emptyTaskForm)
      setNotice('AI 任务已创建，结果不会自动发布。')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建任务失败')
    } finally {
      setBusy('')
    }
  }

  const uploadAiInputAsset = async (file: File | null) => {
    if (!file) return
    setError('')
    setNotice('')
    setAiUploadBusy('input')
    try {
      const asset = await uploadMediaAsset(api, file, 'AI 任务输入素材', 'AI 任务输入素材')
      setTaskForm(current => ({
        ...current,
        sourceMediaUrl: asset.url,
        inputText: current.inputText || asset.url,
      }))
      setNotice('输入素材已上传到媒体库，并已填入源媒体。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传输入素材失败')
    } finally {
      setAiUploadBusy('')
    }
  }

  const runTask = async (id: string) => {
    setError('')
    setNotice('')
    setBusy(`run:${id}`)
    try {
      await api<AiTask>(`/admin/ai/tasks/${id}/run`, { method: 'POST' })
      setNotice('AI 任务已完成调用，结果仍需人工审校并进入内容审核。')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '运行任务失败')
      await load().catch(() => undefined)
    } finally {
      setBusy('')
    }
  }

  const importResult = async (id: string) => {
    const resultText = manualResults[id] || ''
    const resultJsonText = manualResultJsons[id] || ''
    setError('')
    setNotice('')
    if (!resultText.trim()) {
      setError('请先填写要补录的结果。')
      return
    }
    setBusy(`import:${id}`)
    try {
      const payload: { resultText: string; resultJson?: unknown } = { resultText }
      if (resultJsonText.trim()) payload.resultJson = JSON.parse(resultJsonText)
      await api<AiTask>(`/admin/ai/tasks/${id}/import-result`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setManualResults(current => ({ ...current, [id]: '' }))
      setManualResultJsons(current => ({ ...current, [id]: '' }))
      setNotice('AI 结果已补录到任务中心，尚未发布。')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '补录失败')
    } finally {
      setBusy('')
    }
  }

  const applyTaskResult = async (task: AiTask, submitForReview: boolean) => {
    const targetField = applyTargets[task.id] || defaultAiApplyTargetField(task)
    setError('')
    setNotice('')
    setBusy(`${submitForReview ? 'apply-submit' : 'apply'}:${task.id}`)
    try {
      await api<{ content: ManagedContent; task: AiTask }>(`/admin/ai/tasks/${task.id}/apply-result`, {
        method: 'POST',
        body: JSON.stringify({ targetField, submitForReview }),
      })
      setNotice(submitForReview ? 'AI 结果已应用为内容版本，并已提交审核。' : 'AI 结果已应用为内容草稿，尚未公开。')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '应用 AI 结果失败')
    } finally {
      setBusy('')
    }
  }

  return (
    <section className="panel ai-panel">
      <div className="panel-head">
        <div>
          <h2>AI 中心</h2>
          <p>{providers.length} 个供应商，{tasks.length} 个任务，AI 结果只能应用为草稿或提交审核，不会直接公开。</p>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {notice && <div className="success">{notice}</div>}

      <div className="ai-layout">
        <form className="ai-card" onSubmit={saveProvider}>
          <h3>{editingProviderId ? '编辑 AI 服务' : '新增 AI 服务'}</h3>
          {!editingProviderId && providerPresets.length > 0 && (
            <OptionCardSelect
              label="快速套用大模型预设（可选）"
              value={presetId}
              options={[
                { value: '', label: '不套用，手动填写' },
                ...providerPresets.map(preset => ({ value: preset.id, label: preset.name })),
              ]}
              onChange={applyPreset}
            />
          )}
          {!editingProviderId && presetId && (
            <p className="form-hint">{providerPresets.find(preset => preset.id === presetId)?.note || '已套用预设'} · 服务凭据需自行填写。</p>
          )}
          {!editingProviderId && ttsProviderPresets.length > 0 && (
            <OptionCardSelect
              label="快速套用小米语音预设（可选，语音克隆）"
              value={ttsPresetId}
              options={[
                { value: '', label: '不套用，手动填写' },
                ...ttsProviderPresets.map(preset => ({ value: preset.id, label: preset.name })),
              ]}
              onChange={applyTtsPreset}
            />
          )}
          {!editingProviderId && ttsPresetId && (
            <p className="form-hint">{ttsProviderPresets.find(preset => preset.id === ttsPresetId)?.note || '已套用语音预设'} · 请填写小米服务凭据后保存。</p>
          )}
          <Input label="供应商名称" value={providerForm.name} onChange={name => setProviderForm({ ...providerForm, name })} />
          <OptionCardSelect
            label="供应商类型"
            value={providerForm.providerType}
            options={AI_PROVIDER_TYPE_OPTIONS}
            onChange={providerType => setProviderForm({ ...providerForm, providerType })}
          />
          <details className="wide-field json-raw-details" open={providerForm.providerType !== 'manual_only'}>
            <summary>服务接入信息（运维人员填写）</summary>
            <div className="advanced-raw-grid">
              <Input label="接入地址" value={providerForm.baseUrl} placeholder="例如：https://服务商地址/v1" onChange={baseUrl => setProviderForm({ ...providerForm, baseUrl })} />
              <Input label="默认模型名称" value={providerForm.defaultModel} onChange={defaultModel => setProviderForm({ ...providerForm, defaultModel })} />
              <Input label={editingProviderId ? '服务凭据（留空保持原值）' : '服务凭据'} value={providerForm.apiKey} onChange={apiKey => setProviderForm({ ...providerForm, apiKey })} />
            </div>
            <p className="form-hint">选择“人工补录”时可不填写；接入真实服务时由运维人员填写，服务凭据保存后不会明文显示。</p>
          </details>
          <label className="check-row">
            <input
              type="checkbox"
              checked={providerForm.isEnabled}
              onChange={event => setProviderForm({ ...providerForm, isEnabled: event.target.checked })}
            />
            <span>启用供应商</span>
          </label>
          <CheckboxPillGroup
            label="能力类型"
            hint="勾选这个供应商支持的主要能力，便于后续选择任务。"
            options={AI_PROVIDER_CAPABILITY_OPTIONS.map(item => ({ value: item.value, label: item.label }))}
            value={providerForm.capabilities}
            onChange={capabilities => setProviderForm({ ...providerForm, capabilities })}
          />
          <Input
            label="补充能力"
            value={providerForm.customCapabilities}
            placeholder="例如：图片理解, OCR"
            onChange={customCapabilities => setProviderForm({ ...providerForm, customCapabilities })}
          />
          <CheckboxPillGroup
            label="支持的任务类型"
            hint="勾选这个供应商允许处理的任务。"
            options={AI_PROVIDER_TASK_TYPE_OPTIONS.map(item => ({ value: item.value, label: item.label }))}
            value={providerForm.supportedTaskTypes}
            onChange={supportedTaskTypes => setProviderForm({ ...providerForm, supportedTaskTypes })}
          />
          <label className="check-row">
            <input
              type="checkbox"
              checked={providerForm.fileInputEnabled}
              onChange={event => setProviderForm({ ...providerForm, fileInputEnabled: event.target.checked })}
            />
            <span>允许上传音频、视频、图片或 PDF 作为任务输入</span>
          </label>
          <CheckboxPillGroup
            label="支持的产物格式"
            hint="常用产物可直接勾选，其他格式可在下方补充。"
            options={AI_PROVIDER_OUTPUT_FORMAT_OPTIONS.map(item => ({ value: item.value, label: item.label }))}
            value={providerForm.outputFormats}
            onChange={outputFormats => setProviderForm({ ...providerForm, outputFormats })}
          />
          <Input
            label="补充产物格式"
            value={providerForm.customOutputFormats}
            placeholder="例如：docx, ass"
            onChange={customOutputFormats => setProviderForm({ ...providerForm, customOutputFormats })}
          />
          <CheckboxPillGroup
            label="允许上传的文件格式"
            hint="用于限制任务输入文件扩展名。"
            options={AI_PROVIDER_INPUT_EXTENSION_OPTIONS.map(item => ({ value: item.value, label: item.label }))}
            value={providerForm.acceptedInputExtensions}
            onChange={acceptedInputExtensions => setProviderForm({ ...providerForm, acceptedInputExtensions })}
          />
          <Input
            label="补充文件格式"
            value={providerForm.customAcceptedInputExtensions}
            placeholder="例如：flac, avi"
            onChange={customAcceptedInputExtensions => setProviderForm({ ...providerForm, customAcceptedInputExtensions })}
          />
          <OptionCardSelect
            label="结果返回方式"
            value={providerForm.resultMode}
            options={AI_RESULT_MODE_OPTIONS}
            onChange={resultMode => setProviderForm({ ...providerForm, resultMode })}
          />
          <details className="wide-field json-raw-details">
            <summary>服务能力摘要（仅运维人员）</summary>
            {(() => {
              const readableConfig = buildReadableProviderConfig(providerForm)
              return (
                <div className="json-rows-list">
                  <article className="json-row-card">
                    <div className="json-row-card-head">
                      <span>当前服务能力</span>
                    </div>
                    <div className="json-row-fields">
                      <label>
                        <span>支持任务</span>
                        <input value={readableConfig.taskTypes} readOnly />
                      </label>
                      <label>
                        <span>输入方式</span>
                        <input value={readableConfig.inputMode} readOnly />
                      </label>
                      <label>
                        <span>允许文件格式</span>
                        <input value={readableConfig.acceptedFormats} readOnly />
                      </label>
                      <label>
                        <span>产物格式</span>
                        <input value={readableConfig.outputFormats} readOnly />
                      </label>
                      <label>
                        <span>结果返回方式</span>
                        <input value={readableConfig.resultMode} readOnly />
                      </label>
                    </div>
                  </article>
                </div>
              )
            })()}
          </details>
          <div className="actions-cell">
            <button disabled={busy === 'provider'}>{busy === 'provider' ? '保存中...' : '保存 AI 服务'}</button>
            {editingProviderId && <button type="button" className="secondary" onClick={() => { setEditingProviderId(''); setProviderForm(emptyProviderForm) }}>取消编辑</button>}
          </div>
        </form>

        <form className="ai-card" onSubmit={createTask}>
          <h3>创建 AI 任务</h3>
          <OptionCardSelect
            label="任务类型"
            value={taskForm.taskType}
            options={AI_TASK_TYPE_CHOICE_OPTIONS}
            onChange={taskType => setTaskForm({ ...taskForm, taskType })}
          />
          <ProviderBindingSelect
            value={taskForm.providerId}
            providers={providers}
            onChange={providerId => setTaskForm({ ...taskForm, providerId })}
          />
          <OptionCardSelect
            label="目标类型"
            value={taskForm.targetType}
            options={AI_TARGET_TYPE_CHOICE_OPTIONS}
            onChange={targetType => setTaskForm({ ...taskForm, targetType, targetId: '' })}
          />
          <ContentBindingSelect
            label="目标内容"
            value={taskForm.targetId}
            options={
              taskForm.targetType === 'oral_history'
                ? targetContents.filter(item => item.moduleKey === 'oral_history')
                : taskForm.targetType === 'archive'
                  ? targetContents.filter(item => item.moduleKey === 'archive')
                  : targetContents
            }
            onChange={targetId => setTaskForm({ ...taskForm, targetId })}
          />
          <MediaPickerField
            api={api}
            label="源媒体"
            value={taskForm.sourceMediaUrl}
            onChange={sourceMediaUrl => setTaskForm({ ...taskForm, sourceMediaUrl })}
            mediaTypes={['audio', 'video', 'image', 'document']}
            canUseLibrary
            pickerTitle="选择 AI 任务源媒体"
          />
          <MediaPickerField
            api={api}
            label="源文件"
            value={taskForm.sourceFileUrl}
            onChange={sourceFileUrl => setTaskForm({ ...taskForm, sourceFileUrl })}
            mediaTypes={['document', 'audio', 'video']}
            canUseLibrary
            pickerTitle="选择 AI 任务源文件"
          />
          <label>
            <span>上传输入素材</span>
            <input
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/mp4,audio/m4a,audio/x-m4a,audio/aac,audio/webm,video/mp4,video/quicktime,video/webm,application/pdf,image/png,image/jpeg,image/webp"
              disabled={aiUploadBusy === 'input'}
              onChange={event => {
                const selectedFile = event.target.files?.[0] || null
                void uploadAiInputAsset(selectedFile)
                event.currentTarget.value = ''
              }}
            />
          </label>
          <Input label="期望产物" value={taskForm.expectedOutput} placeholder="例如：逐字稿、MP3 讲解音频、数字人视频" onChange={expectedOutput => setTaskForm({ ...taskForm, expectedOutput })} />
          <Input label="产物格式" value={taskForm.outputFormat} placeholder="例如：文字稿、音频、视频、字幕" onChange={outputFormat => setTaskForm({ ...taskForm, outputFormat })} />
          <Input label="语言" value={taskForm.language} onChange={language => setTaskForm({ ...taskForm, language })} />
          <Input label="讲述人 / 声音对象" value={taskForm.speakerName} onChange={speakerName => setTaskForm({ ...taskForm, speakerName })} />
          <MediaPickerField
            api={api}
            label="授权文件"
            value={taskForm.authorizationFile}
            onChange={authorizationFile => setTaskForm({ ...taskForm, authorizationFile })}
            mediaTypes={['document', 'image']}
            canUseLibrary
            pickerTitle="选择授权文件"
          />
          <label>
            <span>提示词</span>
            <textarea value={taskForm.prompt} onChange={event => setTaskForm({ ...taskForm, prompt: event.target.value })} />
          </label>
          <label>
            <span>输入内容</span>
            <textarea value={taskForm.inputText} onChange={event => setTaskForm({ ...taskForm, inputText: event.target.value })} />
          </label>
          {taskForm.taskType === 'transcription' && (
            <>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={taskForm.diarizationEnabled}
                  onChange={event => setTaskForm({ ...taskForm, diarizationEnabled: event.target.checked })}
                />
                <span>启用多人说话人区分</span>
              </label>
              <JsonRowsEditor
                title="转写分段提示"
                hint="可选。用于提前告诉 AI 某些时间段是谁在说话，便于采访转写更准确。"
                value={taskForm.transcriptionSegmentsJson}
                onChange={transcriptionSegmentsJson => setTaskForm({ ...taskForm, transcriptionSegmentsJson })}
                newItem={{ start: 0, end: 30, speaker: '' }}
                fields={[
                  { key: 'start', label: '开始秒数', type: 'number', placeholder: '0' },
                  { key: 'end', label: '结束秒数', type: 'number', placeholder: '30' },
                  { key: 'speaker', label: '说话人', placeholder: '老党员本人 / 采访者' },
                ]}
              />
            </>
          )}
          <details className="wide-field json-raw-details">
            <summary>补充输入信息（仅运维人员）</summary>
            <textarea
              value={taskForm.inputJson}
              placeholder="一般不用填写。仅在运维人员需要补充任务参数时使用。"
              onChange={event => setTaskForm({ ...taskForm, inputJson: event.target.value })}
            />
          </details>
          <details className="wide-field json-raw-details">
            <summary>关联内容补充（仅管理员）</summary>
            <div className="inline-form">
              <Input label="内容类型补充" value={taskForm.targetType} onChange={targetType => setTaskForm({ ...taskForm, targetType })} />
              <Input label="内容记录" value={taskForm.targetId} onChange={targetId => setTaskForm({ ...taskForm, targetId })} />
            </div>
          </details>
          <button disabled={busy === 'task'}>{busy === 'task' ? '创建中...' : '创建任务'}</button>
        </form>
      </div>

      <section className="ai-section risk-template-panel">
        <div className="section-head">
          <div>
            <h3>风险标签字典</h3>
            <p>用于统一审核风险标签的等级、分类和说明；内容命中同名标签时，会按这里的规则进入审核风险信号。</p>
          </div>
        </div>
        <form className="inline-form risk-tag-form" onSubmit={saveRiskTag}>
          <Input label="标签名称" value={riskTagForm.label} onChange={label => setRiskTagForm({ ...riskTagForm, label })} />
          <OptionCardSelect
            label="风险等级"
            value={riskTagForm.level}
            options={RISK_LEVEL_OPTIONS}
            onChange={level => setRiskTagForm({ ...riskTagForm, level: level as RiskTagTemplate['level'] })}
          />
          <Input label="分类" value={riskTagForm.category} onChange={category => setRiskTagForm({ ...riskTagForm, category })} />
          <Input label="排序" type="number" value={riskTagForm.sortOrder} onChange={sortOrder => setRiskTagForm({ ...riskTagForm, sortOrder })} />
          <label className="check-row">
            <input type="checkbox" checked={riskTagForm.isActive} onChange={event => setRiskTagForm({ ...riskTagForm, isActive: event.target.checked })} />
            <span>启用</span>
          </label>
          <label className="wide-field">
            <span>说明</span>
            <textarea value={riskTagForm.description} onChange={event => setRiskTagForm({ ...riskTagForm, description: event.target.value })} />
          </label>
          <button disabled={busy === 'risk-tag'}>{busy === 'risk-tag' ? '保存中...' : editingRiskTagId ? '保存标签' : '新增标签'}</button>
          {editingRiskTagId && <button type="button" className="secondary" onClick={() => { setEditingRiskTagId(''); setRiskTagForm(emptyRiskTagForm) }}>取消编辑</button>}
        </form>
        <div className="table-wrap">
          <table>
            <thead><tr><th>标签</th><th>等级</th><th>分类</th><th>状态</th><th>说明</th><th>操作</th></tr></thead>
            <tbody>
              {riskTags.map(tag => (
                <tr key={tag.id}>
                  <td><strong>{tag.label}</strong><small className="muted-line">{tag.id}</small></td>
                  <td>{riskLevelLabel(tag.level)}</td>
                  <td>{tag.category || '-'}</td>
                  <td>{tag.isActive ? '启用' : '停用'}</td>
                  <td>{tag.description || '-'}</td>
                  <td className="actions-cell">
                    <button type="button" className="secondary" onClick={() => editRiskTag(tag)}>编辑</button>
                    <button type="button" className="secondary" disabled={busy === `risk-delete:${tag.id}`} onClick={() => deleteRiskTag(tag)}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ai-section">
        <h3>AI 服务</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>名称</th><th>类型</th><th>模型</th><th>能力</th><th>任务说明</th><th>状态</th><th>服务测试</th><th>操作</th></tr></thead>
            <tbody>
              {providers.map(provider => (
                <tr key={provider.id}>
                  <td><strong>{provider.name}</strong><small className="muted-line">{provider.isEnabled ? '可用于创建任务' : '当前停用'}</small></td>
                  <td>{aiProviderTypeLabel(provider.providerType)}</td>
                  <td>{provider.defaultModel || '-'}</td>
                  <td>{provider.capabilities.join('、') || '-'}</td>
                  <td>{aiProviderConfigSummary(provider)}</td>
                  <td>{provider.isEnabled ? '启用' : '停用'} · {provider.hasApiKey ? '已保存服务凭据' : '未保存服务凭据'}</td>
                  <td>{aiProviderTestStatusLabel(provider.lastTestStatus)}<small className="muted-line">{provider.lastTestMessage || ''}</small></td>
                  <td className="actions-cell">
                    <button type="button" className="secondary" onClick={() => editProvider(provider)}>编辑</button>
                    <button type="button" className="secondary" disabled={busy === `test:${provider.id}`} onClick={() => testProvider(provider.id)}>测试服务</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ai-section">
        <h3>任务中心</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>任务</th><th>目标</th><th>供应商</th><th>状态</th><th>结果</th><th>人工补录结果</th><th>补充记录（可选）</th><th>应用位置</th><th>操作</th></tr></thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td><strong>{aiTaskTypeLabel(task.taskType)}</strong><small className="muted-line">{formatTime(task.createdAt)}</small></td>
                  <td>
                    {task.targetType ? aiTargetTypeLabel(task.targetType) : '-'}
                    <small className="muted-line">{task.targetId ? '已关联目标内容' : '尚未关联目标内容'}</small>
                    {aiTaskInputSummary(task) && <small className="muted-line">{aiTaskInputSummary(task)}</small>}
                  </td>
                  <td>{task.providerName || '-'}</td>
                  <td>{aiTaskStatusLabel(task.status)}{task.errorMessage && <small className="muted-line">{task.errorMessage}</small>}</td>
                  <td><small className="muted-line">{task.resultText ? task.resultText.slice(0, 140) : '暂无结果'}</small></td>
                  <td>
                    <textarea
                      className="ai-inline-result"
                      value={manualResults[task.id] || ''}
                      placeholder="粘贴人工整理后的结果，补录后仍需审校。"
                      onChange={event => setManualResults(current => ({ ...current, [task.id]: event.target.value }))}
                    />
                  </td>
                  <td>
                    <AiResultJsonEditor
                      task={task}
                      value={manualResultJsons[task.id] || ''}
                      onChange={nextValue => setManualResultJsons(current => ({ ...current, [task.id]: nextValue }))}
                    />
                  </td>
                  <td>
                    <InlineChoiceField
                      value={applyTargets[task.id] || defaultAiApplyTargetField(task)}
                      options={aiApplyTargetOptions(task).map(option => ({
                        value: option.value,
                        label: option.label,
                        hint: `把当前 AI 结果应用到“${option.label}”。`,
                      }))}
                      onChange={nextValue => setApplyTargets(current => ({ ...current, [task.id]: nextValue }))}
                    />
                  </td>
                  <td className="actions-cell">
                    <button type="button" className="secondary" disabled={!task.providerId || busy === `run:${task.id}`} onClick={() => runTask(task.id)}>真实调用</button>
                    <button type="button" className="secondary" disabled={busy === `import:${task.id}`} onClick={() => importResult(task.id)}>补录结果</button>
                    <button type="button" className="secondary" disabled={!canApplyAiTask(task) || busy === `apply:${task.id}`} onClick={() => applyTaskResult(task, false)}>应用草稿</button>
                    <button type="button" className="secondary" disabled={!canApplyAiTask(task) || busy === `apply-submit:${task.id}`} onClick={() => applyTaskResult(task, true)}>应用并提交审核</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ai-section">
        <h3>调用日志</h3>
        <DataTable
          columns={['时间', '供应商', '动作', '状态', '耗时', '摘要']}
          rows={logs.map(log => [
            formatTime(log.createdAt),
            log.providerName || '-',
            aiLogActionLabel(log.action),
            aiCallStatusLabel(log.status),
            `${log.durationMs} ms`,
            log.errorMessage || log.responseSummary || log.requestSummary || '-',
          ])}
        />
      </section>
    </section>
  )
}

export const AI_TASK_TYPE_CHOICE_OPTIONS = AI_PROVIDER_TASK_TYPE_OPTIONS.map(item => ({
  value: item.value,
  label: item.label,
  hint: `创建或筛选“${item.label}”相关任务。`,
}))

export const AI_TARGET_TYPE_CHOICE_OPTIONS = AI_TARGET_TYPE_OPTIONS.map(item => ({
  value: item.value,
  label: item.label,
  hint: `把 AI 任务绑定到${item.label}内容。`,
}))

export function aiTaskInputSummary(task: AiTask) {
  const input = task.inputJson || {}
  const sourceMediaUrl = typeof input.sourceMediaUrl === 'string' ? input.sourceMediaUrl : typeof input.source_media_url === 'string' ? input.source_media_url : ''
  const sourceFileUrl = typeof input.sourceFileUrl === 'string' ? input.sourceFileUrl : typeof input.source_file_url === 'string' ? input.source_file_url : ''
  const expectedOutput = typeof input.expectedOutput === 'string' ? input.expectedOutput : typeof input.expected_output === 'string' ? input.expected_output : ''
  const outputFormat = typeof input.outputFormat === 'string' ? input.outputFormat : typeof input.output_format === 'string' ? input.output_format : ''
  const parts = [
    sourceMediaUrl ? `源媒体：${sourceMediaUrl}` : '',
    sourceFileUrl ? `源文件：${sourceFileUrl}` : '',
    expectedOutput ? `产物：${expectedOutput}` : '',
    outputFormat ? `格式：${outputFormat}` : '',
  ].filter(Boolean)
  return parts.join('；')
}

export function aiProviderConfigSummary(provider: AiProvider) {
  const config = provider.configJson || {}
  const taskTypes = Array.isArray(config.supportedTaskTypes)
    ? config.supportedTaskTypes
    : Array.isArray(config.supported_task_types)
      ? config.supported_task_types
      : []
  const outputFormats = Array.isArray(config.outputFormats)
    ? config.outputFormats
    : Array.isArray(config.output_formats)
      ? config.output_formats
      : []
  const resultMode = typeof config.resultMode === 'string'
    ? config.resultMode
    : typeof config.result_mode === 'string'
      ? config.result_mode
      : ''
  const fileInputEnabled = config.fileInputEnabled !== false && config.file_input_enabled !== false
  const taskText = taskTypes.length ? taskTypes.map(item => aiTaskTypeLabel(String(item))).join('、') : '不限任务'
  const outputText = outputFormats.length ? outputFormats.map(String).join('、') : '不限格式'
  const modeText: Record<string, string> = {
    sync: '同步',
    async_polling: '轮询',
    callback: '回调',
    manual: '手动',
  }
  return (
    <>
      {taskText}
      <small className="muted-line">{fileInputEnabled ? '支持文件输入' : '仅文本输入'} · {outputText} · {modeText[resultMode] || '同步'}</small>
    </>
  )
}

export function buildReadableProviderConfig(form: {
  supportedTaskTypes: string[]
  fileInputEnabled: boolean
  acceptedInputExtensions: string[]
  customAcceptedInputExtensions: string
  outputFormats: string[]
  customOutputFormats: string
  resultMode: string
}) {
  const acceptedFormats = Array.from(new Set([
    ...form.acceptedInputExtensions,
    ...normalizeCsvTokens(form.customAcceptedInputExtensions),
  ]))
  const outputFormats = Array.from(new Set([
    ...form.outputFormats,
    ...normalizeCsvTokens(form.customOutputFormats),
  ]))
  const resultModeLabels: Record<string, string> = {
    sync: '同步返回',
    async_polling: '异步轮询',
    callback: '回调通知',
    manual: '人工补录结果',
  }
  return {
    taskTypes: form.supportedTaskTypes.length ? form.supportedTaskTypes.map(item => aiTaskTypeLabel(item)).join('、') : '不限任务',
    inputMode: form.fileInputEnabled ? '支持上传文件和文本' : '仅支持文本输入',
    acceptedFormats: acceptedFormats.length ? acceptedFormats.join('、') : '未限制',
    outputFormats: outputFormats.length ? outputFormats.join('、') : '未限制',
    resultMode: resultModeLabels[form.resultMode] || form.resultMode || '同步返回',
  }
}

export function defaultAiApplyTargetField(task: AiTask) {
  if (task.taskType === 'risk_hint') return 'risk_types'
  if (task.taskType === 'transcription') return task.targetType === 'oral_history' ? 'oral_transcription_workbench' : 'body'
  if (task.taskType === 'public_summary') return task.targetType === 'oral_history' ? 'ai_summary' : 'summary'
  if (task.taskType === 'narration_script') return 'narration_script'
  if (task.taskType === 'tts_audio') return 'tts_audio'
  if (task.taskType === 'digital_human_video') return 'digital_human_video'
  if (task.taskType === 'story_script') return 'body'
  return 'data_note'
}

export function aiApplyTargetOptions(task: AiTask) {
  const options = [
    { value: 'summary', label: '内容摘要' },
    { value: 'body', label: '正文' },
    { value: 'ai_summary', label: 'AI 摘要待审' },
    { value: 'public_transcript', label: '口述历史公开稿' },
    { value: 'oral_transcription_workbench', label: '口述历史转写工作台' },
    { value: 'raw_transcript', label: '口述历史完整转写' },
    { value: 'risk_types', label: '风险标签' },
    { value: 'narration_script', label: 'AI 讲解稿' },
    { value: 'tts_audio', label: 'TTS 音频媒体' },
    { value: 'digital_human_video', label: '数字人视频媒体' },
    { value: 'data_note', label: 'AI 备注' },
  ]
  if (task.targetType === 'oral_history') return options
  return options.filter(option => !['public_transcript', 'raw_transcript', 'oral_transcription_workbench'].includes(option.value))
}

export function canApplyAiTask(task: AiTask) {
  return Boolean(task.targetId && task.resultText && ['completed', 'imported'].includes(task.status))
}

