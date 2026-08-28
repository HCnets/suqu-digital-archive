/**
 * tools/refactor-tailwind-tokens.cjs
 * 视觉统一：把组件中 className 内的硬编码色值任意值类（如 text-[#C41E3A]）
 * 替换为 index.css @theme 设计令牌类（如 text-party-red）。
 *
 * 安全策略：
 *  - 仅匹配 className 中的 `[#HEX]` 任意值形式，style 对象里的颜色（如 style={{color:'#...'}}）不含方括号，不会被误改
 *  - 保留前缀（text/bg/border/ring/hover: 等）与透明度后缀（/60）
 *  - 幂等：已替换为令牌的文件再次运行不会重复改动
 *
 * 用法: node tools/refactor-tailwind-tokens.cjs <文件...>
 * 例:   node tools/refactor-tailwind-tokens.cjs client/src/App.tsx client/src/components/ui/UnifiedHeader.tsx
 */
const fs = require('fs')
const path = require('path')

const TOKEN_MAP = {
  C41E3A: 'party-red',
  '8B1A2B': 'party-red-dark',
  FDE8EC: 'party-red-light',
  '8B6914': 'party-gold',
  FFF8E1: 'party-gold-light',
  D8C4A8: 'party-gold-line',
  '1A1A1A': 'party-ink',
  '5C5C5C': 'party-ink-light',
  FEFAF6: 'museum-bg',
  FFFFFF: 'museum-card',
  E8DFD5: 'museum-border',
}

/** 匹配 [ #HEX ]（可带 /透明度 后缀） */
const HEX_ARBITRARY_RE = /\[#([0-9A-Fa-f]{6})\](?:\/\d+(?:\.\d+)?)?/g

function refactor(source) {
  let count = 0
  const out = source.replace(HEX_ARBITRARY_RE, (match, hex) => {
    const token = TOKEN_MAP[hex.toUpperCase()]
    if (!token) return match
    count++
    return token
  })
  return { out, count }
}

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('用法: node tools/refactor-tailwind-tokens.cjs <文件...>')
  process.exit(1)
}

let total = 0
for (const rel of files) {
  const file = path.resolve(rel)
  if (!fs.existsSync(file)) {
    console.error(`文件不存在: ${rel}`)
    continue
  }
  const source = fs.readFileSync(file, 'utf8')
  const { out, count } = refactor(source)
  if (count > 0) {
    fs.writeFileSync(file, out, 'utf8')
  }
  total += count
  console.log(`  ${String(count).padStart(4)} 处替换  ${rel}`)
}
console.log(`\n共替换 ${total} 处。`)
