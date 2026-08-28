const http = require('http')
const { spawn } = require('child_process')

async function main() {
  const port = 3100 + Math.floor(Math.random() * 400)
  const child = spawn(process.execPath, ['index.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      DB_CLIENT: 'mysql',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })

  let stderr = ''
  child.stderr.on('data', (chunk) => {
    stderr += String(chunk)
  })

  try {
    const health = await waitForJson(`http://localhost:${port}/api/health`, 15000)
    const contents = await requestJson(`http://localhost:${port}/api/contents?page=1&pageSize=1`)
    const errors = []

    if (health.store !== 'mysql') errors.push(`expected health.store=mysql, got ${health.store}`)
    if (health.configuredStore !== 'mysql') errors.push(`expected health.configuredStore=mysql, got ${health.configuredStore}`)
    if (health.compatibilityMode !== false) errors.push(`expected health.compatibilityMode=false, got ${health.compatibilityMode}`)
    if (health.database?.runtimeAligned !== true) errors.push('expected database.runtimeAligned=true')
    if (health.database?.nextAction !== 'runtime_already_on_mysql') errors.push(`expected database.nextAction=runtime_already_on_mysql, got ${health.database?.nextAction}`)
    if (!Array.isArray(contents.items)) errors.push('expected /api/contents to return items array')

    const result = {
      checkedAt: Date.now(),
      ok: errors.length === 0,
      health: {
        store: health.store,
        configuredStore: health.configuredStore,
        compatibilityMode: health.compatibilityMode,
        runtimeAligned: health.database?.runtimeAligned,
        nextAction: health.database?.nextAction,
      },
      contentCount: Array.isArray(contents.items) ? contents.items.length : null,
    }

    if (errors.length) {
      result.errors = errors
      throw new Error(JSON.stringify(result, null, 2))
    }

    console.log(JSON.stringify(result, null, 2))
  } finally {
    child.kill()
  }

  if (stderr.trim()) {
    process.stderr.write(stderr)
  }
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`))
          return
        }
        try {
          resolve(JSON.parse(body))
        } catch (error) {
          reject(error)
        }
      })
    })
    req.on('error', reject)
  })
}

async function waitForJson(url, timeoutMs) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    try {
      return await requestJson(url)
    } catch (error) {
      await delay(300)
    }
  }
  throw new Error(`Timed out waiting for ${url}`)
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

main().catch((error) => {
  const message = error && error.message ? error.message : String(error)
  try {
    const parsed = JSON.parse(message)
    console.error(JSON.stringify(parsed, null, 2))
  } catch {
    console.error(JSON.stringify({
      checkedAt: Date.now(),
      ok: false,
      error: message,
    }, null, 2))
  }
  process.exit(1)
})
