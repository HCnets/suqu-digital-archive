/**
 * 从 index.js 拆出的独立辅助函数
 */
const { cleanText } = require('./utils')
const { sortJsonValue } = require('./rows')

function buildContentVersionDiff(currentVersion, publishedVersion, versions = []) {
  if (!currentVersion) {
    return { baseType: 'none', baseVersionNumber: null, compareVersionNumber: null, fields: [], hasChanges: false }
  }
  const baseVersion = publishedVersion && publishedVersion.id !== currentVersion.id
    ? publishedVersion
    : versions.find((version) => version.id !== currentVersion.id && version.versionNumber < currentVersion.versionNumber) || null
  if (!baseVersion) {
    return {
      baseType: 'none',
      baseVersionNumber: null,
      compareVersionNumber: currentVersion.versionNumber,
      fields: [],
      hasChanges: false,
    }
  }

  const fieldSpecs = [
    ['title', '标题', baseVersion.title || '', currentVersion.title || ''],
    ['summary', '摘要', baseVersion.summary || '', currentVersion.summary || ''],
    ['body', '正文', baseVersion.body || '', currentVersion.body || ''],
    ['data', '结构化数据', stableJsonStringify(baseVersion.data || {}), stableJsonStringify(currentVersion.data || {})],
  ]
  const fields = fieldSpecs
    .map(([key, label, before, after]) => ({
      key,
      label,
      before: cleanText(before, 6000),
      after: cleanText(after, 6000),
      changed: before !== after,
    }))
    .filter((field) => field.changed)
  return {
    baseType: publishedVersion && publishedVersion.id === baseVersion.id ? 'published' : 'previous',
    baseVersionNumber: baseVersion.versionNumber,
    compareVersionNumber: currentVersion.versionNumber,
    fields,
    hasChanges: fields.length > 0,
  }
}

function stableJsonStringify(value) {
  return JSON.stringify(sortJsonValue(value), null, 2)
}

module.exports = { buildContentVersionDiff, stableJsonStringify }
