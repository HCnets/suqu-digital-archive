const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const { getDatabaseConfig } = require('../db/config')
const { withMysqlConnection } = require('../db/mysql-primary-ops')

const DEFAULT_SOURCE_DATE = '2026-04-13'
const DEFAULT_SOURCE_TITLE = '苏区革命旧遗址39处'
const DEFAULT_OUTPUT = path.join(__dirname, '..', 'data', 'imports', 'official-suqu-sites-20260413-plan.json')

const MANUAL_TITLE_MATCHES = new Map([
  ['红军兵工厂旧址', ['soviet-arsenal']],
  ['红二师官兵操练遗址（红军亭）', ['red-army-pavilion']],
  ['炮子乡农会、紫金县总农会旧址', ['zijin-farmers-association']],
  ['血田遗址', ['blood-field']],
  ['中共紫金县委、紫金县苏维埃政府旧址', ['zijin-party-committee', 'suqu-red-house']],
  ['红军医院旧址', ['red-army-hospital']],
  ['紫金县老苏区革命纪念碑、烈士墓', ['suqu-monument']],
])

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const docxPath = args.docx || process.env.SUQU_OFFICIAL_DOCX
  if (!docxPath) {
    throw new Error('请通过 --docx 或 SUQU_OFFICIAL_DOCX 指定官方 Word 文档路径。')
  }

  const outPath = args.out || DEFAULT_OUTPUT
  const document = readDocxDocument(docxPath)
  const officialSites = extractOfficialSites(document.paragraphs)
  const currentArchives = await loadCurrentArchiveContents()
  const plan = buildImportPlan({
    docxPath,
    mediaFiles: document.mediaFiles,
    paragraphs: document.paragraphs,
    officialSites,
    currentArchives,
  })

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8')

  console.log(JSON.stringify({
    ok: true,
    output: outPath,
    sourceFile: docxPath,
    officialCount: plan.officialCount,
    currentArchiveCount: plan.currentArchiveCount,
    matchedCount: plan.matchedCount,
    unmatchedCount: plan.unmatchedCount,
    destroyedCount: plan.destroyedCount,
    mediaCount: plan.mediaCount,
    nextAction: '请在导入计划中逐条确认坐标、图片归属和需合并的旧点位后，再执行正式入库。',
  }, null, 2))
}

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index]
    if (key === '--docx') args.docx = argv[++index]
    else if (key === '--out') args.out = argv[++index]
    else if (key === '--source-date') args.sourceDate = argv[++index]
  }
  return args
}

function readDocxDocument(filePath) {
  const absolutePath = path.resolve(filePath)
  const buffer = fs.readFileSync(absolutePath)
  const zipEntries = readZipEntries(buffer)
  const documentXml = zipEntries.get('word/document.xml')
  if (!documentXml) throw new Error('Word 文档中未找到 word/document.xml。')

  return {
    paragraphs: extractParagraphs(documentXml.toString('utf8')),
    mediaFiles: [...zipEntries.keys()].filter((name) => name.startsWith('word/media/')),
  }
}

function readZipEntries(buffer) {
  const entries = new Map()
  const eocdOffset = findEndOfCentralDirectory(buffer)
  const entryCount = buffer.readUInt16LE(eocdOffset + 10)
  let cursor = buffer.readUInt32LE(eocdOffset + 16)

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) break
    const method = buffer.readUInt16LE(cursor + 10)
    const compressedSize = buffer.readUInt32LE(cursor + 20)
    const fileNameLength = buffer.readUInt16LE(cursor + 28)
    const extraLength = buffer.readUInt16LE(cursor + 30)
    const commentLength = buffer.readUInt16LE(cursor + 32)
    const localOffset = buffer.readUInt32LE(cursor + 42)
    const name = buffer.toString('utf8', cursor + 46, cursor + 46 + fileNameLength)

    const localFileNameLength = buffer.readUInt16LE(localOffset + 26)
    const localExtraLength = buffer.readUInt16LE(localOffset + 28)
    const dataStart = localOffset + 30 + localFileNameLength + localExtraLength
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize)
    const data = method === 0
      ? Buffer.from(compressed)
      : method === 8
        ? zlib.inflateRawSync(compressed)
        : null
    if (data) entries.set(name, data)

    cursor += 46 + fileNameLength + extraLength + commentLength
  }

  return entries
}

