function createMysqlAiOpsStore({ ops }) {
  async function updateFields(tableName, idColumn, idValue, fields, fieldMap) {
    const entries = Object.entries(fieldMap)
      .filter(([key]) => Object.prototype.hasOwnProperty.call(fields, key))
      .map(([key, column]) => [column, fields[key]])

    if (!entries.length) return

    const sql = `UPDATE ${tableName} SET ${entries.map(([column]) => `${column} = ?`).join(', ')} WHERE ${idColumn} = ?`
    await ops.run(sql, [...entries.map(([, value]) => value), String(idValue)])
  }

  return {
    async listAiProviderRows() {
      return ops.all('SELECT * FROM ai_providers ORDER BY is_enabled DESC, updated_at DESC')
    },

    async findAiProviderRow(id) {
      return ops.get('SELECT * FROM ai_providers WHERE id = ?', [String(id)])
    },

    async insertAiProvider(provider) {
      await ops.run(`
        INSERT INTO ai_providers
          (id, name, provider_type, base_url, api_key_encrypted, default_model, capabilities_json, config_json,
           is_enabled, last_tested_at, last_test_status, last_test_message, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, '', '', ?, ?, ?)
      `, [
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
      ])
    },

    async updateAiProvider(id, provider) {
      await ops.run(`
        UPDATE ai_providers
        SET name = ?, provider_type = ?, base_url = ?, api_key_encrypted = ?, default_model = ?,
            capabilities_json = ?, config_json = ?, is_enabled = ?, updated_at = ?
        WHERE id = ?
      `, [
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
      ])
    },

    async updateAiProviderTestResult(id, patch) {
      await ops.run(
        'UPDATE ai_providers SET last_tested_at = ?, last_test_status = ?, last_test_message = ?, updated_at = ? WHERE id = ?',
        [patch.lastTestedAt, patch.lastTestStatus, patch.lastTestMessage, patch.updatedAt, String(id)],
      )
    },

    async listAiTaskRows({ whereSql = '', params = [], pageSize = 50, offset = 0 }) {
      const totalRow = await ops.get(`SELECT count(*) AS count FROM ai_tasks t ${whereSql}`, params)
      const rows = await ops.all(`
        SELECT t.*, p.name AS provider_name, u.username AS created_by_username
        FROM ai_tasks t
        LEFT JOIN ai_providers p ON p.id = t.provider_id
        LEFT JOIN admin_users u ON u.id = t.created_by
        ${whereSql}
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, Number(pageSize), Number(offset)])
      return { total: Number(totalRow?.count || 0), rows }
    },

    async findAiTaskRow(id) {
      return ops.get(`
        SELECT t.*, p.name AS provider_name, u.username AS created_by_username
        FROM ai_tasks t
        LEFT JOIN ai_providers p ON p.id = t.provider_id
        LEFT JOIN admin_users u ON u.id = t.created_by
        WHERE t.id = ?
      `, [String(id)])
    },

    async getAiTaskCallbackTokenHash(id) {
      return (await ops.get('SELECT callback_token_hash FROM ai_tasks WHERE id = ?', [String(id)]))?.callback_token_hash || ''
    },

    async insertAiTask(task) {
      await ops.run(`
        INSERT INTO ai_tasks
          (id, task_type, target_type, target_id, provider_id, prompt, input_text, input_json, status,
           result_text, result_json, error_message, created_by, updated_by, created_at, updated_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
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
      ])
    },

    async updateAiTaskFields(id, fields) {
      await updateFields('ai_tasks', 'id', id, fields, {
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

    async listAiCallLogRows({ pageSize = 50, offset = 0 }) {
      return ops.all(`
        SELECT l.*, p.name AS provider_name, t.task_type
        FROM ai_call_logs l
        LEFT JOIN ai_providers p ON p.id = l.provider_id
        LEFT JOIN ai_tasks t ON t.id = l.task_id
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `, [Number(pageSize), Number(offset)])
    },

    async countAiCallLogs() {
      const row = await ops.get('SELECT count(*) AS count FROM ai_call_logs')
      return Number(row?.count || 0)
    },

    async insertAiCallLog(entry) {
      await ops.run(`
        INSERT INTO ai_call_logs
          (provider_id, task_id, action, status, request_summary, response_summary, error_message, duration_ms, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
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
      ])
    },

    async listAuditLogRows({ whereSql = '', params = [], pageSize = 50, offset = 0 }) {
      const totalRow = await ops.get(`SELECT count(*) AS count FROM audit_logs ${whereSql}`, params)
      const rows = await ops.all(`
        SELECT id, action, entity_type, entity_id, before_json, after_json, actor, ip, created_at
        FROM audit_logs
        ${whereSql}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, Number(pageSize), Number(offset)])
      return { total: Number(totalRow?.count || 0), rows }
    },

    async insertAuditLog(entry) {
      await ops.run(`
        INSERT INTO audit_logs
          (action, entity_type, entity_id, before_json, after_json, actor, ip, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        entry.action,
        entry.entityType,
        entry.entityId || null,
        entry.beforeJson,
        entry.afterJson,
        entry.actor,
        entry.ip,
        entry.createdAt,
      ])
    },

    async listDeletedMediaFileRows() {
      return ops.all('SELECT id, storage_path, original_storage_path, thumbnail_url FROM media_assets WHERE deleted_at IS NOT NULL')
    },

    async listDeletedContentIdRows() {
      return ops.all("SELECT id FROM contents WHERE status = 'deleted' OR deleted_at IS NOT NULL")
    },

    async purgeDeletedContentAndMedia() {
      await ops.run("DELETE FROM contents WHERE status = 'deleted' OR deleted_at IS NOT NULL")
      await ops.run('DELETE FROM media_assets WHERE deleted_at IS NOT NULL')
    },
  }
}

module.exports = {
  createMysqlAiOpsStore,
}
