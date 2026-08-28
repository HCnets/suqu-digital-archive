const fs = require('fs')
const path = require('path')
const assert = require('assert')
const { getDatabaseConfig } = require('../db/config')
const { withMysqlTransaction } = require('../db/mysql-primary-ops')

const DEFAULT_PLAN = path.join(__dirname, '..', 'data', 'imports', 'official-suqu-sites-20260413-plan.json')
const SYSTEM_USER = 'system-official-suqu-sites-import'
const REGION_ID = process.env.DEFAULT_PUBLIC_REGION_ID || 'region-suqu'
const REGION_NAME = process.env.DEFAULT_PUBLIC_REGION_NAME || '苏区镇'
const SOURCE_TITLE = '苏区革命旧遗址39处'
const SOURCE_DATE = '2026-04-13'

const STABLE_CONTENT_IDS = new Map([
  [6, 'content-archive-soviet-arsenal'],
  [8, 'content-archive-red-army-pavilion'],
  [11, 'content-archive-zijin-farmers-association'],
  [12, 'content-archive-blood-field'],
  [15, 'content-archive-suqu-red-house'],
  [20, 'content-archive-suqu-monument'],
  [27, 'content-archive-red-army-hospital'],
])

const VILLAGE_CENTERS = {
  '赤溪村': [115.3338, 23.3668],
  '龙上村': [115.3548, 23.3738],
  '炮子村': [115.3412, 23.3608],
  '青溪村': [115.426667, 23.426667],
  '小北村': [115.3188, 23.3728],
  '永光村': [115.3598, 23.3488],
  '永坑村': [115.3728, 23.3568],
}

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index]
    if (key === '--plan') args.plan = argv[++index]
    else if (key === '--dry-run') args.dryRun = true
  }
  return args
}

function loadPlan(filePath) {
  const absolutePath = path.resolve(filePath || DEFAULT_PLAN)
  const plan = JSON.parse(fs.readFileSync(absolutePath, 'utf8'))
  if (!Array.isArray(plan.planItems)) throw new Error('导入计划缺少 planItems。')
  return { absolutePath, plan }
}

function contentIdForItem(item) {
  return STABLE_CONTENT_IDS.get(Number(item.officialIndex)) ||
    `content-official-suqu-site-${String(item.officialIndex).padStart(2, '0')}`
}

function publicArchiveIdForItem(item) {
  const stableContentId = STABLE_CONTENT_IDS.get(Number(item.officialIndex))
  if (stableContentId) return stableContentId.replace(/^content-archive-/, '')
  return `official-suqu-site-${String(item.officialIndex).padStart(2, '0')}`
}

function coordinateForItem(item) {
  const data = item?.draftContent?.data || {}
  const longitude = Number(data.longitude)
  const latitude = Number(data.latitude)
  if (hasValidCoordinate(longitude, latitude)) {
    return { longitude, latitude, status: '沿用既有点位坐标' }
  }

  const center = VILLAGE_CENTERS[item.village] || VILLAGE_CENTERS['炮子村']
  const index = Math.max(1, Number(item.villageIndex || item.officialIndex || 1))
  const ring = Math.ceil(index / 8)
  const angle = ((index - 1) % 8) * (Math.PI / 4)
  const radius = 0.00125 * ring
  return {
    longitude: Number((center[0] + Math.cos(angle) * radius).toFixed(6)),
    latitude: Number((center[1] + Math.sin(angle) * radius).toFixed(6)),
    status: '村级临时定位，待主管部门补充精确坐标',
  }
}

function hasValidCoordinate(longitude, latitude) {
  return Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90 &&
    !(longitude === 0 && latitude === 0)
}

function yearFromText(text) {
  const match = String(text || '').match(/(19\d{2}|20\d{2})年/)
  return match ? Number(match[1]) : 1927
}

function makeSummary(item) {
  const text = String(item?.draftContent?.summary || '').trim()
  if (!text) return `${item.village}${item.title}，资料来源于${SOURCE_TITLE}。`
  return text.length > 180 ? `${text.slice(0, 180)}...` : text
}

function makeBody(item, coordinateStatus) {
  const body = String(item?.draftContent?.body || '').trim()
  const notes = [
    `资料来源：${SOURCE_TITLE}（${SOURCE_DATE}）。`,
    `所属村：${item.village}，文档序号：第${item.officialIndex}处。`,
    `保存状态：${item.preservationStatus || '以文档表述为准'}。`,
    `地图定位：${coordinateStatus}。`,
  ]
  return `${body}\n\n【资料说明】\n${notes.join('\n')}`
}

