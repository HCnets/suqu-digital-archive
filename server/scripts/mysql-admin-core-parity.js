const assert = require('assert')
const { DatabaseSync } = require('node:sqlite')
const { getDatabaseConfig } = require('../db/config')
const { createAdminCoreStore } = require('../db/admin-core-store')
const { withMysqlConnection } = require('../db/mysql-primary-ops')
const { createMysqlAdminCoreStore } = require('../db/mysql-admin-core-store')

async function main() {
  const config = getDatabaseConfig(process.env)
  const sqlite = new DatabaseSync(config.sqlite.file)
  const sqliteStore = createAdminCoreStore({ getDb: () => sqlite, dbClient: 'sqlite' })
  const summary = {
    checkedAt: Date.now(),
    sqliteFile: config.sqlite.file,
    mysqlTarget: `${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`,
    permissions: null,
    roles: null,
    users: null,
    regions: null,
    userRegions: null,
    ok: false,
  }

  try {
    await withMysqlConnection(config, async (ops) => {
      const mysqlStore = createMysqlAdminCoreStore({ ops })

      const sqlitePermissions = sqliteStore.listPermissions().map((row) => row.code)
      const mysqlPermissions = (await mysqlStore.listPermissions()).map((row) => row.code)
      summary.permissions = {
        sqliteCount: sqlitePermissions.length,
        mysqlCount: mysqlPermissions.length,
        sqliteCodes: sqlitePermissions,
        mysqlCodes: mysqlPermissions,
      }

      const sqliteRoles = sqliteStore.listRoles().map((row) => row.id)
      const mysqlRoles = (await mysqlStore.listRoles()).map((row) => row.id)
      const sqliteRolePermissions = sqliteStore.listRolePermissionCodes('super_admin')
      const mysqlRolePermissions = await mysqlStore.listRolePermissionCodes('super_admin')
      summary.roles = {
        sqliteIds: sqliteRoles,
        mysqlIds: mysqlRoles,
        superAdminPermissionCountSqlite: sqliteRolePermissions.length,
        superAdminPermissionCountMysql: mysqlRolePermissions.length,
      }

      const sqliteUsers = sqliteStore.listAdminUsers({ limit: 20 }).map((row) => row.username)
      const mysqlUsers = (await mysqlStore.listAdminUsers({ limit: 20 })).map((row) => row.username)
      const sqliteAdmin = sqliteStore.findAdminUserByUsername('admin')
      const mysqlAdmin = await mysqlStore.findAdminUserByUsername('admin')
      summary.users = {
        sqliteUsernames: sqliteUsers,
        mysqlUsernames: mysqlUsers,
        sqliteAdminRole: sqliteAdmin?.role_id || '',
        mysqlAdminRole: mysqlAdmin?.role_id || '',
      }

      const sqliteRegions = sqliteStore.listRegions().map((row) => row.id)
      const mysqlRegions = (await mysqlStore.listRegions()).map((row) => row.id)
      summary.regions = {
        sqliteIds: sqliteRegions,
        mysqlIds: mysqlRegions,
      }

      const sqliteAdminRegionIds = sqliteAdmin ? sqliteStore.listUserAssignedRegionIds(sqliteAdmin.id) : []
      const mysqlAdminRegionIds = mysqlAdmin ? await mysqlStore.listUserAssignedRegionIds(mysqlAdmin.id) : []
      summary.userRegions = {
        sqliteAdminRegionIds,
        mysqlAdminRegionIds,
      }
    })
  } finally {
    try { sqlite.close() } catch {}
  }

  assert.strictEqual(summary.permissions.sqliteCount, summary.permissions.mysqlCount)
  assert.deepStrictEqual(summary.permissions.sqliteCodes, summary.permissions.mysqlCodes)
  assert.deepStrictEqual(summary.roles.sqliteIds, summary.roles.mysqlIds)
  assert.strictEqual(summary.roles.superAdminPermissionCountSqlite, summary.roles.superAdminPermissionCountMysql)
  assert.deepStrictEqual(summary.users.sqliteUsernames, summary.users.mysqlUsernames)
  assert.strictEqual(summary.users.sqliteAdminRole, summary.users.mysqlAdminRole)
  assert.deepStrictEqual(summary.regions.sqliteIds, summary.regions.mysqlIds)
  assert.deepStrictEqual(summary.userRegions.sqliteAdminRegionIds, summary.userRegions.mysqlAdminRegionIds)

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
