/**
 * 数据修复：给已发布档案点位补地区关联（regionId）
 * 背景：本地区域配置 displayMode=current + scopeRegionIds=[region-suqu]，
 * 而 archives 的 data_json 缺 regionId，导致前端 getAllArchives 区域过滤全部排除（点位显示 0）。
 * 幂等：已有 regionId/region_id 的记录不动。
 * 用法: node scripts/fix-archive-region.cjs [--dry-run]
 */
const fs = require('fs')
const path = require('path')
const { DatabaseSync } = require('node:sqlite')

const DB_PATH = path.join(__dirname, '..', 'server', 'data', 'suqu.db')
const BACKUP_DIR = path.join(__dirname, '..', 'server', 'data', 'backups')
const TARGET_REGION_ID = 'region-suqu'
const dryRun = process.argv.includes('--dry-run')

if (!fs.existsSync(DB_PATH)) { console.error('未找到数据库'); process.exit(1) }
const db = new DatabaseSync(DB_PATH)
const rows = db.prepare(
  "SELECT v.id AS vid, v.data_json FROM contents c JOIN content_versions v ON v.id = c.published_version_id WHERE c.module_key = 'archive' AND c.status = 'published'",
).all()

let patched = 0
let skipped = 0
for (const row of rows) {
  let data = {}
  try { data = JSON.parse(row.data_json || '{}') } catch { data = {} }
  if (data && typeof data === 'object' && !Array.isArray(data) && !data.regionId && !data.region_id) {
    data.regionId = TARGET_REGION_ID
    if (!dryRun) db.prepare('UPDATE content_versions SET data_json = ? WHERE id = ?').run(JSON.stringify(data), row.vid)
    patched++
  } else {
    skipped++
  }
}
db.close()
console.log(`${dryRun ? '[dry-run] 将修复 ' : '已修复 '}${patched} 条档案（已有关联 ${skipped} 条）→ regionId=${TARGET_REGION_ID}`)
if (!dryRun) {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true })
  console.log('提示：数据已更新，刷新前端即可在地图看到点位。')
}
