/**
 * 组件抽取脚本（修复版）
 * 修复：findFunctionEnd 从函数体"最后一个 {" 开始计数（避开 props 解构陷阱）
 * 安全：--dry-run 校验每个块含 `return (` 且以 `}` 结尾；全部用 node 写文件（UTF-8）
 * 用法: node _extract_components2.cjs <group> <组件名...> [--dry-run]
 */
const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, 'src', 'App.tsx')
const COMP_DIR = path.join(__dirname, 'src', 'components')

const group = process.argv[2]
const COMPONENTS = process.argv.slice(3).filter((a) => a !== '--dry-run')
const dryRun = process.argv.includes('--dry-run')
if (!group || COMPONENTS.length === 0) { console.error('用法: node _extract_components2.cjs <group> <组件名...> [--dry-run]'); process.exit(1) }

/** 字符扫描状态机：跨行跟踪字符串/模板字符串，正确处理 props 解构与嵌套括号 */
function makeScanner() {
  return { inTemplate: false, inStr: null }
}

/**
 * 找到函数体结束行。
 * 算法：跨行扫描（跳过字符串/模板），跟踪小括号深度 paren。
 *  - 参数结束后（paren===0）遇到的第一个 { 才是函数体
 *  - 若 paren===0 且 { 前一个非空白字符是 ':'（返回类型对象如 : { a: T; b: U }），先跳过它
 *  - 函数体 {} 深度归零即结束
 * 正确处理：多行 props 解构、嵌套函数类型参数（onChange: (v)=>void）、返回类型（含对象类型）
 */
function findFunctionEnd(lines, startLine) {
  const s = makeScanner()
  let paren = 0
  let foundBody = false
  let depth = 0
  let retDepth = 0
  let lastNonSpace = ''
  let angle = 0
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i]
    for (let c = 0; c < line.length; c++) {
      const ch = line[c]
      if (s.inTemplate) { if (ch === '\\') { c++; continue } if (ch === '`') s.inTemplate = false; continue }
      if (s.inStr) { if (ch === '\\') { c++; continue } if (ch === s.inStr) s.inStr = null; continue }
      if (ch === '`') { s.inTemplate = true; continue }
      if (ch === "'" || ch === '"') { s.inStr = ch; continue }
      if (!foundBody && ch === '<') { angle++; continue }
      if (!foundBody && ch === '>') { if (angle > 0) angle--; continue }
      if (angle > 0) continue // 泛型参数段（如 <T extends { ... }>）：整体跳过
      if (ch === '(') { paren++; continue }
      if (ch === ')') { if (paren > 0) paren--; continue }
      if (ch === '{') {
        if (retDepth > 0) { retDepth++; continue }
        if (!foundBody) {
          if (paren === 0) {
            if (lastNonSpace === ':') { retDepth = 1 } // 返回类型对象，跳过
            else { foundBody = true; depth = 1 }
          }
        } else { depth++ }
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

/** 找到 const 声明结束行（支持单行/多行，括号深度归零的行即结束，兼容有无分号） */
function findConstEnd(lines, startLine) {
  let depth = { '(': 0, '{': 0, '[': 0 }
  let inTemplate = false, inStr = null
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i]
    for (let c = 0; c < line.length; c++) {
      const ch = line[c]
      if (inTemplate) { if (ch === '\\') { c++; continue } if (ch === '`') inTemplate = false; continue }
      if (inStr) { if (ch === '\\') { c++; continue } if (ch === inStr) inStr = null; continue }
      if (ch === '`') { inTemplate = true; continue }
      if (ch === "'" || ch === '"') { inStr = ch; continue }
      if (ch === '(' || ch === '{' || ch === '[') { depth[ch]++; continue }
      if (ch === ')') { if (depth['('] > 0) depth['(']--; continue }
      if (ch === '}') { if (depth['{'] > 0) depth['{']--; continue }
      if (ch === ']') { if (depth['['] > 0) depth['[']--; continue }
    }
    if (depth['('] <= 0 && depth['{'] <= 0 && depth['['] <= 0) return i
  }
  return -1
}

// 读取共享模块导出名（宽 import）
function exportNames(file) {
  if (!fs.existsSync(file)) return []
  const t = fs.readFileSync(file, 'utf8')
  const names = new Set()
  for (const m of t.matchAll(/^export (?:function|const|type|interface) ([A-Za-z0-9_]+)/gm)) names.add(m[1])
  return [...names]
}
const TYPES_NAMES = exportNames(path.join(__dirname, 'src', 'types.ts'))
const CONSTANTS_NAMES = exportNames(path.join(__dirname, 'src', 'constants.ts'))
const UTILS_NAMES = exportNames(path.join(__dirname, 'src', 'utils.ts'))

