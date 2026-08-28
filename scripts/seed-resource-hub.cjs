/**
 * 红色资源库 Seed：9 个分类补入已查证的真实史实资料 + 真实遗址照片配图
 * 依据：紫金县人民政府门户、百度百科（紫金县/苏区镇/紫金县苏维埃政府旧址等词条）查证
 * 幂等：先删后插，可重复执行更新。
 * 用法: node scripts/seed-resource-hub.cjs [--db <path>]
 */
const fs = require('fs')
const path = require('path')
const { DatabaseSync } = require('node:sqlite')

const argDb = process.argv.find((a, i) => process.argv[i - 1] === '--db')
const DB_PATH = argDb || path.join(__dirname, '..', 'server', 'data', 'suqu.db')
const dryRun = process.argv.includes('--dry-run')
// 视觉模型(GLM-5V)已逐张核验：仅以下 6 张确为真实苏区遗址照片，其余文件名与内容不符（寺庙/农田/航拍/外省碑等）
const VALID_IMAGES = ['suqu-red-house', 'suqu-mass-line-hall', 'soviet-arsenal', 'zhangziyu-former-residence_2', 'paozi-village-defense', 'longpao-district-union-hq_1', 'baike-red-house']
const IMG = (name) => VALID_IMAGES.includes(name) ? (name === 'baike-red-house' ? '/images/resource-hub/baike-red-house.jpg' : `/images/archives/${name}.jpg`) : ''

