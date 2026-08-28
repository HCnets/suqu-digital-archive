const assert = require('assert')
const { getDatabaseConfig } = require('../db/config')
const { withMysqlConnection, withMysqlRollbackTransaction } = require('../db/mysql-primary-ops')
const { createMysqlAdminCoreStore } = require('../db/mysql-admin-core-store')

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
    const store = createMysqlAdminCoreStore({ ops })
    const admin = await store.findAdminUserByUsername('admin')
    const roles = await store.listRoles()
    const permissions = await store.listPermissions()
    const regions = await store.listRegions()
    const adminRegions = admin ? await store.listUserAssignedRegionIds(admin.id) : []

    summary.reads = {
      adminId: admin?.id || null,
      adminRoleId: admin?.role_id || null,
      roleCount: roles.length,
      permissionCount: permissions.length,
      regionCount: regions.length,
      adminRegionCount: adminRegions.length,
    }
  })

  const txSummary = await withMysqlRollbackTransaction(config, async (ops) => {
    const store = createMysqlAdminCoreStore({ ops })
    const admin = await store.findAdminUserByUsername('admin')
    if (!admin) throw new Error('Admin user not found for MySQL admin-core smoke.')

    const now = Date.now()
    const tempRegionId = `region-mysql-smoke-${now}`
    const tempSessionId = `mysql-admin-session-${now}`
    const tempTokenHash = `mysql-admin-token-${now}`
    const tempUsername = `mysql-admin-login-${now}`

    await store.insertSession({
      id: tempSessionId,
      userId: admin.id,
      tokenHash: tempTokenHash,
      csrfToken: `csrf-${now}`,
      ip: '127.0.0.1',
      userAgent: 'mysql-admin-core-flow-smoke',
      expiresAt: now + 60000,
      createdAt: now,
      lastSeenAt: now,
    })
    const sessionRow = await store.findSessionByTokenHash(tempTokenHash)

    await store.insertLoginAttempt({
      username: tempUsername,
      ip: '127.0.0.1',
      success: false,
      reason: 'mysql-admin-core-flow-smoke',
      createdAt: now,
    })
    const failedCount = await store.countRecentFailedLoginAttempts(tempUsername, '127.0.0.1', now - 1000)

    await store.insertRegion({
      id: tempRegionId,
      parentId: 'region-suqu',
      level: 'village',
      name: 'MySQL 烟测地区',
      fullName: 'MySQL 烟测地区',
      code: `mysql-smoke-${now}`,
      description: 'rollback only',
      displayMode: 'current',
      mapMode: 'single',
      sortOrder: 999,
      isDefault: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    const insertedRegion = await store.findRegion(tempRegionId)
    const childCount = await store.countChildRegions('region-suqu')

    await store.replaceUserRegions(admin.id, [tempRegionId], now)
    const replacedRegions = await store.listUserAssignedRegionIds(admin.id)

    await store.updateRegion(tempRegionId, {
      parentId: 'region-suqu',
      level: 'village',
      name: 'MySQL 烟测地区已更新',
      fullName: 'MySQL 烟测地区已更新',
      code: `mysql-smoke-${now}`,
      description: 'rollback only updated',
      displayMode: 'current',
      mapMode: 'single',
      sortOrder: 998,
      isDefault: false,
      isActive: true,
    }, now + 1)
    const updatedRegion = await store.findRegion(tempRegionId)
    const duplicateCode = await store.findRegionCodeDuplicate(`mysql-smoke-${now}`, '')
    const parentId = await store.findRegionParentId(tempRegionId)

    return {
      adminId: admin.id,
      tempRegionId,
      tempSessionId,
      tempTokenHash,
      tempUsername,
      sessionInserted: Boolean(sessionRow?.id),
      failedCount,
      regionInserted: Boolean(insertedRegion?.id),
      childCountAfterInsert: childCount,
      replacedRegionIds: replacedRegions,
      regionUpdatedName: updatedRegion?.name || '',
      duplicateCodeFound: Boolean(duplicateCode?.id),
      parentId,
    }
  })

  summary.writes = {
    sessionInserted: txSummary.sessionInserted,
    failedCount: txSummary.failedCount,
    regionInserted: txSummary.regionInserted,
    childCountAfterInsert: txSummary.childCountAfterInsert,
    replacedRegionIds: txSummary.replacedRegionIds,
    regionUpdatedName: txSummary.regionUpdatedName,
    duplicateCodeFound: txSummary.duplicateCodeFound,
    parentId: txSummary.parentId,
  }

  await withMysqlConnection(config, async (ops) => {
    const store = createMysqlAdminCoreStore({ ops })
    const sessionRow = await store.findSessionByTokenHash(txSummary.tempTokenHash)
    const regionRow = await store.findRegion(txSummary.tempRegionId)
    const failedCount = await store.countRecentFailedLoginAttempts(txSummary.tempUsername, '127.0.0.1', Date.now() - 3600000)
    const adminRegionIds = await store.listUserAssignedRegionIds(txSummary.adminId)

    summary.rollback = {
      sessionReverted: !sessionRow,
      regionReverted: !regionRow,
      loginAttemptReverted: failedCount === 0,
      adminRegionsRestored: !adminRegionIds.includes(txSummary.tempRegionId),
    }
  })

  assert(summary.reads.adminId)
  assert(summary.reads.roleCount > 0)
  assert(summary.reads.permissionCount > 0)
  assert(summary.reads.regionCount > 0)
  assert(summary.writes.sessionInserted)
  assert.strictEqual(summary.writes.failedCount, 1)
  assert(summary.writes.regionInserted)
  assert(summary.writes.childCountAfterInsert >= 1)
  assert.deepStrictEqual(summary.writes.replacedRegionIds, [txSummary.tempRegionId])
  assert.strictEqual(summary.writes.regionUpdatedName, 'MySQL 烟测地区已更新')
  assert(summary.writes.duplicateCodeFound)
  assert.strictEqual(summary.writes.parentId, 'region-suqu')
  assert(summary.rollback.sessionReverted)
  assert(summary.rollback.regionReverted)
  assert(summary.rollback.loginAttemptReverted)
  assert(summary.rollback.adminRegionsRestored)

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
