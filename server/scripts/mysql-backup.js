const fs = require('fs')
const path = require('path')
const { getDatabaseConfig } = require('../db/config')

async function main() {
  const mysql = loadMysql()
  const config = getDatabaseConfig(process.env)
  const backupDir = config.sqlite.backupDir
  const uploadDir = config.sqlite.uploadDir

  fs.mkdirSync(backupDir, { recursive: true })

  const connection = await mysql.createConnection({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
  })

  try {
    const [tables] = await connection.query('SHOW TABLES')
    const tableKey = Object.keys(tables[0] || {})[0]
    const payload = {
      exportedAt: Date.now(),
      format: 'suqu-mysql-json-v1',
      database: config.mysql.database,
      tables: {},
    }

    for (const row of tables) {
      const tableName = row[tableKey]
      const [items] = await connection.query(`SELECT * FROM ${quoteIdentifier(tableName)}`)
      payload.tables[tableName] = items
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(backupDir, `suqu-mysql-${stamp}.json`)
    fs.writeFileSync(backupFile, JSON.stringify(payload, null, 2), 'utf8')

    const uploadTarget = path.join(backupDir, `suqu-mysql-${stamp}-uploads`)
    if (fs.existsSync(uploadDir)) {
      copyDirectory(uploadDir, uploadTarget)
    }

    const stat = fs.statSync(backupFile)
    console.log(`MySQL backup created: ${backupFile}`)
    console.log(`Size: ${stat.size} bytes`)
    if (fs.existsSync(uploadTarget)) {
      console.log(`Upload snapshot: ${uploadTarget}`)
      console.log(`Upload size: ${getDirectorySize(uploadTarget)} bytes`)
    }
  } finally {
    await connection.end().catch(() => {})
  }
}

function loadMysql() {
  try {
    return require('mysql2/promise')
  } catch (error) {
    throw new Error(`mysql2 is required before running MySQL backup. Run "npm install" in server/. ${error.message}`)
  }
}

function quoteIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``
}

function copyDirectory(source, target) {
  const resolvedSource = path.resolve(source)
  const resolvedTarget = path.resolve(target)
  if (!fs.existsSync(resolvedSource)) return

  fs.mkdirSync(resolvedTarget, { recursive: true })
  for (const entry of fs.readdirSync(resolvedSource, { withFileTypes: true })) {
    const sourcePath = path.join(resolvedSource, entry.name)
    const targetPath = path.join(resolvedTarget, entry.name)
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath)
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath)
    }
  }
}

function getDirectorySize(dirPath) {
  const resolved = path.resolve(dirPath)
  if (!fs.existsSync(resolved)) return 0
  return fs.readdirSync(resolved, { withFileTypes: true }).reduce((total, entry) => {
    const entryPath = path.join(resolved, entry.name)
    if (entry.isDirectory()) return total + getDirectorySize(entryPath)
    if (entry.isFile()) return total + fs.statSync(entryPath).size
    return total
  }, 0)
}

main().catch((error) => {
  console.error(`MySQL backup failed: ${error.message}`)
  process.exit(1)
})
