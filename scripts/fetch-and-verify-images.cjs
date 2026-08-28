/**
 * 下载网上候选遗址图片 + 用 GLM-5V 视觉模型验证内容，避免错图。
 * 用法: node scripts/fetch-and-verify-images.cjs
 */
const fs = require('fs')
const path = require('path')

const API_KEY = '1e18221acb584a93a2ac97390b5e0d52.cloe6e8eoHysgYFS'
const MODEL = 'glm-5v-turbo'
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const TMP = path.join(__dirname, '..', 'server', 'data', 'tmp-imgs')
fs.mkdirSync(TMP, { recursive: true })

// 候选：来源（百度百科词条概述图）→ 目标遗址
const CANDIDATES = [
  { name: 'baike-red-house', target: '红屋（紫金县苏维埃政府旧址）', url: 'https://bkimg.cdn.bcebos.com/pic/0ff41bd5ad6eddc451da04170083a1fd5266d116959d?x-bce-process=image/format,f_auto/quality,Q_70' },
  { name: 'baike-suqu-town', target: '苏区镇相关（红屋或革命旧址群）', url: 'https://bkimg.cdn.bcebos.com/pic/dcc451da81cb39dbb6fdf2e3f15d1e24ab18972b9a79?x-bce-process=image/format,f_auto/quality,Q_70' },
]

async function download(name, url) {
  const res = await fetch(url, { headers: { Referer: 'https://baike.baidu.com/', 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) return null
  const buf = Buffer.from(await res.arrayBuffer())
  const ext = (res.headers.get('content-type') || '').includes('png') ? 'png' : 'jpg'
  const file = path.join(TMP, `${name}.${ext}`)
  fs.writeFileSync(file, buf)
  return file
}

async function describe(file, target) {
  const b64 = fs.readFileSync(file).toString('base64')
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
          { type: 'text', text: `我期望这张图是「${target}」。请客观描述图片实际内容（建筑类型/标识牌文字等），并判断它是否是革命旧址/遗址类建筑。不要猜测，只说看到的。` },
        ],
      }],
      max_tokens: 2048,
    }),
  })
  const payload = await res.json().catch(() => null)
  if (!res.ok) return `HTTP ${res.status}`
  return (payload?.choices?.[0]?.message?.content || '').replace(/\s+/g, ' ').slice(0, 300)
}

;(async () => {
  for (const c of CANDIDATES) {
    try {
      const file = await download(c.name, c.url)
      if (!file) { console.log(`${c.name}: 下载失败`); continue }
      console.log(`${c.name} (目标: ${c.target})`)
      console.log(`  → ${await describe(file, c.target)}`)
    } catch (e) {
      console.log(`${c.name}: ERROR ${e.message}`)
    }
  }
})()
