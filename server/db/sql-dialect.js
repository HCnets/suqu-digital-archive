function createSqlDialect(client = 'sqlite') {
  const normalized = String(client || 'sqlite').trim().toLowerCase() === 'mysql' ? 'mysql' : 'sqlite'

  function assertSafeJsonPath(path) {
    if (typeof path !== 'string' || !/^\$(\.[A-Za-z_$][\w$]*|\[[^'"]+\])*$/.test(path)) {
      throw new Error(`非法 JSON path: ${String(path)}`)
    }
    return path
  }

  function jsonText(columnSql, path) {
    path = assertSafeJsonPath(path)
    return normalized === 'mysql'
      ? `JSON_UNQUOTE(JSON_EXTRACT(${columnSql}, '${path}'))`
      : `json_extract(${columnSql}, '${path}')`
  }

  function jsonType(columnSql, path) {
    path = assertSafeJsonPath(path)
    return normalized === 'mysql'
      ? `JSON_TYPE(JSON_EXTRACT(${columnSql}, '${path}'))`
      : `json_type(${columnSql}, '${path}')`
  }

  function jsonNumber(columnSql, path) {
    path = assertSafeJsonPath(path)
    return normalized === 'mysql'
      ? `CAST(JSON_UNQUOTE(JSON_EXTRACT(${columnSql}, '${path}')) AS DECIMAL(20,6))`
      : `CAST(json_extract(${columnSql}, '${path}') AS REAL)`
  }

  function insertIgnoreInto(tableSql, columnsSql) {
    return normalized === 'mysql'
      ? `INSERT IGNORE INTO ${tableSql} ${columnsSql}`
      : `INSERT OR IGNORE INTO ${tableSql} ${columnsSql}`
  }

  function upsertCheckinProgressSql() {
    return normalized === 'mysql'
      ? `
        INSERT INTO checkin_progress (visitor_id, visited_pois_json, updated_at)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          visited_pois_json = VALUES(visited_pois_json),
          updated_at = VALUES(updated_at)
      `
      : `
        INSERT INTO checkin_progress (visitor_id, visited_pois_json, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(visitor_id) DO UPDATE SET
          visited_pois_json = excluded.visited_pois_json,
          updated_at = excluded.updated_at
      `
  }

  return {
    client: normalized,
    jsonText,
    jsonType,
    jsonNumber,
    insertIgnoreInto,
    upsertCheckinProgressSql,
  }
}

module.exports = {
  createSqlDialect,
}
