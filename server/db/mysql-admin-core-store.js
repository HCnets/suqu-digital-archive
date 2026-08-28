const { createSqlDialect } = require('./sql-dialect')

function createMysqlAdminCoreStore({ ops }) {
  const dialect = createSqlDialect('mysql')

  return {
    async insertAdminUser(user) {
      await ops.run(`
        INSERT INTO admin_users
          (id, username, password_hash, real_name, phone, email, department, role_id, status, notes,
           last_login_at, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
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
      ])
    },

    async updateAdminUser(id, user) {
      await ops.run(`
        UPDATE admin_users
        SET real_name = ?, phone = ?, email = ?, department = ?, role_id = ?, status = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `, [
        user.realName,
        user.phone,
        user.email,
        user.department,
        user.roleId,
        user.status,
        user.notes,
        user.updatedAt,
        String(id),
      ])
    },

    async findAdminUserByUsername(username) {
      return ops.get(`
        SELECT u.*, r.name AS role_name
        FROM admin_users u
        LEFT JOIN roles r ON r.id = u.role_id
        WHERE u.username = ? OR u.email = ?
      `, [String(username).toLowerCase(), String(username).toLowerCase()])
    },

    async findAdminUserById(id) {
      return ops.get(`
        SELECT u.*, r.name AS role_name
        FROM admin_users u
        LEFT JOIN roles r ON r.id = u.role_id
        WHERE u.id = ?
      `, [String(id)])
    },

    async touchAdminUserLogin(userId, now) {
      await ops.run('UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE id = ?', [now, now, String(userId)])
    },

    async listPermissions() {
      return ops.all('SELECT code, name, group_name FROM permissions ORDER BY group_name, code')
    },

    async findRole(id) {
      return ops.get('SELECT id, name, description, is_system, created_at, updated_at FROM roles WHERE id = ?', [String(id)])
    },

    async listRoles() {
      return ops.all('SELECT id, name, description, is_system, created_at, updated_at FROM roles ORDER BY is_system DESC, name ASC')
    },

    async listRolePermissionCodes(roleId) {
      const rows = await ops.all('SELECT permission_code FROM role_permissions WHERE role_id = ? ORDER BY permission_code', [String(roleId)])
      return rows.map((row) => row.permission_code)
    },

    async listUserPermissionOverrides(userId) {
      return ops.all('SELECT permission_code, effect FROM user_role_overrides WHERE user_id = ?', [String(userId)])
    },

    async listAdminUsers({ q = '', status = '', limit = 200 } = {}) {
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
      return ops.all(`
        SELECT u.*, r.name AS role_name
        FROM admin_users u
        LEFT JOIN roles r ON r.id = u.role_id
        ${whereSql}
        ORDER BY u.created_at DESC
        LIMIT ?
      `, [...params, Number(limit)])
    },

    async insertSession(session) {
      await ops.run(`
        INSERT INTO sessions (id, user_id, token_hash, csrf_token, ip, user_agent, expires_at, created_at, last_seen_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        session.id,
        session.userId,
        session.tokenHash,
        session.csrfToken,
        session.ip,
        session.userAgent,
        session.expiresAt,
        session.createdAt,
        session.lastSeenAt,
      ])
    },

    async findSessionByTokenHash(tokenHash) {
      return ops.get(`
        SELECT s.*, u.username, u.status, u.role_id
        FROM sessions s
        JOIN admin_users u ON u.id = s.user_id
        WHERE s.token_hash = ?
      `, [String(tokenHash)])
    },

    async deleteSessionById(sessionId) {
      await ops.run('DELETE FROM sessions WHERE id = ?', [String(sessionId)])
    },

    async touchSessionLastSeen(sessionId, now) {
      await ops.run('UPDATE sessions SET last_seen_at = ? WHERE id = ?', [now, String(sessionId)])
    },

    async updateSessionExpiry(sessionId, expiresAt, now) {
      await ops.run('UPDATE sessions SET expires_at = ?, last_seen_at = ? WHERE id = ?', [expiresAt, now, String(sessionId)])
    },

    async insertLoginAttempt(attempt) {
      await ops.run(
        'INSERT INTO login_attempts (username, ip, success, reason, created_at) VALUES (?, ?, ?, ?, ?)',
        [attempt.username, attempt.ip, attempt.success ? 1 : 0, attempt.reason, attempt.createdAt],
      )
    },

    async countRecentFailedLoginAttempts(username, ip, since) {
      const row = await ops.get(`
        SELECT count(*) AS count
        FROM login_attempts
        WHERE username = ? AND ip = ? AND success = 0 AND created_at >= ?
      `, [String(username), String(ip), Number(since)])
      return Number(row?.count || 0)
    },

    async listUserAssignedRegionIds(userId) {
      const rows = await ops.all('SELECT region_id FROM user_regions WHERE user_id = ? ORDER BY region_id ASC', [String(userId)])
      return rows.map((row) => row.region_id)
    },

    async replaceUserRegions(userId, regionIds, now) {
      const ids = Array.from(new Set((regionIds || []).map((id) => String(id)).filter(Boolean)))
      await ops.run('DELETE FROM user_regions WHERE user_id = ?', [String(userId)])
      for (const id of ids) {
        await ops.run(dialect.insertIgnoreInto('user_regions', '(user_id, region_id, created_at) VALUES (?, ?, ?)'), [
          String(userId),
          id,
          Number(now),
        ])
      }
    },

    async listRegions() {
      return ops.all(`
        SELECT r.*, p.name AS parent_name
        FROM regions r
        LEFT JOIN regions p ON p.id = r.parent_id
        ORDER BY r.sort_order ASC, r.level ASC, r.name ASC
      `)
    },

    async findRegion(id) {
      return ops.get(`
        SELECT r.*, p.name AS parent_name
        FROM regions r
        LEFT JOIN regions p ON p.id = r.parent_id
        WHERE r.id = ?
      `, [String(id)])
    },

    async findRegionParentId(id) {
      const row = await ops.get('SELECT parent_id FROM regions WHERE id = ?', [String(id)])
      return row?.parent_id || ''
    },

    async findRegionCodeDuplicate(code, currentId = '') {
      return ops.get('SELECT id FROM regions WHERE code = ? AND id <> ?', [String(code), String(currentId || '')])
    },

    async clearDefaultRegion() {
      await ops.run('UPDATE regions SET is_default = 0')
    },

    async clearDefaultRegionExcept(id) {
      await ops.run('UPDATE regions SET is_default = 0 WHERE id <> ?', [String(id)])
    },

    async insertRegion(region) {
      await ops.run(`
        INSERT INTO regions
          (id, parent_id, level, name, full_name, code, description, display_mode, map_mode, sort_order, is_default, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
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
      ])
    },

    async updateRegion(id, region, now) {
      await ops.run(`
        UPDATE regions
        SET parent_id = ?, level = ?, name = ?, full_name = ?, code = ?, description = ?,
            display_mode = ?, map_mode = ?, sort_order = ?, is_default = ?, is_active = ?, updated_at = ?
        WHERE id = ?
      `, [
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
      ])
    },

    async countChildRegions(parentId) {
      const row = await ops.get('SELECT count(*) AS count FROM regions WHERE parent_id = ?', [String(parentId)])
      return Number(row?.count || 0)
    },

    async deleteRegion(id) {
      await ops.run('DELETE FROM regions WHERE id = ?', [String(id)])
    },
  }
}

module.exports = {
  createMysqlAdminCoreStore,
}
