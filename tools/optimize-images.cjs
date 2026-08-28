/**
 * tools/optimize-images.cjs
 * 图片优化：为 jpg/jpeg/png 生成 WebP 副本（原图保留，零风险）。
 * 配合 server/index.js 的 WebP 内容协商中间件，浏览器自动加载更小的 WebP。
 *
 * 用法:
 *   node tools/optimize-images.cjs                    # 处理默认目录 (server/public/images)
 *   node tools/optimize-images.cjs --dir <dir>        # 指定目录
 *   node tools/optimize-images.cjs --quality 80       # 设置 WebP 质量 (1-100)
 *   node tools/optimize-images.cjs --max-width 1600   # 长边上限（超出则等比缩小）
 *   node tools/optimize-images.cjs --dry-run          # 只预览不写文件
 *
 * 特性: 幂等（重复运行仅覆盖自身输出）、原图不动、有清晰统计。
 */
const fs = require('fs')
const path = require('path')
const sharp = require('../server/node_modules/sharp')

function parseArgs(argv) {
  const args = { dir: 'server/public/images', quality: 80, maxWidth: 1600, dryRun: false }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dir') args.dir = argv[++i]
    else if (a === '--quality') args.quality = Math.max(1, Math.min(100, Number(argv[++i]) || 80))
    else if (a === '--max-width') args.maxWidth = Number(argv[++i]) || 1600
    else if (a === '--dry-run') args.dryRun = true
    else { console.error(`未知参数: ${a}`); process.exit(1) }
  }
  return args
}

const EXT_RE = /\.(jpe?g|png)$/i

async function processFile(filePath, { quality, maxWidth, dryRun }) {
  const ext = path.extname(filePath)
  const webpPath = filePath.slice(0, -ext.length) + '.webp'

  const meta = await sharp(filePath).metadata()
  const longEdge = Math.max(meta.width || 0, meta.height || 0)
  const needsResize = longEdge > maxWidth

  let pipeline = sharp(filePath)
  if (needsResize) pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true })
  pipeline = pipeline.webp({ quality, effort: 4 })

  const origBytes = fs.statSync(filePath).size
  if (dryRun) {
    // 内存编码估算体积，不写文件
    const buf = await pipeline.toBuffer()
    return { webpPath, origBytes, webpBytes: buf.length, needsResize, done: false }
  }

  await pipeline.toFile(webpPath)
  return {
    webpPath,
    origBytes,
    webpBytes: fs.statSync(webpPath).size,
    needsResize,
    done: true,
  }
}

async function main() {
  const args = parseArgs(process.argv)
  const dir = args.dir
  if (!fs.existsSync(dir)) {
    console.error(`目录不存在: ${dir}`)
    process.exit(1)
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => EXT_RE.test(f))
    .map((f) => path.join(dir, f))

  // 同名去重（如 xxx.jpg 与 xxx.png）：只保留体积最大的源生成一份 WebP，避免互相覆盖
  const byName = new Map()
  for (const file of files) {
    const base = file.replace(EXT_RE, '')
    const size = fs.statSync(file).size
    const existing = byName.get(base)
    if (!existing || size > existing.size) byName.set(base, { file, size })
  }
  const uniqueFiles = [...byName.values()].map((x) => x.file).sort()

  console.log(`目录: ${dir}\n待处理: ${files.length} 张（去重后 ${uniqueFiles.length} 个 WebP）| WebP 质量 ${args.quality} | 长边上限 ${args.maxWidth}px${args.dryRun ? ' | [dry-run 预览]' : ''}\n`)

  let totalOrig = 0
  let totalWebp = 0

  for (const file of uniqueFiles) {
    try {
      // 第一步：内存估算体积，决定是否值得生成 WebP
      const est = await processFile(file, { ...args, dryRun: true })
      const savedPct = est.origBytes > 0 ? Math.round((1 - est.webpBytes / est.origBytes) * 100) : 0
      const resizeMark = est.needsResize ? ' [缩小]' : ''

      // WebP 不小于原图时跳过（避免负优化；服务端协商会回退原图）
      if (est.webpBytes >= est.origBytes) {
        console.log(`  ${(est.origBytes / 1024).toFixed(0).padStart(6)}KB →  跳过（WebP 无收益）  ${path.basename(est.webpPath)}`)
        continue
      }

      totalOrig += est.origBytes
      totalWebp += est.webpBytes

      // 第二步：确有收益才写盘
      if (!args.dryRun) {
        await processFile(file, args)
      }

      console.log(
        `  ${(est.origBytes / 1024).toFixed(0).padStart(6)}KB → ${(est.webpBytes / 1024).toFixed(0).padStart(6)}KB  (-${String(savedPct).padStart(3)}%)${resizeMark}  ${path.basename(est.webpPath)}`
      )
    } catch (e) {
      console.error(`  ❌ 失败 ${path.basename(file)}: ${e.message}`)
    }
  }

  if (totalOrig > 0) {
    console.log(
      `\n汇总: ${(totalOrig / 1024 / 1024).toFixed(2)} MB → ${(totalWebp / 1024 / 1024).toFixed(2)} MB  (节省 ${((1 - totalWebp / totalOrig) * 100).toFixed(1)}%)`
    )
  }
  if (args.dryRun) {
    console.log('\n[dry-run] 未写入任何文件')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
