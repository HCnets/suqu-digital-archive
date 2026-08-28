/**
 * 一次性依赖分析：给定组件名，列出块内引用的标识符中
 * 不属于 JS 关键字 / react / types / constants / utils / 本批组件 的部分
 * 用法: node _analyze_deps.cjs <组件名...>
 */
const fs = require('fs')
const path = require('path')
const SRC = path.join(__dirname, 'src', 'App.tsx')

const KEYWORDS = new Set(`
  const let var function return if else for while do switch case default break continue
  new typeof instanceof in of delete void this super class extends static async await yield
  import export from as try catch finally throw true false null undefined
  Array Object String Number Boolean Math JSON Promise Date RegExp Set Map Error
  console window document navigator fetch Intl parseFloat parseInt isNaN encodeURIComponent decodeURIComponent
  JSON.stringify JSON.parse React useCallback useDeferredValue useEffect useMemo useRef useState createContext useContext
  File FormData Blob URL atob btoa location history localStorage sessionStorage requestAnimationFrame
`.trim().split(/\s+/))

function exportNames(file) {
  if (!fs.existsSync(file)) return []
  const t = fs.readFileSync(file, 'utf8')
  const names = new Set()
  for (const m of t.matchAll(/^export (?:function|const|type|interface) ([A-Za-z0-9_]+)/gm)) names.add(m[1])
  return [...names]
}
const SHARED = new Set([
  ...exportNames(path.join(__dirname, 'src', 'types.ts')),
  ...exportNames(path.join(__dirname, 'src', 'constants.ts')),
  ...exportNames(path.join(__dirname, 'src', 'utils.ts')),
])

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

const names = process.argv.slice(2)
const lines = fs.readFileSync(SRC, 'utf8').split('\n')

// App.tsx 顶层符号（function / const 顶层声明）——只有这些才是真实的跨组件依赖
const INTERNAL = new Set()
for (const l of lines) {
  if (!/^[A-Za-z_$]/.test(l)) continue
  const m = l.match(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)/) || l.match(/^(?:export\s+)?const\s+([A-Za-z0-9_$]+)\s*[:=]/)
  if (m) INTERNAL.add(m[1])
}

const comps = new Set(names)
const blocks = new Map()
for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  const m = line.match(/^(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*[<(]/) || line.match(/^const\s+([A-Za-z0-9_$]+)\s*[:=]/)
  if (m && comps.has(m[1])) {
    const isConst = line.startsWith('const ')
    const end = isConst ? findConstEnd(lines, i) : findFunctionEnd(lines, i)
    blocks.set(m[1], lines.slice(i, end + 1).join('\n'))
    i = end
  }
}

for (const name of names) {
  if (!blocks.has(name)) { console.log(`❌ ${name}: 未找到`); continue }
  const ids = new Set()
  for (const m of blocks.get(name).matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g)) {
    const id = m[0]
    if (INTERNAL.has(id) && !comps.has(id)) ids.add(id)
  }
  const deps = [...ids].sort()
  console.log(`${name}: ${deps.length ? deps.join(', ') : '（无外部依赖）'}`)
}
