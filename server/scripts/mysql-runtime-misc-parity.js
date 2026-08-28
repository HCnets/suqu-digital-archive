const assert = require('assert')
const { DatabaseSync } = require('node:sqlite')
const { getDatabaseConfig } = require('../db/config')
const { createRuntimeMiscStore } = require('../db/runtime-misc-store')
const { withMysqlConnection } = require('../db/mysql-primary-ops')
const { createMysqlRuntimeMiscStore } = require('../db/mysql-runtime-misc-store')

async function main() {
  const config = getDatabaseConfig(process.env)
  const sqlite = new DatabaseSync(config.sqlite.file)
  const sqliteStore = createRuntimeMiscStore({ getDb: () => sqlite, dbClient: 'sqlite' })
  const summary = {
    checkedAt: Date.now(),
    sqliteFile: config.sqlite.file,
    mysqlTarget: `${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`,
    modules: null,
    riskTags: null,
    reviewRecords: null,
    workflows: null,
    publicArchiveMap: null,
    publicMessages: null,
    legacyArchives: null,
    legacyMessage: null,
    checkin: null,
    tribute: null,
    mediaLookup: null,
    ok: false,
  }

  try {
    await withMysqlConnection(config, async (ops) => {
      const mysqlStore = createMysqlRuntimeMiscStore({ ops })

      const sqliteModules = sqliteStore.listContentModuleRows()
      const mysqlModules = await mysqlStore.listContentModuleRows()
      const sqliteArchiveModule = sqliteStore.findContentModuleRow('archive')
      const mysqlArchiveModule = await mysqlStore.findContentModuleRow('archive')
      summary.modules = {
        sqliteKeys: sqliteModules.map((row) => row.module_key),
        mysqlKeys: mysqlModules.map((row) => row.module_key),
        sqliteArchiveFlags: pickModuleFlags(sqliteArchiveModule),
        mysqlArchiveFlags: pickModuleFlags(mysqlArchiveModule),
      }

      const sqliteRiskTags = sqliteStore.listRiskTagTemplateRows({ includeInactive: true })
      const mysqlRiskTags = await mysqlStore.listRiskTagTemplateRows({ includeInactive: true })
      const sqliteActiveRiskTags = sqliteStore.listActiveRiskTagTemplateRows()
      const mysqlActiveRiskTags = await mysqlStore.listActiveRiskTagTemplateRows()
      summary.riskTags = {
        sqliteAllIds: sqliteRiskTags.map((row) => row.id),
        mysqlAllIds: mysqlRiskTags.map((row) => row.id),
        sqliteActiveIds: sqliteActiveRiskTags.map((row) => row.id),
        mysqlActiveIds: mysqlActiveRiskTags.map((row) => row.id),
      }

      const sqliteReviewRecords = sqliteStore.listReviewRecordRows(200)
      const mysqlReviewRecords = await mysqlStore.listReviewRecordRows(200)
      summary.reviewRecords = {
        sqliteIds: sqliteReviewRecords.map((row) => row.id),
        mysqlIds: mysqlReviewRecords.map((row) => row.id),
      }

      const sqliteArchiveWorkflow = sqliteStore.findWorkflowRow('archive')
      const mysqlArchiveWorkflow = await mysqlStore.findWorkflowRow('archive')
      const sqliteFallbackWorkflow = sqliteStore.findWorkflowRow('__missing__')
      const mysqlFallbackWorkflow = await mysqlStore.findWorkflowRow('__missing__')
      summary.workflows = {
        sqliteArchiveWorkflowId: sqliteArchiveWorkflow?.id || null,
        mysqlArchiveWorkflowId: mysqlArchiveWorkflow?.id || null,
        sqliteFallbackWorkflowId: sqliteFallbackWorkflow?.id || null,
        mysqlFallbackWorkflowId: mysqlFallbackWorkflow?.id || null,
      }

      const sqliteMapRows = sqliteStore.listPublicArchiveMapRows()
      const mysqlMapRows = await mysqlStore.listPublicArchiveMapRows()
      summary.publicArchiveMap = {
        sqliteIds: sqliteMapRows.map((row) => row.id),
        mysqlIds: mysqlMapRows.map((row) => row.id),
      }

      const sqlitePublicMessageSeed = sqliteStore.listPublicMessageRows({ pageSize: 20, offset: 0 })
      const mysqlPublicMessageSeed = await mysqlStore.listPublicMessageRows({ pageSize: 20, offset: 0 })
      const sqlitePublicMessages = sqliteStore.listPublicMessageRows({
        pageSize: Math.max(20, sqlitePublicMessageSeed.total),
        offset: 0,
      })
      const mysqlPublicMessages = await mysqlStore.listPublicMessageRows({
        pageSize: Math.max(20, mysqlPublicMessageSeed.total),
        offset: 0,
      })
      summary.publicMessages = {
        sqliteTotal: sqlitePublicMessages.total,
        mysqlTotal: mysqlPublicMessages.total,
        sqliteIds: sqlitePublicMessages.rows.map((row) => row.id),
        mysqlIds: mysqlPublicMessages.rows.map((row) => row.id),
      }

      const sqliteLegacyCount = sqliteStore.countLegacyArchiveRows({})
      const mysqlLegacyCount = await mysqlStore.countLegacyArchiveRows({})
      const sqliteLegacyRows = sqliteStore.listLegacyArchiveRows({ pageSize: Math.max(20, sqliteLegacyCount), offset: 0 })
      const mysqlLegacyRows = await mysqlStore.listLegacyArchiveRows({ pageSize: Math.max(20, mysqlLegacyCount), offset: 0 })
      const targetLegacyId = sqliteLegacyRows[0]?.id || ''
      const sqliteLegacyDetail = targetLegacyId ? sqliteStore.findLegacyArchiveRow(targetLegacyId) : null
      const mysqlLegacyDetail = targetLegacyId ? await mysqlStore.findLegacyArchiveRow(targetLegacyId) : null
      summary.legacyArchives = {
        sqliteTotal: sqliteLegacyCount,
        mysqlTotal: mysqlLegacyCount,
        sqliteIds: sqliteLegacyRows.map((row) => row.id),
        mysqlIds: mysqlLegacyRows.map((row) => row.id),
        targetLegacyId: targetLegacyId || null,
        sqliteTargetTitle: sqliteLegacyDetail?.title || '',
        mysqlTargetTitle: mysqlLegacyDetail?.title || '',
      }

      const sqliteMessageId = sqlite.prepare('SELECT id FROM messages ORDER BY created_at DESC LIMIT 1').get()?.id || ''
      if (sqliteMessageId) {
        const sqliteMessage = sqliteStore.findMessageRow(sqliteMessageId)
        const mysqlMessage = await mysqlStore.findMessageRow(sqliteMessageId)
        summary.legacyMessage = {
          id: sqliteMessageId,
          sqliteName: sqliteMessage?.name || '',
          mysqlName: mysqlMessage?.name || '',
          sqliteText: sqliteMessage?.text || '',
          mysqlText: mysqlMessage?.text || '',
        }
      }

      const sqliteVisitorId = sqlite.prepare('SELECT visitor_id FROM checkin_progress ORDER BY updated_at DESC LIMIT 1').get()?.visitor_id || ''
      if (sqliteVisitorId) {
        const sqliteCheckin = sqliteStore.findCheckinProgressRow(sqliteVisitorId)
        const mysqlCheckin = await mysqlStore.findCheckinProgressRow(sqliteVisitorId)
        summary.checkin = {
          visitorId: sqliteVisitorId,
          sqliteVisitedPoisJson: sqliteCheckin?.visited_pois_json || '',
          mysqlVisitedPoisJson: mysqlCheckin?.visited_pois_json || '',
        }
      }

      const sqliteTribute = sqliteStore.getTributeCount()
      const mysqlTribute = await mysqlStore.getTributeCount()
      summary.tribute = {
        sqliteCount: sqliteTribute,
        mysqlCount: mysqlTribute,
      }

      const requestedPath = sqlite.prepare(`
        SELECT url
        FROM media_assets
        WHERE deleted_at IS NULL AND url IS NOT NULL AND url <> ''
        ORDER BY created_at DESC
        LIMIT 1
      `).get()?.url || ''
      if (requestedPath) {
        const sqliteMedia = sqliteStore.findMediaAssetFileRowByRequestedPath(requestedPath)
        const mysqlMedia = await mysqlStore.findMediaAssetFileRowByRequestedPath(requestedPath)
        summary.mediaLookup = {
          requestedPath,
          sqliteUrl: sqliteMedia?.url || '',
          mysqlUrl: mysqlMedia?.url || '',
          sqliteStoragePath: sqliteMedia?.storage_path || '',
          mysqlStoragePath: mysqlMedia?.storage_path || '',
        }
      }
    })
  } finally {
    try { sqlite.close() } catch {}
  }

  assert.deepStrictEqual(summary.modules.sqliteKeys, summary.modules.mysqlKeys)
  assert.deepStrictEqual(summary.modules.sqliteArchiveFlags, summary.modules.mysqlArchiveFlags)
  assert.deepStrictEqual(sortStrings(summary.riskTags.sqliteAllIds), sortStrings(summary.riskTags.mysqlAllIds))
  assert.deepStrictEqual(sortStrings(summary.riskTags.sqliteActiveIds), sortStrings(summary.riskTags.mysqlActiveIds))
  assert.deepStrictEqual(summary.reviewRecords.sqliteIds, summary.reviewRecords.mysqlIds)
  assert.strictEqual(summary.workflows.sqliteArchiveWorkflowId, summary.workflows.mysqlArchiveWorkflowId)
  assert.strictEqual(summary.workflows.sqliteFallbackWorkflowId, summary.workflows.mysqlFallbackWorkflowId)
  assert.deepStrictEqual(sortStrings(summary.publicArchiveMap.sqliteIds), sortStrings(summary.publicArchiveMap.mysqlIds))
  assert.strictEqual(summary.publicMessages.sqliteTotal, summary.publicMessages.mysqlTotal)
  assert.deepStrictEqual(sortStrings(summary.publicMessages.sqliteIds), sortStrings(summary.publicMessages.mysqlIds))
  assert.strictEqual(summary.legacyArchives.sqliteTotal, summary.legacyArchives.mysqlTotal)
  assert.deepStrictEqual(sortStrings(summary.legacyArchives.sqliteIds), sortStrings(summary.legacyArchives.mysqlIds))
  assert.strictEqual(summary.legacyArchives.sqliteTargetTitle, summary.legacyArchives.mysqlTargetTitle)
  if (summary.legacyMessage) {
    assert.strictEqual(summary.legacyMessage.sqliteName, summary.legacyMessage.mysqlName)
    assert.strictEqual(summary.legacyMessage.sqliteText, summary.legacyMessage.mysqlText)
  }
  if (summary.checkin) {
    assert.strictEqual(summary.checkin.sqliteVisitedPoisJson, summary.checkin.mysqlVisitedPoisJson)
  }
  assert.strictEqual(summary.tribute.sqliteCount, summary.tribute.mysqlCount)
  if (summary.mediaLookup) {
    assert.strictEqual(summary.mediaLookup.sqliteUrl, summary.mediaLookup.mysqlUrl)
    assert.strictEqual(summary.mediaLookup.sqliteStoragePath, summary.mediaLookup.mysqlStoragePath)
  }

  summary.ok = true
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(JSON.stringify({
    checkedAt: Date.now(),
    ok: false,
    error: error.message,
  }, null, 2))
  process.exit(1)
})

function pickModuleFlags(row) {
  return row ? {
    map: Number(row.default_publish_map || 0),
    list: Number(row.default_publish_list || 0),
    home: Number(row.default_publish_home || 0),
    topic: Number(row.default_publish_topic || 0),
    guide: Number(row.default_publish_guide || 0),
  } : null
}

function sortStrings(values) {
  return [...values].sort((a, b) => String(a).localeCompare(String(b)))
}
