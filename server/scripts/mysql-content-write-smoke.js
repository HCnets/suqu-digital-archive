const assert = require('assert')
const { getDatabaseConfig } = require('../db/config')
const { withMysqlConnection, withMysqlRollbackTransaction } = require('../db/mysql-primary-ops')
const { createMysqlContentReadStore } = require('../db/mysql-content-read-store')
const { createMysqlContentWriteStore } = require('../db/mysql-content-write-store')

async function main() {
  const config = getDatabaseConfig(process.env)
  const summary = {
    checkedAt: Date.now(),
    mysqlTarget: `${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`,
    writes: {},
    rollback: {},
    ok: false,
  }

  const txResult = await withMysqlRollbackTransaction(config, async (ops) => {
    const readStore = createMysqlContentReadStore({ ops })
    const writeStore = createMysqlContentWriteStore({ ops })
    const now = Date.now()

    const contentId = `content-mysql-write-${now}`
    const versionId = `version-mysql-write-${now}`
    const versionId2 = `version-mysql-write-${now}-2`
    const reviewId = `review-mysql-write-${now}`
    const mediaId = `media-mysql-write-${now}`

    await writeStore.insertContent({
      id: contentId,
      moduleKey: 'archive',
      category: 'revolution',
      tagsJson: JSON.stringify(['mysql', 'write-smoke']),
      status: 'draft',
      title: 'MySQL 写链路烟测内容',
      summary: 'rollback only',
      sensitiveLevel: 'attention',
      riskTypesJson: JSON.stringify(['AI 生成待审']),
      currentVersionId: versionId,
      publishedVersionId: null,
      workflowId: 'workflow-archive-default',
      currentStepId: null,
      createdBy: 'user-1784095828451-8fd7222c',
      updatedBy: 'user-1784095828451-8fd7222c',
      submittedAt: null,
      publishedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    })

    await writeStore.insertContentVersion({
      id: versionId,
      contentId,
      versionNumber: 1,
      title: 'MySQL 写链路烟测内容',
      summary: 'rollback only',
      body: '第一版正文',
      dataJson: JSON.stringify({ regionId: 'region-suqu', longitude: 114.5, latitude: 23.6 }),
      createdBy: 'user-1784095828451-8fd7222c',
      createdAt: now,
    })

    await writeStore.replaceContentSources(contentId, versionId, [{
      id: `source-mysql-write-${now}-1`,
      sourceType: 'document',
      sourceTitle: '第一版来源',
      sourceUrl: '',
      archiveRef: '',
      pageRef: '1',
      collector: 'mysql-smoke',
      collectedAt: '2026-07-16',
      trustLevel: 'high',
      attachmentMediaId: '',
      notes: 'rollback only',
      createdAt: now,
    }])

    await writeStore.insertReviewTask({
      id: reviewId,
      contentId,
      versionId,
      workflowId: 'workflow-archive-default',
      stepId: 'step-archive-review',
      status: 'pending',
      assigneeRoleId: 'reviewer',
      reviewerId: null,
      comment: '',
      createdAt: now,
      reviewedAt: null,
    })

    await writeStore.insertMediaAsset({
      id: mediaId,
      originalName: 'mysql-write.png',
      storedName: 'mysql-write.png',
      mediaType: 'image',
      mimeType: 'image/png',
      extension: '.png',
      sizeBytes: 1024,
      width: 320,
      height: 240,
      durationSeconds: null,
      category: 'smoke',
      altText: 'rollback media',
      caption: 'rollback media',
      originalUrl: '',
      url: `/uploads/${mediaId}.png`,
      thumbnailUrl: '',
      originalStoragePath: '',
      storagePath: `C:/tmp/${mediaId}.png`,
      checksumSha256: `checksum-${mediaId}`,
      watermarkText: '',
      autoCompress: 0,
      processingStatus: 'stored',
      processingNote: '',
      uploadedBy: 'user-1784095828451-8fd7222c',
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    })

    await writeStore.updateContentVersion(versionId, {
      title: 'MySQL 写链路烟测内容已更新',
      summary: 'rollback only updated',
      body: '第一版正文已更新',
      dataJson: JSON.stringify({ regionId: 'region-suqu', longitude: 114.55, latitude: 23.65 }),
      createdBy: 'user-1784095828451-8fd7222c',
      createdAt: now + 1,
    })

    await writeStore.insertContentVersion({
      id: versionId2,
      contentId,
      versionNumber: 2,
      title: 'MySQL 写链路烟测内容第二版',
      summary: 'rollback only v2',
      body: '第二版正文',
      dataJson: JSON.stringify({ regionId: 'region-suqu', longitude: 114.56, latitude: 23.66 }),
      createdBy: 'user-1784095828451-8fd7222c',
      createdAt: now + 2,
    })

    await writeStore.updateContentFields(contentId, {
      title: 'MySQL 写链路烟测内容已升级',
      summary: 'rollback only upgraded',
      tagsJson: JSON.stringify(['mysql', 'write-smoke', 'updated']),
      currentVersionId: versionId2,
      updatedAt: now + 2,
    })

    await writeStore.replaceContentSources(contentId, versionId2, [{
      id: `source-mysql-write-${now}-2`,
      sourceType: 'interview',
      sourceTitle: '第二版来源',
      sourceUrl: '',
      archiveRef: '',
      pageRef: '2',
      collector: 'mysql-smoke',
      collectedAt: '2026-07-16',
      trustLevel: 'normal',
      attachmentMediaId: mediaId,
      notes: 'rollback only second',
      createdAt: now + 2,
    }])

    await writeStore.updateReviewTaskFields(reviewId, {
      status: 'approved',
      reviewerId: 'user-1784095828451-8fd7222c',
      comment: 'rollback only',
      reviewedAt: now + 3,
    })

    await writeStore.insertReviewTask({
      id: `${reviewId}-pending`,
      contentId,
      versionId: versionId2,
      workflowId: 'workflow-archive-default',
      stepId: 'step-archive-final',
      status: 'pending',
      assigneeRoleId: 'super_admin',
      reviewerId: null,
      comment: '',
      createdAt: now + 4,
      reviewedAt: null,
    })
    await writeStore.cancelPendingReviewTasks(contentId)

    await writeStore.updateMediaAssetFields(mediaId, {
      category: 'smoke-updated',
      altText: 'rollback media updated',
      caption: 'rollback media updated',
      watermarkText: 'WATERMARK',
      autoCompress: 1,
      updatedAt: now + 5,
    })

    const content = await readStore.findContentSummaryRow(contentId)
    const versions = await readStore.listContentVersionRows(contentId)
    const sources = await readStore.listContentSourceRows(contentId, versionId2)
    const pendingTask = await readStore.findPendingReviewTaskRow(contentId)
    const reviewTasks = await readStore.listContentReviewTaskRows(contentId)
    const media = await readStore.findMediaAssetRow(mediaId)

    return {
      contentId,
      mediaId,
      contentTitle: content?.title || '',
      currentVersionId: content?.current_version_id || '',
      versionCount: versions.length,
      sourceCount: sources.length,
      pendingTaskId: pendingTask?.id || null,
      reviewTaskStatuses: reviewTasks.map((row) => row.status),
      mediaCategory: media?.category || '',
      mediaAutoCompress: Number(media?.auto_compress || 0),
    }
  })

  summary.writes = txResult

  await withMysqlConnection(config, async (ops) => {
    const readStore = createMysqlContentReadStore({ ops })
    const content = await readStore.findContentSummaryRow(txResult.contentId)
    const versions = await readStore.listContentVersionRows(txResult.contentId)
    const reviewTasks = await readStore.listContentReviewTaskRows(txResult.contentId)
    const media = await readStore.findMediaAssetRow(txResult.mediaId)

    summary.rollback = {
      contentReverted: !content,
      versionReverted: versions.length === 0,
      reviewTaskReverted: reviewTasks.length === 0,
      mediaReverted: !media,
    }
  })

  assert.strictEqual(summary.writes.contentTitle, 'MySQL 写链路烟测内容已升级')
  assert(summary.writes.currentVersionId.endsWith('-2'))
  assert.strictEqual(summary.writes.versionCount, 2)
  assert.strictEqual(summary.writes.sourceCount, 1)
  assert.strictEqual(summary.writes.pendingTaskId, null)
  assert(summary.writes.reviewTaskStatuses.includes('approved'))
  assert(summary.writes.reviewTaskStatuses.includes('cancelled'))
  assert.strictEqual(summary.writes.mediaCategory, 'smoke-updated')
  assert.strictEqual(summary.writes.mediaAutoCompress, 1)
  assert(summary.rollback.contentReverted)
  assert(summary.rollback.versionReverted)
  assert(summary.rollback.reviewTaskReverted)
  assert(summary.rollback.mediaReverted)

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
