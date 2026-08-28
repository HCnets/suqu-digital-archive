const http = require('http')
const crypto = require('crypto')
const { getDatabaseConfig } = require('../db/config')
const { loadMysql, createMysqlConnectionOptions } = require('../db/mysql-primary-ops')

async function main() {
  const config = getDatabaseConfig({
    ...process.env,
    DB_CLIENT: 'mysql',
  })
  const mysql = loadMysql()
  const connection = await mysql.createConnection(createMysqlConnectionOptions(config))
  const client = createHttpClient('http://localhost:3001')
  const tempPassword = 'SzhtMysqlRegression2026'
  const summary = {
    checkedAt: Date.now(),
    mysqlTarget: `${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`,
    admin: {},
    auth: {},
    exportImport: {},
    backupRestore: {},
    ok: false,
  }
  let currentStep = 'init'
  globalThis.__mysqlAdminRuntimeRegressionStep = currentStep

  let adminRow = null
  let originalPasswordHash = ''
  let originalUpdatedAt = 0
  let originalStatus = 'active'

  try {
    adminRow = await findSuperAdmin(connection)
    if (!adminRow) throw new Error('No super_admin user found for regression smoke.')

    originalPasswordHash = adminRow.password_hash
    originalUpdatedAt = Number(adminRow.updated_at || Date.now())
    originalStatus = adminRow.status || 'active'

    await connection.query(
      'UPDATE admin_users SET password_hash = ?, status = ?, updated_at = ? WHERE id = ?',
      [hashPassword(tempPassword), 'active', Date.now(), adminRow.id],
    )
    await connection.query('DELETE FROM sessions WHERE user_id = ?', [adminRow.id])

    summary.admin = {
      userId: adminRow.id,
      username: adminRow.username,
      roleId: adminRow.role_id,
    }

    currentStep = 'login'
    globalThis.__mysqlAdminRuntimeRegressionStep = currentStep
    const login = await client.request('POST', '/api/auth/login', {
      body: {
        username: adminRow.username,
        password: tempPassword,
        rememberMe: false,
      },
    })
    client.setCsrfToken(login.body.csrfToken)

    currentStep = 'auth_me'
    globalThis.__mysqlAdminRuntimeRegressionStep = currentStep
    const me = await client.request('GET', '/api/auth/me')
    currentStep = 'permissions'
    globalThis.__mysqlAdminRuntimeRegressionStep = currentStep
    const permissions = await client.request('GET', '/api/admin/permissions')
    currentStep = 'users'
    globalThis.__mysqlAdminRuntimeRegressionStep = currentStep
    const users = await client.request('GET', '/api/admin/users')
    currentStep = 'tribute_before'
    globalThis.__mysqlAdminRuntimeRegressionStep = currentStep
    const tributeBefore = await client.request('GET', '/api/admin/tributes')

    summary.auth = {
      loginUser: login.body?.user?.username || null,
      meUser: me.body?.user?.username || null,
      permissionCount: Array.isArray(permissions.body) ? permissions.body.length : 0,
      userCount: Array.isArray(users.body) ? users.body.length : 0,
      tributeBefore: tributeBefore.body?.count ?? null,
    }

    currentStep = 'export'
    globalThis.__mysqlAdminRuntimeRegressionStep = currentStep
    const exported = await client.request('GET', '/api/admin/export')
    currentStep = 'backup_create'
    globalThis.__mysqlAdminRuntimeRegressionStep = currentStep
    const backup = await client.request('POST', '/api/admin/backup', { body: {} })
    currentStep = 'backup_list'
    globalThis.__mysqlAdminRuntimeRegressionStep = currentStep
    const backups = await client.request('GET', '/api/admin/backups')

    currentStep = 'tribute_adjust_before_import'
    globalThis.__mysqlAdminRuntimeRegressionStep = currentStep
    await client.request('POST', '/api/admin/tributes/adjust', { body: { delta: 7 } })
    currentStep = 'tribute_public_after_import_adjust'
    globalThis.__mysqlAdminRuntimeRegressionStep = currentStep
    const tributeAfterAdjustForImport = await client.request('GET', '/api/tributes')

    currentStep = 'import'
    globalThis.__mysqlAdminRuntimeRegressionStep = currentStep
    const imported = await client.request('POST', '/api/admin/import', {
      body: exported.body,
    })

    let meAfterImportStatus = null
    try {
      currentStep = 'auth_me_after_import'
      globalThis.__mysqlAdminRuntimeRegressionStep = currentStep
      await client.request('GET', '/api/auth/me')
      meAfterImportStatus = 200
    } catch (error) {
      meAfterImportStatus = error.statusCode || 500
    }

    currentStep = 'relogin_after_import'
    globalThis.__mysqlAdminRuntimeRegressionStep = currentStep
    const reLogin = await client.request('POST', '/api/auth/login', {
      body: {
        username: adminRow.username,
        password: tempPassword,
        rememberMe: false,
      },
      resetCookie: true,
    })
    client.setCsrfToken(reLogin.body.csrfToken)

    currentStep = 'tribute_adjust_before_restore'
    globalThis.__mysqlAdminRuntimeRegressionStep = currentStep
    await client.request('POST', '/api/admin/tributes/adjust', { body: { delta: 5 } })
    currentStep = 'tribute_public_after_restore_adjust'
    globalThis.__mysqlAdminRuntimeRegressionStep = currentStep
    const tributeAfterAdjustForRestore = await client.request('GET', '/api/tributes')
    currentStep = 'backup_restore'
    globalThis.__mysqlAdminRuntimeRegressionStep = currentStep
    const restored = await client.request('POST', `/api/admin/backups/${encodeURIComponent(backup.body.name)}/restore`, {
      body: {},
    })
    currentStep = 'tribute_public_after_restore'
    globalThis.__mysqlAdminRuntimeRegressionStep = currentStep
    const tributeAfterRestore = await client.request('GET', '/api/tributes')
    let authStatusAfterRestore = null
    try {
      currentStep = 'auth_me_after_restore'
      globalThis.__mysqlAdminRuntimeRegressionStep = currentStep
      await client.request('GET', '/api/auth/me')
      authStatusAfterRestore = 200
    } catch (error) {
      authStatusAfterRestore = error.statusCode || 500
    }

    summary.exportImport = {
      exportedTableCount: Object.keys(exported.body?.tables || {}).length,
      exportedTributeRows: Array.isArray(exported.body?.tables?.tributes) ? exported.body.tables.tributes.length : 0,
      tributeAfterAdjust: tributeAfterAdjustForImport.body?.count ?? null,
      importedSessionInvalidated: imported.body?.sessionInvalidated === true,
      authStatusAfterImport: meAfterImportStatus,
      tributeAfterImport: (await client.request('GET', '/api/tributes')).body?.count ?? null,
    }

    summary.backupRestore = {
      backupName: backup.body?.name || null,
      backupListed: Array.isArray(backups.body?.items) && backups.body.items.some((item) => item.name === backup.body?.name),
      tributeAfterSecondAdjust: tributeAfterAdjustForRestore.body?.count ?? null,
      restoredBackupName: restored.body?.name || null,
      tributeAfterRestore: tributeAfterRestore.body?.count ?? null,
      authStatusAfterRestore,
    }

    const errors = []
    if (summary.auth.loginUser !== adminRow.username) errors.push('login returned unexpected username')
    if (summary.auth.meUser !== adminRow.username) errors.push('auth/me returned unexpected username')
    if (summary.auth.permissionCount <= 0) errors.push('permissions list is empty')
    if (summary.auth.userCount <= 0) errors.push('users list is empty')
    if (summary.auth.tributeBefore === null) errors.push('failed to read tribute count before regression')
    if (summary.exportImport.exportedTableCount <= 0) errors.push('export returned no tables')
    if (summary.exportImport.tributeAfterAdjust !== summary.auth.tributeBefore + 7) errors.push('tribute adjust before import did not apply')
    if (!summary.exportImport.importedSessionInvalidated) errors.push('import did not report sessionInvalidated=true')
    if (summary.exportImport.authStatusAfterImport !== 401) errors.push(`expected auth/me after import to return 401, got ${summary.exportImport.authStatusAfterImport}`)
    if (summary.exportImport.tributeAfterImport !== summary.auth.tributeBefore) errors.push('import did not restore tribute count')
    if (!summary.backupRestore.backupListed) errors.push('created backup was not listed in backups endpoint')
    if (summary.backupRestore.tributeAfterSecondAdjust !== summary.auth.tributeBefore + 5) errors.push('tribute adjust before restore did not apply')
    if (summary.backupRestore.restoredBackupName !== summary.backupRestore.backupName) errors.push('restore did not return expected backup name')
    if (summary.backupRestore.tributeAfterRestore !== summary.auth.tributeBefore) errors.push('backup restore did not restore tribute count')
    if (summary.backupRestore.authStatusAfterRestore !== 401) errors.push(`expected auth/me after restore to return 401, got ${summary.backupRestore.authStatusAfterRestore}`)

    if (errors.length) {
      summary.errors = errors
      throw new Error('Regression checks failed.')
    }

    summary.ok = true
    console.log(JSON.stringify(summary, null, 2))
  } finally {
    if (adminRow) {
      await connection.query(
        'UPDATE admin_users SET password_hash = ?, status = ?, updated_at = ? WHERE id = ?',
        [originalPasswordHash, originalStatus, originalUpdatedAt, adminRow.id],
      ).catch(() => {})
      await connection.query('DELETE FROM sessions WHERE user_id = ?', [adminRow.id]).catch(() => {})
    }
    await connection.end().catch(() => {})
  }
}

