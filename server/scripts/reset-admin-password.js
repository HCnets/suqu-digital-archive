const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { DatabaseSync } = require('node:sqlite')

const username = process.argv[2]
const password = process.argv[3] || generatePassword()

if (!username) {
  console.error('Usage: npm run admin:reset-password -- <username> [new-password]')
  process.exit(1)
}

if (!isStrongPassword(password)) {
  console.error('Password must be at least 10 characters and include letters and numbers.')
  process.exit(1)
}

const dataDir = resolveDataDir(process.env.DATA_DIR)
const dbFile = path.join(dataDir, 'suqu.db')

if (!fs.existsSync(dbFile)) {
  console.error(`Database not found: ${dbFile}`)
  process.exit(1)
}

const db = new DatabaseSync(dbFile)
try {
  const user = db.prepare('SELECT id, username FROM admin_users WHERE username = ?').get(username.toLowerCase())
  if (!user) {
    console.error(`Admin user not found: ${username}`)
    process.exit(1)
  }

  db.prepare('UPDATE admin_users SET password_hash = ?, status = ?, updated_at = ? WHERE id = ?')
    .run(hashPassword(password), 'active', Date.now(), user.id)

  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id)
  db.prepare(`
    INSERT INTO audit_logs (action, entity_type, entity_id, before_json, after_json, actor, ip, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('reset_password', 'admin_user', user.id, null, JSON.stringify({ username: user.username }), 'server-cli', 'local', Date.now())

  console.log(`Password reset for ${user.username}`)
  console.log(`New password: ${password}`)
  console.log('Keep it safe. It is shown only once by this local command.')
} finally {
  db.close()
}

function resolveDataDir(value) {
  if (!value) return path.resolve(__dirname, '..', 'data')
  return path.isAbsolute(value) ? value : path.resolve(__dirname, '..', value)
}

function isStrongPassword(value) {
  return String(value || '').length >= 10 && /[a-zA-Z]/.test(value) && /\d/.test(value)
}

function hashPassword(value) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(String(value), salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

function generatePassword() {
  return `Szht${crypto.randomBytes(8).toString('base64url')}9`
}
