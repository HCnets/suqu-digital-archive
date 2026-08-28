/**
 * 内容运营 Seed：补齐三个内容模块（内容均基于库内已审核档案史实编排，不新增未经证实信息）
 * - director_script 自动讲解脚本（串联核心点位，TTS 朗读）
 * - quiz 党史题库（基于点位史实）
 * - tour_route 文旅导览路线
 * 幂等：固定内容 id，重复执行不重复。
 * 用法: node scripts/seed-red-content.cjs [--dry-run]
 */
const fs = require('fs')
const path = require('path')
const { DatabaseSync } = require('node:sqlite')

const DB_PATH = path.join(__dirname, '..', 'server', 'data', 'suqu.db')
const BACKUP_DIR = path.join(__dirname, '..', 'server', 'data', 'backups')
const dryRun = process.argv.includes('--dry-run')

// ============ director_script：自动讲解（串联关键点位） ============
const directorScript = {
  scenes: [
    {
      id: 'scene-1-agriculture', title: '革命的起点',
      narration: '1923年元旦，在海丰县总农会成立的影响下，紫金县的先进知识分子和农民骨干开始秘密串联。同年春，紫金县总农会在炮子乡正式成立，成为东江地区继海丰之后第二个县级农会组织。农会成立后领导农民开展减租减息、反抗苛捐杂税的斗争，推行的“二五减租”政策，让广大贫苦农民第一次感受到了组织的力量。',
      poiId: 'zijin-farmers-association', openDetail: true, waitBeforeMs: 800, waitAfterMs: 2000,
    },
    {
      id: 'scene-2-party', title: '深山里的红色中枢',
      narration: '1927年四一二反革命政变后，国民党反动派大肆屠杀共产党人和革命群众。中共紫金县委被迫从县城秘密迁至炮子乡深山之中，在此起草并发布了《紫金县武装暴动计划》，点燃了紫金土地革命的烽火。时任中共东江特委书记的彭湃同志曾多次亲临此处，传达党的八七会议精神，指导紫金的武装斗争和土地革命。',
      poiId: 'zijin-party-committee', openDetail: true, waitBeforeMs: 800, waitAfterMs: 2000,
    },
    {
      id: 'scene-3-red-house', title: '政权建设',
      narration: '1927年12月，在彭湃同志的直接指导下，紫金县工农兵代表大会在苏区镇林氏宗祠召开，正式宣布紫金县苏维埃政府成立，主席为刘琴西。因会场内外张贴红联、悬挂红旗，群众亲切地称之为“红屋”。红屋期间发布了《没收地主土地分给农民》等一系列纲领性文件，掀起了东江流域土地革命的高潮。',
      poiId: 'suqu-red-house', openDetail: true, waitBeforeMs: 800, waitAfterMs: 2000,
    },
    {
      id: 'scene-4-pavilion', title: '星火燎原',
      narration: '红军亭位于苏维埃政府旧址红屋附近。1927年，南昌起义军余部改编为中国工农革命军第二师，广州起义军余部改编为第四师，两支部队先后抵达紫金，在苏区胜利会师。红军亭便是当年部队驻扎、集结、誓师出征的重要场所，见证了军民间同吃同住同劳动、鱼水情深的革命岁月。',
      poiId: 'red-army-pavilion', openDetail: true, waitBeforeMs: 800, waitAfterMs: 2000,
    },
    {
      id: 'scene-5-blood-field', title: '铭记血田历史',
      narration: '1928年3月，国民党反动派对海陆惠紫苏区发动残酷的“围剿”。在紫金苏区炮子村，红军第四师、第二师余部及赤卫队依托地形进行了顽强阻击。由于敌我力量悬殊、弹尽粮绝，防线最终被突破。反动派进村后对手无寸铁的革命群众、苏维埃干部和红军伤病员进行了惨绝人寰的大屠杀。据《紫金县志》记载，先后有450多名革命先烈在炮子村的一块水田中被集体杀害。烈士的鲜血染红了整片稻田，当地群众悲痛地将这块水田称为“血田”。',
      poiId: 'blood-field', openDetail: true, waitBeforeMs: 800, waitAfterMs: 2500,
    },
    {
      id: 'scene-6-monument', title: '缅怀革命先烈',
      narration: '1958年，经国务院批准，炮子乡正式命名为“苏区乡”，后改称苏区镇，成为全国唯一以“苏区”命名的乡镇。同年，为缅怀在历次革命战争中牺牲的苏区籍烈士，在此修建了苏区革命烈士纪念碑。碑身正面镌刻着“革命烈士永垂不朽”八个大字。今天我们瞻仰纪念碑，就是要传承革命先辈敢于斗争、不怕牺牲的精神，在新时代奋勇前行。',
      poiId: 'suqu-monument', openDetail: true, waitBeforeMs: 800, waitAfterMs: 2500,
    },
  ],
}

