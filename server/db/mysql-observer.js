const { loadMysql, createMysqlConnectionOptions } = require('./mysql-primary-ops')

async function inspectMysqlTarget(config) {
  const base = {
    client: 'mysql',
    reachable: false,
    schemaReady: false,
    migrationRuns: 0,
    coreTablesPresent: false,
    tableCount: 0,
    version: null,
    error: null,
  }

  let mysql = null
  try {
    mysql = loadMysql()
  } catch (error) {
    return {
      ...base,
      error: error.message,
    }
  }

  let connection = null
  try {
    connection = await mysql.createConnection(createMysqlConnectionOptions(config))

    const [versionRows] = await connection.query('SELECT VERSION() AS version')
    const [tableRows] = await connection.query('SHOW TABLES')
    const tableNames = tableRows.map((row) => String(Object.values(row)[0] || ''))
    const hasMigrationRuns = tableNames.includes('migration_runs')
    const hasAdminUsers = tableNames.includes('admin_users')
    const hasContents = tableNames.includes('contents')
    let migrationRuns = 0

    if (hasMigrationRuns) {
      const [migrationRows] = await connection.query('SELECT count(*) AS count FROM migration_runs')
      migrationRuns = Number(migrationRows[0]?.count || 0)
    }

    return {
      ...base,
      reachable: true,
      schemaReady: hasMigrationRuns,
      migrationRuns,
      coreTablesPresent: hasAdminUsers && hasContents,
      tableCount: tableNames.length,
      version: versionRows[0]?.version || null,
    }
  } catch (error) {
    return {
      ...base,
      error: error.message,
    }
  } finally {
    if (connection) await connection.end().catch(() => {})
  }
}

module.exports = {
  inspectMysqlTarget,
}
