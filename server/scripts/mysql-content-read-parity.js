const assert = require('assert')
const { DatabaseSync } = require('node:sqlite')
const { getDatabaseConfig } = require('../db/config')
const { createContentReadStore } = require('../db/content-read-store')
const { withMysqlConnection } = require('../db/mysql-primary-ops')
const { createMysqlContentReadStore } = require('../db/mysql-content-read-store')

async function main() {
  const config = getDatabaseConfig(process.env)
  const sqlite = new DatabaseSync(config.sqlite.file)
  const sqliteStore = createContentReadStore({ getDb: () => sqlite })
  const summary = {
    checkedAt: Date.now(),
    sqliteFile: config.sqlite.file,
    mysqlTarget: `${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`,
    media: null,
    contents: null,
    detail: null,
    workflows: null,
    reviewTasks: null,
    ok: false,
  }

  try {
    await withMysqlConnection(config, async (ops) => {
      const mysqlStore = createMysqlContentReadStore({ ops })

      const sqliteMediaSeed = sqliteStore.listMediaAssetRows({ pageSize: 10, offset: 0 })
      const mysqlMediaSeed = await mysqlStore.listMediaAssetRows({ pageSize: 10, offset: 0 })
      const sqliteMedia = sqliteStore.listMediaAssetRows({ pageSize: Math.max(10, sqliteMediaSeed.total), offset: 0 })
      const mysqlMedia = await mysqlStore.listMediaAssetRows({ pageSize: Math.max(10, mysqlMediaSeed.total), offset: 0 })
      summary.media = {
        sqliteTotal: sqliteMedia.total,
        mysqlTotal: mysqlMedia.total,
        sqliteIds: sqliteMedia.rows.map((row) => row.id),
        mysqlIds: mysqlMedia.rows.map((row) => row.id),
      }

      const sqliteContentsSeed = sqliteStore.listContentSummaryRows({ pageSize: 10, offset: 0 })
      const mysqlContentsSeed = await mysqlStore.listContentSummaryRows({ pageSize: 10, offset: 0 })
      const sqliteContents = sqliteStore.listContentSummaryRows({ pageSize: Math.max(10, sqliteContentsSeed.total), offset: 0 })
      const mysqlContents = await mysqlStore.listContentSummaryRows({ pageSize: Math.max(10, mysqlContentsSeed.total), offset: 0 })
      summary.contents = {
        sqliteTotal: sqliteContents.total,
        mysqlTotal: mysqlContents.total,
        sqliteIds: sqliteContents.rows.map((row) => row.id),
        mysqlIds: mysqlContents.rows.map((row) => row.id),
        sqliteFirstId: sqliteContents.rows[0]?.id || null,
        mysqlFirstId: mysqlContents.rows[0]?.id || null,
      }

      const targetContentId = summary.contents.sqliteIds[0] || ''
      if (targetContentId) {
        const sqliteContent = sqliteStore.findContentSummaryRow(targetContentId)
        const mysqlContent = await mysqlStore.findContentSummaryRow(targetContentId)
        const sqliteVersions = sqliteStore.listContentVersionRows(targetContentId)
        const mysqlVersions = await mysqlStore.listContentVersionRows(targetContentId)
        const currentVersionId = sqliteContent?.current_version_id || ''
        const sqliteSources = sqliteStore.listContentSourceRows(targetContentId, currentVersionId)
        const mysqlSources = await mysqlStore.listContentSourceRows(targetContentId, currentVersionId)
        const sqlitePending = sqliteStore.findPendingReviewTaskRow(targetContentId)
        const mysqlPending = await mysqlStore.findPendingReviewTaskRow(targetContentId)
        const sqliteReviewRows = sqliteStore.listContentReviewTaskRows(targetContentId)
        const mysqlReviewRows = await mysqlStore.listContentReviewTaskRows(targetContentId)

        summary.detail = {
          contentId: targetContentId,
          sqliteTitle: sqliteContent?.title || '',
          mysqlTitle: mysqlContent?.title || '',
          sqliteVersionIds: sqliteVersions.map((row) => row.id),
          mysqlVersionIds: mysqlVersions.map((row) => row.id),
          sqliteSourceIds: sqliteSources.map((row) => row.id),
          mysqlSourceIds: mysqlSources.map((row) => row.id),
          sqlitePendingTaskId: sqlitePending?.id || null,
          mysqlPendingTaskId: mysqlPending?.id || null,
          sqliteReviewTaskIds: sqliteReviewRows.map((row) => row.id),
          mysqlReviewTaskIds: mysqlReviewRows.map((row) => row.id),
        }
      }

      const sqliteWorkflows = sqliteStore.listReviewWorkflowRows()
      const mysqlWorkflows = await mysqlStore.listReviewWorkflowRows()
      const targetWorkflowId = sqliteWorkflows[0]?.id || ''
      const sqliteWorkflowSteps = targetWorkflowId ? sqliteStore.listWorkflowStepRows(targetWorkflowId) : []
      const mysqlWorkflowSteps = targetWorkflowId ? await mysqlStore.listWorkflowStepRows(targetWorkflowId) : []
      summary.workflows = {
        sqliteWorkflowIds: sqliteWorkflows.map((row) => row.id),
        mysqlWorkflowIds: mysqlWorkflows.map((row) => row.id),
        targetWorkflowId: targetWorkflowId || null,
        sqliteStepIds: sqliteWorkflowSteps.map((row) => row.id),
        mysqlStepIds: mysqlWorkflowSteps.map((row) => row.id),
      }

      const sqlitePendingTasks = sqliteStore.listReviewTaskRows({ status: 'pending', limit: 20 })
      const mysqlPendingTasks = await mysqlStore.listReviewTaskRows({ status: 'pending', limit: 20 })
      summary.reviewTasks = {
        sqlitePendingIds: sqlitePendingTasks.map((row) => row.id),
        mysqlPendingIds: mysqlPendingTasks.map((row) => row.id),
      }
    })
  } finally {
    try { sqlite.close() } catch {}
  }

  assert.strictEqual(summary.media.sqliteTotal, summary.media.mysqlTotal)
  assert.deepStrictEqual(summary.media.sqliteIds, summary.media.mysqlIds)
  assert.strictEqual(summary.contents.sqliteTotal, summary.contents.mysqlTotal)
  assert.strictEqual(summary.contents.sqliteFirstId, summary.contents.mysqlFirstId)
  assert.deepStrictEqual(sortStrings(summary.contents.sqliteIds), sortStrings(summary.contents.mysqlIds))
  if (summary.detail) {
    assert.strictEqual(summary.detail.sqliteTitle, summary.detail.mysqlTitle)
    assert.deepStrictEqual(summary.detail.sqliteVersionIds, summary.detail.mysqlVersionIds)
    assert.deepStrictEqual(summary.detail.sqliteSourceIds, summary.detail.mysqlSourceIds)
    assert.strictEqual(summary.detail.sqlitePendingTaskId, summary.detail.mysqlPendingTaskId)
    assert.deepStrictEqual(summary.detail.sqliteReviewTaskIds, summary.detail.mysqlReviewTaskIds)
  }
  assert.deepStrictEqual(sortStrings(summary.workflows.sqliteWorkflowIds), sortStrings(summary.workflows.mysqlWorkflowIds))
  assert.deepStrictEqual(sortStrings(summary.workflows.sqliteStepIds), sortStrings(summary.workflows.mysqlStepIds))
  assert.deepStrictEqual(sortStrings(summary.reviewTasks.sqlitePendingIds), sortStrings(summary.reviewTasks.mysqlPendingIds))

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

function sortStrings(values) {
  return [...values].sort((a, b) => String(a).localeCompare(String(b)))
}