function findEndOfCentralDirectory(buffer) {
  for (let cursor = buffer.length - 22; cursor >= 0; cursor -= 1) {
    if (buffer.readUInt32LE(cursor) === 0x06054b50) return cursor
  }
  throw new Error('无法识别 docx 压缩结构。')
}

function extractParagraphs(xml) {
  const paragraphs = []
  const paragraphPattern = /<w:p\b[\s\S]*?<\/w:p>/g
  let paragraphMatch
  while ((paragraphMatch = paragraphPattern.exec(xml))) {
    const textParts = []
    const paragraphXml = paragraphMatch[0]
    const textPattern = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g
    let textMatch
    while ((textMatch = textPattern.exec(paragraphXml))) {
      textParts.push(decodeXml(textMatch[1]))
    }
    const text = textParts.join('').replace(/\s+/g, ' ').trim()
    if (text) paragraphs.push(text)
  }
  return paragraphs
}

function decodeXml(value) {
  return String(value || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function extractOfficialSites(paragraphs) {
  const sites = []
  const villageCounts = new Map()
  let village = ''
  let current = null

  function finishCurrent() {
    if (!current) return
    const body = current.bodyParagraphs.join('\n').trim()
    sites.push({
      officialIndex: sites.length + 1,
      village: current.village,
      villageIndex: current.villageIndex,
      sourceTitle: current.title,
      title: normalizeKnownTitle(current.title),
      body,
      summary: makeSummary(body),
      preservationStatus: inferPreservationStatus(body),
      needsTitleReview: current.title !== normalizeKnownTitle(current.title),
      sourceParagraphCount: current.bodyParagraphs.length,
    })
    current = null
  }

  function startSite(title, explicitNumber) {
    finishCurrent()
    const nextIndex = explicitNumber || Number(villageCounts.get(village) || 0) + 1
    villageCounts.set(village, nextIndex)
    current = {
      village,
      villageIndex: nextIndex,
      title: title.trim(),
      bodyParagraphs: [],
    }
  }

  for (let index = 2; index < paragraphs.length; index += 1) {
    let line = paragraphs[index]
    const villageMatch = line.match(/^(.*?村)[：:]\s*(.*)$/)
    if (villageMatch) {
      finishCurrent()
      village = villageMatch[1]
      if (!villageCounts.has(village)) villageCounts.set(village, 0)
      line = villageMatch[2].trim()
      if (!line) continue
    } else if (/^.*?村[：:]$/.test(line)) {
      finishCurrent()
      village = line.replace(/[：:]$/, '')
      if (!villageCounts.has(village)) villageCounts.set(village, 0)
      continue
    }

    const numbered = line.match(/^(\d+)[.．、]\s*(.+)$/)
    if (numbered && village) {
      startSite(numbered[2], Number(numbered[1]))
      continue
    }

    if (village && isUnnumberedTitle(paragraphs, index, line)) {
      startSite(line)
      continue
    }

    if (current) current.bodyParagraphs.push(line)
  }

  finishCurrent()
  return sites
}

function isUnnumberedTitle(paragraphs, index, line) {
  if (!line || line.length > 32) return false
  if (/[，。；]/.test(line)) return false
  if (!/(旧址|遗址|纪念碑|烈士墓|址群)$/.test(line)) return false
  const next = paragraphs[index + 1] || ''
  return next.includes('位于') && (
    next.includes(line) ||
    next.includes(line.slice(0, 2)) ||
    next.includes(line.slice(-4)) ||
    line.includes('战斗遗址')
  )
}

function normalizeKnownTitle(title) {
  if (title === '竹解沥战斗遗址') return '竹拐沥战斗遗址'
  return title
}

function makeSummary(body) {
  const firstLine = String(body || '').split(/\n/).find(Boolean) || ''
  return firstLine.length > 120 ? `${firstLine.slice(0, 120)}...` : firstLine
}

function inferPreservationStatus(body) {
  if (/灭失|已拆除|原建筑已拆除|现已灭失|已毁|不复存在/.test(body)) return '已灭失或原建筑已拆除'
  if (/破旧不堪|年久失修|坍塌|风雨腐蚀/.test(body)) return '现存但需保护说明'
  return '现存或可展示'
}

async function loadCurrentArchiveContents() {
  const config = getDatabaseConfig(process.env)
  if (config.client !== 'mysql') return []

  try {
    return await withMysqlConnection(config, async (db) => {
      const rows = await db.all(`
        SELECT c.id, c.status, c.category, c.title, c.summary, c.current_version_id, c.published_version_id,
               v.title AS version_title, v.summary AS version_summary, v.body, v.data_json
        FROM contents c
        LEFT JOIN content_versions v ON v.id = COALESCE(c.current_version_id, c.published_version_id)
        WHERE c.module_key = 'archive'
          AND c.deleted_at IS NULL
        ORDER BY c.updated_at DESC, c.id ASC
      `)
      return rows.map((row) => {
        const data = safeJson(row.data_json) || {}
        return {
          id: row.id,
          legacyId: data.legacyId || data.legacy_id || '',
          status: row.status,
          title: row.version_title || row.title,
          summary: row.version_summary || row.summary || '',
          longitude: Number(data.longitude || 0),
          latitude: Number(data.latitude || 0),
          address: data.address || data.location || '',
          data,
        }
      })
    })
  } catch (error) {
    return [{ error: error.message }]
  }
}

function buildImportPlan({ docxPath, mediaFiles, paragraphs, officialSites, currentArchives }) {
  const usableArchives = currentArchives.filter((item) => !item.error)
  const planItems = officialSites.map((site) => {
    const matches = findArchiveMatches(site, usableArchives)
    const primaryMatch = matches[0] || null
    const hasCoordinates = Boolean(primaryMatch && hasValidCoordinate(primaryMatch))
    const recommendedAction = matches.length > 1
      ? '人工确认合并口径'
      : primaryMatch
        ? '沿用现有点位并补写官方资料'
        : '新增为后台草稿，待补坐标和图片后发布'

    return {
      officialIndex: site.officialIndex,
      village: site.village,
      villageIndex: site.villageIndex,
      title: site.title,
      sourceTitle: site.sourceTitle,
      summary: site.summary,
      preservationStatus: site.preservationStatus,
      sourceParagraphCount: site.sourceParagraphCount,
      needsTitleReview: site.needsTitleReview,
      currentMatches: matches.map((match) => ({
        id: match.id,
        legacyId: match.legacyId,
        title: match.title,
        status: match.status,
        longitude: match.longitude,
        latitude: match.latitude,
        address: match.address,
      })),
      gaps: {
        coordinates: hasCoordinates ? '可沿用现有坐标' : '待补精确经纬度',
        media: '待从 Word 内嵌图片或素材库确认归属',
        publicStatus: site.preservationStatus.includes('灭失') ? '前台需标记原址/已灭失，避免按可参观点展示' : '可作为普通档案点位展示',
      },
      recommendedAction,
      draftContent: buildDraftContent(site, primaryMatch),
    }
  })

  const matchedIds = new Set(planItems.flatMap((item) => item.currentMatches.map((match) => match.id)))
  const extraCurrentArchives = usableArchives
    .filter((archive) => !matchedIds.has(archive.id))
    .map((archive) => ({
      id: archive.id,
      legacyId: archive.legacyId,
      title: archive.title,
      status: archive.status,
      reason: '当前动态库中存在，但不在本次官方 39 处自动匹配结果内；建议保留为配套设施或延伸资源，不混入官方 39 处。',
    }))

  return {
    generatedAt: new Date().toISOString(),
    source: {
      title: DEFAULT_SOURCE_TITLE,
      sourceDate: DEFAULT_SOURCE_DATE,
      file: docxPath,
      paragraphCount: paragraphs.length,
      note: '本计划严格以甲方提供的 Word 文档为入库基准；外部资料只作为后续复核，不阻塞本轮迁移。',
    },
    officialCount: officialSites.length,
    currentArchiveCount: usableArchives.length,
    matchedCount: planItems.filter((item) => item.currentMatches.length > 0).length,
    unmatchedCount: planItems.filter((item) => item.currentMatches.length === 0).length,
    destroyedCount: planItems.filter((item) => item.preservationStatus.includes('灭失')).length,
    mediaCount: mediaFiles.length,
    mediaFiles: mediaFiles.map((name) => ({ name, extension: path.extname(name).toLowerCase() })),
    byVillage: countBy(officialSites, 'village'),
    planItems,
    extraCurrentArchives,
    importPolicy: {
      phase1: '先生成草稿和审核清单，不直接发布缺坐标或图片归属不明的点位。',
      phase2: '已匹配点位沿用现有坐标和公开 ID，补充官方正文、来源和灭失状态。',
      phase3: '未匹配点位进入后台草稿，坐标补齐后再允许地图发布。',
      phase4: '已灭失或原建筑拆除的点位前台必须展示“原址/已灭失”说明。',
    },
  }
}

function buildDraftContent(site, match) {
  const longitude = match && hasValidCoordinate(match) ? match.longitude : null
  const latitude = match && hasValidCoordinate(match) ? match.latitude : null
  return {
    id: match?.id || `content-official-suqu-site-${String(site.officialIndex).padStart(2, '0')}`,
    moduleKey: 'archive',
    status: match ? 'draft_update' : 'draft_new',
    title: site.title,
    summary: site.summary,
    body: site.body,
    data: {
      officialIndex: site.officialIndex,
      village: site.village,
      sourceDocument: DEFAULT_SOURCE_TITLE,
      officialSourceDate: DEFAULT_SOURCE_DATE,
      preservationStatus: site.preservationStatus,
      longitude,
      latitude,
      address: inferAddress(site),
      publishPositions: {
        map: Boolean(longitude && latitude),
        list: true,
        home: false,
        topic: false,
        guide: false,
      },
      detailBlocks: [
        {
          id: 'official-description',
          type: 'text',
          title: '官方资料',
          content: site.body,
          enabled: true,
        },
      ],
      media: [],
    },
    source: {
      sourceType: 'official_document',
      sourceTitle: DEFAULT_SOURCE_TITLE,
      archiveRef: `${site.village} 第${site.villageIndex}处`,
      collectedAt: DEFAULT_SOURCE_DATE,
      trustLevel: 'official',
      notes: '甲方提供 Word 文献素材，按其作为本轮迁移基准。',
    },
  }
}

function inferAddress(site) {
  const firstLine = site.body.split(/\n/).find((line) => line.includes('位于')) || ''
  return firstLine.slice(0, 180)
}

function findArchiveMatches(site, archives) {
  const manualIds = MANUAL_TITLE_MATCHES.get(site.title) || MANUAL_TITLE_MATCHES.get(site.sourceTitle)
  if (manualIds) {
    return archives.filter((archive) => manualIds.includes(archive.legacyId) || manualIds.includes(archive.id))
  }

  const siteTitle = normalizeTitleForMatch(site.title)
  const sourceTitle = normalizeTitleForMatch(site.sourceTitle)
  return archives.filter((archive) => {
    const archiveTitle = normalizeTitleForMatch(archive.title)
    if (!archiveTitle) return false
    return archiveTitle.includes(siteTitle) ||
      siteTitle.includes(archiveTitle) ||
      archiveTitle.includes(sourceTitle) ||
      sourceTitle.includes(archiveTitle)
  })
}

function normalizeTitleForMatch(value) {
  return String(value || '')
    .replace(/[（）()、，,\s]/g, '')
    .replace(/旧址|遗址|纪念碑|烈士墓|苏维埃政府|紫金县|中共|中国工农革命军|官兵操练|红二师/g, '')
    .replace(/红军亭/g, '红军亭')
    .toLowerCase()
}

function hasValidCoordinate(item) {
  return Number.isFinite(Number(item.longitude)) &&
    Number.isFinite(Number(item.latitude)) &&
    Number(item.longitude) >= -180 &&
    Number(item.longitude) <= 180 &&
    Number(item.latitude) >= -90 &&
    Number(item.latitude) <= 90 &&
    !(Number(item.longitude) === 0 && Number(item.latitude) === 0)
}

function countBy(items, key) {
  return items.reduce((result, item) => {
    const value = item[key] || ''
    result[value] = (result[value] || 0) + 1
    return result
  }, {})
}

function safeJson(value) {
  try {
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
