const path = require('path')

const SUPPORTED_DB_CLIENTS = new Set(['sqlite', 'mysql'])

function resolveDataDir(value) {
  if (!value) return path.join(__dirname, '..', 'data')
  return path.isAbsolute(value) ? value : path.resolve(__dirname, '..', value)
}

function parsePort(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function getDatabaseConfig(env = process.env) {
  const client = String(env.DB_CLIENT || 'sqlite').trim().toLowerCase() || 'sqlite'
  const dataDir = resolveDataDir(env.DATA_DIR)
  return {
    client,
    sqlite: {
      dataDir,
      file: path.join(dataDir, 'suqu.db'),
      backupDir: path.join(dataDir, 'backups'),
      uploadDir: path.join(dataDir, 'uploads'),
      aiSecretFile: path.join(dataDir, '.ai-secret-key'),
    },
    mysql: {
      host: String(env.DB_HOST || '127.0.0.1').trim() || '127.0.0.1',
      port: parsePort(env.DB_PORT, 3306),
      database: String(env.DB_NAME || 'szht_cms').trim() || 'szht_cms',
      user: String(env.DB_USER || 'szht_user').trim() || 'szht_user',
      password: String(env.DB_PASSWORD || '').trim(),
      connectionLimit: parsePort(env.DB_CONNECTION_LIMIT, 10),
    },
  }
}

function assertSupportedDbClient(client) {
  if (!SUPPORTED_DB_CLIENTS.has(client)) {
    throw new Error(`Unsupported DB_CLIENT "${client}". Supported values: sqlite, mysql.`)
  }
}

function getDatabaseSummary(env = process.env) {
  const config = getDatabaseConfig(env)
  return {
    configuredClient: config.client,
    sqliteFile: config.sqlite.file,
    mysqlHost: config.mysql.host,
    mysqlPort: config.mysql.port,
    mysqlDatabase: config.mysql.database,
  }
}

module.exports = {
  SUPPORTED_DB_CLIENTS,
  assertSupportedDbClient,
  getDatabaseConfig,
  getDatabaseSummary,
  resolveDataDir,
}
