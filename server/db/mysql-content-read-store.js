function createMysqlContentReadStore({ ops }) {
  return {
    async listMediaAssetRows({ whereSql = '', params = [], pageSize = 48, offset = 0 }) {
      const totalRow = await ops.get(`SELECT count(*) AS count FROM media_assets ${whereSql}`, params)
      const rows = await ops.all(`
        SELECT m.*, u.username AS uploaded_by_username
        FROM media_assets m
        LEFT JOIN admin_users u ON u.id = m.uploaded_by
        ${whereSql}
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, Number(pageSize), Number(offset)])
      return { total: Number(totalRow?.count || 0), rows }
    },

    async findMediaAssetRow(id) {
      return ops.get(`
        SELECT m.*, u.username AS uploaded_by_username
        FROM media_assets m
        LEFT JOIN admin_users u ON u.id = m.uploaded_by
        WHERE m.id = ?
      `, [String(id)])
    },

    async listContentSummaryRows({ whereSql = '', params = [], pageSize = 50, offset = 0 }) {
      const totalRow = await ops.get(`
        SELECT count(*) AS count
        FROM contents c
        LEFT JOIN content_versions cv ON cv.id = c.current_version_id
        ${whereSql}
      `, params)
      const rows = await ops.all(`
        SELECT c.*, m.name AS module_name, u.username AS updated_by_username, cv.data_json AS current_data_json
        FROM contents c
        LEFT JOIN content_versions cv ON cv.id = c.current_version_id
        LEFT JOIN content_modules m ON m.module_key = c.module_key
        LEFT JOIN admin_users u ON u.id = c.updated_by
        ${whereSql}
        ORDER BY c.updated_at DESC
        LIMIT ? OFFSET ?
      `, [...params, Number(pageSize), Number(offset)])
      return { total: Number(totalRow?.count || 0), rows }
    },

    async findContentSummaryRow(id) {
      return ops.get(`
        SELECT c.*, m.name AS module_name, u.username AS updated_by_username, cv.data_json AS current_data_json
        FROM contents c
        LEFT JOIN content_versions cv ON cv.id = c.current_version_id
        LEFT JOIN content_modules m ON m.module_key = c.module_key
        LEFT JOIN admin_users u ON u.id = c.updated_by
        WHERE c.id = ?
      `, [String(id)])
    },

    async listContentVersionRows(contentId) {
      return ops.all('SELECT * FROM content_versions WHERE content_id = ? ORDER BY version_number DESC', [String(contentId)])
    },

    async listContentSourceRows(contentId, versionId) {
      return ops.all(
        'SELECT * FROM content_sources WHERE content_id = ? AND version_id = ? ORDER BY created_at ASC',
        [String(contentId), String(versionId || '')],
      )
    },

    async listReviewWorkflowRows() {
      return ops.all('SELECT id, module_key, name, is_default, created_at, updated_at FROM review_workflows ORDER BY module_key, name')
    },

    async listWorkflowStepRows(workflowId) {
      return ops.all(`
        SELECT s.*, r.name AS role_name
        FROM review_workflow_steps s
        LEFT JOIN roles r ON r.id = s.role_id
        WHERE s.workflow_id = ?
        ORDER BY s.step_order ASC
      `, [String(workflowId)])
    },

    async listReviewTaskRows({ status = '', limit = 200 } = {}) {
      const where = status ? 'WHERE t.status = ?' : ''
      const params = status ? [status] : []
      return ops.all(`
        SELECT t.*, c.title, c.module_key, c.sensitive_level, c.risk_types_json,
               cv.data_json AS current_data_json, s.name AS step_name, s.step_order,
               s.required_permission, s.is_final, r.name AS assignee_role_name
        FROM content_review_tasks t
        JOIN contents c ON c.id = t.content_id
        LEFT JOIN content_versions cv ON cv.id = c.current_version_id
        JOIN review_workflow_steps s ON s.id = t.step_id
        LEFT JOIN roles r ON r.id = t.assignee_role_id
        ${where}
        ORDER BY t.created_at DESC
        LIMIT ?
      `, [...params, Number(limit)])
    },

    async listContentReviewTaskRows(contentId) {
      return ops.all(`
        SELECT t.*, s.name AS step_name, s.step_order, s.required_permission, s.is_final,
               c.title, c.module_key, r.name AS assignee_role_name, u.username AS reviewer_username
        FROM content_review_tasks t
        JOIN review_workflow_steps s ON s.id = t.step_id
        JOIN contents c ON c.id = t.content_id
        LEFT JOIN roles r ON r.id = t.assignee_role_id
        LEFT JOIN admin_users u ON u.id = t.reviewer_id
        WHERE t.content_id = ?
        ORDER BY t.created_at ASC
      `, [String(contentId)])
    },

    async findPendingReviewTaskRow(contentId) {
      return ops.get(`
        SELECT t.*, s.name AS step_name, s.step_order, s.required_permission, s.is_final, c.title, c.module_key
        FROM content_review_tasks t
        JOIN review_workflow_steps s ON s.id = t.step_id
        JOIN contents c ON c.id = t.content_id
        WHERE t.content_id = ? AND t.status = 'pending'
        ORDER BY t.created_at DESC
        LIMIT 1
      `, [String(contentId)])
    },
  }
}

module.exports = {
  createMysqlContentReadStore,
}
