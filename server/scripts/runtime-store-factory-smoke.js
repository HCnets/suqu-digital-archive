const assert = require('assert')
const { DatabaseSync } = require('node:sqlite')
const { getDatabaseConfig } = require('../db/config')
const { createRuntimeStores } = require('../db/runtime-store-factory')
const { withMysqlConnection } = require('../db/mysql-primary-ops')

async function main() {
  const config = getDatabaseConfig(process.env)
  const summary = {
    checkedAt: Date.now(),
    sqlite: null,
    mysql: null,
    ok: false,
  }

  const sqlite = new DatabaseSync(config.sqlite.file)
  try {
    const sqliteStores = createRuntimeStores({
      runtimeClient: 'sqlite',
      getDb: () => sqlite,
    })
    const sqliteRoles = sqliteStores.adminCore.listRoles()
    const sqliteContents = sqliteStores.contentRead.listContentSummaryRows({ pageSize: 1, offset: 0 })
    const sqliteModules = sqliteStores.runtimeMisc.listContentModuleRows()

    summary.sqlite = {
      runtimeClient: sqliteStores.runtimeClient,
      isAsyncRuntime: sqliteStores.isAsyncRuntime,
      roleCount: sqliteRoles.length,
      firstContentId: sqliteContents.rows[0]?.id || null,
      moduleCount: sqliteModules.length,
    }
  } finally {
    try { sqlite.close() } catch {}
  }

  await withMysqlConnection(config, async (ops) => {
    const mysqlStores = createRuntimeStores({
      runtimeClient: 'mysql',
      mysqlOps: ops,
    })
    const mysqlRoles = await mysqlStores.adminCore.listRoles()
    const mysqlContents = await mysqlStores.contentRead.listContentSummaryRows({ pageSize: 1, offset: 0 })
    const mysqlModules = await mysqlStores.runtimeMisc.listContentModuleRows()

    summary.mysql = {
      runtimeClient: mysqlStores.runtimeClient,
      isAsyncRuntime: mysqlStores.isAsyncRuntime,
      roleCount: mysqlRoles.length,
      firstContentId: mysqlContents.rows[0]?.id || null,
      moduleCount: mysqlModules.length,
    }
  })

  assert.strictEqual(summary.sqlite.runtimeClient, 'sqlite')
  assert.strictEqual(summary.sqlite.isAsyncRuntime, false)
  assert(summary.sqlite.roleCount > 0)
  assert(summary.sqlite.moduleCount > 0)
  assert.strictEqual(summary.mysql.runtimeClient, 'mysql')
  assert.strictEqual(summary.mysql.isAsyncRuntime, true)
  assert(summary.mysql.roleCount > 0)
  assert(summary.mysql.moduleCount > 0)

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
