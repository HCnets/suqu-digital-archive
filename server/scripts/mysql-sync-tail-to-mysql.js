const { getDatabaseConfig } = require('../db/config')
const { syncSqliteAppendOnlyTablesToMysql } = require('../db/mysql-tail-sync')

async function main() {
  const config = getDatabaseConfig({
    ...process.env,
    DB_CLIENT: 'mysql',
  })
  const summary = await syncSqliteAppendOnlyTablesToMysql(config)
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
