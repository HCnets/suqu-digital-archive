const fs = require('fs')
const { DatabaseSync } = require('node:sqlite')
const { inspectMysqlTarget } = require('./mysql-observer')

const CORE_TABLES = [
  'admin_users',
  'roles',
  'permissions',
  'role_permissions',
  'regions',
  'contents',
  'content_versions',
  'content_sources',
  'content_review_tasks',
  'review_workflows',
  'review_workflow_steps',
  'media_assets',
  'archives',
  'messages',
  'tributes',
  'audit_logs',
]

const AUTO_INCREMENT_TABLES = ['login_attempts', 'audit_logs', 'ai_call_logs']

async function buildMysqlCutoverReadiness(config) {
  const sqliteFile = config.sqlite.file
  const targetStatus = await inspectMysqlTarget(config)
  const summary = {
    checkedAt: Date.now(),
    sqliteFile,
    mysqlTarget: `${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`,
    configuredClient: config.client,
    targetStatus,
    sqlitePresent: fs.existsSync(sqliteFile),
    coreTableCounts: [],
    autoIncrementChecks: [],
    blockers: [],
    readyForRuntimeCutover: false,
  }

  if (!summary.sqlitePresent) {
    summary.blockers.push('sqlite_missing')
    return summary
  }

  const mysql = loadMysql()
  const sqlite = new DatabaseSync(sqliteFile)
  let connection = null
  try {
    connection = await mysql.createConnection({
      host: config.mysql.host,
      port: config.mysql.port,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database,
    })

    const [tableRows] = await connection.query('SHOW TABLES')
    const mysqlTableNames = new Set(tableRows.map((row) => String(Object.values(row)[0] || '')))

    for (const tableName of CORE_TABLES) {
      const sqliteCount = getSqliteTableCount(sqlite, tableName)
      const mysqlExists = mysqlTableNames.has(tableName)
      const mysqlCount = mysqlExists ? await getMysqlTableCount(connection, tableName) : null
      summary.coreTableCounts.push({
        tableName,
        sqliteCount,
        mysqlCount,
        mysqlExists,
        countsMatch: mysqlExists && sqliteCount === mysqlCount,
      })
    }

    for (const tableName of AUTO_INCREMENT_TABLES) {
      const [columnRows] = await connection.query(`
        SELECT EXTRA AS extra
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'id'
      `, [config.mysql.database, tableName])
      const autoIncrement = String(columnRows[0]?.extra || '').toLowerCase().includes('auto_increment')
      summary.autoIncrementChecks.push({
        tableName,
        autoIncrement,
      })
    }
  } finally {
    try { sqlite.close() } catch {}
    if (connection) await connection.end().catch(() => {})
  }

  if (!targetStatus.reachable) summary.blockers.push('mysql_unreachable')
  if (!targetStatus.schemaReady) summary.blockers.push('mysql_schema_incomplete')
  if (!targetStatus.coreTablesPresent) summary.blockers.push('mysql_core_tables_missing')
  if (!summary.coreTableCounts.every((item) => item.countsMatch)) summary.blockers.push('table_count_mismatch')
  if (!summary.autoIncrementChecks.every((item) => item.autoIncrement)) summary.blockers.push('auto_increment_incomplete')

  summary.readyForRuntimeCutover = summary.blockers.length === 0
  return summary
}

function loadMysql() {
  try {
    return require('mysql2/promise')
  } catch (error) {
    throw new Error(`mysql2 is required before running MySQL preflight. Run "npm install" in server/. ${error.message}`)
  }
}

function getSqliteTableCount(sqlite, tableName) {
  const table = sqlite.prepare(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`,
  ).get(String(tableName))
  if (!table) return null
  return sqlite.prepare(`SELECT count(*) AS count FROM "${String(tableName).replace(/"/g, '""')}"`).get().count
}

async function getMysqlTableCount(connection, tableName) {
  const [rows] = await connection.query(`SELECT count(*) AS count FROM ${quoteMysqlIdentifier(tableName)}`)
  return Number(rows[0]?.count || 0)
}

function quoteMysqlIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``
}

module.exports = {
  CORE_TABLES,
  AUTO_INCREMENT_TABLES,
  buildMysqlCutoverReadiness,
}
