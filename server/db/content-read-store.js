function createContentReadStore({ getDb }) {
  function db() {
    return getDb()
  }

  return {
    listMediaAssetRows({ whereSql = '', params = [], pageSize = 48, offset = 0 }) {
      const total = db().prepare(`SELECT count(*) AS count FROM media_assets ${whereSql}`).get(...params).count
      const rows = db().prepare(`
        SELECT m.*, u.username AS uploaded_by_username
        FROM media_assets m
        LEFT JOIN admin_users u ON u.id = m.uploaded_by
        ${whereSql}
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, pageSize, offset)
      return { total, rows }
    },

    findMediaAssetRow(id) {
      return db().prepare(`
        SELECT m.*, u.username AS uploaded_by_username
        FROM media_assets m
        LEFT JOIN admin_users u ON u.id = m.uploaded_by
        WHERE m.id = ?
      `).get(String(id))
    },

    listContentSummaryRows({ whereSql = '', params = [], pageSize = 50, offset = 0 }) {
      const total = db().prepare(`
        SELECT count(*) AS count
        FROM contents c
        LEFT JOIN content_versions cv ON cv.id = c.current_version_id
        ${whereSql}
      `).get(...params).count
      const rows = db().prepare(`
        SELECT c.*, m.name AS module_name, u.username AS updated_by_username, cv.data_json AS current_data_json
        FROM contents c
        LEFT JOIN content_versions cv ON cv.id = c.current_version_id
        LEFT JOIN content_modules m ON m.module_key = c.module_key
        LEFT JOIN admin_users u ON u.id = c.updated_by
        ${whereSql}
        ORDER BY c.updated_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, pageSize, offset)
      return { total, rows }
    },

    findContentSummaryRow(id) {
      return db().prepare(`
        SELECT c.*, m.name AS module_name, u.username AS updated_by_username, cv.data_json AS current_data_json
        FROM contents c
        LEFT JOIN content_versions cv ON cv.id = c.current_version_id
        LEFT JOIN content_modules m ON m.module_key = c.module_key
        LEFT JOIN admin_users u ON u.id = c.updated_by
        WHERE c.id = ?
      `).get(String(id))
    },

    listContentVersionRows(contentId) {
      return db().prepare('SELECT * FROM content_versions WHERE content_id = ? ORDER BY version_number DESC').all(String(contentId))
    },

    listContentSourceRows(contentId, versionId) {
      return db().prepare('SELECT * FROM content_sources WHERE content_id = ? AND version_id = ? ORDER BY created_at ASC')
        .all(String(contentId), String(versionId || ''))
    },

    listReviewWorkflowRows() {
      return db().prepare('SELECT id, module_key, name, is_default, created_at, updated_at FROM review_workflows ORDER BY module_key, name').all()
    },

    listWorkflowStepRows(workflowId) {
      return db().prepare(`
        SELECT s.*, r.name AS role_name
        FROM review_workflow_steps s
        LEFT JOIN roles r ON r.id = s.role_id
        WHERE s.workflow_id = ?
        ORDER BY s.step_order ASC
      `).all(String(workflowId))
    },

    listReviewTaskRows({ status = '', limit = 200 } = {}) {
      const where = status ? 'WHERE t.status = ?' : ''
      const params = status ? [status] : []
      return db().prepare(`
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
      `).all(...params, Number(limit))
    },

    listContentReviewTaskRows(contentId) {
      return db().prepare(`
        SELECT t.*, s.name AS step_name, s.step_order, s.required_permission, s.is_final,
               c.title, c.module_key, r.name AS assignee_role_name, u.username AS reviewer_username
        FROM content_review_tasks t
        JOIN review_workflow_steps s ON s.id = t.step_id
        JOIN contents c ON c.id = t.content_id
        LEFT JOIN roles r ON r.id = t.assignee_role_id
        LEFT JOIN admin_users u ON u.id = t.reviewer_id
        WHERE t.content_id = ?
        ORDER BY t.created_at ASC
      `).all(String(contentId))
    },

    findPendingReviewTaskRow(contentId) {
      return db().prepare(`
        SELECT t.*, s.name AS step_name, s.step_order, s.required_permission, s.is_final, c.title, c.module_key
        FROM content_review_tasks t
        JOIN review_workflow_steps s ON s.id = t.step_id
        JOIN contents c ON c.id = t.content_id
        WHERE t.content_id = ? AND t.status = 'pending'
        ORDER BY t.created_at DESC
        LIMIT 1
      `).get(String(contentId))
    },
  }
}

module.exports = {
  createContentReadStore,
}
