function createMysqlSnapshotStore({ getDb }) {
  function db() {
    return getDb()
  }

  function quoteIdentifier(identifier) {
    return `\`${String(identifier).replace(/`/g, '``')}\``
  }

  async function listTableRows(tableName) {
    return db().all(`SELECT * FROM ${quoteIdentifier(tableName)}`)
  }

  async function listSnapshotTables(tableNames) {
    const entries = []
    for (const tableName of tableNames) {
      entries.push([tableName, await listTableRows(tableName)])
    }
    return Object.fromEntries(entries)
  }

  async function listTableColumns(tableName) {
    const rows = await db().all(`
      SELECT COLUMN_NAME AS column_name
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION ASC
    `, [String(tableName)])
    return rows.map((row) => row.column_name)
  }

  async function insertTableRows(tableName, rows) {
    if (!rows.length) return
    const columns = await listTableColumns(tableName)
    if (!columns.length) return
    const placeholders = rows.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ')
    const values = []
    for (const row of rows) {
      for (const column of columns) {
        values.push(row[column] === undefined ? null : row[column])
      }
    }
    await db().run(
      `INSERT INTO ${quoteIdentifier(tableName)} (${columns.map(quoteIdentifier).join(', ')}) VALUES ${placeholders}`,
      values,
    )
  }

  async function replaceSnapshotTables({ snapshotTableNames, importOnlyTableNames, tables }) {
    const clearTables = [...snapshotTableNames].reverse().concat(importOnlyTableNames)
    const counts = Object.fromEntries(snapshotTableNames.map((tableName) => [tableName, tables[tableName].length]))

    await db().transaction(async () => {
      await db().run('SET FOREIGN_KEY_CHECKS = 0')
      try {
        for (const tableName of clearTables) {
          await db().run(`DELETE FROM ${quoteIdentifier(tableName)}`)
        }
        for (const tableName of snapshotTableNames) {
          await insertTableRows(tableName, tables[tableName])
        }
      } finally {
        await db().run('SET FOREIGN_KEY_CHECKS = 1')
      }
    })

    return { counts }
  }

  return {
    listSnapshotTables,
    replaceSnapshotTables,
  }
}

module.exports = {
  createMysqlSnapshotStore,
}
