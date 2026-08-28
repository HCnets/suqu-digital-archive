const assert = require('assert')
const { getDatabaseConfig } = require('../db/config')
const { withMysqlConnection } = require('../db/mysql-primary-ops')
const { createMysqlContentReadStore } = require('../db/mysql-content-read-store')

async function main() {
  const config = getDatabaseConfig(process.env)
  const summary = {
    checkedAt: Date.now(),
    mysqlTarget: `${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`,
    media: {},
    contents: {},
    detail: {},
    workflows: {},
    reviewTasks: {},
    ok: false,
  }

  await withMysqlConnection(config, async (ops) => {
    const store = createMysqlContentReadStore({ ops })

    const media = await store.listMediaAssetRows({ pageSize: 10, offset: 0 })
    summary.media = {
      total: media.total,
      firstId: media.rows[0]?.id || null,
      firstUploader: media.rows[0]?.uploaded_by_username || '',
    }

    const contents = await store.listContentSummaryRows({ pageSize: 10, offset: 0 })
    const firstContentId = contents.rows[0]?.id || ''
    summary.contents = {
      total: contents.total,
      firstId: firstContentId || null,
      firstModuleKey: contents.rows[0]?.module_key || '',
      firstUpdatedBy: contents.rows[0]?.updated_by_username || '',
    }

    if (firstContentId) {
      const content = await store.findContentSummaryRow(firstContentId)
      const versions = await store.listContentVersionRows(firstContentId)
      const currentVersionId = content?.current_version_id || versions[0]?.id || ''
      const sources = await store.listContentSourceRows(firstContentId, currentVersionId)
      const pendingTask = await store.findPendingReviewTaskRow(firstContentId)
      const reviewTaskRows = await store.listContentReviewTaskRows(firstContentId)

      summary.detail = {
        contentId: firstContentId,
        title: content?.title || '',
        versionCount: versions.length,
        currentVersionId,
        sourceCount: sources.length,
        pendingTaskId: pendingTask?.id || null,
        reviewTaskCount: reviewTaskRows.length,
      }
    }

    const workflows = await store.listReviewWorkflowRows()
    const firstWorkflowId = workflows[0]?.id || ''
    const steps = firstWorkflowId ? await store.listWorkflowStepRows(firstWorkflowId) : []
    summary.workflows = {
      count: workflows.length,
      firstWorkflowId: firstWorkflowId || null,
      firstWorkflowStepCount: steps.length,
    }

    const pendingTasks = await store.listReviewTaskRows({ status: 'pending', limit: 20 })
    summary.reviewTasks = {
      pendingCount: pendingTasks.length,
      firstPendingId: pendingTasks[0]?.id || null,
      firstPendingStepName: pendingTasks[0]?.step_name || '',
    }
  })

  assert(summary.media.total >= 0)
  assert(summary.contents.total >= 0)
  assert(summary.workflows.count > 0)
  if (summary.contents.firstId) {
    assert(summary.detail.versionCount > 0)
    assert(summary.detail.reviewTaskCount >= 0)
  }
  assert(summary.reviewTasks.pendingCount >= 0)

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
