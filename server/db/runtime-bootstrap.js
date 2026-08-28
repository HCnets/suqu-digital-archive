function createRuntimeBootstrap(options = {}) {
  const runtimeClient = normalizeClient(options.runtimeClient)
  const configuredClient = normalizeClient(options.configuredClient || runtimeClient)
  const steps = {
    ensurePrimarySchema: asFunction(options.ensurePrimarySchema),
    ensureRuntimeMigrations: asFunction(options.ensureRuntimeMigrations),
    seedDatabase: asFunction(options.seedDatabase),
    seedAccessControl: asFunction(options.seedAccessControl),
    seedRegions: asFunction(options.seedRegions),
    seedContentSystem: asFunction(options.seedContentSystem),
    seedRiskTagTemplates: asFunction(options.seedRiskTagTemplates),
    seedArchiveContentsFromLegacyStore: asFunction(options.seedArchiveContentsFromLegacyStore),
  }

  function describe(reason) {
    const normalizedReason = normalizeReason(reason)
    return buildPlan({ reason: normalizedReason, runtimeClient, configuredClient, steps })
  }

  function apply(reason, context = {}) {
    const normalizedReason = normalizeReason(reason)
    const plan = describe(normalizedReason)
    const executedSteps = []

    for (const step of plan) {
      step.run(context)
      executedSteps.push(step.key)
    }

    return {
      reason: normalizedReason,
      runtimeClient,
      configuredClient,
      executedSteps,
    }
  }

  return {
    runtimeClient,
    configuredClient,
    describe,
    apply,
  }
}

function buildPlan({ reason, runtimeClient, steps }) {
  const plan = []
  const isSqliteRuntime = runtimeClient === 'sqlite'

  if (reason === 'startup') {
    if (isSqliteRuntime) {
      plan.push(step('ensure_primary_schema', steps.ensurePrimarySchema))
      plan.push(step('ensure_runtime_migrations', steps.ensureRuntimeMigrations))
    }
    plan.push(step('seed_database', steps.seedDatabase))
    plan.push(step('seed_access_control', steps.seedAccessControl))
    plan.push(step('seed_regions', steps.seedRegions))
    plan.push(step('seed_content_system', steps.seedContentSystem))
    plan.push(step('seed_risk_tag_templates', steps.seedRiskTagTemplates))
    plan.push(step('seed_legacy_archive_contents', steps.seedArchiveContentsFromLegacyStore))
    return plan
  }

  if (reason === 'import' || reason === 'restore' || reason === 'restore_recovery') {
    if (isSqliteRuntime) {
      plan.push(step('ensure_runtime_migrations', steps.ensureRuntimeMigrations))
    }
    plan.push(step('seed_access_control', steps.seedAccessControl))
    plan.push(step('seed_regions', steps.seedRegions))
    plan.push(step('seed_content_system', steps.seedContentSystem))
    return plan
  }

  throw new Error(`Unsupported runtime bootstrap reason "${reason}".`)
}

function step(key, run) {
  return { key, run }
}

function normalizeClient(value) {
  return String(value || 'sqlite').trim().toLowerCase() === 'mysql' ? 'mysql' : 'sqlite'
}

function normalizeReason(value) {
  return String(value || '').trim().toLowerCase()
}

function asFunction(value) {
  return typeof value === 'function' ? value : () => {}
}

module.exports = {
  createRuntimeBootstrap,
}
