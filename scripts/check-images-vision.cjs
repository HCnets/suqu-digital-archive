/**
 * 用智谱 GLM-5V-Turbo 视觉模型逐张确认遗址照片内容，用于校验资源库/档案配图是否准确。
 * 用法: node scripts/check-images-vision.cjs
 */
const fs = require('fs')
const path = require('path')

const API_KEY = '1e18221acb584a93a2ac97390b5e0d52.cloe6e8eoHysgYFS'
const MODEL = 'glm-5v-turbo'
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const IMG_DIR = path.join(__dirname, '..', 'server', 'public', 'images', 'archives')

const IMAGES = [
  'suqu-red-house', 'blood-field', 'suqu-monument', 'zijin-farmers-association', 'zijin-party-committee',
  'paozi-peasant-selfdefense-hq', 'paozi-village-defense', 'longpao-district-union-hq_1',
  'red-2nd-4th-division-trial', 'qingxi-farmers-association', 'zhangziyu-former-residence_1',
  'zhangziyu-former-residence_2', 'zhongdingxiang-former-residence_1', 'zhongdingxiang-former-residence_2',
  'zhongdingxiang-former-residence_3', 'zhongdingxiang-former-residence_4', 'zhongdingxiang-former-residence_6',
  'scholar-culture-hall', 'suqu-party-square', 'red-army-pavilion', 'red-army-hospital',
  'soviet-arsenal', 'suqu-education-base', 'suqu-mass-line-hall', 'suqu-red-transport-station',
  'suqu-town-hall', 'yangqi-anti-encirclement', 'dongjiang-committee',
]

async function analyze(fileName) {
  const jpg = path.join(IMG_DIR, `${fileName}.jpg`)
  if (!fs.existsSync(jpg)) return `${fileName}: 缺 jpg`
  const b64 = fs.readFileSync(jpg).toString('base64')
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
          { type: 'text', text: '请用一句话准确描述这张照片的内容：是什么类型的建筑或场所（如旧民居、纪念馆、纪念碑、广场、水田、门楼等）？若画面中有文字或碑刻请指出。不要猜测地点名称，只描述你看到的。' },
        ],
      }],
      max_tokens: 2048,
    }),
  })
  const payload = await res.json().catch(() => null)
  if (!res.ok) return `${fileName}: HTTP ${res.status} ${JSON.stringify(payload).slice(0, 120)}`
  const text = payload?.choices?.[0]?.message?.content || ''
  return `${fileName}: ${text.replace(/\s+/g, ' ').slice(0, 200)}`
}

;(async () => {
  for (const f of IMAGES) {
    try {
      console.log(await analyze(f))
    } catch (e) {
      console.log(`${f}: ERROR ${e.message}`)
    }
  }
})()
