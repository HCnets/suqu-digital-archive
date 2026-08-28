/**
 * 从 index.js 拆出的辅助函数
 */
const fs = require('fs')
const path = require('path')
const { cleanText } = require('./utils')

// 运行期注入的依赖（由 index.js 调用 init() 传入）
let DEFAULT_HELP_ARTICLES
let HELP_ARTICLES_FILE
let HELP_ARTICLE_PAGE_KEYS
let HELP_ARTICLE_PAGE_SET
function init(deps) {
  DEFAULT_HELP_ARTICLES = deps.DEFAULT_HELP_ARTICLES
  HELP_ARTICLES_FILE = deps.HELP_ARTICLES_FILE
  HELP_ARTICLE_PAGE_KEYS = deps.HELP_ARTICLE_PAGE_KEYS
  HELP_ARTICLE_PAGE_SET = deps.HELP_ARTICLE_PAGE_SET
}

function findHelpArticleConfig(pageKey) {
  const target = cleanText(pageKey || '', 80)
  return listHelpArticlesConfig().find((item) => item.pageKey === target) || null
}

function saveHelpArticleConfig(article) {
  const normalized = normalizeHelpArticleInput(article, article?.pageKey)
  if (normalized.error) throw new Error(normalized.error)
  const overrides = readHelpArticlesOverrideMap()
  overrides[normalized.article.pageKey] = normalized.article
  writeHelpArticlesOverrideMap(overrides)
  return normalized.article
}

function saveAllHelpArticleConfigs(items) {
  const map = {}
  const rows = Array.isArray(items) ? items : Object.values(items || {})
  for (const row of rows) {
    const normalized = normalizeHelpArticleInput(row, row?.pageKey)
    if (normalized.article) {
      map[normalized.article.pageKey] = normalized.article
    }
  }
  writeHelpArticlesOverrideMap(map)
  return listHelpArticlesConfig()
}

function listHelpArticlesConfig() {
  const defaults = getDefaultHelpArticlesMap()
  const overrides = readHelpArticlesOverrideMap()
  return HELP_ARTICLE_PAGE_KEYS.map((pageKey) => {
    const current = overrides[pageKey]
    if (!current || typeof current !== 'object') return defaults[pageKey]
    const normalized = normalizeHelpArticleInput({ ...defaults[pageKey], ...current }, pageKey)
    return normalized.article || defaults[pageKey]
  })
}

function normalizeHelpArticleInput(input, pageKey = '') {
  const targetPageKey = cleanText(pageKey || input?.pageKey || '', 80)
  if (!HELP_ARTICLE_PAGE_SET.has(targetPageKey)) {
    return { error: '请选择有效的帮助页面。' }
  }
  const title = cleanText(input?.title || '', 120)
  const summary = cleanText(input?.summary || '', 500)
  const tips = cleanText(input?.tips || '', 800)
  const videoUrl = cleanText(input?.videoUrl || input?.video_url || '', 500)
  const steps = Array.isArray(input?.steps)
    ? input.steps.map((item) => cleanText(item, 200)).filter(Boolean).slice(0, 8)
    : String(input?.stepsText || input?.steps || '')
      .split(/\r?\n/)
      .map((item) => cleanText(item, 200))
      .filter(Boolean)
      .slice(0, 8)
  if (!title) return { error: '帮助标题不能为空。' }
  if (!summary) return { error: '帮助摘要不能为空。' }
  if (!steps.length) return { error: '至少需要填写一条操作步骤。' }
  return {
    article: {
      pageKey: targetPageKey,
      title,
      summary,
      steps,
      tips,
      videoUrl,
    },
  }
}

function readHelpArticlesOverrideMap() {
  try {
    if (!fs.existsSync(HELP_ARTICLES_FILE)) return {}
    const payload = JSON.parse(fs.readFileSync(HELP_ARTICLES_FILE, 'utf8'))
    return payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {}
  } catch (error) {
    console.warn('[WARN] Failed to read help articles file:', error)
    return {}
  }
}

function writeHelpArticlesOverrideMap(map) {
  fs.mkdirSync(path.dirname(HELP_ARTICLES_FILE), { recursive: true })
  fs.writeFileSync(HELP_ARTICLES_FILE, JSON.stringify(map, null, 2), 'utf8')
}

function getDefaultHelpArticlesMap() {
  return HELP_ARTICLE_PAGE_KEYS.reduce((result, pageKey) => {
    result[pageKey] = { ...DEFAULT_HELP_ARTICLES[pageKey], steps: [...(DEFAULT_HELP_ARTICLES[pageKey]?.steps || [])] }
    return result
  }, {})
}

module.exports = { init, findHelpArticleConfig, saveHelpArticleConfig, saveAllHelpArticleConfigs, listHelpArticlesConfig, normalizeHelpArticleInput, readHelpArticlesOverrideMap, writeHelpArticlesOverrideMap, getDefaultHelpArticlesMap }