// ============ quiz：党史题库（基于点位史实） ============
const quizQuestions = {
  questions: [
    {
      q: '紫金县总农会成立于哪一年？',
      options: ['1921 年', '1923 年', '1927 年', '1928 年'],
      answer: 1,
      explanation: '1923 年，紫金县总农会在炮子乡正式成立，成为东江地区继海丰之后第二个县级农会组织。',
    },
    {
      q: '四一二反革命政变后，中共紫金县委秘密迁至哪里继续领导斗争？',
      options: ['海丰县城', '炮子乡深山', '广州城内', '惠州城区'],
      answer: 1,
      explanation: '1927 年四一二政变后，中共紫金县委被迫从县城秘密迁至炮子乡深山之中，在此起草并发布了《紫金县武装暴动计划》。',
    },
    {
      q: '紫金县苏维埃政府旧址因何被群众亲切称为“红屋”？',
      options: ['建筑外墙为红色', '会场内外张贴红联、悬挂红旗', '屋顶为红瓦', '位于红色山岗'],
      answer: 1,
      explanation: '1927 年 12 月，紫金县工农兵代表大会在林氏宗祠召开，宣布苏维埃政府成立。因会场内外张贴红联、悬挂红旗，群众亲切地称之为“红屋”。',
    },
    {
      q: '1927 年，先后改编并抵达紫金胜利会师的两支队伍是？',
      options: ['红一师与红三师', '红二师与红四师', '红五师与红六师', '八路军与新四军'],
      answer: 1,
      explanation: '南昌起义军余部改编为中国工农革命军第二师，广州起义军余部改编为第四师，两支部队在紫金苏区胜利会师，红军亭即为见证。',
    },
    {
      q: '中共东江特委机关曾设在紫金炮子乡，统一领导哪四个县的革命斗争？',
      options: ['海陆惠紫', '潮汕兴梅', '韶连肇云', '广佛中珠'],
      answer: 0,
      explanation: '1928 年中共东江特委在紫金炮子乡设立机关，彭湃任书记，统一领导海丰、陆丰、惠阳、紫金四县的苏维埃运动，形成了约 3000 平方公里、人口超百万的东江苏区。',
    },
    {
      q: '炮子村阻击战中，红军依托地形进行了多长时间的顽强阻击？',
      options: ['半天', '三天三夜', '七天七夜', '一个月'],
      answer: 1,
      explanation: '1928 年，红二师、红四师余部及赤卫队约 600 人在炮子村构筑防线，开展了长达三天三夜的惨烈阻击，掩护苏维埃政府和群众安全转移。',
    },
    {
      q: '“血田”因何得名？',
      options: ['田里种着红稻', '烈士鲜血染红了整片水田', '土地为红壤', '红军在此练兵'],
      answer: 1,
      explanation: '据《紫金县志》记载，1928 年先后有 450 多名革命先烈在炮子村的一块水田中被集体杀害，烈士的鲜血染红了整片稻田，当地群众悲痛地称其为“血田”。',
    },
    {
      q: '苏区镇是全国唯一以什么命名的乡镇？',
      options: ['“革命”', '“红军”', '“苏区”', '“解放”'],
      answer: 2,
      explanation: '1958 年经国务院批准，炮子乡正式命名为“苏区乡”，后改称苏区镇，成为全国唯一以“苏区”命名的乡镇。',
    },
  ],
}

