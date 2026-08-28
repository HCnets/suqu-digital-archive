const { createAdminCoreStore } = require('./admin-core-store')
const { createContentReadStore } = require('./content-read-store')
const { createContentWriteStore } = require('./content-write-store')
const { createRuntimeMiscStore } = require('./runtime-misc-store')
const { createMysqlAdminCoreStore } = require('./mysql-admin-core-store')
const { createMysqlContentReadStore } = require('./mysql-content-read-store')
const { createMysqlContentWriteStore } = require('./mysql-content-write-store')
const { createMysqlRuntimeMiscStore } = require('./mysql-runtime-misc-store')

function createRuntimeStoreFactory(options = {}) {
  const runtimeClient = normalizeRuntimeClient(options.runtimeClient)
  const getDb = typeof options.getDb === 'function' ? options.getDb : null
  const mysqlOps = options.mysqlOps || null

  function requireSqliteDb() {
    if (!getDb) {
      throw new Error('SQLite runtime store creation requires getDb().')
    }
    return getDb
  }

  function requireMysqlOps() {
    if (!mysqlOps) {
      throw new Error('MySQL runtime store creation requires mysqlOps.')
    }
    return mysqlOps
  }

  return {
    runtimeClient,
    isAsyncRuntime: runtimeClient === 'mysql',

    createAdminCoreStore() {
      return runtimeClient === 'mysql'
        ? createMysqlAdminCoreStore({ ops: requireMysqlOps() })
        : createAdminCoreStore({ getDb: requireSqliteDb(), dbClient: 'sqlite' })
    },

    createContentReadStore() {
      return runtimeClient === 'mysql'
        ? createMysqlContentReadStore({ ops: requireMysqlOps() })
        : createContentReadStore({ getDb: requireSqliteDb() })
    },

    createContentWriteStore() {
      return runtimeClient === 'mysql'
        ? createMysqlContentWriteStore({ ops: requireMysqlOps() })
        : createContentWriteStore({ getDb: requireSqliteDb() })
    },

    createRuntimeMiscStore() {
      return runtimeClient === 'mysql'
        ? createMysqlRuntimeMiscStore({ ops: requireMysqlOps() })
        : createRuntimeMiscStore({ getDb: requireSqliteDb(), dbClient: 'sqlite' })
    },
  }
}

function createRuntimeStores(options = {}) {
  const factory = createRuntimeStoreFactory(options)
  return {
    runtimeClient: factory.runtimeClient,
    isAsyncRuntime: factory.isAsyncRuntime,
    adminCore: factory.createAdminCoreStore(),
    contentRead: factory.createContentReadStore(),
    contentWrite: factory.createContentWriteStore(),
    runtimeMisc: factory.createRuntimeMiscStore(),
  }
}

function normalizeRuntimeClient(value) {
  return String(value || 'sqlite').trim().toLowerCase() === 'mysql' ? 'mysql' : 'sqlite'
}

module.exports = {
  createRuntimeStoreFactory,
  createRuntimeStores,
  normalizeRuntimeClient,
}
