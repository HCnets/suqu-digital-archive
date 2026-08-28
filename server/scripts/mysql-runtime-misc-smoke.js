const assert = require('assert')
const { getDatabaseConfig } = require('../db/config')
const { withMysqlConnection, withMysqlRollbackTransaction } = require('../db/mysql-primary-ops')
const { createMysqlRuntimeMiscStore } = require('../db/mysql-runtime-misc-store')

async function main() {
  const config = getDatabaseConfig(process.env)
  const summary = {
    checkedAt: Date.now(),
    mysqlTarget: `${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`,
    reads: {},
    writes: {},
    rollback: {},
    ok: false,
  }

  await withMysqlConnection(config, async (ops) => {
    const store = createMysqlRuntimeMiscStore({ ops })
    const modules = await store.listContentModuleRows()
    const risks = await store.listRiskTagTemplateRows({ includeInactive: true })
    const reviewRecords = await store.listReviewRecordRows(20)
    const workflow = await store.findWorkflowRow('archive')
    const mapRows = await store.listPublicArchiveMapRows()
    const publicMessages = await store.listPublicMessageRows({ pageSize: 10, offset: 0 })

    summary.reads = {
      moduleCount: modules.length,
      riskTagCount: risks.length,
      reviewRecordCount: reviewRecords.length,
      archiveWorkflowId: workflow?.id || null,
      mapArchiveCount: mapRows.length,
      publicMessageCount: publicMessages.total,
    }
  })

  const txSummary = await withMysqlRollbackTransaction(config, async (ops) => {
    const store = createMysqlRuntimeMiscStore({ ops })
    const now = Date.now()
    const moduleBefore = await store.findContentModuleRow('archive')
    const originalModuleFlags = pickModuleFlags(moduleBefore)
    const originalTribute = await store.getTributeCount()

    const riskId = `risk-mysql-misc-${now}`
    const riskDeleteId = `risk-mysql-misc-delete-${now}`
    const archiveId = `legacy-mysql-misc-${now}`
    const archiveDeleteId = `legacy-mysql-misc-delete-${now}`
    const messageId = `message-mysql-misc-${now}`
    const visitorId = `visitor-mysql-misc-${now}`

    await store.updateContentModuleDefaultPublishPositions('archive', {
      map: !originalModuleFlags.map,
      list: !originalModuleFlags.list,
      home: !originalModuleFlags.home,
      topic: !originalModuleFlags.topic,
      guide: !originalModuleFlags.guide,
    })
    const moduleAfter = await store.findContentModuleRow('archive')

    await store.insertRiskTagTemplate({
      id: riskId,
      label: `MySQL 杂项风险标签 ${now}`,
      level: 'attention',
      category: 'smoke',
      description: 'rollback only',
      isActive: true,
      sortOrder: 999,
      createdBy: 'user-1784095828451-8fd7222c',
      createdAt: now,
      updatedAt: now,
    })
    await store.insertRiskTagTemplate({
      id: riskDeleteId,
      label: `MySQL 杂项风险标签删除 ${now}`,
      level: 'normal',
      category: 'smoke',
      description: 'rollback only delete',
      isActive: false,
      sortOrder: 1000,
      createdBy: 'user-1784095828451-8fd7222c',
      createdAt: now,
      updatedAt: now,
    })
    await store.updateRiskTagTemplate(riskId, {
      label: `MySQL 杂项风险标签已更新 ${now}`,
      level: 'high',
      category: 'smoke-updated',
      description: 'rollback only updated',
      isActive: true,
      sortOrder: 998,
    }, now + 1)
    const riskUpdated = await store.findRiskTagTemplateRow(riskId)
    const riskDuplicate = await store.findRiskTagTemplateDuplicate(riskUpdated.label, '')
    await store.deleteRiskTagTemplate(riskDeleteId)

    await store.insertLegacyArchive({
      id: archiveId,
      title: `MySQL 杂项旧档案 ${now}`,
      description: 'rollback only',
      content: '第一版旧档案内容',
      type: 'culture',
      year: 1931,
      longitude: 114.61,
      latitude: 23.71,
      media: [{ kind: 'image', url: '/uploads/legacy-smoke.png' }],
      createdAt: now,
      updatedAt: now,
    })
    await store.insertLegacyArchive({
      id: archiveDeleteId,
      title: `MySQL 杂项旧档案删除 ${now}`,
      description: 'rollback only delete',
      content: '待删除',
      type: 'revolution',
      year: 1932,
      longitude: 114.62,
      latitude: 23.72,
      media: [],
      createdAt: now,
      updatedAt: now,
    })
    await store.updateLegacyArchive(archiveId, {
      title: `MySQL 杂项旧档案已更新 ${now}`,
      description: 'rollback only updated',
      content: '第二版旧档案内容',
      type: 'government',
      year: 1933,
      longitude: 114.63,
      latitude: 23.73,
      media: [{ kind: 'image', url: '/uploads/legacy-smoke-updated.png' }],
      updatedAt: now + 2,
    })
    const legacyUpdated = await store.findLegacyArchiveRow(archiveId)
    const legacyCount = await store.countLegacyArchiveRows({
      whereSql: 'WHERE id IN (?, ?)',
      params: [archiveId, archiveDeleteId],
    })
    const legacyRows = await store.listLegacyArchiveRows({
      whereSql: 'WHERE id IN (?, ?)',
      params: [archiveId, archiveDeleteId],
      pageSize: 10,
      offset: 0,
    })
    await store.deleteLegacyArchive(archiveDeleteId)

    await ops.run(`
      INSERT INTO messages (id, name, identity, text, in_reply_to, created_at, ip)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      messageId,
      'MySQL 烟测留言',
      'tester',
      'rollback only message',
      null,
      now,
      '127.0.0.1',
    ])
    const messageBeforeDelete = await store.findMessageRow(messageId)
    await store.deleteMessage(messageId)
    const messageAfterDelete = await store.findMessageRow(messageId)

    await store.upsertCheckinProgress(visitorId, JSON.stringify(['poi-a', 'poi-b']), now)
    await store.upsertCheckinProgress(visitorId, JSON.stringify(['poi-a', 'poi-b', 'poi-c']), now + 1)
    const checkinAfter = await store.findCheckinProgressRow(visitorId)

    await store.setTributeCount((originalTribute || 0) + 5)
    await store.incrementTributeCount()
    const tributeAfter = await store.getTributeCount()

    const requestedPath = await ops.get(`
      SELECT url
      FROM media_assets
      WHERE deleted_at IS NULL AND url IS NOT NULL AND url <> ''
      ORDER BY created_at DESC
      LIMIT 1
    `)
    const mediaLookup = requestedPath?.url
      ? await store.findMediaAssetFileRowByRequestedPath(requestedPath.url)
      : null

    return {
      originalModuleFlags,
      originalTribute,
      riskId,
      riskDeleteId,
      archiveId,
      archiveDeleteId,
      messageId,
      visitorId,
      moduleFlagsAfter: pickModuleFlags(moduleAfter),
      riskUpdatedLabel: riskUpdated?.label || '',
      riskDuplicateFound: Boolean(riskDuplicate?.id),
      legacyUpdatedTitle: legacyUpdated?.title || '',
      legacyCount,
      legacyRowIds: legacyRows.map((row) => row.id),
      messageFoundBeforeDelete: Boolean(messageBeforeDelete?.id),
      messageRemovedAfterDelete: !messageAfterDelete,
      checkinVisitedPoisJson: checkinAfter?.visited_pois_json || '',
      tributeAfter,
      mediaLookupUrl: mediaLookup?.url || '',
    }
  })

  summary.writes = {
    moduleFlagsAfter: txSummary.moduleFlagsAfter,
    riskUpdatedLabel: txSummary.riskUpdatedLabel,
    riskDuplicateFound: txSummary.riskDuplicateFound,
    legacyUpdatedTitle: txSummary.legacyUpdatedTitle,
    legacyCount: txSummary.legacyCount,
    legacyRowIds: txSummary.legacyRowIds,
    messageFoundBeforeDelete: txSummary.messageFoundBeforeDelete,
    messageRemovedAfterDelete: txSummary.messageRemovedAfterDelete,
    checkinVisitedPoisJson: txSummary.checkinVisitedPoisJson,
    tributeAfter: txSummary.tributeAfter,
    mediaLookupUrl: txSummary.mediaLookupUrl,
  }

  await withMysqlConnection(config, async (ops) => {
    const store = createMysqlRuntimeMiscStore({ ops })
    const moduleRow = await store.findContentModuleRow('archive')
    const riskRow = await store.findRiskTagTemplateRow(txSummary.riskId)
    const deletedRiskRow = await store.findRiskTagTemplateRow(txSummary.riskDeleteId)
    const legacyRow = await store.findLegacyArchiveRow(txSummary.archiveId)
    const deletedLegacyRow = await store.findLegacyArchiveRow(txSummary.archiveDeleteId)
    const messageRow = await store.findMessageRow(txSummary.messageId)
    const checkinRow = await store.findCheckinProgressRow(txSummary.visitorId)
    const tributeCount = await store.getTributeCount()

    summary.rollback = {
      moduleRestored: JSON.stringify(pickModuleFlags(moduleRow)) === JSON.stringify(txSummary.originalModuleFlags),
      riskReverted: !riskRow,
      deletedRiskStillMissing: !deletedRiskRow,
      legacyReverted: !legacyRow,
      deletedLegacyStillMissing: !deletedLegacyRow,
      messageReverted: !messageRow,
      checkinReverted: !checkinRow,
      tributeReverted: tributeCount === txSummary.originalTribute,
    }
  })

  assert(summary.reads.moduleCount > 0)
  assert(summary.reads.archiveWorkflowId)
  assert(JSON.stringify(summary.writes.moduleFlagsAfter) !== JSON.stringify(txSummary.originalModuleFlags))
  assert(summary.writes.riskUpdatedLabel.includes('已更新'))
  assert(summary.writes.riskDuplicateFound)
  assert(summary.writes.legacyUpdatedTitle.includes('已更新'))
  assert(summary.writes.legacyCount >= 2)
  assert(summary.writes.legacyRowIds.includes(txSummary.archiveId))
  assert(summary.writes.messageFoundBeforeDelete)
  assert(summary.writes.messageRemovedAfterDelete)
  assert(summary.writes.checkinVisitedPoisJson.includes('poi-c'))
  assert.strictEqual(summary.writes.tributeAfter, (txSummary.originalTribute || 0) + 6)
  assert(summary.rollback.moduleRestored)
  assert(summary.rollback.riskReverted)
  assert(summary.rollback.deletedRiskStillMissing)
  assert(summary.rollback.legacyReverted)
  assert(summary.rollback.deletedLegacyStillMissing)
  assert(summary.rollback.messageReverted)
  assert(summary.rollback.checkinReverted)
  assert(summary.rollback.tributeReverted)

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
  return {
    map: Number(row?.default_publish_map || 0),
    list: Number(row?.default_publish_list || 0),
    home: Number(row?.default_publish_home || 0),
    topic: Number(row?.default_publish_topic || 0),
    guide: Number(row?.default_publish_guide || 0),
  }
}