// ============ tour_route：文旅导览路线 ============
const tourRoutes = [
  {
    name: '苏区红色初心之旅',
    desc: '一条串联苏区镇革命起点、政权建设、武装斗争与英烈缅怀的红色初心线路，约半天行程，适合党史学习与主题党日。',
    color: '#C41E3A',
    icon: '🏛',
    items: [
      { id: 'stop-1', name: '紫金县总农会旧址', time: '08:30', duration: '约 30 分钟', description: '东江地区最早的县级农会之一，1923 年成立，感受农民运动兴起的初心力量。' },
      { id: 'stop-2', name: '中共紫金县委旧址', time: '09:10', duration: '约 30 分钟', description: '土地革命战争时期紫金革命斗争指挥中枢，彭湃同志曾多次在此主持重要会议。' },
      { id: 'stop-3', name: '紫金县苏维埃政府旧址（红屋）', time: '09:50', duration: '约 40 分钟', description: '1927 年 12 月宣布成立苏维埃政府，广东最早建立的县级苏维埃政权之一。' },
      { id: 'stop-4', name: '红军亭', time: '10:40', duration: '约 20 分钟', description: '红二师、红四师胜利会师地，见证星星之火燎原的革命力量。' },
      { id: 'stop-5', name: '炮子村阻击战遗址', time: '11:10', duration: '约 20 分钟', description: '1928 年三天三夜惨烈阻击战的遗址，感悟革命先辈的牺牲与担当。' },
      { id: 'stop-6', name: '血田遗址', time: '11:40', duration: '约 30 分钟', description: '450 多名革命先烈血染水田之地，铭记历史、缅怀先烈。' },
      { id: 'stop-7', name: '苏区革命烈士纪念碑', time: '12:20', duration: '约 30 分钟', description: '全国唯一“苏区”命名乡镇的纪念碑，瞻仰致敬，传承红色基因。' },
    ],
  },
]

// ============ 通用插入 ============
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
    const key = item.key || item.name || item.title
    const contentId = `content-${moduleKey}-${String(key).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60)}`
    const versionId = `${contentId}-v1`
    const title = item.title || item.name || '自动讲解'
    const summary = item.summary || item.desc || ''
    const dataJson = JSON.stringify(toData(item))
    const con = insertContent.run(
      contentId, moduleKey, '', '[]', 'published', title, summary, 'normal', '[]',
      versionId, versionId, null, null, 'seed', 'seed', now, now, null, now, now,
    )
    insertVersion.run(versionId, contentId, 1, title, summary, '', dataJson, 'seed', now)
    if (con.changes > 0) inserted++
    else skipped++
  }
  return { inserted, skipped }
}

if (dryRun) {
  console.log(`[dry-run] 将 seed director_script(1) + quiz(1 含 ${quizQuestions.questions.length} 题) + tour_route(${tourRoutes.length})`)
  process.exit(0)
}

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
fs.copyFileSync(DB_PATH, path.join(BACKUP_DIR, `suqu.db.seed-red-${stamp}.bak`))
console.log(`已备份 → data/backups/suqu.db.seed-red-${stamp}.bak`)

const db = new DatabaseSync(DB_PATH)
const r1 = seedModule(db, 'director_script', [{ key: 'red-tour', title: '苏区红色初心自动讲解', summary: '沿苏区镇革命旧址的自动语音讲解（按年份串联：1923 总农会 → 1927 县委/红屋/红军亭 → 1928 东江特委/阻击战/血田 → 1958 纪念碑）。', ...directorScript }], (d) => ({ scenes: d.scenes }))
const r2 = seedModule(db, 'quiz', [{ key: 'suqu-party-history', title: '苏区党史知识问答', summary: '基于苏区镇革命史实编写的党史自测题。', ...quizQuestions }], (d) => ({ questions: d.questions }))
const r3 = seedModule(db, 'tour_route', tourRoutes.map((r) => ({ ...r, key: r.name })), (r) => ({ name: r.name, desc: r.desc, color: r.color, icon: r.icon, items: r.items }))
db.close()
console.log(`director_script: 新增 ${r1.inserted} | quiz: 新增 ${r2.inserted} | tour_route: 新增 ${r3.inserted}`)
console.log('完成。刷新前端即可体验自动讲解 / 党史答题 / 数字导览。')
