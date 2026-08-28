/**
 * server/test/security.test.js
 * security 模块单元测试（node:test）。
 */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  isStrongPassword,
  hashPassword,
  verifyPassword,
  hashToken,
  serializeCookie,
} = require('../lib/security')

test('isStrongPassword 校验强度', () => {
  assert.equal(isStrongPassword('abc1234567'), true)
  assert.equal(isStrongPassword('1234567890'), false) // 无字母
  assert.equal(isStrongPassword('abcdefghij'), false) // 无数字
  assert.equal(isStrongPassword('short1'), false) // 过短
  assert.equal(isStrongPassword(''), false)
})

test('hashPassword + verifyPassword 哈希往返', () => {
  const stored = hashPassword('S3curePass!')
  assert.match(stored, /^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/)
  assert.equal(verifyPassword('S3curePass!', stored), true)
  assert.equal(verifyPassword('wrong-pass', stored), false)
})

test('hashPassword 每次盐不同', () => {
  assert.notEqual(hashPassword('same-pass'), hashPassword('same-pass'))
})

test('verifyPassword 容忍异常输入', () => {
  assert.equal(verifyPassword('x', ''), false)
  assert.equal(verifyPassword('x', 'md5:abc:def'), false)
  assert.equal(verifyPassword('x', null), false)
})

test('hashToken 摘要一致且定长', () => {
  const a = hashToken('token-abc')
  const b = hashToken('token-abc')
  const c = hashToken('token-xyz')
  assert.equal(a, b)
  assert.match(a, /^[0-9a-f]{64}$/)
  assert.notEqual(a, c)
})

test('serializeCookie 基础属性', () => {
  const cookie = serializeCookie('sid', 'abc 123', { httpOnly: true, secure: true })
  assert.match(cookie, /^sid=abc%20123/)
  assert.ok(cookie.includes('Path=/'))
  assert.ok(cookie.includes('HttpOnly'))
  assert.ok(cookie.includes('Secure'))
  assert.ok(cookie.includes('SameSite=Lax'))
})

test('serializeCookie 自定义选项', () => {
  const cookie = serializeCookie('name', 'v', { domain: 'szht.online', maxAge: 3600, sameSite: 'Strict', path: '/admin' })
  assert.ok(cookie.includes('Domain=szht.online'))
  assert.ok(cookie.includes('Max-Age=3600'))
  assert.ok(cookie.includes('SameSite=Strict'))
  assert.ok(cookie.includes('Path=/admin'))
  assert.ok(!cookie.includes('HttpOnly'))
})

test('serializeCookie maxAge 不产生负数', () => {
  const cookie = serializeCookie('n', 'v', { maxAge: -10 })
  assert.ok(cookie.includes('Max-Age=0'))
})