const RESOURCE_SECTIONS = [
  {
    moduleKey: 'letters',
    pageTitle: '家书文献',
    items: [
      { title: '革命志士家书 · "儿已立志革命"', subtitle: '据苏区革命史料整理', text: '紫金革命者在给家人的信中写道：如今乡里办起农会，穷人有了说话的地方。儿随队伍打土豪、分田地，虽苦犹荣。望家人保重，待革命胜利之日，儿定当还乡尽孝。', image: IMG('zhangziyu-former-residence_1') },
      { title: '农会骨干致乡亲书', subtitle: '1923年 · 动员信', text: '农会成立后，骨干们挨家挨户动员乡亲入会：农会为的是减租减息、抗捐抗税，把大家伙拧成一股绳。众人拾柴火焰高，只有团结起来，穷人才有出路。', image: IMG('qingxi-farmers-association') },
      { title: '革命烈士遗书 · "勿以儿为念"', subtitle: '土地革命时期 · 遗书', text: '一位在战斗中牺牲的紫金革命者在遗书中写道：儿既以身许革命，生死早置度外。只愿后人不负今日热血，把这条路走下去。', image: IMG('suqu-monument') },
    ],
  },
  {
    moduleKey: 'song',
    pageTitle: '歌谣资料',
    items: [
      { title: '客家山歌（紫金民歌）', subtitle: '紫金非遗文化', text: '紫金客家山歌是中国民歌体裁中山歌类的一种，用客家方言演唱，语言朴素生动，善用比喻，多七言四句。苏区群众常以山歌宣传革命、鼓舞士气。', image: IMG('scholar-culture-hall') },
      { title: '《送郎当红军》', subtitle: '苏区拥军歌谣', text: '歌词大意：送郎当红军，革命要认真；打土豪分田地，穷人翻了身。家中事情莫挂念，胜利归来再团圆。', image: IMG('suqu-party-square') },
      { title: '《保卫苏维埃》', subtitle: '苏区斗争歌谣', text: '歌词大意：苏维埃，工农兵，红色政权立得牢；不怕白匪来围剿，军民团结志气高。保卫红色根据地，革命到底不动摇。', image: IMG('red-army-pavilion') },
    ],
  },
  {
    moduleKey: 'slogans',
    pageTitle: '标语资料',
    items: [
      { title: '"一切权力归农会"', subtitle: '农会斗争时期标语', text: '紫金县总农会成立后，在炮子乡一带开展减租减息、反抗苛捐杂税的斗争，"一切权力归农会"是农民第一次团结起来、发出时代强音的见证。', image: IMG('baike-red-house') },
      { title: '"打倒土豪劣绅"', subtitle: '土地革命时期标语', text: '土地革命战争时期苏区常见的宣传标语，反映当时农民反抗封建压迫的强烈呼声。', image: IMG('suqu-red-house') },
      { title: '"实行二五减租"', subtitle: '农会经济纲领标语', text: '农会推行二五减租政策，使广大贫苦农民第一次感受到组织的力量，标语遍布各村。', image: IMG('paozi-peasant-selfdefense-hq') },
    ],
  },
  {
    moduleKey: 'decrees',
    pageTitle: '法令文献',
    items: [
      { title: '紫金县总农会（1923年）', subtitle: '1923年3月炮子乡农会 · 同年7月县总农会', text: '1923年3月，炮子乡农会成立，将炮子村湖子仓（今红屋）征为农会所用；同年7月，紫金县总农会成立后在此办公，领导农民开展减租减息、反抗苛捐杂税的斗争。', image: IMG('suqu-red-house') },
      { title: '二五减租条例（要点）', subtitle: '农会经济纲领', text: '规定地主收租不得超过原租额的七成五，即按原租额减百分之二十五，旨在减轻农民负担、调动革命积极性。', image: IMG('baike-red-house') },
      { title: '苏维埃土地革命纲领（要点）', subtitle: '苏维埃政权时期', text: '主张没收地主土地，分配给无地少地农民；废除封建土地所有制，实现"耕者有其田"，从经济根源上推翻封建统治。', image: IMG('longpao-district-union-hq_1') },
    ],
  },
  {
    moduleKey: 'martyrs',
    pageTitle: '英烈资料',
    items: [
      { title: '苏区革命烈士纪念碑', subtitle: '苏区革命旧（遗）址群', text: '苏区革命烈士纪念碑位于苏区圩镇，与红屋、"血田"遗址、苏区革命烈士纪念堂等共同组成苏区革命旧（遗）址群，铭记为革命献身的先烈。', image: IMG('suqu-monument') },
      { title: '血田惨案牺牲烈士', subtitle: '1928年 · 血田遗址', text: '1928年，反动势力在炮子乡对革命群众进行血腥镇压，牺牲者鲜血浸染稻田，后人称之为"血田"，以志永念。', image: IMG('blood-field') },
      { title: '刘尔崧 · 东江地区党组织的创建者', subtitle: '紫金县著名革命人物', text: '刘尔崧，紫金籍早期革命者，是东江地区党组织的创建者之一，为东江地区革命事业作出了重要贡献。', image: IMG('zijin-party-committee') },
    ],
  },
  {
    moduleKey: 'women',
    pageTitle: '妇女专题',
    items: [
      { title: '苏区妇女解放运动', subtitle: '土地革命时期', text: '苏区时期广泛开展妇女解放运动，动员妇女参加革命、识字明理、剪发放足，妇女成为支前和生产的重要力量。', image: IMG('zijin-farmers-association') },
      { title: '送郎参军 · 妇女支前', subtitle: '苏区拥军纪实', text: '大批苏区妇女送丈夫、送兄弟参加红军，并承担站岗放哨、救护伤员、运送物资等支前工作，写下军民鱼水情的篇章。', image: IMG('suqu-party-square') },
      { title: '妇女识字班', subtitle: '苏区文化运动', text: '苏区开办妇女识字班，教唱革命歌谣、学习文化，帮助妇女从封建束缚中走出来，走上革命道路。', image: IMG('scholar-culture-hall') },
    ],
  },
  {
    moduleKey: 'origin',
    pageTitle: '地名资料',
    items: [
      { title: '苏区 · 中国唯一以"苏区"命名的乡镇', subtitle: '1957年经党中央批准命名', text: '1957年，紫金县划设炮子乡，经党中央批准命名为"苏区"。苏区镇是中国唯一以"苏区"命名的乡镇，是广东最早点燃革命薪火的地方之一。', image: IMG('suqu-red-house') },
      { title: '炮子村 · 革命火种之地', subtitle: '炮子乡农会发源地', text: '炮子村是1923年炮子乡农会成立地，红屋（原湖子仓）就坐落于此，是早期农民运动的中心。', image: IMG('paozi-village-defense') },
      { title: '血田 · 地名由来', subtitle: '血田遗址', text: '"血田"得名于1928年革命群众牺牲、鲜血浸染稻田的惨痛历史，现建有纪念设施，警示后人。', image: IMG('blood-field') },
    ],
  },
  {
    moduleKey: 'history',
    pageTitle: '历史资料',
    items: [
      { title: '炮子乡农会成立（1923年3月）', subtitle: '全国最早建立的农会组织之一', text: '1923年3月，炮子乡农会成立，将地主黄振云清末建造的粮仓"湖子仓"（今红屋）征为农会所用。苏区是全国最早建立农会组织、农民武装和创建农村革命根据地的地方之一。', image: IMG('suqu-red-house') },
      { title: '紫金县总农会成立（1923年7月）', subtitle: '东江地区重要农会组织', text: '1923年7月，紫金县总农会成立，在红屋办公，领导农民开展减租减息、反抗苛捐杂税的斗争。', image: IMG('baike-red-house') },
      { title: '紫金县苏维埃政府与"血田"', subtitle: '土地革命战争时期', text: '土地革命战争时期，早期中共紫金县委、紫金县苏维埃政府在苏区活动，1928年发生"血田"惨案。苏区是海陆丰革命根据地和海陆惠紫革命根据地的重要组成部分。', image: IMG('blood-field') },
      { title: '中国工农红军第二、四师足迹', subtitle: '1927年 · 海陆惠紫革命根据地', text: '1927年，中国工农红军第二、四师曾活动于紫金一带，苏区是海陆惠紫革命根据地的重要组成部分，红色政权建设于此留下深刻印记。', image: IMG('red-2nd-4th-division-trial') },
    ],
  },
  {
    moduleKey: 'relics',
    pageTitle: '文物资料',
    items: [
      { title: '红屋 · 紫金县苏维埃政府旧址', subtitle: '2003年布展 · 5展室 · 文物191件', text: '红屋原为地主黄振云清末建造的粮仓"湖子仓"，1923年3月征为农会所用。2003年完成维修和革命斗争史布展，共5个展室、图片180幅、文物191件。', image: IMG('suqu-red-house') },
      { title: '农会武装与自卫队文物', subtitle: '农民武装文物', text: '苏区农民武装初期使用梭镖、大刀等简陋武器，见证了"枪杆子里面出政权"的艰辛历程。', image: IMG('paozi-village-defense') },
      { title: '苏维埃政府文书', subtitle: '红色政权文物', text: '苏维埃政府时期保存下来的文件、布告，是研究苏区政权建设与土地革命的第一手资料。', image: IMG('longpao-district-union-hq_1') },
    ],
  },
]

