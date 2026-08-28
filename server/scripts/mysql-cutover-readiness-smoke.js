const { getDatabaseConfig } = require('../db/config')
const { buildMysqlCutoverReadiness } = require('../db/mysql-cutover-readiness')

async function main() {
  const config = getDatabaseConfig({
    ...process.env,
    DB_CLIENT: 'mysql',
  })
  const summary = await buildMysqlCutoverReadiness(config)
  const errors = []

  if (!summary.sqlitePresent) errors.push('expected sqlitePresent=true')
  if (!summary.targetStatus?.reachable) errors.push(`expected targetStatus.reachable=true, got error=${summary.targetStatus?.error || 'unknown'}`)
  if (!summary.targetStatus?.schemaReady) errors.push('expected targetStatus.schemaReady=true')
  if (!summary.targetStatus?.coreTablesPresent) errors.push('expected targetStatus.coreTablesPresent=true')
  if (!summary.coreTableCounts.every((item) => item.countsMatch)) errors.push('expected all coreTableCounts to match')
  if (!summary.autoIncrementChecks.every((item) => item.autoIncrement)) errors.push('expected all autoIncrementChecks to be true')
  if (!summary.readyForRuntimeCutover) errors.push('expected readyForRuntimeCutover=true')
  if (summary.blockers.length !== 0) errors.push(`expected blockers=[], got ${summary.blockers.join(',')}`)

  const result = {
    checkedAt: Date.now(),
    sqlitePresent: summary.sqlitePresent,
    runtimeConfiguredClient: summary.configuredClient,
    mysqlTarget: summary.mysqlTarget,
    targetStatus: summary.targetStatus,
    coreTableCountMismatches: summary.coreTableCounts.filter((item) => !item.countsMatch).map((item) => item.tableName),
    autoIncrementMissing: summary.autoIncrementChecks.filter((item) => !item.autoIncrement).map((item) => item.tableName),
    readyForRuntimeCutover: summary.readyForRuntimeCutover,
    blockers: summary.blockers,
    ok: errors.length === 0,
  }

  if (errors.length > 0) {
    result.errors = errors
    console.error(JSON.stringify(result, null, 2))
    process.exit(1)
  }

  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(JSON.stringify({
    checkedAt: Date.now(),
    ok: false,
    error: error.message,
  }, null, 2))
  process.exit(1)
})
