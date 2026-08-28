/**
 * server/index.js 函数抽取脚本 v2（CJS）
 * 用法:
 *   node _extract_v2.cjs <lib模块名> <函数名...> [--dry-run]        # 纯函数抽取（无注入）
 *   node _extract_v2.cjs --cluster <lib模块名> <种子函数名...> [--dry-run]  # 簇抽取（自动闭包 + init 注入）
 * 安全: --dry-run 校验；node 写文件（UTF-8）
 */
const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, 'index.js')
const LIB_DIR = path.join(__dirname, 'lib')
const LIB_REQUIRE_ANCHOR = "require('./lib/security')"

const args = process.argv.slice(2)
const clusterMode = args[0] === '--cluster'
const rest = clusterMode ? args.slice(1) : args
const moduleName = rest[0]
const FNS = rest.slice(1).filter((a) => a !== '--dry-run')
const dryRun = rest.includes('--dry-run')
if (!moduleName || FNS.length === 0) { console.error('用法见脚本头注释'); process.exit(1) }

function findFunctionEnd(lines, startLine) {
  let paren = 0, foundBody = false, depth = 0, retDepth = 0, lastNonSpace = '', angle = 0
  let inTemplate = false, inStr = null
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i]
    for (let c = 0; c < line.length; c++) {
      const ch = line[c]
      if (inTemplate) { if (ch === '\\') { c++; continue } if (ch === '`') inTemplate = false; continue }
      if (inStr) { if (ch === '\\') { c++; continue } if (ch === inStr) inStr = null; continue }
      if (ch === '`') { inTemplate = true; continue }
      if (ch === "'" || ch === '"') { inStr = ch; continue }
      if (!foundBody && ch === '<') { angle++; continue }
      if (!foundBody && ch === '>') { if (angle > 0) angle--; continue }
      if (angle > 0) continue
      if (ch === '(') { paren++; continue }
      if (ch === ')') { if (paren > 0) paren--; continue }
      if (ch === '{') {
        if (retDepth > 0) { retDepth++; continue }
        if (!foundBody) { if (paren === 0) { if (lastNonSpace === ':') retDepth = 1; else { foundBody = true; depth = 1 } } }
        else depth++
        continue
      }
      if (ch === '}') {
        if (retDepth > 0) { retDepth--; continue }
        if (foundBody) { depth--; if (depth === 0) return i }
        continue
      }
      if (!/\s/.test(ch)) lastNonSpace = ch
    }
  }
  return -1
}

const lines = fs.readFileSync(SRC, 'utf8').split('\n')
const MODULE_VARS = new Set()
for (const l of lines) { const m = l.match(/^(?:const|let)\s+([A-Za-z0-9_$]+)\s*=/); if (m) MODULE_VARS.add(m[1]) }
const REQ_LIBS = new Set(['express', 'cors', 'fs', 'path', 'crypto', 'sharp'])

const funcs = new Map()
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*[<(]/)
  if (m) {
    const end = findFunctionEnd(lines, i)
    if (end > 0) funcs.set(m[1], { start: i, end, content: lines.slice(i, end + 1).join('\n') })
    i = end
  }
}
const allNames = new Set(funcs.keys())

function libExports(file) {
  if (!fs.existsSync(file)) return Object.create(null)
  const t = fs.readFileSync(file, 'utf8')
  const map = Object.create(null)
  for (const m of t.matchAll(/^(?:function|const|async function)\s+([A-Za-z0-9_$]+)/gm)) map[m[1]] = path.basename(file, '.js')
  return map
}
const LIB_EXPORTS = Object.create(null)
for (const f of fs.readdirSync(LIB_DIR)) {
  if (!f.endsWith('.js')) continue
  Object.assign(LIB_EXPORTS, libExports(path.join(LIB_DIR, f)))
}

let selected
if (clusterMode) {
  selected = new Set(FNS)
  let changed = true
  while (changed) {
    changed = false
    for (const n of [...selected]) {
      if (!funcs.has(n)) { console.error(`❌ 未找到 ${n}`); process.exit(1) }
      for (const m of funcs.get(n).content.matchAll(/\b([A-Za-z_$][A-Za-z0-9_$]*)\b/g)) {
        const id = m[1]
        if (allNames.has(id) && !selected.has(id) && !LIB_EXPORTS[id]) { selected.add(id); changed = true }
      }
    }
  }
} else {
  selected = new Set(FNS)
  const missing = FNS.filter((c) => !funcs.has(c))
  if (missing.length) { console.error(`❌ 未匹配: ${missing.join(', ')}`); process.exit(1) }
}

