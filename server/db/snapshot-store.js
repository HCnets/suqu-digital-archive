function createSnapshotStore({ getDb }) {
  function db() {
    return getDb()
  }

  function quoteIdentifier(identifier) {
    return `"${String(identifier).replace(/"/g, '""')}"`
  }

  function listTableRows(tableName) {
    return db().prepare(`SELECT * FROM ${quoteIdentifier(tableName)}`).all()
  }

  function listSnapshotTables(tableNames) {
    return Object.fromEntries(tableNames.map((tableName) => [tableName, listTableRows(tableName)]))
  }

  function listTableColumns(tableName) {
    return db().prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`).all().map((column) => column.name)
  }

  function insertTableRows(tableName, rows) {
    if (!rows.length) return
    const columns = listTableColumns(tableName)
    if (!columns.length) return
    const statement = db().prepare(
      `INSERT INTO ${quoteIdentifier(tableName)} (${columns.map(quoteIdentifier).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    )

    for (const row of rows) {
      const values = columns.map((column) => (row[column] === undefined ? null : row[column]))
      statement.run(...values)
    }
  }

  function replaceSnapshotTables({ snapshotTableNames, importOnlyTableNames, tables }) {
    const clearTables = [...snapshotTableNames].reverse().concat(importOnlyTableNames)
    const counts = Object.fromEntries(snapshotTableNames.map((tableName) => [tableName, tables[tableName].length]))

    db().exec('PRAGMA foreign_keys = OFF')
    db().exec('BEGIN')
    try {
      for (const tableName of clearTables) {
        db().prepare(`DELETE FROM ${quoteIdentifier(tableName)}`).run()
      }
      for (const tableName of snapshotTableNames) {
        insertTableRows(tableName, tables[tableName])
      }
      db().exec('COMMIT')
    } catch (error) {
      db().exec('ROLLBACK')
      throw error
    } finally {
      db().exec('PRAGMA foreign_keys = ON')
    }

    return { counts }
  }

  return {
    listSnapshotTables,
    replaceSnapshotTables,
  }
}

module.exports = {
  createSnapshotStore,
}