const lines = fs.readFileSync(SRC, 'utf8').split('\n')
const blocks = []
for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  const isConst = line.startsWith('const ')
  const m = (isConst ? line.match(/^const\s+([A-Za-z0-9_$]+)\s*[:=]/) : null)
    || line.match(/^(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*[<(]/)
  if (m && COMPONENTS.includes(m[1])) {
    const end = isConst ? findConstEnd(lines, i) : findFunctionEnd(lines, i)
    if (end < 0) { console.error(`❌ 无法闭合 ${m[1]} @${i + 1}`); process.exit(1) }
    blocks.push({ start: i, end, name: m[1], content: lines.slice(i, end + 1).join('\n'), isConst })
    i = end
  }
}
const foundNames = blocks.map((b) => b.name)
const missing = COMPONENTS.filter((c) => !foundNames.includes(c))
console.log(`匹配 ${blocks.length} / ${COMPONENTS.length}`)
if (missing.length) { console.error(`❌ 未匹配: ${missing.join(', ')}`); process.exit(1) }

// 完整性校验：函数须含 return 且以 `}` 结尾；const 只须以 `;` 或 `}` 结尾
for (const b of blocks) {
  const hasReturn = b.isConst ? true : (/return\s*[<(]/.test(b.content) || b.content.includes('return '))
  const endsOk = b.isConst ? b.content.trimEnd().length > 0 : b.content.trimEnd().endsWith('}')
  const marker = hasReturn && endsOk ? '✅' : '❌'
  console.log(`  ${marker} ${b.name} (${b.end - b.start + 1} 行) return=${hasReturn} 结尾=${b.content.trimEnd().slice(-1)}`)
  if (!hasReturn || !endsOk) { console.error(`❌ ${b.name} 提取不完整，中止`); process.exit(1) }
}

if (dryRun) { console.log('\n[dry-run] 校验通过，未写入'); process.exit(0) }

// 执行：删除 + 生成
const sorted = [...blocks].sort((a, b) => b.start - a.start)
let source = lines.slice()
for (const b of sorted) source.splice(b.start, b.end - b.start + 1)

const reactHooks = "import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'\n"
const typeImport = TYPES_NAMES.length ? `import type { ${TYPES_NAMES.join(', ')} } from '../types'\n` : ''
const constImport = CONSTANTS_NAMES.length ? `import { ${CONSTANTS_NAMES.join(', ')} } from '../constants'\n` : ''
const utilsImport = UTILS_NAMES.length ? `import { ${UTILS_NAMES.join(', ')} } from '../utils'\n` : ''
let content = `/**\n * 后台通用组件（从 App.tsx 拆分）\n */\n${reactHooks}${typeImport}${constImport}${utilsImport}\n`
for (const b of blocks) content += (b.isConst ? b.content.replace(/^const /, 'export const ') : b.content.replace(/^(async\s+)?function /, 'export $1function ')) + '\n\n'

// 跨文件组件 import：检测本批内容引用了其他 components/*.tsx 已导出的组件名，自动补 import
const compExports = Object.create(null)
if (fs.existsSync(COMP_DIR)) {
  for (const f of fs.readdirSync(COMP_DIR)) {
    if (!f.endsWith('.tsx') || f === `${group}.tsx`) continue
    const t = fs.readFileSync(path.join(COMP_DIR, f), 'utf8')
    for (const m of t.matchAll(/^export (?:async\s+)?function ([A-Za-z0-9_]+)/gm)) compExports[m[1]] = f.replace(/\.tsx$/, '')
    for (const m of t.matchAll(/^export const ([A-Za-z0-9_]+)/gm)) compExports[m[1]] = f.replace(/\.tsx$/, '')
  }
}
const usedComp = new Set()
for (const m of content.matchAll(/\b[A-Za-z0-9_$]+\b/g)) {
  if (Object.prototype.hasOwnProperty.call(compExports, m[0]) && !COMPONENTS.includes(m[0])) usedComp.add(m[0])
}
const byFile = Object.create(null)
for (const n of usedComp) { const f = compExports[n]; (byFile[f] = byFile[f] || []).push(n) }
const extraImports = Object.entries(byFile)
  .map(([f, ns]) => `import { ${ns.join(', ')} } from './${f}'\n`)
  .join('')
content = content.replace(`from '../utils'\n`, `from '../utils'\n${extraImports}`)

fs.mkdirSync(COMP_DIR, { recursive: true })
const DST = path.join(COMP_DIR, `${group}.tsx`)
fs.writeFileSync(DST, content, 'utf8')

const srcLines = source
const firstImportIdx = srcLines.findIndex((l) => l.startsWith('import '))
const names = blocks.map((b) => b.name).join(', ')
srcLines.splice(firstImportIdx + 1, 0, `import { ${names} } from './components/${group}'`)
fs.writeFileSync(SRC, srcLines.join('\n'), 'utf8')

console.log(`✅ 抽出 ${blocks.length} 个组件 → src/components/${group}.tsx`)
console.log(`✅ App.tsx 剩余 ${srcLines.filter((l) => l.trim()).length} 非空行`)
