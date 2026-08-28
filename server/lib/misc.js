/**
 * 从 index.js 拆出的独立辅助函数
 */
const { safeJsonArray, cleanText } = require('./utils')
const { collectRegionAndDescendantIds, hasValidArchiveCoordinates } = require('./rows')
const { getJpegDimensions, getWebpDimensions } = require('./media-helpers')

function resolveDisplayScopeRegionIds(defaultRegion, activeRegions) {
  if (!defaultRegion) return activeRegions.map((region) => region.id)
  if (defaultRegion.displayMode === 'overview') return activeRegions.map((region) => region.id)
  return collectRegionAndDescendantIds(defaultRegion.id, activeRegions)
}

function inferMapView(archives, mapMode = 'single') {
  const points = archives
    .filter(hasValidArchiveCoordinates)
    .map((archive) => ({ longitude: Number(archive.longitude), latitude: Number(archive.latitude) }))

  if (points.length === 0) {
    return { longitude: 0, latitude: 0, zoom: 2, pitch: 0, bearing: 0 }
  }

  const minLng = Math.min(...points.map((point) => point.longitude))
  const maxLng = Math.max(...points.map((point) => point.longitude))
  const minLat = Math.min(...points.map((point) => point.latitude))
  const maxLat = Math.max(...points.map((point) => point.latitude))
  const spread = Math.max(maxLng - minLng, maxLat - minLat)
  const longitude = Number(((minLng + maxLng) / 2).toFixed(6))
  const latitude = Number(((minLat + maxLat) / 2).toFixed(6))
  const baseZoom = spread < 0.03 ? 15 : spread < 0.2 ? 12 : spread < 1 ? 9 : 7
  const zoom = mapMode === 'aggregate' ? Math.min(baseZoom, 8.5) : mapMode === 'mixed' ? Math.min(baseZoom, 12) : baseZoom

  return {
    longitude,
    latitude,
    zoom,
    pitch: mapMode === 'aggregate' ? 30 : mapMode === 'mixed' ? 45 : 60,
    bearing: mapMode === 'single' ? -20 : 0,
  }
}

function getImageDimensions(buffer, mimeType) {
  try {
    if (mimeType === 'image/png' && buffer.length >= 24 && buffer.toString('ascii', 1, 4) === 'PNG') {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
    }
    if (mimeType === 'image/webp' && buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      return getWebpDimensions(buffer)
    }
    if (mimeType === 'image/jpeg') return getJpegDimensions(buffer)
  } catch {
    return {}
  }
  return {}
}

function rowToCheckinProgress(row) {
  return {
    visitorId: row.visitor_id,
    visitedPois: safeJsonArray(row.visited_pois_json).map((value) => cleanText(value, 80)).filter(Boolean),
    updatedAt: row.updated_at,
  }
}

module.exports = { resolveDisplayScopeRegionIds, inferMapView, getImageDimensions, rowToCheckinProgress }
