const fs = require('fs')
const { DatabaseSync, backup } = require('node:sqlite')

function ensureSqliteDirectories(config) {
  fs.mkdirSync(config.sqlite.dataDir, { recursive: true })
  fs.mkdirSync(config.sqlite.uploadDir, { recursive: true })
  fs.mkdirSync(config.sqlite.backupDir, { recursive: true })
}

function applySqlitePragmas(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `)
}

function openSqliteDatabase(config) {
  ensureSqliteDirectories(config)
  const db = new DatabaseSync(config.sqlite.file)
  applySqlitePragmas(db)
  return db
}

function reopenSqliteDatabase(currentDb, config) {
  try {
    currentDb?.close?.()
  } catch {}
  return openSqliteDatabase(config)
}

async function backupSqliteDatabase(db, backupFile) {
  await backup(db, backupFile)
}

function getSqliteHealthSnapshot(db) {
  return {
    archiveCount: db.prepare('SELECT count(*) AS count FROM archives').get().count,
    messageCount: db.prepare('SELECT count(*) AS count FROM messages').get().count,
  }
}

function runSqliteTransaction(db, action) {
  db.exec('BEGIN')
  try {
    const result = action()
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

async function runSqliteTransactionAsync(db, action) {
  db.exec('BEGIN')
  try {
    const result = await action()
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

module.exports = {
  ensureSqliteDirectories,
  openSqliteDatabase,
  reopenSqliteDatabase,
  backupSqliteDatabase,
  getSqliteHealthSnapshot,
  runSqliteTransaction,
  runSqliteTransactionAsync,
}
