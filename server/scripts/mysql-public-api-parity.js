const assert = require('assert')
const { getDatabaseConfig } = require('../db/config')
const { withMysqlConnection } = require('../db/mysql-primary-ops')
const { createMysqlPublicReadStore } = require('../db/mysql-public-read-store')
const { createSqlDialect } = require('../db/sql-dialect')

const BASE_URL = process.env.PUBLIC_API_BASE_URL || 'http://localhost:3001'

async function main() {
  const config = getDatabaseConfig(process.env)
  const dialect = createSqlDialect('mysql')
  const summary = {
    checkedAt: Date.now(),
    baseUrl: BASE_URL,
    mysqlTarget: `${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`,
    contents: null,
    oralHistory: null,
    archives: null,
    archiveDetail: null,
    ok: false,
  }

  const apiContents = await fetchJson(`${BASE_URL}/api/contents?page=1&pageSize=5`)
  const apiOralHistory = await fetchJson(`${BASE_URL}/api/contents?moduleKey=oral_history&page=1&pageSize=5`)
  const apiArchives = await fetchJson(`${BASE_URL}/api/archives?page=1&pageSize=5`)

  await withMysqlConnection(config, async (ops) => {
    const store = createMysqlPublicReadStore({ ops })

    const baseContentWhere = "WHERE c.status = 'published' AND c.published_version_id IS NOT NULL"
    const baseContentRows = await store.listPublicContentRows({
      whereSql: baseContentWhere,
      params: [],
      pageSize: 5,
      offset: 0,
    })
    summary.contents = {
      apiTotal: Number(apiContents.total || 0),
      mysqlTotal: Number(baseContentRows.total || 0),
      apiIds: extractIds(apiContents.items),
      mysqlIds: extractIds(baseContentRows.rows),
    }

    const oralWhere = `WHERE c.status = 'published' AND c.published_version_id IS NOT NULL AND c.module_key = 'oral_history' AND ${dialect.jsonText('v.data_json', '$.authorizationStatus')} = 'authorized'`
    const oralRows = await store.listPublicContentRows({
      whereSql: oralWhere,
      params: [],
      pageSize: 5,
      offset: 0,
    })
    summary.oralHistory = {
      apiTotal: Number(apiOralHistory.total || 0),
      mysqlRowsVisible: extractAuthorizedIds(oralRows.rows).length,
      apiIds: extractIds(apiOralHistory.items),
      mysqlIds: extractAuthorizedIds(oralRows.rows),
    }

    const mapPublishTypeSql = dialect.jsonType('v.data_json', '$.publishPositions.map')
    const mapPublishFlagSql = dialect.jsonText('v.data_json', '$.publishPositions.map')
    const legacyMapPublishFlagSql = dialect.jsonText('v.data_json', '$.publish_positions.map')
    const longitudeSql = dialect.jsonNumber('v.data_json', '$.longitude')
    const latitudeSql = dialect.jsonNumber('v.data_json', '$.latitude')
    const archiveWhere = `WHERE c.module_key = 'archive' AND c.status = 'published' AND c.published_version_id IS NOT NULL
      AND (${mapPublishTypeSql} IS NULL OR ${mapPublishFlagSql} != '0' OR ${legacyMapPublishFlagSql} != '0')
      AND (${longitudeSql} BETWEEN -180 AND 180 AND ${latitudeSql} BETWEEN -90 AND 90 AND NOT (${longitudeSql} = 0 AND ${latitudeSql} = 0))`
    const archiveCount = await store.countPublicArchiveRows({ whereSql: archiveWhere, params: [] })
    const archiveRows = await store.listPublicArchiveRows({
      whereSql: archiveWhere,
      params: [],
      pageSize: 5,
      offset: 0,
    })

    summary.archives = {
      apiTotal: Array.isArray(apiArchives.items) ? Number(apiArchives.total || 0) : Array.isArray(apiArchives) ? apiArchives.length : 0,
      mysqlTotal: archiveCount,
      apiIds: extractArchiveIds(apiArchives),
      mysqlIds: archiveRows.map((row) => extractArchiveId(row)).filter(Boolean),
    }

    const archiveId = summary.archives.apiIds[0]
    if (archiveId) {
      const apiArchiveDetail = await fetchJson(`${BASE_URL}/api/archives/${encodeURIComponent(archiveId)}`)
      const mysqlArchiveDetail = await store.findPublishedArchiveRow(archiveId)
      const mysqlSources = mysqlArchiveDetail ? await store.listPublicContentSourceRows(mysqlArchiveDetail.id) : []
      summary.archiveDetail = {
        id: archiveId,
        apiTitle: apiArchiveDetail.title || '',
        mysqlTitle: mysqlArchiveDetail?.version_title || mysqlArchiveDetail?.title || '',
        apiSourceCount: Array.isArray(apiArchiveDetail.sources) ? apiArchiveDetail.sources.length : 0,
        mysqlSourceCount: mysqlSources.length,
      }
    }
  })

  assert.strictEqual(summary.contents.apiTotal, summary.contents.mysqlTotal)
  assert.deepStrictEqual(summary.contents.apiIds, summary.contents.mysqlIds)
  assert.strictEqual(summary.oralHistory.apiTotal, summary.oralHistory.mysqlRowsVisible)
  assert.deepStrictEqual(summary.oralHistory.apiIds, summary.oralHistory.mysqlIds)
  assert.strictEqual(summary.archives.apiTotal, summary.archives.mysqlTotal)
  assert.deepStrictEqual(summary.archives.apiIds, summary.archives.mysqlIds)
  if (summary.archiveDetail) {
    assert.strictEqual(summary.archiveDetail.apiTitle, summary.archiveDetail.mysqlTitle)
    assert.strictEqual(summary.archiveDetail.apiSourceCount, summary.archiveDetail.mysqlSourceCount)
  }

  summary.ok = true
  console.log(JSON.stringify(summary, null, 2))
}

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }
  return response.json()
}

function extractIds(items) {
  return Array.isArray(items) ? items.map((item) => item?.id).filter(Boolean) : []
}

function extractAuthorizedIds(rows) {
  return rows
    .filter((row) => {
      const data = safeJsonValue(row.data_json) || {}
      return data.authorizationStatus === 'authorized' || data.authorization_status === 'authorized'
    })
    .map((row) => row.id)
    .filter(Boolean)
}

function extractArchiveIds(payload) {
  if (Array.isArray(payload?.items)) return payload.items.map((item) => item?.id).filter(Boolean)
  if (Array.isArray(payload)) return payload.map((item) => item?.id).filter(Boolean)
  return []
}

function extractArchiveId(row) {
  const data = safeJsonValue(row?.data_json) || {}
  return data.legacyId || row?.id || ''
}

function safeJsonValue(value) {
  if (!value) return null
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    checkedAt: Date.now(),
    ok: false,
    error: error.message,
  }, null, 2))
  process.exit(1)
})
