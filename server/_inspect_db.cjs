// 临时：查询 contents 表结构，评估 dashboard_entry 发布方式
const { DatabaseSync } = require('node:sqlite')
const db = new DatabaseSync(require('path').join(__dirname, 'data', 'suqu.db'))
const cols = (t) => db.prepare(`PRAGMA table_info(${t})`).all().map((c) => `${c.name}:${c.type}`).join(', ')
console.log('contents:', cols('contents'))
console.log('content_versions:', cols('content_versions'))
const row = db.prepare('SELECT id,module_key,status,published_version_id,region_id,created_at,updated_at FROM contents LIMIT 1').get()
console.log('样例 content:', JSON.stringify(row))
const v = db.prepare('SELECT * FROM content_versions LIMIT 1').get()
console.log('样例 version:', v ? JSON.stringify({ ...v, data_json: String(v.data_json).slice(0, 200) }) : '无')
// dashboard_entry 前端需要的数据（参考 HudDashboard contentToDashboardEntry）
console.log('\n--- 提示 ---')
console.log('前端 /api/contents?moduleKey=dashboard_entry 需要: contents.status=published 且 published_version_id 非空')
