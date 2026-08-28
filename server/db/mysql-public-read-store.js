const { createSqlDialect } = require('./sql-dialect')

function createMysqlPublicReadStore({ ops }) {
  const dialect = createSqlDialect('mysql')
  const archiveYearSql = dialect.jsonNumber('v.data_json', '$.year')
  const archiveLegacyIdSql = dialect.jsonText('v.data_json', '$.legacyId')

  return {
    async listPublicContentRows({ whereSql = '', params = [], pageSize = 50, offset = 0 }) {
      const totalRow = await ops.get(`
        SELECT count(*) AS count
        FROM contents c
        JOIN content_versions v ON v.id = c.published_version_id
        ${whereSql}
      `, params)
      const rows = await ops.all(`
        SELECT c.*, m.name AS module_name, v.id AS version_id, v.version_number, v.title AS version_title,
               v.summary AS version_summary, v.body, v.data_json
        FROM contents c
        JOIN content_versions v ON v.id = c.published_version_id
        LEFT JOIN content_modules m ON m.module_key = c.module_key
        ${whereSql}
        ORDER BY c.published_at DESC, c.updated_at DESC
        LIMIT ? OFFSET ?
      `, [...params, Number(pageSize), Number(offset)])
      return {
        total: Number(totalRow?.count || 0),
        rows,
      }
    },

    async findPublishedContentRow(id) {
      return ops.get(`
        SELECT c.*, m.name AS module_name, v.id AS version_id, v.version_number, v.title AS version_title,
               v.summary AS version_summary, v.body, v.data_json
        FROM contents c
        JOIN content_versions v ON v.id = c.published_version_id
        LEFT JOIN content_modules m ON m.module_key = c.module_key
        WHERE c.id = ? AND c.status = 'published' AND c.published_version_id IS NOT NULL
      `, [String(id)])
    },

    async countPublicArchiveRows({ whereSql = '', params = [] }) {
      const row = await ops.get(`
        SELECT count(*) AS count
        FROM contents c
        JOIN content_versions v ON v.id = c.published_version_id
        ${whereSql}
      `, params)
      return Number(row?.count || 0)
    },

    async listPublicArchiveRows({ whereSql = '', params = [], pageSize = 100, offset = 0 }) {
      return ops.all(`
        SELECT c.*, v.id AS version_id, v.version_number, v.title AS version_title,
               v.summary AS version_summary, v.body, v.data_json
        FROM contents c
        JOIN content_versions v ON v.id = c.published_version_id
        ${whereSql}
        ORDER BY ${archiveYearSql} ASC, v.title ASC
        LIMIT ? OFFSET ?
      `, [...params, Number(pageSize), Number(offset)])
    },

    async findPublishedArchiveRow(id) {
      return ops.get(`
        SELECT c.*, v.id AS version_id, v.version_number, v.title AS version_title,
               v.summary AS version_summary, v.body, v.data_json
        FROM contents c
        JOIN content_versions v ON v.id = c.published_version_id
        WHERE c.module_key = 'archive'
          AND c.status = 'published'
          AND c.published_version_id IS NOT NULL
          AND (c.id = ? OR ${archiveLegacyIdSql} = ?)
      `, [String(id), String(id)])
    },

    async listPublicContentSourceRows(contentId) {
      return ops.all(`
        SELECT source_type, source_title, source_url, archive_ref, page_ref,
               collector, collected_at, trust_level, notes, created_at
        FROM content_sources
        WHERE content_id = ?
        ORDER BY created_at ASC
      `, [String(contentId)])
    },

    async listPublicContentSourceRowsByContentIds(contentIds) {
      if (!contentIds.length) return []
      const placeholders = contentIds.map(() => '?').join(', ')
      return ops.all(`
        SELECT content_id, source_type, source_title, source_url, archive_ref, page_ref,
               collector, collected_at, trust_level, notes, created_at
        FROM content_sources
        WHERE content_id IN (${placeholders})
        ORDER BY created_at ASC
      `, contentIds)
    },
  }
}

module.exports = {
  createMysqlPublicReadStore,
}
