const assert = require('assert')
const { createRuntimeBootstrap } = require('../db/runtime-bootstrap')

function runScenario(runtimeClient, reason) {
  const calls = []
  const bootstrap = createRuntimeBootstrap({
    runtimeClient,
    configuredClient: 'mysql',
    ensurePrimarySchema: () => calls.push('ensure_primary_schema'),
    ensureRuntimeMigrations: () => calls.push('ensure_runtime_migrations'),
    seedDatabase: () => calls.push('seed_database'),
    seedAccessControl: () => calls.push('seed_access_control'),
    seedRegions: () => calls.push('seed_regions'),
    seedContentSystem: () => calls.push('seed_content_system'),
    seedRiskTagTemplates: () => calls.push('seed_risk_tag_templates'),
    seedArchiveContentsFromLegacyStore: () => calls.push('seed_legacy_archive_contents'),
  })

  const result = bootstrap.apply(reason)
  return {
    runtimeClient,
    reason,
    calls,
    executedSteps: result.executedSteps,
  }
}

function main() {
  const sqliteStartup = runScenario('sqlite', 'startup')
  const sqliteImport = runScenario('sqlite', 'import')
  const sqliteRestore = runScenario('sqlite', 'restore')
  const mysqlStartup = runScenario('mysql', 'startup')
  const mysqlImport = runScenario('mysql', 'import')
  const mysqlRestore = runScenario('mysql', 'restore')

  assert.deepStrictEqual(sqliteStartup.calls, [
    'ensure_primary_schema',
    'ensure_runtime_migrations',
    'seed_database',
    'seed_access_control',
    'seed_regions',
    'seed_content_system',
    'seed_risk_tag_templates',
    'seed_legacy_archive_contents',
  ])
  assert.deepStrictEqual(sqliteImport.calls, [
    'ensure_runtime_migrations',
    'seed_access_control',
    'seed_regions',
    'seed_content_system',
  ])
  assert.deepStrictEqual(sqliteRestore.calls, [
    'ensure_runtime_migrations',
    'seed_access_control',
    'seed_regions',
    'seed_content_system',
  ])
  assert.deepStrictEqual(mysqlStartup.calls, [
    'seed_database',
    'seed_access_control',
    'seed_regions',
    'seed_content_system',
    'seed_risk_tag_templates',
    'seed_legacy_archive_contents',
  ])
  assert.deepStrictEqual(mysqlImport.calls, [
    'seed_access_control',
    'seed_regions',
    'seed_content_system',
  ])
  assert.deepStrictEqual(mysqlRestore.calls, [
    'seed_access_control',
    'seed_regions',
    'seed_content_system',
  ])

  console.log(JSON.stringify({
    checkedAt: Date.now(),
    ok: true,
    scenarios: [
      sqliteStartup,
      sqliteImport,
      sqliteRestore,
      mysqlStartup,
      mysqlImport,
      mysqlRestore,
    ],
  }, null, 2))
}

main()
