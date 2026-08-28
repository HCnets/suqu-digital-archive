const fs = require('fs')
const { DatabaseSync } = require('node:sqlite')

const APPEND_ONLY_TABLES = ['audit_logs', 'login_attempts', 'ai_call_logs']

async function syncSqliteAppendOnlyTablesToMysql(config, options = {}) {
  const sqliteFile = config.sqlite.file
  if (!fs.existsSync(sqliteFile)) {
    throw new Error(`SQLite database not found: ${sqliteFile}`)
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

    const summary = {
      checkedAt: Date.now(),
      sqliteFile,
      mysqlTarget: `${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`,
      tables: [],
      totalInserted: 0,
    }

    for (const tableName of APPEND_ONLY_TABLES) {
      const sqliteColumns = getSqliteColumns(sqlite, tableName)
      if (!sqliteColumns.length) {
        summary.tables.push({
          tableName,
          sqlitePresent: false,
          mysqlPresent: false,
          inserted: 0,
          skipped: true,
          reason: 'sqlite_table_missing',
        })
        continue
      }

      const mysqlPresent = await hasMysqlTable(connection, tableName)
      if (!mysqlPresent) {
        summary.tables.push({
          tableName,
          sqlitePresent: true,
          mysqlPresent: false,
          inserted: 0,
          skipped: true,
          reason: 'mysql_table_missing',
        })
        continue
      }

      const mysqlMaxId = await getMysqlMaxId(connection, tableName)
      const rows = sqlite.prepare(`
        SELECT *
        FROM ${quoteSqliteIdentifier(tableName)}
        WHERE id > ?
        ORDER BY id ASC
      `).all(Number(mysqlMaxId))

      let inserted = 0
      if (rows.length) {
        inserted = await insertRows(connection, tableName, sqliteColumns, rows, options.chunkSize || 200)
        await ensureMysqlAutoIncrementAtLeast(connection, tableName, rows[rows.length - 1].id)
      }

      summary.tables.push({
        tableName,
        sqlitePresent: true,
        mysqlPresent: true,
        mysqlMaxIdBefore: mysqlMaxId,
        sqliteMaxIdAfter: rows.length ? Number(rows[rows.length - 1].id) : mysqlMaxId,
        inserted,
        skipped: false,
      })
      summary.totalInserted += inserted
    }

    return summary
  } finally {
    try { sqlite.close() } catch {}
    if (connection) await connection.end().catch(() => {})
  }
}

function loadMysql() {
  try {
    return require('mysql2/promise')
  } catch (error) {
    throw new Error(`mysql2 is required before syncing append-only tables. Run "npm install" in server/. ${error.message}`)
  }
}

function getSqliteColumns(sqlite, tableName) {
  return sqlite.prepare(`PRAGMA table_info(${quoteSqliteIdentifier(tableName)})`).all().map((column) => column.name)
}

async function hasMysqlTable(connection, tableName) {
  const [rows] = await connection.query(`
    SELECT 1
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
    LIMIT 1
  `, [String(tableName)])
  return rows.length > 0
}

async function getMysqlMaxId(connection, tableName) {
  const [rows] = await connection.query(`SELECT COALESCE(MAX(id), 0) AS maxId FROM ${quoteMysqlIdentifier(tableName)}`)
  return Number(rows[0]?.maxId || 0)
}

async function insertRows(connection, tableName, columnNames, rows, chunkSize) {
  let inserted = 0
  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize)
    const placeholders = chunk.map(() => `(${columnNames.map(() => '?').join(', ')})`).join(', ')
    const values = []
    for (const row of chunk) {
      for (const columnName of columnNames) {
        values.push(normalizeMysqlValue(row[columnName]))
      }
    }
    await connection.query(
      `INSERT INTO ${quoteMysqlIdentifier(tableName)} (${columnNames.map(quoteMysqlIdentifier).join(', ')}) VALUES ${placeholders}`,
      values,
    )
    inserted += chunk.length
  }
  return inserted
}

async function ensureMysqlAutoIncrementAtLeast(connection, tableName, lastInsertedId) {
  const nextId = Number(lastInsertedId || 0) + 1
  await connection.query(`ALTER TABLE ${quoteMysqlIdentifier(tableName)} AUTO_INCREMENT = ${nextId}`)
}

function normalizeMysqlValue(value) {
  if (Buffer.isBuffer(value)) return value
  if (value === undefined) return null
  return value
}

function quoteMysqlIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``
}

function quoteSqliteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`
}

module.exports = {
  APPEND_ONLY_TABLES,
  syncSqliteAppendOnlyTablesToMysql,
}
