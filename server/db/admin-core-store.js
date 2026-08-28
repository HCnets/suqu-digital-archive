const { createSqlDialect } = require('./sql-dialect')

function createAdminCoreStore({ getDb, dbClient = 'sqlite' }) {
  function db() {
    return getDb()
  }

  const dialect = createSqlDialect(dbClient)

  return {
    insertAdminUser(user) {
      db().prepare(`
        INSERT INTO admin_users
          (id, username, password_hash, real_name, phone, email, department, role_id, status, notes,
           last_login_at, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        user.id,
        user.username,
        user.passwordHash,
        user.realName,
        user.phone,
        user.email,
        user.department,
        user.roleId,
        user.status,
        user.notes,
        null,
        user.createdBy,
        user.createdAt,
        user.updatedAt,
      )
    },

    updateAdminUser(id, user) {
      db().prepare(`
        UPDATE admin_users
        SET real_name = ?, phone = ?, email = ?, department = ?, role_id = ?, status = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `).run(
        user.realName,
        user.phone,
        user.email,
        user.department,
        user.roleId,
        user.status,
        user.notes,
        user.updatedAt,
        String(id),
      )
    },

    findAdminUserByUsername(username) {
      return db().prepare(`
        SELECT u.*, r.name AS role_name
        FROM admin_users u
        LEFT JOIN roles r ON r.id = u.role_id
        WHERE u.username = ? OR u.email = ?
      `).get(String(username).toLowerCase(), String(username).toLowerCase())
    },

    findAdminUserById(id) {
      return db().prepare(`
        SELECT u.*, r.name AS role_name
        FROM admin_users u
        LEFT JOIN roles r ON r.id = u.role_id
        WHERE u.id = ?
      `).get(String(id))
    },

    touchAdminUserLogin(userId, now) {
      db().prepare('UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE id = ?').run(now, now, String(userId))
    },

    listPermissions() {
      return db().prepare('SELECT code, name, group_name FROM permissions ORDER BY group_name, code').all()
    },

    findRole(id) {
      return db().prepare('SELECT id, name, description, is_system, created_at, updated_at FROM roles WHERE id = ?').get(String(id))
    },

    listRoles() {
      return db().prepare('SELECT id, name, description, is_system, created_at, updated_at FROM roles ORDER BY is_system DESC, name ASC').all()
    },

    listRolePermissionCodes(roleId) {
      return db().prepare('SELECT permission_code FROM role_permissions WHERE role_id = ? ORDER BY permission_code').all(String(roleId))
        .map((row) => row.permission_code)
    },

    listUserPermissionOverrides(userId) {
      return db().prepare('SELECT permission_code, effect FROM user_role_overrides WHERE user_id = ?').all(String(userId))
    },

    listAdminUsers({ q = '', status = '', limit = 200 } = {}) {
      const where = []
      const params = []
      if (q) {
        where.push('(u.username LIKE ? OR u.real_name LIKE ? OR u.email LIKE ? OR u.department LIKE ?)')
        params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`)
      }
      if (status) {
        where.push('u.status = ?')
        params.push(status)
      }
      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
      return db().prepare(`
        SELECT u.*, r.name AS role_name
        FROM admin_users u
        LEFT JOIN roles r ON r.id = u.role_id
        ${whereSql}
        ORDER BY u.created_at DESC
        LIMIT ?
      `).all(...params, Number(limit))
    },

    insertSession(session) {
      db().prepare(`
        INSERT INTO sessions (id, user_id, token_hash, csrf_token, ip, user_agent, expires_at, created_at, last_seen_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        session.id,
        session.userId,
        session.tokenHash,
        session.csrfToken,
        session.ip,
        session.userAgent,
        session.expiresAt,
        session.createdAt,
        session.lastSeenAt,
      )
    },

    findSessionByTokenHash(tokenHash) {
      return db().prepare(`
        SELECT s.*, u.username, u.status, u.role_id
        FROM sessions s
        JOIN admin_users u ON u.id = s.user_id
        WHERE s.token_hash = ?
      `).get(String(tokenHash))
    },

    deleteSessionById(sessionId) {
      db().prepare('DELETE FROM sessions WHERE id = ?').run(String(sessionId))
    },

    touchSessionLastSeen(sessionId, now) {
      db().prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').run(now, String(sessionId))
    },

    updateSessionExpiry(sessionId, expiresAt, now) {
      db().prepare('UPDATE sessions SET expires_at = ?, last_seen_at = ? WHERE id = ?').run(expiresAt, now, String(sessionId))
    },

    insertLoginAttempt(attempt) {
      db().prepare('INSERT INTO login_attempts (username, ip, success, reason, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(attempt.username, attempt.ip, attempt.success ? 1 : 0, attempt.reason, attempt.createdAt)
    },

    countRecentFailedLoginAttempts(username, ip, since) {
      return db().prepare(`
        SELECT count(*) AS count
        FROM login_attempts
        WHERE username = ? AND ip = ? AND success = 0 AND created_at >= ?
      `).get(String(username), String(ip), Number(since)).count
    },

    listUserAssignedRegionIds(userId) {
      return db().prepare('SELECT region_id FROM user_regions WHERE user_id = ? ORDER BY region_id ASC').all(String(userId))
        .map((row) => row.region_id)
    },

    replaceUserRegions(userId, regionIds, now) {
      const ids = Array.from(new Set((regionIds || []).map((id) => String(id)).filter(Boolean)))
      db().prepare('DELETE FROM user_regions WHERE user_id = ?').run(String(userId))
      const insert = db().prepare(dialect.insertIgnoreInto('user_regions', '(user_id, region_id, created_at) VALUES (?, ?, ?)'))
      for (const id of ids) {
        insert.run(String(userId), id, Number(now))
      }
    },

    listRegions() {
      return db().prepare(`
        SELECT r.*, p.name AS parent_name
        FROM regions r
        LEFT JOIN regions p ON p.id = r.parent_id
        ORDER BY r.sort_order ASC, r.level ASC, r.name ASC
      `).all()
    },

    findRegion(id) {
      return db().prepare(`
        SELECT r.*, p.name AS parent_name
        FROM regions r
        LEFT JOIN regions p ON p.id = r.parent_id
        WHERE r.id = ?
      `).get(String(id))
    },

    findRegionParentId(id) {
      return db().prepare('SELECT parent_id FROM regions WHERE id = ?').get(String(id))?.parent_id || ''
    },

    findRegionCodeDuplicate(code, currentId = '') {
      return db().prepare('SELECT id FROM regions WHERE code = ? AND id <> ?').get(String(code), String(currentId || ''))
    },

    insertRegion(region) {
      db().exec('BEGIN')
      try {
        if (region.isDefault) db().prepare('UPDATE regions SET is_default = 0').run()
        db().prepare(`
          INSERT INTO regions
            (id, parent_id, level, name, full_name, code, description, display_mode, map_mode, sort_order, is_default, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          region.id,
          region.parentId,
          region.level,
          region.name,
          region.fullName,
          region.code,
          region.description,
          region.displayMode,
          region.mapMode,
          region.sortOrder,
          region.isDefault ? 1 : 0,
          region.isActive ? 1 : 0,
          region.createdAt,
          region.updatedAt,
        )
        db().exec('COMMIT')
      } catch (error) {
        db().exec('ROLLBACK')
        throw error
      }
    },

    updateRegion(id, region, now) {
      db().exec('BEGIN')
      try {
        if (region.isDefault) db().prepare('UPDATE regions SET is_default = 0 WHERE id <> ?').run(String(id))
        db().prepare(`
          UPDATE regions
          SET parent_id = ?, level = ?, name = ?, full_name = ?, code = ?, description = ?,
              display_mode = ?, map_mode = ?, sort_order = ?, is_default = ?, is_active = ?, updated_at = ?
          WHERE id = ?
        `).run(
          region.parentId,
          region.level,
          region.name,
          region.fullName,
          region.code,
          region.description,
          region.displayMode,
          region.mapMode,
          region.sortOrder,
          region.isDefault ? 1 : 0,
          region.isActive ? 1 : 0,
          Number(now),
          String(id),
        )
        db().exec('COMMIT')
      } catch (error) {
        db().exec('ROLLBACK')
        throw error
      }
    },

    countChildRegions(parentId) {
      return db().prepare('SELECT count(*) AS count FROM regions WHERE parent_id = ?').get(String(parentId)).count
    },

    deleteRegion(id) {
      db().prepare('DELETE FROM regions WHERE id = ?').run(String(id))
    },
  }
}

module.exports = {
  createAdminCoreStore,
}