function makeData(item, publicArchiveId, coordinates, body) {
  const status = String(item.preservationStatus || '')
  const isLost = status.includes('灭失') || status.includes('拆除')
  return {
    legacyId: publicArchiveId,
    regionId: REGION_ID,
    regionName: REGION_NAME,
    archiveType: 'revolution',
    type: 'revolution',
    year: yearFromText(body),
    longitude: coordinates.longitude,
    latitude: coordinates.latitude,
    address: `${item.village}，${item.title}`,
    historyPeriod: '土地革命战争时期',
    officialIndex: Number(item.officialIndex),
    village: item.village,
    villageIndex: Number(item.villageIndex || 0),
    sourceDocument: SOURCE_TITLE,
    officialSourceDate: SOURCE_DATE,
    preservationStatus: status || '以文档表述为准',
    coordinateStatus: coordinates.status,
    coordinateNote: coordinates.status,
    publishPositions: {
      map: true,
      list: true,
      home: false,
      topic: false,
      guide: true,
    },
    detailBlocks: [
      { type: 'basic', title: '基本信息', order: 1, enabled: true },
      { type: 'history', title: '文献原文', order: 2, enabled: true },
      { type: 'sources', title: '资料来源', order: 3, enabled: true },
      { type: 'risk_note', title: '展示说明', order: 4, enabled: true },
    ],
    displayTimeline: [
      { label: '资料日期', value: SOURCE_DATE },
      { label: '文档序号', value: `第${item.officialIndex}处` },
      { label: '所属村', value: item.village },
    ],
    relatedPeople: [],
    relatedEvents: [],
    learningQuestions: [],
    routeTips: [],
    publicMessages: [],
    oralHistories: [],
    aiNarration: null,
    trustLevel: 'official',
    auditStatus: 'published',
    statusLabel: isLost ? '原址或遗址说明' : '文档收录旧址',
    coverImage: '',
    cover_image: '',
    media: [],
  }
}

async function nextVersionNumber(db, contentId) {
  const row = await db.get('SELECT COALESCE(MAX(version_number), 0) AS maxVersion FROM content_versions WHERE content_id = ?', [contentId])
  return Number(row?.maxVersion || 0) + 1
}

