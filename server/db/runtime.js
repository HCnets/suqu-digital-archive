const { AsyncLocalStorage } = require('node:async_hooks')
const {
  ensureSqliteDirectories,
  openSqliteDatabase,
  reopenSqliteDatabase,
  backupSqliteDatabase,
  getSqliteHealthSnapshot,
  runSqliteTransaction,
  runSqliteTransactionAsync,
} = require('./sqlite-runtime')
const { inspectMysqlTarget } = require('./mysql-observer')
const { loadMysql, createMysqlConnectionOptions } = require('./mysql-primary-ops')

function createDatabaseRuntime(config) {
  ensureSqliteDirectories(config)
  const runtimeClient = config.client === 'mysql' ? 'mysql' : 'sqlite'
  const compatibilityMode = config.client !== runtimeClient

  let cachedTargetStatus = null
  let cachedTargetStatusAt = 0

  async function inspectConfiguredTarget() {
    const now = Date.now()
    if (cachedTargetStatus && now - cachedTargetStatusAt < 5000) {
      return cachedTargetStatus
    }

    const targetStatus = config.client === 'mysql'
      ? await inspectMysqlTarget(config)
      : {
          client: 'sqlite',
          reachable: true,
          schemaReady: true,
          sqliteFile: config.sqlite.file,
        }

    cachedTargetStatus = targetStatus
    cachedTargetStatusAt = now
    return targetStatus
  }

  function getRuntimeModeSummary(targetStatus = null) {
    const effectiveTargetStatus = targetStatus || cachedTargetStatus
    const targetReady = config.client === 'mysql'
      ? Boolean(effectiveTargetStatus?.reachable && effectiveTargetStatus?.schemaReady && effectiveTargetStatus?.coreTablesPresent)
      : true
    const blockers = []

    if (config.client === 'mysql') {
      if (!effectiveTargetStatus?.reachable) blockers.push('mysql_unreachable')
      if (!effectiveTargetStatus?.schemaReady) blockers.push('mysql_schema_incomplete')
      if (!effectiveTargetStatus?.coreTablesPresent) blockers.push('mysql_core_tables_missing')
    }

    const readyForRuntimeSwitch = config.client === 'mysql' && targetReady && compatibilityMode
    const runtimeAligned = config.client === runtimeClient

    return {
      configuredClient: config.client,
      runtimeClient,
      compatibilityMode,
      targetReady,
      targetReachable: Boolean(effectiveTargetStatus?.reachable),
      schemaReady: config.client === 'mysql' ? Boolean(effectiveTargetStatus?.schemaReady) : true,
      coreTablesPresent: config.client === 'mysql' ? Boolean(effectiveTargetStatus?.coreTablesPresent) : true,
      runtimeAligned,
      readyForRuntimeSwitch,
      blockers,
      nextAction: config.client === 'mysql'
        ? targetReady
          ? compatibilityMode
            ? 'switch_runtime_client'
            : 'runtime_already_on_mysql'
          : 'complete_mysql_target_setup'
        : 'switch_db_client_when_ready',
    }
  }

  return {
    configuredClient: config.client,
    runtimeClient,
    compatibilityMode,
    openPrimaryConnection() {
      return runtimeClient === 'mysql'
        ? openMysqlRuntimeDatabase(config)
        : openSqliteDatabase(config)
    },
    reopenPrimaryConnection(currentDb) {
      if (runtimeClient === 'mysql') {
        try {
          if (currentDb && typeof currentDb.close === 'function') currentDb.close()
        } catch {}
        return openMysqlRuntimeDatabase(config)
      }
      return reopenSqliteDatabase(currentDb, config)
    },
    async createBackup(currentDb, backupFile) {
      if (runtimeClient === 'mysql') {
        throw new Error('MySQL runtime backup is handled by the application snapshot flow.')
      }
      await backupSqliteDatabase(currentDb, backupFile)
    },
    getHealthSnapshot(currentDb) {
      if (runtimeClient === 'mysql') {
        return currentDb.getHealthSnapshot()
      }
      return getSqliteHealthSnapshot(currentDb)
    },
    runInTransaction(currentDb, action) {
      if (runtimeClient === 'mysql') {
        throw new Error('Synchronous transactions are not supported for MySQL runtime.')
      }
      return runSqliteTransaction(currentDb, action)
    },
    async runInTransactionAsync(currentDb, action) {
      if (runtimeClient === 'mysql') {
        return currentDb.transaction(action)
      }
      return runSqliteTransactionAsync(currentDb, action)
    },
    async inspectConfiguredTarget() {
      return inspectConfiguredTarget()
    },
    getRuntimeModeSummary(targetStatus = null) {
      return getRuntimeModeSummary(targetStatus)
    },
    invalidateTargetCache() {
      cachedTargetStatus = null
      cachedTargetStatusAt = 0
    },
  }
}

function openMysqlRuntimeDatabase(config) {
  const mysql = loadMysql()
  const storage = new AsyncLocalStorage()
  const pool = mysql.createPool({
    ...createMysqlConnectionOptions(config),
    waitForConnections: true,
    connectionLimit: config.mysql.connectionLimit,
    queueLimit: 0,
  })

  const poolExecutor = createMysqlExecutor(pool)

  return {
    __runtimeClient: 'mysql',
    async get(sql, params = []) {
      return getExecutor(storage, poolExecutor).get(sql, params)
    },
    async all(sql, params = []) {
      return getExecutor(storage, poolExecutor).all(sql, params)
    },
    async run(sql, params = []) {
      return getExecutor(storage, poolExecutor).run(sql, params)
    },
    async transaction(action) {
      const connection = await pool.getConnection()
      const executor = createMysqlExecutor(connection)
      await connection.beginTransaction()
      try {
        const result = await storage.run(executor, async () => await action(executor))
        await connection.commit()
        return result
      } catch (error) {
        await connection.rollback().catch(() => {})
        throw error
      } finally {
        connection.release()
      }
    },
    async getHealthSnapshot() {
      const archiveRow = await poolExecutor.get('SELECT count(*) AS count FROM archives')
      const messageRow = await poolExecutor.get('SELECT count(*) AS count FROM messages')
      return {
        archiveCount: Number(archiveRow?.count || 0),
        messageCount: Number(messageRow?.count || 0),
      }
    },
    async close() {
      await pool.end()
    },
  }
}

function createMysqlExecutor(target) {
  return {
    async get(sql, params = []) {
      const [rows] = await target.query(sql, params)
      return Array.isArray(rows) && rows.length ? rows[0] : null
    },
    async all(sql, params = []) {
      const [rows] = await target.query(sql, params)
      return Array.isArray(rows) ? rows : []
    },
    async run(sql, params = []) {
      const [result] = await target.query(sql, params)
      return result
    },
  }
}

function getExecutor(storage, fallbackExecutor) {
  return storage.getStore() || fallbackExecutor
}

module.exports = {
  createDatabaseRuntime,
}
