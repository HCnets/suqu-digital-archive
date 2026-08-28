/**
 * 「今日苏区」Seed：今昔对比面板（TodaySuqu），数据基于查证的苏区镇真实发展情况。
 * 依据：百度百科苏区镇词条、紫金县政府信息（3A景区/20处遗址/红+绿特色小镇/S242等）
 * 幂等：先删后插。用法: node scripts/seed-today-suqu.cjs [--db <path>]
 */
const fs = require('fs')
const path = require('path')
const { DatabaseSync } = require('node:sqlite')

const argDb = process.argv.find((a, i) => process.argv[i - 1] === '--db')
const DB_PATH = argDb || path.join(__dirname, '..', 'server', 'data', 'suqu.db')

const DATA = {
  title: '今日苏区',
  beforeYear: '1928',
  afterYear: '2026',
  introBefore: '土地革命战争时期，苏区人民在中国共产党领导下建立农会、创建苏维埃政权，以热血和生命书写了可歌可泣的篇章。红屋、血田、纪念碑……处处铭刻着那段烽火岁月。',
  transitionLabel: '九十余载奋斗路',
  introAfter: '昔日革命老区，今日红色名镇。苏区镇以"红+绿"融合发展——20处革命旧址焕发新生，革命遗址群获评国家3A级旅游景区，乡村振兴步履坚实，红色基因代代相传。',
  metrics: [
    { iconKey: 'home', number: '20', label: '处革命旧址', detail: '红屋、血田、纪念碑等苏区革命旧（遗）址群20处' },
    { iconKey: 'trending', number: '3A', label: '国家3A级景区', detail: '苏区革命遗址群景区获评国家3A级旅游景区' },
    { iconKey: 'users', number: '2.3万', label: '苏区儿女', detail: '户籍人口约2.3万，辖8个行政村1个社区' },
    { iconKey: 'leaf', number: '红+绿', label: '融合发展', detail: '打造"红+绿"特色小镇，推进乡村振兴' },
  ],
  comparisons: [
    { title: '红屋 · 从粮仓到殿堂', before: '1923年 地主粮仓"湖子仓"，炮子乡农会征用、县总农会在此办公', after: '文物保护单位，2003年完成维修布展：5个展室、图片180幅、文物191件' },
    { title: '交通 · 从山路到坦途', before: '革命年代山间小道、羊肠山路，物资运输艰难', after: '省道S242通达，红色旅游公路串联革命旧址群' },
    { title: '面貌 · 从老区到名镇', before: '战火硝烟中的革命老区，百废待兴', after: '"红+绿"特色小镇，革命遗址群3A景区焕发新生' },
    { title: '传承 · 从烽火到课堂', before: '苏区人民浴血奋斗、前赴后继', after: '爱国主义教育基地，红色研学与革命传统教育持续火热' },
  ],
}

function seed(db) {
  const delV = db.prepare('DELETE FROM content_versions WHERE content_id = ?')
  const delC = db.prepare('DELETE FROM contents WHERE id = ?')
  const insV = db.prepare('INSERT INTO content_versions (id, content_id, version_number, title, summary, body, data_json, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const insC = db.prepare('INSERT INTO contents (id, module_key, category, tags_json, status, title, summary, sensitive_level, risk_types_json, current_version_id, published_version_id, workflow_id, current_step_id, created_by, updated_by, submitted_at, published_at, deleted_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const now = Date.now()
  const contentId = 'content-today-suqu'
  const versionId = `${contentId}-v1`
  delV.run(contentId)
  delC.run(contentId)
  insC.run(contentId, 'today_suqu', 'page', '["今日苏区"]', 'published', DATA.title, DATA.introAfter, 'normal', '[]', versionId, versionId, null, null, 'seed', 'seed', now, now, null, now, now)
  insV.run(versionId, contentId, 1, DATA.title, DATA.introAfter, '', JSON.stringify(DATA), 'seed', now)
  return DATA.metrics.length + DATA.comparisons.length
}

const BACKUP_DIR = path.join(path.dirname(DB_PATH), 'backups')
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
fs.copyFileSync(DB_PATH, path.join(BACKUP_DIR, `suqu.db.today-${stamp}.bak`))

const db = new DatabaseSync(DB_PATH)
const n = seed(db)
db.close()
console.log(`「今日苏区」已写入（${n} 项：4 指标 + 4 对比）→ ${DB_PATH}`)
