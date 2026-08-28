const { createSqlDialect } = require('./sql-dialect')

function createRuntimeMiscStore({ getDb, dbClient = 'sqlite' }) {
  function db() {
    return getDb()
  }

  const dialect = createSqlDialect(dbClient)
  const archiveYearSql = dialect.jsonNumber('v.data_json', '$.year')
  const archiveLegacyIdSql = dialect.jsonText('v.data_json', '$.legacyId')
  const mapPublishTypeSql = dialect.jsonType('v.data_json', '$.publishPositions.map')
  const mapPublishFlagSql = dialect.jsonText('v.data_json', '$.publishPositions.map')
  const legacyMapPublishFlagSql = dialect.jsonText('v.data_json', '$.publish_positions.map')

  return {
    listContentModuleRows() {
      return db().prepare(`
        SELECT module_key, name, default_publish_map, default_publish_list,
               default_publish_home, default_publish_topic, default_publish_guide
        FROM content_modules
        ORDER BY module_key
      `).all()
    },

    findContentModuleRow(moduleKey) {
      return db().prepare(`
        SELECT module_key, name, default_publish_map, default_publish_list,
               default_publish_home, default_publish_topic, default_publish_guide
        FROM content_modules
        WHERE module_key = ?
      `).get(String(moduleKey))
    },

    updateContentModuleDefaultPublishPositions(moduleKey, positions) {
      db().prepare(`
        UPDATE content_modules
        SET default_publish_map = ?, default_publish_list = ?, default_publish_home = ?,
            default_publish_topic = ?, default_publish_guide = ?
        WHERE module_key = ?
      `).run(
        positions.map ? 1 : 0,
        positions.list ? 1 : 0,
        positions.home ? 1 : 0,
        positions.topic ? 1 : 0,
        positions.guide ? 1 : 0,
        String(moduleKey),
      )
    },

    listRiskTagTemplateRows({ includeInactive = false } = {}) {
      const where = includeInactive ? '' : 'WHERE is_active = 1'
      return db().prepare(`
        SELECT *
        FROM risk_tag_templates
        ${where}
        ORDER BY sort_order ASC, label ASC
      `).all()
    },

    findRiskTagTemplateRow(id) {
      return db().prepare('SELECT * FROM risk_tag_templates WHERE id = ?').get(String(id))
    },

    listActiveRiskTagTemplateRows() {
      return db().prepare('SELECT * FROM risk_tag_templates WHERE is_active = 1').all()
    },

    findRiskTagTemplateDuplicate(label, excludeId = '') {
      return db().prepare('SELECT id FROM risk_tag_templates WHERE label = ? AND id <> ?').get(String(label), String(excludeId || ''))
    },

    insertRiskTagTemplate(item) {
      db().prepare(`
        INSERT INTO risk_tag_templates
          (id, label, level, category, description, is_active, sort_order, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
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
      )
    },

    updateRiskTagTemplate(id, item, updatedAt) {
      db().prepare(`
        UPDATE risk_tag_templates
        SET label = ?, level = ?, category = ?, description = ?, is_active = ?, sort_order = ?, updated_at = ?
        WHERE id = ?
      `).run(
        item.label,
        item.level,
        item.category,
        item.description,
        item.isActive ? 1 : 0,
        item.sortOrder,
        Number(updatedAt),
        String(id),
      )
    },

    deleteRiskTagTemplate(id) {
      db().prepare('DELETE FROM risk_tag_templates WHERE id = ?').run(String(id))
    },

    listReviewRecordRows(limit = 5000) {
      return db().prepare(`
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
      `).all(Number(limit))
    },

    findWorkflowRow(moduleKey) {
      return db().prepare(`
        SELECT *
        FROM review_workflows
        WHERE module_key = ?
        ORDER BY is_default DESC, created_at ASC
        LIMIT 1
      `).get(String(moduleKey)) || db().prepare(`
        SELECT *
        FROM review_workflows
        WHERE module_key = '*'
        ORDER BY is_default DESC, created_at ASC
        LIMIT 1
      `).get()
    },

    listPublicContentRows({ whereSql = '', params = [], pageSize = 50, offset = 0 }) {
      const total = db().prepare(`
        SELECT count(*) AS count
        FROM contents c
        JOIN content_versions v ON v.id = c.published_version_id
        ${whereSql}
      `).get(...params).count
      const rows = db().prepare(`
        SELECT c.*, m.name AS module_name, v.id AS version_id, v.version_number, v.title AS version_title,
               v.summary AS version_summary, v.body, v.data_json
        FROM contents c
        JOIN content_versions v ON v.id = c.published_version_id
        LEFT JOIN content_modules m ON m.module_key = c.module_key
        ${whereSql}
        ORDER BY c.published_at DESC, c.updated_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, Number(pageSize), Number(offset))
      return { total, rows }
    },

    findPublishedContentRow(id) {
      return db().prepare(`
        SELECT c.*, m.name AS module_name, v.id AS version_id, v.version_number, v.title AS version_title,
               v.summary AS version_summary, v.body, v.data_json
        FROM contents c
        JOIN content_versions v ON v.id = c.published_version_id
        LEFT JOIN content_modules m ON m.module_key = c.module_key
        WHERE c.id = ? AND c.status = 'published' AND c.published_version_id IS NOT NULL
      `).get(String(id))
    },

    countPublicArchiveRows({ whereSql = '', params = [] }) {
      return db().prepare(`
        SELECT count(*) AS count
        FROM contents c
        JOIN content_versions v ON v.id = c.published_version_id
        ${whereSql}
      `).get(...params).count
    },

    listPublicArchiveRows({ whereSql = '', params = [], pageSize = 100, offset = 0 }) {
      return db().prepare(`
        SELECT c.*, v.id AS version_id, v.version_number, v.title AS version_title,
               v.summary AS version_summary, v.body, v.data_json
        FROM contents c
        JOIN content_versions v ON v.id = c.published_version_id
        ${whereSql}
        ORDER BY ${archiveYearSql} ASC, v.title ASC
        LIMIT ? OFFSET ?
      `).all(...params, Number(pageSize), Number(offset))
    },

    findPublishedArchiveRow(id) {
      return db().prepare(`
        SELECT c.*, v.id AS version_id, v.version_number, v.title AS version_title,
               v.summary AS version_summary, v.body, v.data_json
        FROM contents c
        JOIN content_versions v ON v.id = c.published_version_id
        WHERE c.module_key = 'archive'
          AND c.status = 'published'
          AND c.published_version_id IS NOT NULL
          AND (c.id = ? OR ${archiveLegacyIdSql} = ?)
      `).get(String(id), String(id))
    },

    listPublicArchiveMapRows() {
      return db().prepare(`
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
      `).all()
    },

    listPublicContentSourceRows(contentId) {
      return db().prepare(`
        SELECT source_type, source_title, source_url, archive_ref, page_ref,
               collector, collected_at, trust_level, notes, created_at
        FROM content_sources
        WHERE content_id = ?
        ORDER BY created_at ASC
      `).all(String(contentId))
    },

    listPublicContentSourceRowsByContentIds(contentIds) {
      if (!contentIds.length) return []
      const placeholders = contentIds.map(() => '?').join(', ')
      return db().prepare(`
        SELECT content_id, source_type, source_title, source_url, archive_ref, page_ref,
               collector, collected_at, trust_level, notes, created_at
        FROM content_sources
        WHERE content_id IN (${placeholders})
        ORDER BY created_at ASC
      `).all(...contentIds)
    },

    listPublicMessageRows({ pageSize = 50, offset = 0 }) {
      const total = db().prepare(`
        SELECT count(*) AS count
        FROM contents c
        WHERE c.module_key = 'message' AND c.status = 'published' AND c.published_version_id IS NOT NULL
      `).get().count
      const rows = db().prepare(`
        SELECT c.*, v.id AS version_id, v.version_number, v.title AS version_title,
               v.summary AS version_summary, v.body, v.data_json
        FROM contents c
        JOIN content_versions v ON v.id = c.published_version_id
        WHERE c.module_key = 'message' AND c.status = 'published' AND c.published_version_id IS NOT NULL
        ORDER BY c.published_at DESC, c.updated_at DESC
        LIMIT ? OFFSET ?
      `).all(Number(pageSize), Number(offset))
      return { total, rows }
    },

    countLegacyArchiveRows({ whereSql = '', params = [] }) {
      return db().prepare(`SELECT count(*) AS count FROM archives ${whereSql}`).get(...params).count
    },

    listLegacyArchiveRows({ whereSql = '', params = [], pageSize = 100, offset = 0 }) {
      return db().prepare(`
        SELECT id, title, description, content, type, year, longitude, latitude, media_json, created_at, updated_at
        FROM archives
        ${whereSql}
        ORDER BY year ASC, title ASC
        LIMIT ? OFFSET ?
      `).all(...params, Number(pageSize), Number(offset))
    },

    findLegacyArchiveRow(id) {
      return db().prepare(`
        SELECT id, title, description, content, type, year, longitude, latitude, media_json, created_at, updated_at
        FROM archives
        WHERE id = ?
      `).get(String(id))
    },

    insertLegacyArchive(archive) {
      db().prepare(`
        INSERT INTO archives
          (id, title, description, content, type, year, longitude, latitude, media_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
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
      )
    },

    updateLegacyArchive(id, archive) {
      db().prepare(`
        UPDATE archives
        SET title = ?, description = ?, content = ?, type = ?, year = ?,
            longitude = ?, latitude = ?, media_json = ?, updated_at = ?
        WHERE id = ?
      `).run(
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
      )
    },

    deleteLegacyArchive(id) {
      db().prepare('DELETE FROM archives WHERE id = ?').run(String(id))
    },

    findMessageRow(id) {
      return db().prepare(`
        SELECT id, name, identity, text, in_reply_to, created_at, ip
        FROM messages
        WHERE id = ?
      `).get(String(id))
    },

    deleteMessage(id) {
      db().prepare('DELETE FROM messages WHERE id = ?').run(String(id))
    },

    findCheckinProgressRow(visitorId) {
      return db().prepare(`
        SELECT visitor_id, visited_pois_json, updated_at
        FROM checkin_progress
        WHERE visitor_id = ?
      `).get(String(visitorId))
    },

    upsertCheckinProgress(visitorId, visitedPoisJson, updatedAt) {
      db().prepare(dialect.upsertCheckinProgressSql()).run(String(visitorId), String(visitedPoisJson), Number(updatedAt))
    },

    getTributeCount() {
      return db().prepare('SELECT count FROM tributes WHERE id = 1').get()?.count ?? null
    },

    setTributeCount(count) {
      db().prepare('UPDATE tributes SET count = ? WHERE id = 1').run(Number(count))
    },

    incrementTributeCount() {
      db().prepare('UPDATE tributes SET count = count + 1 WHERE id = 1').run()
    },

    findMediaAssetFileRowByRequestedPath(requestedPath) {
      return db().prepare(`
        SELECT storage_path, url, thumbnail_url
        FROM media_assets
        WHERE deleted_at IS NULL AND (url = ? OR thumbnail_url = ?)
        LIMIT 1
      `).get(String(requestedPath), String(requestedPath))
    },
  }
}

module.exports = {
  createRuntimeMiscStore,
}
