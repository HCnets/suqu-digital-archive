function loadMysql() {
  try {
    return require('mysql2/promise')
  } catch (error) {
    throw new Error(`mysql2 is required before using MySQL runtime helpers. Run "npm install" in server/. ${error.message}`)
  }
}

function createMysqlConnectionOptions(config) {
  return {
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
  }
}

function createMysqlOps(connection) {
  return {
    async get(sql, params = []) {
      const [rows] = await connection.query(sql, params)
      return Array.isArray(rows) && rows.length ? rows[0] : null
    },

    async all(sql, params = []) {
      const [rows] = await connection.query(sql, params)
      return Array.isArray(rows) ? rows : []
    },

    async run(sql, params = []) {
      const [result] = await connection.query(sql, params)
      return result
    },
  }
}

async function withMysqlConnection(config, action) {
  const mysql = loadMysql()
  const connection = await mysql.createConnection(createMysqlConnectionOptions(config))
  const ops = createMysqlOps(connection)
  try {
    return await action(ops, connection)
  } finally {
    await connection.end().catch(() => {})
  }
}

async function withMysqlTransaction(config, action) {
  return withMysqlConnection(config, async (ops, connection) => {
    await connection.beginTransaction()
    try {
      const result = await action(ops, connection)
      await connection.commit()
      return result
    } catch (error) {
      await connection.rollback().catch(() => {})
      throw error
    }
  })
}

async function withMysqlRollbackTransaction(config, action) {
  return withMysqlConnection(config, async (ops, connection) => {
    await connection.beginTransaction()
    try {
      return await action(ops, connection)
    } finally {
      await connection.rollback().catch(() => {})
    }
  })
}

async function getMysqlHealthSnapshot(config) {
  return withMysqlConnection(config, async (ops) => {
    const archiveRow = await ops.get('SELECT count(*) AS count FROM archives')
    const messageRow = await ops.get('SELECT count(*) AS count FROM messages')
    return {
      archiveCount: Number(archiveRow?.count || 0),
      messageCount: Number(messageRow?.count || 0),
    }
  })
}

module.exports = {
  createMysqlConnectionOptions,
  createMysqlOps,
  getMysqlHealthSnapshot,
  loadMysql,
  withMysqlConnection,
  withMysqlRollbackTransaction,
  withMysqlTransaction,
}
