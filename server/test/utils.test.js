/**
 * server/test/utils.test.js
 * utils 模块单元测试（Node 内置 node:test，零依赖）。
 * 运行: npm test  或  node --test test/
 */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  cleanText,
  readBooleanFlag,
  safeJsonValue,
  safeJsonArray,
  parsePositiveInt,
  clamp,
  normalizeTributeCount,
  normalizeTributeDelta,
  makeId,
  makeStableId,
} = require('../lib/utils')

test('cleanText 剔除控制字符并修剪', () => {
  assert.equal(cleanText('  abc\u0000\u0007def  ', 10), 'abcdef')
  assert.equal(cleanText(null, 10), '')
  assert.equal(cleanText('hello world', 5), 'hello')
  assert.equal(cleanText('  空格保留  ', 20), '空格保留')
})

test('cleanText 截断到 maxLength', () => {
  assert.equal(cleanText('一二三四五', 3), '一二三四五'.slice(0, 3))
  assert.equal(cleanText('a'.repeat(100), 20).length, 20)
})

test('readBooleanFlag 解析多种布尔表示', () => {
  assert.equal(readBooleanFlag('true'), true)
  assert.equal(readBooleanFlag('false'), false)
  assert.equal(readBooleanFlag('yes'), true)
  assert.equal(readBooleanFlag('off'), false)
  assert.equal(readBooleanFlag(1), true)
  assert.equal(readBooleanFlag(0), false)
  assert.equal(readBooleanFlag(true), true)
  assert.equal(readBooleanFlag(undefined, true), true)
  assert.equal(readBooleanFlag('', false), false)
})

test('safeJsonValue 解析 JSON', () => {
  assert.deepEqual(safeJsonValue('{"a":1}'), { a: 1 })
  assert.deepEqual(safeJsonValue('[1,2]'), [1, 2])
  assert.equal(safeJsonValue('not-json'), null)
  assert.equal(safeJsonValue(''), null)
  assert.equal(safeJsonValue(null), null)
})

test('safeJsonArray 非数组返回空数组', () => {
  assert.deepEqual(safeJsonArray('[1,2]'), [1, 2])
  assert.deepEqual(safeJsonArray('{"a":1}'), [])
  assert.deepEqual(safeJsonArray('bad'), [])
  assert.deepEqual(safeJsonArray(null), [])
})

test('parsePositiveInt 非法返回 fallback', () => {
  assert.equal(parsePositiveInt('5', 1), 5)
  assert.equal(parsePositiveInt('-3', 1), 1)
  assert.equal(parsePositiveInt('abc', 7), 7)
  assert.equal(parsePositiveInt('0', 7), 7)
  assert.equal(parsePositiveInt(2.5, 1), 1)
})

test('clamp 钳制范围', () => {
  assert.equal(clamp(5, 0, 10), 5)
  assert.equal(clamp(-1, 0, 10), 0)
  assert.equal(clamp(99, 0, 10), 10)
})

test('normalizeTributeCount 只接受非负整数', () => {
  assert.equal(normalizeTributeCount(100), 100)
  assert.equal(normalizeTributeCount('42'), 42)
  assert.equal(normalizeTributeCount(-1), null)
  assert.equal(normalizeTributeCount(1.5), null)
  assert.equal(normalizeTributeCount('abc'), null)
})

test('normalizeTributeDelta 限幅', () => {
  assert.equal(normalizeTributeDelta(500), 500)
  assert.equal(normalizeTributeDelta(-999), -999)
  assert.equal(normalizeTributeDelta(1000001), null)
  assert.equal(normalizeTributeDelta(-1000001), null)
  assert.equal(normalizeTributeDelta('x'), null)
})

test('makeId 生成带前缀 ID', () => {
  const a = makeId('x')
  const b = makeId('x')
  assert.match(a, /^x-\d+-[0-9a-f]{8}$/)
  assert.notEqual(a, b)
})

test('makeStableId 同输入同输出', () => {
  const a = makeStableId('doc', '紫金县苏维埃政府旧址')
  const b = makeStableId('doc', '紫金县苏维埃政府旧址')
  const c = makeStableId('doc', '不同内容')
  assert.equal(a, b)
  assert.match(a, /^doc-[0-9a-f]{16}$/)
  assert.notEqual(a, c)
})
