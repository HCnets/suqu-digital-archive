const { getDatabaseConfig } = require('../db/config')
const { buildMysqlCutoverReadiness } = require('../db/mysql-cutover-readiness')

async function main() {
  const config = getDatabaseConfig(process.env)
  const summary = await buildMysqlCutoverReadiness(config)
  console.log(JSON.stringify(summary, null, 2))
  if (!summary.readyForRuntimeCutover) process.exitCode = 1
}

main().catch((error) => {
  console.error(JSON.stringify({
    checkedAt: Date.now(),
    error: error.message,
    readyForRuntimeCutover: false,
  }, null, 2))
  process.exit(1)
})
