/**
 * server/index.js 顶层函数依赖分析
 * 列出每个顶层函数引用的"模块级变量"（即闭包依赖）。
 * 无闭包依赖 = 纯函数，可安全抽到 lib/ 模块。
 * 用法: node _analyze_deps.cjs [函数名...]   （不带参数=全部）
 */
const fs = require('fs')
const path = require('path')
const SRC = path.join(__dirname, 'index.js')

const lines = fs.readFileSync(SRC, 'utf8').split('\n')

// 模块级 const/let 名（含 require 库）
const MODULE_VARS = new Set()
for (const l of lines) {
  const m = l.match(/^(?:const|let)\s+([A-Za-z0-9_$]+)\s*=/)
  if (m) MODULE_VARS.add(m[1])
}
// require 库（可在新模块重新 require，不算闭包依赖）
const REQ_LIBS = new Set(['express', 'cors', 'fs', 'path', 'crypto', 'sharp'])

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

// 收集所有顶层函数
const funcs = new Map()
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*[<(]/)
  if (m) {
    const end = findFunctionEnd(lines, i)
    if (end > 0) { funcs.set(m[1], { start: i, end, content: lines.slice(i, end + 1).join('\n') }) }
    i = end
  }
}

const filter = process.argv.slice(2)
const report = []
for (const [name, { content }] of funcs) {
  const used = new Set()
  for (const m of content.matchAll(/\b([A-Za-z_$][A-Za-z0-9_$]*)\b/g)) {
    const id = m[1]
    if (MODULE_VARS.has(id) && !REQ_LIBS.has(id)) used.add(id)
  }
  const deps = [...used].sort()
  report.push({ name, deps, lines: content.split('\n').length })
}

if (filter.length) {
  for (const n of filter) {
    const r = report.find((x) => x.name === n)
    console.log(r ? `${n}: ${r.deps.length ? r.deps.join(', ') : '（纯函数）'} [${r.lines}行]` : `❌ ${n} 未找到`)
  }
} else {
  const pure = report.filter((r) => r.deps.length === 0)
  const closure = report.filter((r) => r.deps.length > 0)
  console.log(`共 ${report.length} 个顶层函数：纯函数 ${pure.length} 个，闭包依赖 ${closure.length} 个`)
  console.log('\n=== 纯函数（可安全抽取）===')
  for (const r of pure) console.log(`${r.name} [${r.lines}行]`)
  console.log('\n=== 闭包依赖函数（按依赖分组）===')
  const byDep = {}
  for (const r of closure) {
    const key = r.deps.join(',')
    byDep[key] = byDep[key] || []
    byDep[key].push(r)
  }
  for (const [dep, list] of Object.entries(byDep)) {
    console.log(`\n-- 依赖: ${dep} (${list.length} 个)`)
    for (const r of list) console.log(`  ${r.name} [${r.lines}行]`)
  }
}
