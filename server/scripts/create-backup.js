const fs = require('fs')
const path = require('path')
const { DatabaseSync, backup } = require('node:sqlite')

const dataDir = resolveDataDir(process.env.DATA_DIR)
const dbFile = path.join(dataDir, 'suqu.db')
const backupDir = path.join(dataDir, 'backups')
const uploadDir = path.join(dataDir, 'uploads')

if (!fs.existsSync(dbFile)) {
  console.error(`Database not found: ${dbFile}`)
  process.exit(1)
}

fs.mkdirSync(backupDir, { recursive: true })

const target = path.join(backupDir, `suqu-${new Date().toISOString().replace(/[:.]/g, '-')}.db`)
const uploadTarget = path.join(backupDir, `${path.basename(target, '.db')}-uploads`)
const db = new DatabaseSync(dbFile)

backup(db, target)
  .then(() => {
    if (fs.existsSync(uploadDir)) {
      copyDirectory(uploadDir, uploadTarget)
    }
    const stat = fs.statSync(target)
    console.log(`Backup created: ${target}`)
    console.log(`Size: ${stat.size} bytes`)
    if (fs.existsSync(uploadTarget)) {
      console.log(`Upload snapshot: ${uploadTarget}`)
      console.log(`Upload size: ${getDirectorySize(uploadTarget)} bytes`)
    }
  })
  .catch((error) => {
    console.error('Backup failed:', error)
    process.exitCode = 1
  })
  .finally(() => {
    db.close()
  })

function resolveDataDir(value) {
  if (!value) return path.resolve(__dirname, '..', 'data')
  return path.isAbsolute(value) ? value : path.resolve(__dirname, '..', value)
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
