const fs = require('fs')
const path = require('path')
const { DatabaseSync } = require('node:sqlite')
const { getDatabaseConfig } = require('../db/config')

async function main() {
  const mysql = loadMysql()
  const config = getDatabaseConfig(process.env)
  const sqliteFile = config.sqlite.file

  if (!fs.existsSync(sqliteFile)) {
    throw new Error(`SQLite database not found: ${sqliteFile}`)
  }

  const sqlite = new DatabaseSync(sqliteFile)
  let mysqlRootConnection = null
  let mysqlConnection = null
  try {
    mysqlRootConnection = await mysql.createConnection({
      host: config.mysql.host,
      port: config.mysql.port,
      user: config.mysql.user,
      password: config.mysql.password,
      multipleStatements: true,
    })
    await mysqlRootConnection.query(
      `CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(config.mysql.database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    )
    await mysqlRootConnection.end()
    mysqlRootConnection = null

    mysqlConnection = await mysql.createConnection({
      host: config.mysql.host,
      port: config.mysql.port,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database,
      multipleStatements: true,
    })
    await mysqlConnection.query('SET FOREIGN_KEY_CHECKS = 0')

    const tables = sqlite.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all().map((row) => row.name)

    const summary = []
    for (const tableName of tables) {
      const columns = sqlite.prepare(`PRAGMA table_info(${quoteSqliteIdentifier(tableName)})`).all()
      if (!columns.length) continue
      const createSql = buildCreateTableSql(sqlite, tableName, columns)
      await mysqlConnection.query(`DROP TABLE IF EXISTS ${quoteIdentifier(tableName)}`)
      await mysqlConnection.query(createSql)
      await recreateIndexes(sqlite, mysqlConnection, tableName)
      const rowCount = await importRows(sqlite, mysqlConnection, tableName, columns)
      summary.push({ tableName, rowCount })
      console.log(`[migrate] ${tableName}: ${rowCount} rows`)
    }

    await mysqlConnection.query(`
      CREATE TABLE IF NOT EXISTS migration_runs (
        id BIGINT NOT NULL AUTO_INCREMENT,
        source_client VARCHAR(32) NOT NULL,
        target_client VARCHAR(32) NOT NULL,
        started_at BIGINT NOT NULL,
        finished_at BIGINT DEFAULT NULL,
        status VARCHAR(32) NOT NULL,
        summary_json LONGTEXT,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    const now = Date.now()
    await mysqlConnection.query(
      'INSERT INTO migration_runs (source_client, target_client, started_at, finished_at, status, summary_json) VALUES (?, ?, ?, ?, ?, ?)',
      ['sqlite', 'mysql', now, now, 'completed', JSON.stringify(summary)],
    )
    await mysqlConnection.query('SET FOREIGN_KEY_CHECKS = 1')
    console.log(`[migrate] completed: ${summary.length} tables copied into ${config.mysql.database}`)
  } finally {
    try { sqlite.close() } catch {}
    if (mysqlConnection) await mysqlConnection.end().catch(() => {})
    if (mysqlRootConnection) await mysqlRootConnection.end().catch(() => {})
  }
}

function loadMysql() {
  try {
    return require('mysql2/promise')
  } catch (error) {
    throw new Error(`mysql2 is required before running MySQL migration. Run "npm install" in server/. ${error.message}`)
  }
}

function buildCreateTableSql(sqlite, tableName, columns) {
  const primaryKeys = columns.filter((column) => Number(column.pk) > 0).sort((a, b) => a.pk - b.pk)
  const indexedColumnNames = getIndexedColumnNames(sqlite, tableName)
  const lines = columns.map((column) => {
    const isPrimaryKey = Number(column.pk) > 0
    const mysqlType = mapSqliteTypeToMysql(column.type, {
      columnName: column.name,
      isPrimaryKey,
      isIndexed: indexedColumnNames.has(column.name),
    })
    const parts = [
      quoteIdentifier(column.name),
      mysqlType,
      column.notnull || isPrimaryKey ? 'NOT NULL' : 'NULL',
    ]
    if (shouldUseMysqlAutoIncrement(sqlite, tableName, column, primaryKeys, mysqlType)) {
      parts.push('AUTO_INCREMENT')
    }
    const defaultSql = toMysqlDefaultSql(column.dflt_value)
    if (defaultSql && !/TEXT|BLOB/i.test(mysqlType)) parts.push(`DEFAULT ${defaultSql}`)
    return `  ${parts.join(' ')}`
  })
  if (primaryKeys.length) {
    lines.push(`  PRIMARY KEY (${primaryKeys.map((column) => quoteIdentifier(column.name)).join(', ')})`)
  }
  return [
    `CREATE TABLE ${quoteIdentifier(tableName)} (`,
    lines.join(',\n'),
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  ].join('\n')
}

function shouldUseMysqlAutoIncrement(sqlite, tableName, column, primaryKeys, mysqlType) {
  if (primaryKeys.length !== 1) return false
  if (primaryKeys[0].name !== column.name) return false
  if (!/INT/i.test(mysqlType)) return false
  return hasSqliteAutoincrement(sqlite, tableName, column.name)
}

function hasSqliteAutoincrement(sqlite, tableName, columnName) {
  const row = sqlite.prepare(
    `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`,
  ).get(String(tableName))
  const createSql = String(row?.sql || '')
  if (!createSql) return false
  const escapedColumnName = String(columnName).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  const pattern = new RegExp(`"${escapedColumnName}"\\s+INTEGER\\s+PRIMARY\\s+KEY\\s+AUTOINCREMENT|\\b${escapedColumnName}\\b\\s+INTEGER\\s+PRIMARY\\s+KEY\\s+AUTOINCREMENT`, 'i')
  return pattern.test(createSql)
}

function getIndexedColumnNames(sqlite, tableName) {
  const indexedColumnNames = new Set()
  const indexes = sqlite.prepare(`PRAGMA index_list(${quoteSqliteIdentifier(tableName)})`).all()
  for (const index of indexes) {
    if (!index.name) continue
    const columns = sqlite.prepare(`PRAGMA index_info(${quoteSqliteIdentifier(index.name)})`).all()
    for (const column of columns) {
      if (column.name) indexedColumnNames.add(column.name)
    }
  }
  return indexedColumnNames
}

async function recreateIndexes(sqlite, mysqlConnection, tableName) {
  const indexes = sqlite.prepare(`PRAGMA index_list(${quoteSqliteIdentifier(tableName)})`).all()
  for (const index of indexes) {
    if (!index.name || String(index.origin || '').toLowerCase() === 'pk') continue
    if (String(index.name).startsWith('sqlite_autoindex_')) continue
    const columns = sqlite.prepare(`PRAGMA index_info(${quoteSqliteIdentifier(index.name)})`).all()
    if (!columns.length) continue
    const uniqueSql = index.unique ? 'UNIQUE ' : ''
    const sql = `CREATE ${uniqueSql}INDEX ${quoteIdentifier(index.name)} ON ${quoteIdentifier(tableName)} (${columns.map((column) => quoteIdentifier(column.name)).join(', ')})`
    await mysqlConnection.query(sql)
  }
}

async function importRows(sqlite, mysqlConnection, tableName, columns) {
  const rows = sqlite.prepare(`SELECT * FROM ${quoteSqliteIdentifier(tableName)}`).all()
  if (!rows.length) return 0
  const columnNames = columns.map((column) => column.name)
  const chunkSize = 200
  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize)
    const placeholders = chunk.map(() => `(${columnNames.map(() => '?').join(', ')})`).join(', ')
    const values = []
    for (const row of chunk) {
      for (const columnName of columnNames) {
        values.push(normalizeMysqlValue(row[columnName]))
      }
    }
    const sql = `INSERT INTO ${quoteIdentifier(tableName)} (${columnNames.map(quoteIdentifier).join(', ')}) VALUES ${placeholders}`
    await mysqlConnection.query(sql, values)
  }
  return rows.length
}

