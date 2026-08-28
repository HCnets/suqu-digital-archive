/**
 * AI 域路由注册器（从 index.js 迁出，防膨胀）
 * 用法: registerAiRoutes(app, deps)
 * deps 传入 index.js 的 service/中间件/store（避免本模块 require index.js 造成循环依赖）。
 * AI 纯逻辑（normalize/test/run）直接 require lib 已有模块。
 */
const crypto = require('crypto')
const { makeId, cleanText, safeJsonValue } = require('./utils')
const { hashToken, secureEqual } = require('./security')
const { publicAiProvider, publicAiTask } = require('./ai-base')
const { normalizeAiProviderInput } = require('./ai-ops')
const {
  testAiProvider, validateAiTaskAgainstProvider, runAiTaskWithProvider,
  normalizeAiResultJson, normalizeAiExternalJobInput, normalizeAiCallbackInput,
} = require('./ai-run')
const { normalizeAiTaskInputAsync, normalizeAiTaskApplicationInputAsync } = require('./async-ops')
const { listLlmProviderPresets, presetToProviderDraft } = require('./llm-providers')
const { listTtsProviderPresets, presetToProviderDraft: ttsPresetToProviderDraft } = require('./tts-providers')

module.exports = function registerAiRoutes(app, deps) {
  const {
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
  } = deps

  // === 供应商预设（新增，让 DeepSeek/通义等一键配置）===
  app.get('/api/admin/ai/provider-presets', requirePermission('ai.manage'), (req, res) => {
    res.json({ presets: listLlmProviderPresets() })
  })
  app.post('/api/admin/ai/provider-presets/:id/draft', requirePermission('ai.manage'), (req, res) => {
    const draft = presetToProviderDraft(req.params.id)
    if (!draft) return sendError(res, 404, 'AI_PRESET_NOT_FOUND', 'AI 供应商预设不存在。')
    res.json(draft)
  })

  // === TTS 供应商预设（小米 MiMo 语音合成 / 克隆）===
  app.get('/api/admin/ai/tts-providers', requirePermission('ai.manage'), (req, res) => {
    res.json({ presets: listTtsProviderPresets() })
  })
  app.post('/api/admin/ai/tts-providers/:id/draft', requirePermission('ai.manage'), (req, res) => {
    const draft = ttsPresetToProviderDraft(req.params.id)
    if (!draft) return sendError(res, 404, 'AI_PRESET_NOT_FOUND', 'TTS 供应商预设不存在。')
    res.json(draft)
  })

  // === 供应商管理 ===
  app.get('/api/admin/ai/providers', requirePermission('ai.manage'), async (req, res) => {
    res.json(await listAiProvidersAsync())
  })

  app.post('/api/admin/ai/providers', requirePermission('ai.manage'), rateLimit('ai-manage', 60_000, 60), async (req, res) => {
    const normalized = normalizeAiProviderInput(req.body, { creating: true })
    if (normalized.error) return sendError(res, 400, 'INVALID_AI_PROVIDER', normalized.error)
    const now = Date.now()
    const provider = {
      id: makeId('ai_provider'),
      ...normalized.provider,
      createdBy: req.user.id,
      createdAt: now,
      updatedAt: now,
    }
    await insertAiProviderAsync(provider)
    const after = await findAiProviderAsync(provider.id)
    await writeAuditAsync(req, 'create', 'ai_provider', provider.id, null, after)
    res.status(201).json(after)
  })

  app.put('/api/admin/ai/providers/:id', requirePermission('ai.manage'), rateLimit('ai-manage', 60_000, 60), async (req, res) => {
    const before = await findAiProviderAsync(req.params.id, true)
    if (!before) return sendError(res, 404, 'AI_PROVIDER_NOT_FOUND', 'AI 供应商不存在。')
    const normalized = normalizeAiProviderInput(req.body, { creating: false, existing: before })
    if (normalized.error) return sendError(res, 400, 'INVALID_AI_PROVIDER', normalized.error)
    await updateAiProviderAsync(before.id, normalized.provider)
    const after = await findAiProviderAsync(before.id)
    await writeAuditAsync(req, 'update', 'ai_provider', before.id, publicAiProvider(before), after)
    res.json(after)
  })

  app.post('/api/admin/ai/providers/:id/test', requirePermission('ai.manage'), rateLimit('ai-test', 60_000, 20), async (req, res) => {
    const provider = await findAiProviderAsync(req.params.id, true)
    if (!provider) return sendError(res, 404, 'AI_PROVIDER_NOT_FOUND', 'AI 供应商不存在。')
    const started = Date.now()
    const result = await testAiProvider(provider)
    const now = Date.now()
    await AI_OPS_STORE.updateAiProviderTestResult(provider.id, {
      lastTestedAt: now,
      lastTestStatus: result.ok ? 'ok' : 'failed',
      lastTestMessage: result.message,
      updatedAt: now,
    })
    await insertAiCallLogAsync({
      providerId: provider.id,
      taskId: '',
      action: 'test_connection',
      status: result.ok ? 'ok' : 'failed',
      requestSummary: '测试 AI 供应商连接',
      responseSummary: result.ok ? result.message : '',
      errorMessage: result.ok ? '' : result.message,
      durationMs: Date.now() - started,
      createdBy: req.user.id,
    })
    await writeAuditAsync(req, 'test_connection', 'ai_provider', provider.id, publicAiProvider(provider), await findAiProviderAsync(provider.id))
    res.json({ ok: result.ok, message: result.message, durationMs: Date.now() - started })
  })

  // === AI 任务中心 ===
  app.get('/api/admin/ai/tasks', requirePermission('ai.manage'), async (req, res) => {
    res.json(await listAiTasksAsync(req.query))
  })

  app.post('/api/admin/ai/tasks', requirePermission('ai.manage'), rateLimit('ai-task', 60_000, 80), async (req, res) => {
    const normalized = await normalizeAiTaskInputAsync(req.body)
    if (normalized.error) return sendError(res, 400, 'INVALID_AI_TASK', normalized.error)
    const now = Date.now()
    const task = {
      id: makeId('ai_task'),
      ...normalized.task,
      status: 'pending',
      resultText: '',
      resultJson: null,
      errorMessage: '',
      createdBy: req.user.id,
      updatedBy: req.user.id,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    }
    await insertAiTaskAsync(task)
    const after = await findAiTaskAsync(task.id)
    await writeAuditAsync(req, 'create', 'ai_task', task.id, null, after)
    res.status(201).json(after)
  })

  app.post('/api/admin/ai/tasks/:id/run', requirePermission('ai.manage'), rateLimit('ai-run', 60_000, 20), async (req, res) => {
    const task = await findAiTaskAsync(req.params.id, true)
    if (!task) return sendError(res, 404, 'AI_TASK_NOT_FOUND', 'AI 任务不存在。')
    const provider = task.providerId ? await findAiProviderAsync(task.providerId, true) : null
    if (!provider) return sendError(res, 400, 'AI_PROVIDER_REQUIRED', '运行真实调用前请先选择 AI 供应商。')
    if (!provider.isEnabled) return sendError(res, 400, 'AI_PROVIDER_DISABLED', 'AI 供应商已停用。')
    const providerCheck = validateAiTaskAgainstProvider({ taskType: task.taskType, inputJson: task.inputJson || {}, provider })
    if (providerCheck.error) return sendError(res, 400, 'AI_PROVIDER_CAPABILITY_MISMATCH', providerCheck.error)
    const before = publicAiTask(task)
    await setAiTaskRunningAsync(task.id, req.user.id)
    const started = Date.now()
    const result = await runAiTaskWithProvider(task, provider)
    if (result.ok) {
      const normalizedResultJson = normalizeAiResultJson(result.raw, result.text, task)
      if (normalizedResultJson.error) {
        await completeAiTaskAsync(task.id, {
          status: 'failed',
          resultText: '',
          resultJson: null,
          errorMessage: normalizedResultJson.error,
          updatedBy: req.user.id,
        })
        result.ok = false
        result.message = normalizedResultJson.error
        result.text = ''
      } else {
        await completeAiTaskAsync(task.id, {
          status: 'completed',
          resultText: result.text,
          resultJson: normalizedResultJson.value,
          errorMessage: '',
          updatedBy: req.user.id,
        })
      }
    } else {
      await completeAiTaskAsync(task.id, {
        status: 'failed',
        resultText: '',
        resultJson: null,
        errorMessage: result.message,
        updatedBy: req.user.id,
      })
    }
    await insertAiCallLogAsync({
      providerId: provider.id,
      taskId: task.id,
      action: 'run_task',
      status: result.ok ? 'ok' : 'failed',
      requestSummary: `${task.taskType} · ${task.targetType || '未绑定对象'}`,
      responseSummary: result.ok ? cleanText(result.text, 500) : '',
      errorMessage: result.ok ? '' : result.message,
      durationMs: Date.now() - started,
      createdBy: req.user.id,
    })
    const after = await findAiTaskAsync(task.id)
    await writeAuditAsync(req, result.ok ? 'run' : 'run_failed', 'ai_task', task.id, before, after)
    res.json(after)
  })

  app.post('/api/admin/ai/tasks/:id/import-result', requirePermission('ai.manage'), rateLimit('ai-task', 60_000, 80), async (req, res) => {
    const before = await findAiTaskAsync(req.params.id, true)
    if (!before) return sendError(res, 404, 'AI_TASK_NOT_FOUND', 'AI 任务不存在。')
    const resultText = cleanText(req.body?.resultText || req.body?.result_text || '', 100000)
    if (!resultText) return sendError(res, 400, 'INVALID_AI_RESULT', '请填写要导入的 AI 结果。')
    let resultJson = null
    if (req.body?.resultJson !== undefined || req.body?.result_json !== undefined) {
      const raw = req.body.resultJson ?? req.body.result_json
      resultJson = typeof raw === 'string' && raw.trim() ? safeJsonValue(raw) : raw
    }
    const normalizedResultJson = normalizeAiResultJson(resultJson || {}, resultText, before)
    if (normalizedResultJson.error) return sendError(res, 400, 'INVALID_AI_RESULT_JSON', normalizedResultJson.error)
    await completeAiTaskAsync(before.id, {
      status: 'imported',
      resultText,
      resultJson: normalizedResultJson.value,
      errorMessage: '',
      updatedBy: req.user.id,
    })
    await insertAiCallLogAsync({
      providerId: before.providerId || '',
      taskId: before.id,
      action: 'manual_import',
      status: 'ok',
      requestSummary: `${before.taskType} 手动导入结果`,
      responseSummary: cleanText(resultText, 500),
      errorMessage: '',
      durationMs: 0,
      createdBy: req.user.id,
    })
    const after = await findAiTaskAsync(before.id)
    await writeAuditAsync(req, 'manual_import', 'ai_task', before.id, publicAiTask(before), after)
    res.json(after)
  })

  app.post('/api/admin/ai/tasks/:id/external-job', requirePermission('ai.manage'), rateLimit('ai-task', 60_000, 40), async (req, res) => {
    const before = await findAiTaskAsync(req.params.id, true)
    if (!before) return sendError(res, 404, 'AI_TASK_NOT_FOUND', 'AI 任务不存在。')
    if (!before.providerId) return sendError(res, 400, 'AI_PROVIDER_REQUIRED', '登记外部任务前请先绑定 AI 供应商。')
    const provider = await findAiProviderAsync(before.providerId, true)
    if (!provider) return sendError(res, 400, 'AI_PROVIDER_REQUIRED', 'AI 供应商不存在。')
    const providerCheck = validateAiTaskAgainstProvider({ taskType: before.taskType, inputJson: before.inputJson || {}, provider })
    if (providerCheck.error) return sendError(res, 400, 'AI_PROVIDER_CAPABILITY_MISMATCH', providerCheck.error)
    const normalized = normalizeAiExternalJobInput(req.body)
    if (normalized.error) return sendError(res, 400, 'INVALID_AI_EXTERNAL_JOB', normalized.error)
    const callbackToken = crypto.randomBytes(32).toString('base64url')
    await registerAiExternalJobAsync(before.id, {
      ...normalized.value,
      callbackTokenHash: hashToken(callbackToken),
      updatedBy: req.user.id,
    })
    await insertAiCallLogAsync({
      providerId: before.providerId,
      taskId: before.id,
      action: 'register_external_job',
      status: 'ok',
      requestSummary: `${before.taskType} · ${normalized.value.externalJobId}`,
      responseSummary: normalized.value.providerStatus,
      errorMessage: '',
      durationMs: 0,
      createdBy: req.user.id,
    })
    const after = await findAiTaskAsync(before.id)
    await writeAuditAsync(req, 'register_external_job', 'ai_task', before.id, publicAiTask(before), after)
    res.json({
      task: after,
      callbackToken,
      callbackUrl: `/api/ai/tasks/${before.id}/callback`,
    })
  })

  app.post('/api/ai/tasks/:id/callback', rateLimit('ai-callback', 60_000, 120), async (req, res) => {
    const before = await findAiTaskAsync(req.params.id, true)
    if (!before) return sendError(res, 404, 'AI_TASK_NOT_FOUND', 'AI 任务不存在。')
    if (!before.hasCallbackToken) return sendError(res, 403, 'AI_CALLBACK_NOT_ENABLED', 'AI 任务未启用回调。')
    const token = cleanText(req.get('x-ai-callback-token') || req.body?.callbackToken || req.body?.callback_token || '', 500)
    if (!token || !secureEqual(hashToken(token), await AI_OPS_STORE.getAiTaskCallbackTokenHash(before.id))) {
      return sendError(res, 403, 'AI_CALLBACK_TOKEN_INVALID', 'AI 回调令牌无效。')
    }
    const normalized = normalizeAiCallbackInput(req.body, before)
    if (normalized.error) return sendError(res, 400, 'INVALID_AI_CALLBACK', normalized.error)

    const now = Date.now()
    if (normalized.value.status === 'completed') {
      await completeAiTaskAsync(before.id, {
        status: 'completed',
        resultText: normalized.value.resultText,
        resultJson: normalized.value.resultJson,
        errorMessage: '',
        updatedBy: before.updatedBy || before.createdBy || null,
        providerStatus: 'completed',
        providerResponseJson: normalized.value.providerResponseJson,
        callbackReceivedAt: now,
      })
    } else if (normalized.value.status === 'failed') {
      await completeAiTaskAsync(before.id, {
        status: 'failed',
        resultText: '',
        resultJson: null,
        errorMessage: normalized.value.errorMessage || 'AI 供应商回调失败。',
        updatedBy: before.updatedBy || before.createdBy || null,
        providerStatus: 'failed',
        providerResponseJson: normalized.value.providerResponseJson,
        callbackReceivedAt: now,
      })
    } else {
      await updateAiExternalJobStatusAsync(before.id, {
        providerStatus: normalized.value.providerStatus,
        providerResponseJson: normalized.value.providerResponseJson,
        errorMessage: '',
        updatedBy: before.updatedBy || before.createdBy || null,
        callbackReceivedAt: now,
      })
    }
    await insertAiCallLogAsync({
      providerId: before.providerId || '',
      taskId: before.id,
      action: 'provider_callback',
      status: normalized.value.status === 'failed' ? 'failed' : 'ok',
      requestSummary: `${before.taskType} · ${before.externalJobId || '未登记外部任务 ID'}`,
      responseSummary: normalized.value.resultText ? cleanText(normalized.value.resultText, 500) : normalized.value.providerStatus,
      errorMessage: normalized.value.errorMessage || '',
      durationMs: 0,
      createdBy: before.updatedBy || before.createdBy || null,
    })
    const after = await findAiTaskAsync(before.id)
    await writeAuditAsync({ adminActor: 'ai-callback', get: () => '', ip: '', socket: {} }, 'provider_callback', 'ai_task', before.id, publicAiTask(before), after)
    res.json(after)
  })

  app.get('/api/admin/ai/call-logs', requirePermission('ai.manage'), async (req, res) => {
    res.json(await listAiCallLogsAsync(req.query))
  })

  app.post('/api/admin/ai/tasks/:id/apply-result', requirePermission('ai.manage'), rateLimit('ai-task', 60_000, 40), async (req, res) => {
    const permissions = await getUserPermissionCodesAsync(req.user.id)
    if (!permissions.includes('content.edit')) return sendError(res, 403, 'FORBIDDEN', '需要内容编辑权限才能应用 AI 结果。')

    const task = await findAiTaskAsync(req.params.id, true)
    if (!task) return sendError(res, 404, 'AI_TASK_NOT_FOUND', 'AI 任务不存在。')
    if (!['completed', 'imported'].includes(task.status)) return sendError(res, 409, 'AI_TASK_NOT_READY', 'AI 任务尚未完成，不能应用结果。')
    if (!task.resultText) return sendError(res, 400, 'AI_RESULT_EMPTY', 'AI 任务结果为空。')
    if (!task.targetId) return sendError(res, 400, 'AI_TARGET_REQUIRED', 'AI 任务没有绑定目标内容。')

    const before = await findContentAsync(task.targetId, true)
    if (!before) return sendError(res, 404, 'CONTENT_NOT_FOUND', '目标内容不存在。')
    if (!await requireContentRegionAccessAsync(req, res, before)) return
    if (before.status === 'deleted') return sendError(res, 409, 'CONTENT_DELETED', '已删除内容不能应用 AI 结果。')

    const normalized = await normalizeAiTaskApplicationInputAsync(req.body, task, before, req.user.id)
    if (normalized.error) return sendError(res, 400, 'INVALID_AI_APPLY', normalized.error)

    const now = Date.now()
    let after = null
    try {
      await runInDatabaseTransactionAsync(async () => {
        for (const asset of normalized.mediaAssets || []) {
          await insertMediaAssetAsync(asset)
        }
        after = await applyContentUpdateAsync(before, normalized.contentInput, req.user.id, now)
        await insertAiCallLogAsync({
          providerId: task.providerId || '',
          taskId: task.id,
          action: normalized.submitForReview ? 'apply_result_submit' : 'apply_result_draft',
          status: 'ok',
          requestSummary: `${task.taskType} 应用到 ${before.id} · ${normalized.targetField}`,
          responseSummary: cleanText(task.resultText, 500),
          errorMessage: '',
          durationMs: 0,
          createdBy: req.user.id,
        })
        if (normalized.submitForReview) {
          const workflowId = after.workflowId || (await findWorkflowForModuleAsync(after.moduleKey))?.id
          const returnStep = before.status === 'rejected' && before.currentStepId ? await getWorkflowStepByIdAsync(workflowId, before.currentStepId) : null
          const targetStep = returnStep || (await getWorkflowStepsAsync(workflowId))[0]
          if (!targetStep) throw new Error('审核流程没有配置节点。')
          await cancelPendingReviewTasksAsync(after.id)
          await createReviewTaskAsync(after.id, after.currentVersion.id, workflowId, targetStep, req.user.id)
          await CONTENT_WRITE_STORE.updateContentFields(after.id, {
            status: 'pending_review',
            currentStepId: targetStep.id,
            submittedAt: now,
            updatedBy: req.user.id,
            updatedAt: now,
          })
          after = await findContentAsync(after.id, true)
        }
      })
    } catch (error) {
      return sendError(res, 400, 'AI_APPLY_FAILED', error.message || 'AI 结果应用失败。')
    }

    await writeAuditAsync(req, normalized.submitForReview ? 'apply_ai_result_submit' : 'apply_ai_result_draft', 'content', before.id, before, after)
    res.json({ content: after, task: await findAiTaskAsync(task.id) })
  })
}
