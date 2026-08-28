// 全面检查 lib/*.js 的未解析引用（跨 lib 依赖缺失），自动补 require
// 用法: node _check_lib.cjs [--apply]
const fs = require('fs')
const path = require('path')
const LIB_DIR = path.join(__dirname, 'lib')
const APPLY = process.argv.includes('--apply')

const files = fs.readdirSync(LIB_DIR).filter((f) => f.endsWith('.js'))
// deps 注入模块/纯数据模块：依赖由 index.js 装配或自身内聚，跳过自动检查
const SKIP_FILES = new Set(['ai-route.js', 'llm-providers.js'])

// 1) 每个文件的导出（顶层 function/const，排除 require 的库名）
function topDefs(content) {
  const defs = new Set()
  const lines = content.split('\n')
  for (const l of lines) {
    if (l.includes('require(')) continue
    const m = l.match(/^(?:async\s+)?function\s+([A-Za-z0-9_$]+)/) || l.match(/^const\s+([A-Za-z0-9_$]+)\s*[:=]/)
    if (m) defs.add(m[1])
  }
  return defs
}

// 2) 每个文件的 require 依赖 → 解析出模块导出集合
const fileInfo = {}
for (const f of files) {
  const content = fs.readFileSync(path.join(LIB_DIR, f), 'utf8')
  const defs = topDefs(content)
  // require 行
  const reqMods = []
  for (const m of content.matchAll(/^const\s+\{?\s*([^}]*?)\s*\}?\s*=\s*require\(\s*['\"]([^'\"]+)['\"]\s*\)/gm)) {
    const names = m[1].split(',').map((s) => s.trim()).filter(Boolean)
    reqMods.push({ mod: m[2], names })
  }
  for (const m of content.matchAll(/^const\s+([A-Za-z0-9_$]+)\s*=\s*require\(\s*['\"]([^'\"]+)['\"]\s*\)/gm)) {
    reqMods.push({ mod: m[2], names: [m[1]] })
  }
  fileInfo[f] = { defs, reqMods, content }
}

// 3) 所有模块导出名 → 所属文件
const exportOwner = Object.create(null)
for (const f of files) for (const n of fileInfo[f].defs) exportOwner[n] = f

// 4) 每个文件：扫描函数体引用（排除顶层声明/require/let注入行），找未解析
const missingReport = []
for (const f of files) {
  if (SKIP_FILES.has(f)) { console.log(`⏭️ ${f}: 跳过（deps 注入/纯数据模块）`); continue }
  const info = fileInfo[f]
  const lines = info.content.split('\n')
  // 本文件已解析名 = 自身导出 + require 的导出（保守：所有 require 的模块导出）
  const resolved = new Set(info.defs)
  for (const r of info.reqMods) {
    if (r.mod.startsWith('.')) {
      const target = path.join(LIB_DIR, r.mod + '.js')
      const tFile = path.basename(r.mod) + '.js'
      if (fileInfo[tFile]) for (const n of fileInfo[tFile].defs) resolved.add(n)
    } else {
      resolved.add(r.names[0]) // 库名
    }
  }
  // 注入变量（顶层 let）
  const injectVars = new Set()
  for (const l of lines) { const m = l.match(/^let\s+([A-Za-z0-9_$]+)\s*$/); if (m) injectVars.add(m[1]) }
  // 函数体代码：去掉注释 + 顶层行
  const body = lines.map((l) => l.replace(/^\s*\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, ''))
    .filter((l) => {
      const t = l.trim()
      if (/^(const|let)\s/.test(t) && !/^let\s+[A-Za-z0-9_$]+\s*$/.test(t)) return false
      if (/^function\s/.test(t) || /^module\.exports/.test(t)) return false
      return true
    }).join('\n')
  const used = new Set()
  for (const m of body.matchAll(/\b([A-Za-z_$][A-Za-z0-9_$]*)\b/g)) {
    const id = m[1]
    if (Object.prototype.hasOwnProperty.call(exportOwner, id) && exportOwner[id] !== f && !resolved.has(id) && !injectVars.has(id)) used.add(id)
  }
  if (used.size) {
    const missing = [...used].sort()
    missingReport.push({ f, missing })
    console.log(`❌ ${f}: 缺 require → ${missing.join(', ')} (来自 ${[...new Set(missing.map((m) => exportOwner[m]))].join(',')})`)
  } else {
    console.log(`✅ ${f}: 无缺失`)
  }
}

// 5) 修复：按来源模块分组生成 require 行
if (APPLY) {
  for (const { f, missing } of missingReport) {
    const byOwner = {}
    for (const m of missing) { const o = exportOwner[m]; (byOwner[o] = byOwner[o] || []).push(m) }
    let insertLines = []
    for (const [owner, names] of Object.entries(byOwner)) {
      insertLines.push(`const { ${names.join(', ')} } = require('./${owner.replace(/\.js$/, '')}')`)
    }
    const info = fileInfo[f]
    const lines = info.content.split('\n')
    // 在第一个 require 行后插入（若无 require，在首行注释后）
    const reqIdx = lines.findIndex((l) => l.includes('require('))
    const at = reqIdx >= 0 ? reqIdx + 1 : 2
    lines.splice(at, 0, ...insertLines)
    fs.writeFileSync(path.join(LIB_DIR, f), lines.join('\n'), 'utf8')
    console.log(`  已修复 ${f}: 插入 ${insertLines.join(' ; ')}`)
  }
} else {
  console.log('\n(未应用，加 --apply 写入修复)')
}
