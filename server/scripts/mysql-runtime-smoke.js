const { getDatabaseConfig } = require('../db/config')
const { createSqlDialect } = require('../db/sql-dialect')
const { withMysqlConnection, withMysqlTransaction } = require('../db/mysql-primary-ops')

async function main() {
  const config = getDatabaseConfig(process.env)
  const dialect = createSqlDialect('mysql')

  const result = await withMysqlConnection(config, async (db) => {
    const authorizationSql = dialect.jsonText('v.data_json', '$.authorizationStatus')
    const regionIdSql = dialect.jsonText('v.data_json', '$.regionId')
    const legacyRegionIdSql = dialect.jsonText('v.data_json', '$.region_id')
    const mapPublishTypeSql = dialect.jsonType('v.data_json', '$.publishPositions.map')
    const mapPublishFlagSql = dialect.jsonText('v.data_json', '$.publishPositions.map')
    const legacyMapPublishFlagSql = dialect.jsonText('v.data_json', '$.publish_positions.map')
    const longitudeSql = dialect.jsonNumber('v.data_json', '$.longitude')
    const latitudeSql = dialect.jsonNumber('v.data_json', '$.latitude')

    const oralRow = await db.get(`
      SELECT count(*) AS count
      FROM contents c
      JOIN content_versions v ON v.id = c.current_version_id
      WHERE c.module_key = 'oral_history' AND ${authorizationSql} = 'authorized'
    `)

    const regionRow = await db.get(`
      SELECT count(*) AS count
      FROM contents c
      JOIN content_versions v ON v.id = c.current_version_id
      WHERE COALESCE(${regionIdSql}, ${legacyRegionIdSql}, ?) = ?
    `, ['region-suqu', 'region-suqu'])

    const archiveRow = await db.get(`
      SELECT count(*) AS count
      FROM contents c
      JOIN content_versions v ON v.id = c.published_version_id
      WHERE c.module_key = 'archive'
        AND c.status = 'published'
        AND c.published_version_id IS NOT NULL
        AND (
          ${mapPublishTypeSql} IS NULL
          OR ${mapPublishFlagSql} != '0'
          OR ${legacyMapPublishFlagSql} != '0'
        )
        AND ${longitudeSql} BETWEEN -180 AND 180
        AND ${latitudeSql} BETWEEN -90 AND 90
    `)

    const checkinVisitedCount = await withMysqlTransaction(config, async (tx) => {
      await tx.run(dialect.upsertCheckinProgressSql(), [
        'mysql-smoke-visitor',
        JSON.stringify(['poi-a', 'poi-b']),
        Date.now(),
      ])
      const row = await tx.get('SELECT visited_pois_json FROM checkin_progress WHERE visitor_id = ?', ['mysql-smoke-visitor'])
      return JSON.parse(row?.visited_pois_json || '[]').length
    })

    const userRegionInsertedCount = await withMysqlTransaction(config, async (tx) => {
      await tx.run(dialect.insertIgnoreInto('user_regions', '(user_id, region_id, created_at) VALUES (?, ?, ?)'), [
        'mysql-smoke-user',
        'region-suqu',
        Date.now(),
      ])
      const row = await tx.get('SELECT count(*) AS count FROM user_regions WHERE user_id = ?', ['mysql-smoke-user'])
      return Number(row?.count || 0)
    })

    return {
      checkedAt: Date.now(),
      mysqlTarget: `${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`,
      oralHistoryAuthorizedCount: Number(oralRow?.count || 0),
      regionScopedCount: Number(regionRow?.count || 0),
      publishedArchiveCount: Number(archiveRow?.count || 0),
      checkinVisitedCount,
      userRegionInsertedCount,
      ok: true,
    }
  })

  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(JSON.stringify({
    checkedAt: Date.now(),
    ok: false,
    error: error.message,
  }, null, 2))
  process.exit(1)
})
