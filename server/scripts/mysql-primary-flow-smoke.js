const assert = require('assert')
const { getDatabaseConfig } = require('../db/config')
const { createSqlDialect } = require('../db/sql-dialect')
const { getMysqlHealthSnapshot, withMysqlConnection, withMysqlRollbackTransaction } = require('../db/mysql-primary-ops')

async function main() {
  const config = getDatabaseConfig(process.env)
  const dialect = createSqlDialect('mysql')
  const summary = {
    checkedAt: Date.now(),
    mysqlTarget: `${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`,
    health: null,
    reads: {},
    writes: {},
    rollback: {},
    ok: false,
  }

  summary.health = await getMysqlHealthSnapshot(config)

  await withMysqlConnection(config, async (db) => {
    const superAdminRow = await db.get(`
      SELECT u.id, u.username, u.role_id, r.name AS role_name
      FROM admin_users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE u.role_id = 'super_admin'
      ORDER BY u.created_at ASC
      LIMIT 1
    `)
    const permissions = await db.all('SELECT code FROM permissions ORDER BY code ASC LIMIT 5')
    const regions = await db.all('SELECT id, name, is_default FROM regions ORDER BY sort_order ASC, name ASC LIMIT 5')
    const modules = await db.all('SELECT module_key, name FROM content_modules ORDER BY module_key ASC LIMIT 5')
    const latestContent = await db.get(`
      SELECT c.id, c.module_key, c.status, c.updated_at
      FROM contents c
      ORDER BY c.updated_at DESC
      LIMIT 1
    `)

    const regionIdSql = dialect.jsonText('v.data_json', '$.regionId')
    const legacyRegionIdSql = dialect.jsonText('v.data_json', '$.region_id')
    const publishedArchiveRow = await db.get(`
      SELECT count(*) AS count
      FROM contents c
      JOIN content_versions v ON v.id = c.published_version_id
      WHERE c.module_key = 'archive'
        AND c.status = 'published'
        AND c.published_version_id IS NOT NULL
        AND COALESCE(${regionIdSql}, ${legacyRegionIdSql}, ?) = ?
    `, ['region-suqu', 'region-suqu'])

    summary.reads = {
      superAdminUsername: superAdminRow?.username || null,
      superAdminRoleName: superAdminRow?.role_name || null,
      permissionSampleCount: permissions.length,
      regionSampleCount: regions.length,
      moduleSampleCount: modules.length,
      latestContentId: latestContent?.id || null,
      publishedArchiveCountInDefaultRegion: Number(publishedArchiveRow?.count || 0),
    }
  })

  const txSummary = await withMysqlRollbackTransaction(config, async (db) => {
    const now = Date.now()
    const sessionId = `mysql-session-${now}`
    const loginUser = `mysql-login-${now}`
    const visitorId = `mysql-visitor-${now}`
    const sessionTokenHash = `token-${now}`
    const csrfToken = `csrf-${now}`

    const beforeTribute = await db.get('SELECT count FROM tributes WHERE id = 1')

    await db.run(`
      INSERT INTO sessions (id, user_id, token_hash, csrf_token, ip, user_agent, expires_at, created_at, last_seen_at)
      SELECT ?, id, ?, ?, '127.0.0.1', 'mysql-primary-flow-smoke', ?, ?, ?
      FROM admin_users
      WHERE role_id = 'super_admin'
      ORDER BY created_at ASC
      LIMIT 1
    `, [sessionId, sessionTokenHash, csrfToken, now + 60000, now, now])
    const sessionRow = await db.get('SELECT id, token_hash, csrf_token FROM sessions WHERE id = ?', [sessionId])

    await db.run(
      'INSERT INTO login_attempts (username, ip, success, reason, created_at) VALUES (?, ?, ?, ?, ?)',
      [loginUser, '127.0.0.1', 0, 'mysql-primary-flow-smoke', now],
    )
    const loginAttemptRow = await db.get(
      'SELECT count(*) AS count FROM login_attempts WHERE username = ? AND ip = ? AND created_at = ?',
      [loginUser, '127.0.0.1', now],
    )

    await db.run(dialect.upsertCheckinProgressSql(), [
      visitorId,
      JSON.stringify(['poi-1', 'poi-2', 'poi-3']),
      now,
    ])
    const checkinRow = await db.get('SELECT visited_pois_json FROM checkin_progress WHERE visitor_id = ?', [visitorId])

    await db.run('UPDATE tributes SET count = count + 3 WHERE id = 1')
    const afterTribute = await db.get('SELECT count FROM tributes WHERE id = 1')

    return {
      sessionInserted: Boolean(sessionRow?.id),
      sessionTokenPersisted: sessionRow?.token_hash === sessionTokenHash && sessionRow?.csrf_token === csrfToken,
      loginAttemptInserted: Number(loginAttemptRow?.count || 0) === 1,
      checkinVisitedCount: JSON.parse(checkinRow?.visited_pois_json || '[]').length,
      tributeDelta: Number(afterTribute?.count || 0) - Number(beforeTribute?.count || 0),
      sessionId,
      loginUser,
      visitorId,
    }
  })

  summary.writes = {
    sessionInserted: txSummary.sessionInserted,
    sessionTokenPersisted: txSummary.sessionTokenPersisted,
    loginAttemptInserted: txSummary.loginAttemptInserted,
    checkinVisitedCount: txSummary.checkinVisitedCount,
    tributeDelta: txSummary.tributeDelta,
  }

  await withMysqlConnection(config, async (db) => {
    const sessionRow = await db.get('SELECT id FROM sessions WHERE id = ?', [txSummary.sessionId])
    const loginAttemptRow = await db.get('SELECT count(*) AS count FROM login_attempts WHERE username = ?', [txSummary.loginUser])
    const checkinRow = await db.get('SELECT visitor_id FROM checkin_progress WHERE visitor_id = ?', [txSummary.visitorId])

    summary.rollback = {
      sessionReverted: !sessionRow,
      loginAttemptReverted: Number(loginAttemptRow?.count || 0) === 0,
      checkinReverted: !checkinRow,
    }
  })

  assert(summary.health.archiveCount >= 0)
  assert(summary.health.messageCount >= 0)
  assert(summary.reads.permissionSampleCount > 0)
  assert(summary.reads.regionSampleCount > 0)
  assert(summary.reads.moduleSampleCount > 0)
  assert(summary.writes.sessionInserted)
  assert(summary.writes.sessionTokenPersisted)
  assert(summary.writes.loginAttemptInserted)
  assert.strictEqual(summary.writes.checkinVisitedCount, 3)
  assert.strictEqual(summary.writes.tributeDelta, 3)
  assert(summary.rollback.sessionReverted)
  assert(summary.rollback.loginAttemptReverted)
  assert(summary.rollback.checkinReverted)

  summary.ok = true
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(JSON.stringify({
    checkedAt: Date.now(),
    ok: false,
    error: error.message,
  }, null, 2))
  process.exit(1)
})