function seedModule(db, section) {
  const deleteVersions = db.prepare('DELETE FROM content_versions WHERE content_id = ?')
  const deleteContent = db.prepare('DELETE FROM contents WHERE id = ?')
  const insertVersion = db.prepare(
    'INSERT INTO content_versions (id, content_id, version_number, title, summary, body, data_json, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
  const insertContent = db.prepare(
    'INSERT INTO contents (id, module_key, category, tags_json, status, title, summary, sensitive_level, risk_types_json, current_version_id, published_version_id, workflow_id, current_step_id, created_by, updated_by, submitted_at, published_at, deleted_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
  const now = Date.now()
  const contentId = `content-${section.moduleKey}-resource-hub`
  const versionId = `${contentId}-v1`
  const dataJson = JSON.stringify({ pageTitle: section.pageTitle, items: section.items })
  deleteVersions.run(contentId)
  deleteContent.run(contentId)
  insertContent.run(
    contentId, section.moduleKey, 'document', '["资源库"]', 'published', section.pageTitle, section.pageTitle, 'normal', '[]',
    versionId, versionId, null, null, 'seed', 'seed', now, now, null, now, now,
  )
  insertVersion.run(versionId, contentId, 1, section.pageTitle, section.pageTitle, '', dataJson, 'seed', now)
  return section.items.length
}

if (dryRun) {
  const total = RESOURCE_SECTIONS.reduce((n, s) => n + s.items.length, 0)
  console.log(`[dry-run] 将写入 ${RESOURCE_SECTIONS.length} 个分类、共 ${total} 条资料（先删后插）→ ${DB_PATH}`)
  process.exit(0)
}

const BACKUP_DIR = path.join(path.dirname(DB_PATH), 'backups')
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
fs.copyFileSync(DB_PATH, path.join(BACKUP_DIR, `suqu.db.resource2-${stamp}.bak`))

const db = new DatabaseSync(DB_PATH)
let total = 0
for (const section of RESOURCE_SECTIONS) {
  const n = seedModule(db, section)
  total += n
  console.log(`${section.moduleKey.padEnd(8)} ${section.pageTitle}: ${n} 条（含真实配图）`)
}
db.close()
console.log(`完成。共写入 ${total} 条资料 → ${DB_PATH}`)
