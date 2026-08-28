const { createSqlDialect } = require('./sql-dialect')
const { createMysqlPublicReadStore } = require('./mysql-public-read-store')

function createMysqlRuntimeMiscStore({ ops }) {
  const dialect = createSqlDialect('mysql')
  const publicReadStore = createMysqlPublicReadStore({ ops })
  const archiveYearSql = dialect.jsonNumber('v.data_json', '$.year')
  const archiveLegacyIdSql = dialect.jsonText('v.data_json', '$.legacyId')
  const mapPublishTypeSql = dialect.jsonType('v.data_json', '$.publishPositions.map')
  const mapPublishFlagSql = dialect.jsonText('v.data_json', '$.publishPositions.map')
  const legacyMapPublishFlagSql = dialect.jsonText('v.data_json', '$.publish_positions.map')

  return {
    ...publicReadStore,

    async listContentModuleRows() {
      return ops.all(`
        SELECT module_key, name, default_publish_map, default_publish_list,
               default_publish_home, default_publish_topic, default_publish_guide
        FROM content_modules
        ORDER BY module_key
      `)
    },

    async findContentModuleRow(moduleKey) {
      return ops.get(`
        SELECT module_key, name, default_publish_map, default_publish_list,
               default_publish_home, default_publish_topic, default_publish_guide
        FROM content_modules
        WHERE module_key = ?
      `, [String(moduleKey)])
    },

    async updateContentModuleDefaultPublishPositions(moduleKey, positions) {
      await ops.run(`
        UPDATE content_modules
        SET default_publish_map = ?, default_publish_list = ?, default_publish_home = ?,
            default_publish_topic = ?, default_publish_guide = ?
        WHERE module_key = ?
      `, [
        positions.map ? 1 : 0,
        positions.list ? 1 : 0,
        positions.home ? 1 : 0,
        positions.topic ? 1 : 0,
        positions.guide ? 1 : 0,
        String(moduleKey),
      ])
    },

    async listRiskTagTemplateRows({ includeInactive = false } = {}) {
      const where = includeInactive ? '' : 'WHERE is_active = 1'
      return ops.all(`
        SELECT *
        FROM risk_tag_templates
        ${where}
        ORDER BY sort_order ASC, label ASC
      `)
    },

    async findRiskTagTemplateRow(id) {
      return ops.get('SELECT * FROM risk_tag_templates WHERE id = ?', [String(id)])
    },

    async listActiveRiskTagTemplateRows() {
      return ops.all('SELECT * FROM risk_tag_templates WHERE is_active = 1')
    },

    async findRiskTagTemplateDuplicate(label, excludeId = '') {
      return ops.get('SELECT id FROM risk_tag_templates WHERE label = ? AND id <> ?', [
        String(label),
        String(excludeId || ''),
      ])
    },

    async insertRiskTagTemplate(item) {
      await ops.run(`
        INSERT INTO risk_tag_templates
          (id, label, level, category, description, is_active, sort_order, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        item.id,
        item.label,
        item.level,
        item.category,
        item.description,
        item.isActive ? 1 : 0,
        item.sortOrder,
        item.createdBy,
        item.createdAt,
        item.updatedAt,
      ])
    },

    async updateRiskTagTemplate(id, item, updatedAt) {
      await ops.run(`
        UPDATE risk_tag_templates
        SET label = ?, level = ?, category = ?, description = ?, is_active = ?, sort_order = ?, updated_at = ?
        WHERE id = ?
      `, [
        item.label,
        item.level,
        item.category,
        item.description,
        item.isActive ? 1 : 0,
        item.sortOrder,
        Number(updatedAt),
        String(id),
      ])
    },

    async deleteRiskTagTemplate(id) {
      await ops.run('DELETE FROM risk_tag_templates WHERE id = ?', [String(id)])
    },

    async listReviewRecordRows(limit = 5000) {
      return ops.all(`
        SELECT t.*, s.name AS step_name, s.step_order, s.required_permission, s.is_final,
               c.title, c.module_key, c.status AS content_status, c.sensitive_level, c.risk_types_json,
               r.name AS assignee_role_name, u.username AS reviewer_username
        FROM content_review_tasks t
        JOIN review_workflow_steps s ON s.id = t.step_id
        JOIN contents c ON c.id = t.content_id
        LEFT JOIN roles r ON r.id = t.assignee_role_id
        LEFT JOIN admin_users u ON u.id = t.reviewer_id
        ORDER BY t.created_at DESC
        LIMIT ?
      `, [Number(limit)])
    },

    async findWorkflowRow(moduleKey) {
      return await ops.get(`
        SELECT *
        FROM review_workflows
        WHERE module_key = ?
        ORDER BY is_default DESC, created_at ASC
        LIMIT 1
      `, [String(moduleKey)]) || ops.get(`
        SELECT *
        FROM review_workflows
        WHERE module_key = '*'
        ORDER BY is_default DESC, created_at ASC
        LIMIT 1
      `)
    },

    async listPublicArchiveMapRows() {
      return ops.all(`
        SELECT c.*, v.id AS version_id, v.version_number, v.title AS version_title,
               v.summary AS version_summary, v.body, v.data_json
        FROM contents c
        JOIN content_versions v ON v.id = c.published_version_id
        WHERE c.module_key = 'archive'
          AND c.status = 'published'
          AND c.published_version_id IS NOT NULL
          AND (
            ${mapPublishTypeSql} IS NULL
            OR ${mapPublishFlagSql} != '0'
            OR ${legacyMapPublishFlagSql} != '0'
          )
        ORDER BY ${archiveYearSql} ASC, v.title ASC
      `)
    },

    async listPublicMessageRows({ pageSize = 50, offset = 0 }) {
      const totalRow = await ops.get(`
        SELECT count(*) AS count
        FROM contents c
        WHERE c.module_key = 'message' AND c.status = 'published' AND c.published_version_id IS NOT NULL
      `)
      const rows = await ops.all(`
        SELECT c.*, v.id AS version_id, v.version_number, v.title AS version_title,
               v.summary AS version_summary, v.body, v.data_json
        FROM contents c
        JOIN content_versions v ON v.id = c.published_version_id
        WHERE c.module_key = 'message' AND c.status = 'published' AND c.published_version_id IS NOT NULL
        ORDER BY c.published_at DESC, c.updated_at DESC
        LIMIT ? OFFSET ?
      `, [Number(pageSize), Number(offset)])
      return {
        total: Number(totalRow?.count || 0),
        rows,
      }
    },

    async countLegacyArchiveRows({ whereSql = '', params = [] }) {
      const row = await ops.get(`SELECT count(*) AS count FROM archives ${whereSql}`, params)
      return Number(row?.count || 0)
    },

    async listLegacyArchiveRows({ whereSql = '', params = [], pageSize = 100, offset = 0 }) {
      return ops.all(`
        SELECT id, title, description, content, type, year, longitude, latitude, media_json, created_at, updated_at
        FROM archives
        ${whereSql}
        ORDER BY year ASC, title ASC
        LIMIT ? OFFSET ?
      `, [...params, Number(pageSize), Number(offset)])
    },

    async findLegacyArchiveRow(id) {
      return ops.get(`
        SELECT id, title, description, content, type, year, longitude, latitude, media_json, created_at, updated_at
        FROM archives
        WHERE id = ?
      `, [String(id)])
    },

    async insertLegacyArchive(archive) {
      await ops.run(`
        INSERT INTO archives
          (id, title, description, content, type, year, longitude, latitude, media_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        archive.id,
        archive.title,
        archive.description,
        archive.content || '',
        archive.type,
        archive.year,
        archive.longitude,
        archive.latitude,
        JSON.stringify(archive.media || []),
        archive.createdAt,
        archive.updatedAt,
      ])
    },

    async updateLegacyArchive(id, archive) {
      await ops.run(`
        UPDATE archives
        SET title = ?, description = ?, content = ?, type = ?, year = ?,
            longitude = ?, latitude = ?, media_json = ?, updated_at = ?
        WHERE id = ?
      `, [
        archive.title,
        archive.description,
        archive.content || '',
        archive.type,
        archive.year,
        archive.longitude,
        archive.latitude,
        JSON.stringify(archive.media || []),
        archive.updatedAt,
        String(id),
      ])
    },

    async deleteLegacyArchive(id) {
      await ops.run('DELETE FROM archives WHERE id = ?', [String(id)])
    },

    async findMessageRow(id) {
      return ops.get(`
        SELECT id, name, identity, text, in_reply_to, created_at, ip
        FROM messages
        WHERE id = ?
      `, [String(id)])
    },

    async deleteMessage(id) {
      await ops.run('DELETE FROM messages WHERE id = ?', [String(id)])
    },

    async findCheckinProgressRow(visitorId) {
      return ops.get(`
        SELECT visitor_id, visited_pois_json, updated_at
        FROM checkin_progress
        WHERE visitor_id = ?
      `, [String(visitorId)])
    },

    async upsertCheckinProgress(visitorId, visitedPoisJson, updatedAt) {
      await ops.run(dialect.upsertCheckinProgressSql(), [
        String(visitorId),
        String(visitedPoisJson),
        Number(updatedAt),
      ])
    },

    async getTributeCount() {
      const row = await ops.get('SELECT count FROM tributes WHERE id = 1')
      return row ? Number(row.count) : null
    },

    async setTributeCount(count) {
      await ops.run('UPDATE tributes SET count = ? WHERE id = 1', [Number(count)])
    },

    async incrementTributeCount() {
      await ops.run('UPDATE tributes SET count = count + 1 WHERE id = 1')
    },

    async findMediaAssetFileRowByRequestedPath(requestedPath) {
      return ops.get(`
        SELECT storage_path, url, thumbnail_url
        FROM media_assets
        WHERE deleted_at IS NULL AND (url = ? OR thumbnail_url = ?)
        LIMIT 1
      `, [String(requestedPath), String(requestedPath)])
    },
  }
}

module.exports = {
  createMysqlRuntimeMiscStore,
}
