const fs = require('fs')
const path = require('path')

const ENV_CANDIDATES = [
  '.env',
  '.env.local',
  '.env.mysql',
  '.env.mysql.local',
  '.env.mysql.example',
]

bootstrapMysqlCliEnv()

function bootstrapMysqlCliEnv() {
  const rootDir = path.resolve(__dirname, '..')
  for (const name of ENV_CANDIDATES) {
    const fullPath = path.join(rootDir, name)
    if (!fs.existsSync(fullPath)) continue
    applyEnvFile(fullPath)
  }
}

function applyEnvFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex <= 0) continue
    const key = trimmed.slice(0, separatorIndex).trim()
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) continue
    const value = trimmed.slice(separatorIndex + 1).trim()
    process.env[key] = unquote(value)
  }
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}