function normalizeMysqlValue(value) {
  if (Buffer.isBuffer(value)) return value
  if (value === undefined) return null
  return value
}

function mapSqliteTypeToMysql(type, options = {}) {
  const { columnName = '', isPrimaryKey = false, isIndexed = false } = options
  const normalized = String(type || '').trim().toUpperCase()
  const prefersBoundedText = isPrimaryKey || isIndexed || /(^id$|_id$|code$|key$|name$|slug$|username$|email$|status$|type$|level$|ip$|label$|token_hash$)/i.test(columnName)
  if (!normalized) return prefersBoundedText ? 'VARCHAR(191)' : 'LONGTEXT'
  if (normalized.includes('INT')) return 'BIGINT'
  if (normalized.includes('REAL') || normalized.includes('FLOA') || normalized.includes('DOUB')) return 'DOUBLE'
  if (normalized.includes('BLOB')) return 'LONGBLOB'
  if (normalized.includes('CHAR') || normalized.includes('CLOB') || normalized.includes('TEXT')) {
    return prefersBoundedText ? 'VARCHAR(191)' : 'LONGTEXT'
  }
  if (normalized.includes('DATE') || normalized.includes('TIME')) return 'VARCHAR(64)'
  return 'LONGTEXT'
}

function toMysqlDefaultSql(value) {
  if (value === null || value === undefined || value === '') return ''
  const raw = String(value).trim()
  if (!raw) return ''
  if (/^null$/i.test(raw)) return 'NULL'
  if (/^-?\d+(\.\d+)?$/.test(raw)) return raw
  if (/^'(.*)'$/s.test(raw)) return raw.replace(/\\'/g, "''")
  return `'${raw.replace(/'/g, "''")}'`
}

function quoteIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``
}

function quoteSqliteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`
}

main().catch((error) => {
  console.error(`[migrate] failed: ${error.message}`)
  process.exit(1)
})