const blocks = []
const usedLibs = new Set()
const usedLibExports = new Set()
const injectVars = new Set()
let pollute = new Set()
for (const n of selected) {
  const f = funcs.get(n)
  if (!f) { console.error(`❌ 未找到 ${n}`); process.exit(1) }
  if (!f.content.trimEnd().endsWith('}')) { console.error(`❌ ${n} 提取不完整`); process.exit(1) }
  blocks.push({ name: n, content: f.content })
  for (const m of f.content.matchAll(/\b([A-Za-z_$][A-Za-z0-9_$]*)\b/g)) {
    const id = m[1]
    if (REQ_LIBS.has(id)) usedLibs.add(id)
    else if (LIB_EXPORTS[id]) usedLibExports.add(id)
    else if (MODULE_VARS.has(id)) injectVars.add(id)
    else if (allNames.has(id) && !selected.has(id)) pollute.add(id)
  }
}
pollute = new Set([...pollute].filter((x) => !LIB_EXPORTS[x]))
if (pollute.size) { console.error(`❌ 簇内引用 index.js 残留函数: ${[...pollute].join(', ')}`); process.exit(1) }

if (dryRun) {
  console.log(`[dry-run] ${clusterMode ? '簇' : '纯函数'} ${blocks.length} 个: ${blocks.map((b) => b.name).join(', ')}`)
  console.log(`  依赖: libs=${[...usedLibs].join(',') || '无'} lib导出=${[...usedLibExports].join(',') || '无'}`)
  if (clusterMode) console.log(`  注入变量: ${[...injectVars].sort().join(', ') || '无'}`)
  process.exit(0)
}

let libContent = '/**\n * 从 index.js 拆出的辅助函数\n */\n'
for (const lib of [...usedLibs].sort()) libContent += `const ${lib} = require('${lib}')\n`
const byLib = {}
for (const n of usedLibExports) { const f = LIB_EXPORTS[n]; (byLib[f] = byLib[f] || []).push(n) }
for (const [f, ns] of Object.entries(byLib)) libContent += `const { ${ns.join(', ')} } = require('./${f}')\n`
if (usedLibs.size || usedLibExports.size) libContent += '\n'
if (clusterMode && injectVars.size) {
  libContent += `// 运行期注入的依赖（由 index.js 调用 init() 传入）\n`
  for (const v of [...injectVars].sort()) libContent += `let ${v}\n`
  libContent += `function init(deps) {\n${[...injectVars].sort().map((v) => `  ${v} = deps.${v}`).join('\n')}\n}\n\n`
}
libContent += blocks.map((b) => b.content).join('\n\n') + '\n\n'
libContent += `module.exports = { ${clusterMode && injectVars.size ? 'init, ' : ''}${blocks.map((b) => b.name).join(', ')} }\n`
fs.mkdirSync(LIB_DIR, { recursive: true })
fs.writeFileSync(path.join(LIB_DIR, `${moduleName}.js`), libContent, 'utf8')

const sorted = [...blocks].sort((a, b) => funcs.get(a.name).start - funcs.get(b.name).start).reverse()
let src = lines.slice()
for (const b of sorted) { const f = funcs.get(b.name); src.splice(f.start, f.end - f.start + 1) }
const anchorIdx = src.findIndex((l) => l.includes(LIB_REQUIRE_ANCHOR))
const requireLine = `const { ${blocks.map((b) => b.name).join(', ')} } = require('./lib/${moduleName}')`
src.splice(anchorIdx + 1, 0, requireLine)
if (clusterMode && injectVars.size) {
  // init 调用：插在 RUNTIME_MISC_STORE 定义之后（此时所有 store/配置常量均已定义）
  const initLine = `require('./lib/${moduleName}').init({ ${[...injectVars].sort().join(', ')} })`
  const miscIdx = src.findIndex((l) => l.startsWith('const RUNTIME_MISC_STORE'))
  src.splice(miscIdx + 1, 0, initLine)
}
fs.writeFileSync(SRC, src.join('\n'), 'utf8')

console.log(`\n✅ 抽出 ${blocks.length} 个函数 → lib/${moduleName}.js${clusterMode && injectVars.size ? `（注入 ${injectVars.size} 个变量）` : ''}；index.js ${lines.length} → ${src.length} 行`)