function createHttpClient(baseUrl) {
  let cookieHeader = ''
  let csrfToken = ''
  const forwardedFor = `198.18.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`

  return {
    setCsrfToken(value) {
      csrfToken = String(value || '')
    },
    async request(method, path, options = {}) {
      if (options.resetCookie) cookieHeader = ''
      const body = options.body === undefined ? null : JSON.stringify(options.body)
      const url = new URL(path, baseUrl)

      return await new Promise((resolve, reject) => {
        const headers = {}
        if (body) {
          headers['content-type'] = 'application/json'
          headers['content-length'] = Buffer.byteLength(body)
        }
        if (cookieHeader) headers.cookie = cookieHeader
        if (body && csrfToken) headers['x-csrf-token'] = csrfToken
        headers['x-forwarded-for'] = forwardedFor
        headers['user-agent'] = 'mysql-admin-runtime-regression/1.0'

        const req = http.request(url, {
          method,
          headers,
        }, (res) => {
          let raw = ''
          res.setEncoding('utf8')
          const setCookie = res.headers['set-cookie']
          if (setCookie) {
            cookieHeader = setCookie.map((item) => item.split(';')[0]).join('; ')
          }
          res.on('data', (chunk) => {
            raw += chunk
          })
          res.on('end', () => {
            const payload = raw ? safeJsonParse(raw) : null
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ statusCode: res.statusCode, body: payload })
              return
            }
            const error = new Error(`HTTP ${res.statusCode}`)
            error.statusCode = res.statusCode
            error.body = payload
            reject(error)
          })
        })
        req.on('error', reject)
        if (body) req.write(body)
        req.end()
      })
    },
  }
}

async function findSuperAdmin(connection) {
  const [rows] = await connection.query(`
    SELECT id, username, role_id, password_hash, status, updated_at
    FROM admin_users
    WHERE role_id = 'super_admin'
    ORDER BY created_at ASC
    LIMIT 1
  `)
  return rows[0] || null
}

function hashPassword(value) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(String(value), salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    checkedAt: Date.now(),
    ok: false,
    step: globalThis.__mysqlAdminRuntimeRegressionStep || null,
    error: error.message,
    statusCode: error.statusCode || null,
    response: error.body || null,
  }, null, 2))
  process.exit(1)
})
