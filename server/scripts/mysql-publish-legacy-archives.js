const assert = require('assert')
const { getDatabaseConfig } = require('../db/config')
const { withMysqlTransaction } = require('../db/mysql-primary-ops')

const DEFAULT_REGION_ID = process.env.DEFAULT_PUBLIC_REGION_ID || 'region-suqu'
const DEFAULT_REGION_NAME = process.env.DEFAULT_PUBLIC_REGION_NAME || '苏区镇'
const SYSTEM_USER = 'system-frontend-joint-debug'

async function main() {
  const config = getDatabaseConfig(process.env)
  const summary = {
    checkedAt: Date.now(),
    mysqlTarget: `${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`,
    scanned: 0,
    published: 0,
    alreadyPublished: 0,
    skipped: [],
    ok: false,
  }

  await withMysqlTransaction(config, async (db) => {
    const rows = await db.all(`
      SELECT c.id, c.status, c.current_version_id, c.published_version_id, c.published_at,
             v.title, v.summary, v.body, v.data_json
      FROM contents c
      JOIN content_versions v ON v.id = c.current_version_id
      WHERE c.module_key = 'archive'
        AND c.id LIKE 'content-archive-%'
        AND c.deleted_at IS NULL
      ORDER BY c.id ASC
    `)

    summary.scanned = rows.length
    const now = Date.now()

    for (const row of rows) {
      const data = safeJsonValue(row.data_json) || {}
      const validation = validateArchiveData(data)
      if (validation) {
        summary.skipped.push({ id: row.id, reason: validation })
        continue
      }

      const nextData = normalizeArchiveData(data, row)
      await db.run(`
        UPDATE content_versions
        SET data_json = ?
        WHERE id = ?
      `, [JSON.stringify(nextData), row.current_version_id])

      if (row.status === 'published' && row.published_version_id === row.current_version_id) {
        summary.alreadyPublished += 1
        continue
      }

      await db.run(`
        UPDATE contents
        SET status = 'published',
            published_version_id = ?,
            published_at = ?,
            updated_by = ?,
            updated_at = ?
        WHERE id = ?
      `, [
        row.current_version_id,
        row.published_at || now,
        SYSTEM_USER,
        now,
        row.id,
      ])
      summary.published += 1
    }
  })

  assert.strictEqual(summary.skipped.length, 0, `Skipped invalid archive drafts: ${JSON.stringify(summary.skipped)}`)
  summary.ok = true
  console.log(JSON.stringify(summary, null, 2))
}

function validateArchiveData(data) {
  const longitude = Number(data.longitude)
  const latitude = Number(data.latitude)
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return 'invalid_longitude'
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return 'invalid_latitude'
  if (longitude === 0 && latitude === 0) return 'zero_coordinate'
  if (!Array.isArray(data.media)) return 'media_not_array'
  return ''
}

function normalizeArchiveData(data, row) {
  const media = data.media
    .map((item) => ({
      type: item?.type === 'video' ? 'video' : 'image',
      url: String(item?.url || '').trim(),
      caption: String(item?.caption || row.title || '').trim(),
    }))
    .filter((item) => item.url)
  const coverImage = String(data.coverImage || data.cover_image || media[0]?.url || '').trim()

  return {
    ...data,
    legacyId: String(data.legacyId || data.legacy_id || '').trim(),
    regionId: String(data.regionId || data.region_id || DEFAULT_REGION_ID).trim(),
    regionName: String(data.regionName || data.region_name || DEFAULT_REGION_NAME).trim(),
    archiveType: String(data.archiveType || data.archive_type || data.type || 'revolution').trim(),
    type: String(data.type || data.archiveType || data.archive_type || 'revolution').trim(),
    year: Number(data.year || 0),
    longitude: Number(data.longitude),
    latitude: Number(data.latitude),
    coverImage,
    cover_image: coverImage,
    media,
    publishPositions: {
      map: true,
      list: true,
      home: Boolean(data.publishPositions?.home ?? data.publish_positions?.home ?? false),
      topic: Boolean(data.publishPositions?.topic ?? data.publish_positions?.topic ?? false),
      guide: Boolean(data.publishPositions?.guide ?? data.publish_positions?.guide ?? false),
    },
  }
}

function safeJsonValue(value) {
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
