/**
 * 内容运营 Seed：点亮前端功能入口 + 学习课程
 * - dashboard_entry（14 个功能面板入口，HUD「专题入口」区）
 * - learning_course（学习课程，关联已有档案点位）
 * 幂等：固定内容 id，重复执行不产生重复记录。
 * 用法: node scripts/seed-content-entries.cjs [--dry-run]
 */
const fs = require('fs')
const path = require('path')
const { DatabaseSync } = require('node:sqlite')

const DB_PATH = path.join(__dirname, '..', 'server', 'data', 'suqu.db')
const BACKUP_DIR = path.join(__dirname, '..', 'server', 'data', 'backups')
const dryRun = process.argv.includes('--dry-run')

// ---- dashboard_entry：14 个功能面板入口（actionKey 须匹配前端 DASHBOARD_ACTION_KEYS 白名单）----
const dashboardEntries = [
  { actionKey: 'heroes', label: '英雄谱', description: '走进革命英雄的感人事迹', iconKey: 'flag', groupKey: 'red_memory', groupTitle: '红色记忆', order: 1 },
  { actionKey: 'song_player', label: '红歌传唱', description: '聆听经久不衰的红色旋律', iconKey: 'music', groupKey: 'red_memory', groupTitle: '红色记忆', order: 2 },
  { actionKey: 'party_oath', label: '入党誓词', description: '重温入党誓词，坚定初心使命', iconKey: 'scroll', groupKey: 'red_memory', groupTitle: '红色记忆', order: 3 },
  { actionKey: 'panorama', label: '全景影像', description: '沉浸式查看革命旧址实景', iconKey: 'camera', groupKey: 'red_memory', groupTitle: '红色记忆', order: 4 },
  { actionKey: 'film_archive', label: '红色影视', description: '影视档案，重温烽火岁月', iconKey: 'tv', groupKey: 'red_memory', groupTitle: '红色记忆', order: 5 },
  { actionKey: 'long_march', label: '长征沙盘', description: '回顾红军长征的壮阔历程', iconKey: 'route', groupKey: 'red_trail', groupTitle: '红色足迹', order: 10 },
  { actionKey: 'party_routes', label: '党日路线', description: '规划一次有意义的主题党日', iconKey: 'map', groupKey: 'red_trail', groupTitle: '红色足迹', order: 11 },
  { actionKey: 'tour_guide', label: '数字导览', description: '跟随导览路线探访革命旧址', iconKey: 'send', groupKey: 'red_trail', groupTitle: '红色足迹', order: 12 },
  { actionKey: 'passport', label: '打卡护照', description: '打卡革命旧址，收集红色印记', iconKey: 'stamp', groupKey: 'red_trail', groupTitle: '红色足迹', order: 13 },
  { actionKey: 'oral_history', label: '口述历史', description: '聆听亲历者的真实讲述', iconKey: 'mic', groupKey: 'red_class', groupTitle: '红色课堂', order: 20 },
  { actionKey: 'red_quiz', label: '党史答题', description: '以赛促学，检验党史知识', iconKey: 'book', groupKey: 'red_class', groupTitle: '红色课堂', order: 21 },
  { actionKey: 'resource_hub', label: '红色资源库', description: '家书、标语、法令等红色文献', iconKey: 'library', groupKey: 'red_resource', groupTitle: '红色资源', order: 30 },
  { actionKey: 'today_suqu', label: '今日苏区', description: '今昔对比，感受老区新貌', iconKey: 'star', groupKey: 'red_resource', groupTitle: '红色资源', order: 31 },
  { actionKey: 'cocreation', label: '群众共创', description: '写家书、留寄语，共同书写红色记忆', iconKey: 'users', groupKey: 'red_resource', groupTitle: '红色资源', order: 32 },
]

// ---- learning_course：关联已有档案点位（archiveId 用 /api/archives 返回的真实 id）----
const learningCourses = [
  { archiveId: 'zijin-party-committee', title: '苏区革命起点', subtitle: '了解土地革命战争时期中共紫金县委的建立与斗争。', order: 1 },
  { archiveId: 'suqu-red-house', title: '苏维埃政权建设', subtitle: '走进紫金县苏维埃政府旧址（红屋），学习政权建设的探索。', order: 2 },
  { archiveId: 'blood-field', title: '铭记血田历史', subtitle: '在血田遗址缅怀先烈，感悟今日和平的来之不易。', order: 3 },
  { archiveId: 'suqu-monument', title: '缅怀革命先烈', subtitle: '瞻仰苏区革命烈士纪念碑，传承红色基因。', order: 4 },
]

function seedModule(db, moduleKey, items, toData) {
  const insertVersion = db.prepare(
    'INSERT OR IGNORE INTO content_versions (id, content_id, version_number, title, summary, body, data_json, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
  const insertContent = db.prepare(
    'INSERT OR IGNORE INTO contents (id, module_key, category, tags_json, status, title, summary, sensitive_level, risk_types_json, current_version_id, published_version_id, workflow_id, current_step_id, created_by, updated_by, submitted_at, published_at, deleted_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
  const now = Date.now()
  let inserted = 0
  let skipped = 0
  for (const item of items) {
    const contentId = `content-${moduleKey}-${item.actionKey || item.archiveId}`
    const versionId = `${contentId}-v1`
    const title = item.label || item.title
    const summary = item.description || item.subtitle || ''
    const dataJson = JSON.stringify(toData(item))
    // 先插 contents（父），再插 content_versions（子，content_id 外键）
    const con = insertContent.run(
      contentId, moduleKey, '', '[]', 'published', title, summary, 'normal', '[]',
      versionId, versionId, null, null, 'seed', 'seed', now, now, null, now, now,
    )
    const ver = insertVersion.run(versionId, contentId, 1, title, summary, '', dataJson, 'seed', now)
    if (con.changes > 0) inserted++
    else skipped++
  }
  return { inserted, skipped }
}

if (dryRun) {
  console.log(`[dry-run] 将 seed ${dashboardEntries.length} 条 dashboard_entry + ${learningCourses.length} 条 learning_course`)
  process.exit(0)
}

// 备份
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
fs.copyFileSync(DB_PATH, path.join(BACKUP_DIR, `suqu.db.seed-${stamp}.bak`))
console.log(`已备份 → data/backups/suqu.db.seed-${stamp}.bak`)

const db = new DatabaseSync(DB_PATH)
const r1 = seedModule(db, 'dashboard_entry', dashboardEntries, (e) => ({
  actionKey: e.actionKey,
  label: e.label,
  description: e.description,
  groupKey: e.groupKey,
  groupTitle: e.groupTitle,
  iconKey: e.iconKey,
  sectionIconKey: e.iconKey,
  order: e.order,
}))
const r2 = seedModule(db, 'learning_course', learningCourses, (c) => ({
  title: c.title,
  subtitle: c.subtitle,
  archiveId: c.archiveId,
  order: c.order,
}))
db.close()
console.log(`dashboard_entry: 新增 ${r1.inserted}，已存在 ${r1.skipped}`)
console.log(`learning_course: 新增 ${r2.inserted}，已存在 ${r2.skipped}`)
console.log('完成。刷新前端即可看到功能入口点亮。')
