function createAiOpsStore({ getDb }) {
  function db() {
    return getDb()
  }

  function updateFields(tableName, idColumn, idValue, fields, fieldMap) {
    const entries = Object.entries(fieldMap)
      .filter(([key]) => Object.prototype.hasOwnProperty.call(fields, key))
      .map(([key, column]) => [column, fields[key]])

    if (!entries.length) return

    const sql = `UPDATE ${tableName} SET ${entries.map(([column]) => `${column} = ?`).join(', ')} WHERE ${idColumn} = ?`
    db().prepare(sql).run(...entries.map(([, value]) => value), String(idValue))
  }

  return {
    listAiProviderRows() {
      return db().prepare('SELECT * FROM ai_providers ORDER BY is_enabled DESC, updated_at DESC').all()
    },

    findAiProviderRow(id) {
      return db().prepare('SELECT * FROM ai_providers WHERE id = ?').get(String(id))
    },

    insertAiProvider(provider) {
      db().prepare(`
        INSERT INTO ai_providers
          (id, name, provider_type, base_url, api_key_encrypted, default_model, capabilities_json, config_json,
           is_enabled, last_tested_at, last_test_status, last_test_message, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, '', '', ?, ?, ?)
      `).run(
        provider.id,
        provider.name,
        provider.providerType,
        provider.baseUrl,
        provider.apiKeyEncrypted || '',
        provider.defaultModel,
        provider.capabilitiesJson,
        provider.configJson,
        provider.isEnabled ? 1 : 0,
        provider.createdBy,
        provider.createdAt,
        provider.updatedAt,
      )
    },

    updateAiProvider(id, provider) {
      db().prepare(`
        UPDATE ai_providers
        SET name = ?, provider_type = ?, base_url = ?, api_key_encrypted = ?, default_model = ?,
            capabilities_json = ?, config_json = ?, is_enabled = ?, updated_at = ?
        WHERE id = ?
      `).run(
        provider.name,
        provider.providerType,
        provider.baseUrl,
        provider.apiKeyEncrypted || '',
        provider.defaultModel,
        provider.capabilitiesJson,
        provider.configJson,
        provider.isEnabled ? 1 : 0,
        provider.updatedAt,
        String(id),
      )
    },

    updateAiProviderTestResult(id, patch) {
      db().prepare('UPDATE ai_providers SET last_tested_at = ?, last_test_status = ?, last_test_message = ?, updated_at = ? WHERE id = ?')
        .run(patch.lastTestedAt, patch.lastTestStatus, patch.lastTestMessage, patch.updatedAt, String(id))
    },

    listAiTaskRows({ whereSql = '', params = [], pageSize = 50, offset = 0 }) {
      const total = db().prepare(`SELECT count(*) AS count FROM ai_tasks t ${whereSql}`).get(...params).count
      const rows = db().prepare(`
        SELECT t.*, p.name AS provider_name, u.username AS created_by_username
        FROM ai_tasks t
        LEFT JOIN ai_providers p ON p.id = t.provider_id
        LEFT JOIN admin_users u ON u.id = t.created_by
        ${whereSql}
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, pageSize, offset)
      return { total, rows }
    },

    findAiTaskRow(id) {
      return db().prepare(`
        SELECT t.*, p.name AS provider_name, u.username AS created_by_username
        FROM ai_tasks t
        LEFT JOIN ai_providers p ON p.id = t.provider_id
        LEFT JOIN admin_users u ON u.id = t.created_by
        WHERE t.id = ?
      `).get(String(id))
    },

    getAiTaskCallbackTokenHash(id) {
      return db().prepare('SELECT callback_token_hash FROM ai_tasks WHERE id = ?').get(String(id))?.callback_token_hash || ''
    },

    insertAiTask(task) {
      db().prepare(`
        INSERT INTO ai_tasks
          (id, task_type, target_type, target_id, provider_id, prompt, input_text, input_json, status,
           result_text, result_json, error_message, created_by, updated_by, created_at, updated_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        task.id,
        task.taskType,
        task.targetType,
        task.targetId,
        task.providerId || null,
        task.prompt,
        task.inputText,
        task.inputJson,
        task.status,
        task.resultText,
        task.resultJson,
        task.errorMessage,
        task.createdBy,
        task.updatedBy,
        task.createdAt,
        task.updatedAt,
        task.completedAt,
      )
    },

    updateAiTaskFields(id, fields) {
      updateFields('ai_tasks', 'id', id, fields, {
        status: 'status',
        resultText: 'result_text',
        resultJson: 'result_json',
        errorMessage: 'error_message',
        updatedBy: 'updated_by',
        updatedAt: 'updated_at',
        completedAt: 'completed_at',
        externalJobId: 'external_job_id',
        providerStatus: 'provider_status',
        providerRequestJson: 'provider_request_json',
        providerResponseJson: 'provider_response_json',
        callbackTokenHash: 'callback_token_hash',
        callbackReceivedAt: 'callback_received_at',
      })
    },

    listAiCallLogRows({ pageSize = 50, offset = 0 }) {
      return db().prepare(`
        SELECT l.*, p.name AS provider_name, t.task_type
        FROM ai_call_logs l
        LEFT JOIN ai_providers p ON p.id = l.provider_id
        LEFT JOIN ai_tasks t ON t.id = l.task_id
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `).all(pageSize, offset)
    },

    countAiCallLogs() {
      return db().prepare('SELECT count(*) AS count FROM ai_call_logs').get().count
    },

    insertAiCallLog(entry) {
      db().prepare(`
        INSERT INTO ai_call_logs
          (provider_id, task_id, action, status, request_summary, response_summary, error_message, duration_ms, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        entry.providerId || null,
        entry.taskId || null,
        entry.action,
        entry.status,
        entry.requestSummary,
        entry.responseSummary,
        entry.errorMessage,
        entry.durationMs,
        entry.createdBy || null,
        entry.createdAt,
      )
    },

    listAuditLogRows({ whereSql = '', params = [], pageSize = 50, offset = 0 }) {
      const total = db().prepare(`SELECT count(*) AS count FROM audit_logs ${whereSql}`).get(...params).count
      const rows = db().prepare(`
        SELECT id, action, entity_type, entity_id, before_json, after_json, actor, ip, created_at
        FROM audit_logs
        ${whereSql}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, pageSize, offset)
      return { total, rows }
    },

    insertAuditLog(entry) {
      db().prepare(`
        INSERT INTO audit_logs
          (action, entity_type, entity_id, before_json, after_json, actor, ip, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        entry.action,
        entry.entityType,
        entry.entityId || null,
        entry.beforeJson,
        entry.afterJson,
        entry.actor,
        entry.ip,
        entry.createdAt,
      )
    },

    listDeletedMediaFileRows() {
      return db().prepare('SELECT id, storage_path, original_storage_path, thumbnail_url FROM media_assets WHERE deleted_at IS NOT NULL').all()
    },

    listDeletedContentIdRows() {
      return db().prepare("SELECT id FROM contents WHERE status = 'deleted' OR deleted_at IS NOT NULL").all()
    },

    purgeDeletedContentAndMedia() {
      db().prepare("DELETE FROM contents WHERE status = 'deleted' OR deleted_at IS NOT NULL").run()
      db().prepare('DELETE FROM media_assets WHERE deleted_at IS NOT NULL').run()
    },
  }
}

module.exports = {
  createAiOpsStore,
}
