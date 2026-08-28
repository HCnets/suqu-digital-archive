const fs = require('fs')
const path = require('path')

const ENV_CANDIDATES = ['.env', '.env.local']

loadEnvFiles()

function loadEnvFiles() {
  const rootDir = path.resolve(__dirname, '..')
  for (const name of ENV_CANDIDATES) {
    const fullPath = path.join(rootDir, name)
    if (fs.existsSync(fullPath)) applyEnvFile(fullPath)
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
    if (!key) continue
    process.env[key] = unquote(trimmed.slice(separatorIndex + 1).trim())
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