async function upsertOfficialContent(db, item, now, dryRun) {
  const contentId = contentIdForItem(item)
  const publicArchiveId = publicArchiveIdForItem(item)
  const coordinates = coordinateForItem(item)
  const title = String(item.title || '').trim()
  const summary = makeSummary(item)
  const body = makeBody(item, coordinates.status)
  const data = makeData(item, publicArchiveId, coordinates, body)
  const versionNumber = await nextVersionNumber(db, contentId)
  const versionId = `version-official-suqu-site-${String(item.officialIndex).padStart(2, '0')}-${now}`
  const sourceId = `source-official-suqu-site-${String(item.officialIndex).padStart(2, '0')}-${now}`
  const existing = await db.get('SELECT id, created_at FROM contents WHERE id = ?', [contentId])

  if (!dryRun) {
    if (!existing) {
      await db.run(`
        INSERT INTO contents
          (id, module_key, category, tags_json, status, title, summary, sensitive_level, risk_types_json,
           current_version_id, published_version_id, workflow_id, current_step_id, created_by, updated_by,
           submitted_at, published_at, deleted_at, created_at, updated_at)
        VALUES (?, 'archive', 'revolution', ?, 'published', ?, ?, 'normal', ?,
           ?, ?, NULL, NULL, ?, ?, ?, ?, NULL, ?, ?)
      `, [
        contentId,
        JSON.stringify(['official-document', 'suqu-39-sites', item.village]),
        title,
        summary,
        JSON.stringify([]),
        versionId,
        versionId,
        SYSTEM_USER,
        SYSTEM_USER,
        now,
        now,
        now,
        now,
      ])
    } else {
      await db.run(`
        UPDATE contents
        SET category = 'revolution',
            tags_json = ?,
            status = 'published',
            title = ?,
            summary = ?,
            sensitive_level = 'normal',
            risk_types_json = ?,
            current_version_id = ?,
            published_version_id = ?,
            updated_by = ?,
            submitted_at = COALESCE(submitted_at, ?),
            published_at = ?,
            deleted_at = NULL,
            updated_at = ?
        WHERE id = ?
      `, [
        JSON.stringify(['official-document', 'suqu-39-sites', item.village]),
        title,
        summary,
        JSON.stringify([]),
        versionId,
        versionId,
        SYSTEM_USER,
        now,
        now,
        now,
        contentId,
      ])
    }

    await db.run(`
      INSERT INTO content_versions
        (id, content_id, version_number, title, summary, body, data_json, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      versionId,
      contentId,
      versionNumber,
      title,
      summary,
      body,
      JSON.stringify(data),
      SYSTEM_USER,
      now,
    ])

    await db.run('DELETE FROM content_sources WHERE content_id = ?', [contentId])
    await db.run(`
      INSERT INTO content_sources
        (id, content_id, version_id, source_type, source_title, source_url, archive_ref, page_ref,
         collector, collected_at, trust_level, attachment_media_id, notes, created_at)
      VALUES (?, ?, ?, 'official_document', ?, '', ?, '', ?, ?, 'official', NULL, ?, ?)
    `, [
      sourceId,
      contentId,
      versionId,
      SOURCE_TITLE,
      `${item.village} 第${item.villageIndex}处 / 总第${item.officialIndex}处`,
      SYSTEM_USER,
      SOURCE_DATE,
      '甲方提供 Word 文献素材；本轮严格按该文档原文发布。',
      now,
    ])
  }

  return {
    contentId,
    publicArchiveId,
    title,
    village: item.village,
    coordinateStatus: coordinates.status,
    versionNumber,
    inserted: !existing,
    updated: Boolean(existing),
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const { absolutePath, plan } = loadPlan(args.plan)
  const config = getDatabaseConfig(process.env)
  const dryRun = Boolean(args.dryRun)
  const now = Date.now()
  const summary = {
    checkedAt: now,
    plan: absolutePath,
    officialCount: Number(plan.officialCount || plan.planItems.length),
    dryRun,
    imported: [],
    unpublished: [],
    ok: false,
  }

  assert.strictEqual(plan.planItems.length, 39, '官方旧址导入必须保持 39 条。')

  await withMysqlTransaction(config, async (db) => {
    const usedContentIds = new Set()
    const usedPublicIds = new Set()

    for (const item of plan.planItems) {
      const contentId = contentIdForItem(item)
      const publicId = publicArchiveIdForItem(item)
      assert(!usedContentIds.has(contentId), `重复内容 ID: ${contentId}`)
      assert(!usedPublicIds.has(publicId), `重复公开 ID: ${publicId}`)
      usedContentIds.add(contentId)
      usedPublicIds.add(publicId)
      summary.imported.push(await upsertOfficialContent(db, item, now, dryRun))
    }

    const rows = await db.all(`
      SELECT id, title
      FROM contents
      WHERE module_key = 'archive'
        AND deleted_at IS NULL
        AND status = 'published'
      ORDER BY id ASC
    `)
    const officialContentIds = new Set(summary.imported.map((item) => item.contentId))
    const extraRows = rows.filter((row) => !officialContentIds.has(row.id))

    summary.unpublished = extraRows.map((row) => ({ id: row.id, title: row.title }))
    if (!dryRun && extraRows.length) {
      await db.run(`
        UPDATE contents
        SET status = 'unpublished',
            published_version_id = NULL,
            updated_by = ?,
            updated_at = ?
        WHERE module_key = 'archive'
          AND deleted_at IS NULL
          AND status = 'published'
          AND id NOT IN (${[...officialContentIds].map(() => '?').join(',')})
      `, [SYSTEM_USER, now, ...officialContentIds])
    }

    const countRow = await db.get(`
      SELECT count(*) AS count
      FROM contents
      WHERE module_key = 'archive'
        AND status = 'published'
        AND published_version_id IS NOT NULL
        AND deleted_at IS NULL
    `)
    summary.publishedArchiveContentCount = Number(countRow?.count || 0)
  })

  assert.strictEqual(summary.imported.length, 39)
  if (!dryRun) assert.strictEqual(summary.publishedArchiveContentCount, 39)
  summary.ok = true
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(JSON.stringify({
    checkedAt: Date.now(),
    ok: false,
    error: error.message,
  }, null, 2))
  process.exit(1)
})
