const { getDatabaseConfig } = require('../db/config')
const { createDatabaseRuntime } = require('../db/runtime')

async function main() {
  const config = getDatabaseConfig({
    ...process.env,
    DB_CLIENT: 'mysql',
  })
  const runtime = createDatabaseRuntime(config)
  const targetStatus = await runtime.inspectConfiguredTarget()
  const mode = runtime.getRuntimeModeSummary(targetStatus)

  const errors = []
  if (mode.runtimeClient !== 'mysql') errors.push(`expected runtimeClient=mysql, got ${mode.runtimeClient}`)
  if (mode.configuredClient !== 'mysql') errors.push(`expected configuredClient=mysql, got ${mode.configuredClient}`)
  if (mode.compatibilityMode) errors.push('expected compatibilityMode=false when mysql runtime is active')
  if (!mode.targetReachable) errors.push(`expected mysql target reachable, got error=${targetStatus.error || 'unknown'}`)
  if (!mode.schemaReady) errors.push('expected mysql schemaReady=true')
  if (!mode.coreTablesPresent) errors.push('expected mysql coreTablesPresent=true')
  if (!mode.targetReady) errors.push('expected mysql targetReady=true')
  if (mode.readyForRuntimeSwitch) errors.push('expected readyForRuntimeSwitch=false when runtime is already mysql')
  if (!mode.runtimeAligned) errors.push('expected runtimeAligned=true when runtime is already mysql')
  if (mode.nextAction !== 'runtime_already_on_mysql') errors.push(`expected nextAction=runtime_already_on_mysql, got ${mode.nextAction}`)
  if (mode.blockers.length !== 0) errors.push(`expected blockers=[], got ${mode.blockers.join(',')}`)

  const result = {
    checkedAt: Date.now(),
    runtimeClient: mode.runtimeClient,
    configuredClient: mode.configuredClient,
    compatibilityMode: mode.compatibilityMode,
    runtimeAligned: mode.runtimeAligned,
    targetReady: mode.targetReady,
    targetReachable: mode.targetReachable,
    schemaReady: mode.schemaReady,
    coreTablesPresent: mode.coreTablesPresent,
    readyForRuntimeSwitch: mode.readyForRuntimeSwitch,
    nextAction: mode.nextAction,
    blockers: mode.blockers,
    mysqlTarget: `${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`,
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
