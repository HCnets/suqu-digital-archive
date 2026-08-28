/**
 * tools/analyze-images.cjs
 * 图片资产分析：输出每张图的格式/尺寸/体积，并给出 WebP 转换的潜在收益估算。
 * 用法: node tools/analyze-images.cjs [目录]
 * 说明: 纯分析、只读，不做任何修改。
 */
const fs = require('fs')
const path = require('path')
const sharp = require('../server/node_modules/sharp')

const dir = process.argv[2] || 'server/public/images/archives'

async function main() {
  if (!fs.existsSync(dir)) {
    console.error(`目录不存在: ${dir}`)
    process.exit(1)
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .map((f) => path.join(dir, f))

  console.log(`扫描目录: ${dir}\n图片数量: ${files.length}\n`)

  const rows = []
  let totalBytes = 0

  for (const file of files) {
    const stat = fs.statSync(file)
    let meta = null
    try {
      meta = await sharp(file).metadata()
    } catch {
      rows.push({ name: path.basename(file), err: '无法解析' })
      continue
    }
    const bytes = stat.size
    totalBytes += bytes
    rows.push({
      name: path.basename(file),
      format: meta.format,
      width: meta.width,
      height: meta.height,
      bytes,
      hasAlpha: meta.hasAlpha,
    })
  }

  // 汇总
  const byFormat = {}
  for (const r of rows) {
    if (r.err) continue
    byFormat[r.format] = byFormat[r.format] || { count: 0, bytes: 0, maxW: 0 }
    byFormat[r.format].count++
    byFormat[r.format].bytes += r.bytes
    byFormat[r.format].maxW = Math.max(byFormat[r.format].maxW, r.width)
  }

  console.log('=== 按格式汇总 ===')
  for (const [fmt, s] of Object.entries(byFormat)) {
    console.log(
      `  ${fmt.padEnd(5)} ${String(s.count).padStart(3)} 张  ${(s.bytes / 1024 / 1024).toFixed(2).padStart(6)} MB  最大宽 ${s.maxW}px`
    )
  }
  console.log(`\n总大小: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`)

  console.log('\n=== 最大的 15 张（转 WebP 后预计节省 ~70%） ===')
  rows
    .filter((r) => !r.err)
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 15)
    .forEach((r) => {
      const estWebp = Math.round(r.bytes * 0.3 / 1024)
      console.log(
        `  ${(r.bytes / 1024).toFixed(0).padStart(6)} KB  ${String(r.width).padStart(5)}x${String(r.height).padEnd(5)} ${r.format.padEnd(5)} ${r.name}  (≈WebP ${estWebp}KB)`
      )
    })

  const pngBytes = Object.entries(byFormat).reduce((a, [fmt, s]) => a + (fmt === 'png' ? s.bytes : 0), 0)
  console.log(
    `\n[提示] PNG 共 ${(pngBytes / 1024 / 1024).toFixed(2)} MB，是主要优化对象；超大宽度图片建议缩到 ≤1600px。`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
