const { getDatabaseConfig } = require('../db/config')
const { withMysqlConnection } = require('../db/mysql-primary-ops')

const AUTO_INCREMENT_TABLES = ['login_attempts', 'audit_logs', 'ai_call_logs']

async function main() {
  const config = getDatabaseConfig(process.env)
  const summary = {
    checkedAt: Date.now(),
    mysqlTarget: `${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`,
    tables: [],
    ok: true,
  }

  await withMysqlConnection(config, async (db, connection) => {
    for (const tableName of AUTO_INCREMENT_TABLES) {
      const column = await db.get(`
        SELECT COLUMN_TYPE AS column_type, IS_NULLABLE AS is_nullable, EXTRA AS extra
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'id'
      `, [config.mysql.database, tableName])

      if (!column) {
        summary.tables.push({ tableName, exists: false, changed: false, autoIncrement: false })
        summary.ok = false
        continue
      }

      const alreadyAutoIncrement = String(column.extra || '').toLowerCase().includes('auto_increment')
      if (!alreadyAutoIncrement) {
        await connection.query(
          `ALTER TABLE ${quoteIdentifier(tableName)} MODIFY id ${column.column_type} NOT NULL AUTO_INCREMENT`,
        )
        const nextIdRow = await db.get(`SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM ${quoteIdentifier(tableName)}`)
        const nextId = Math.max(1, Number(nextIdRow?.next_id || 1))
        await connection.query(`ALTER TABLE ${quoteIdentifier(tableName)} AUTO_INCREMENT = ${nextId}`)
      }

      const verified = await db.get(`
        SELECT EXTRA AS extra
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'id'
      `, [config.mysql.database, tableName])
      const autoIncrement = String(verified?.extra || '').toLowerCase().includes('auto_increment')

      summary.tables.push({
        tableName,
        exists: true,
        changed: !alreadyAutoIncrement,
        autoIncrement,
      })
      if (!autoIncrement) summary.ok = false
    }
  })

  console.log(JSON.stringify(summary, null, 2))
  if (!summary.ok) process.exitCode = 1
}

function quoteIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``
}

main().catch((error) => {
  console.error(JSON.stringify({
    checkedAt: Date.now(),
    ok: false,
    error: error.message,
  }, null, 2))
  process.exit(1)
})
