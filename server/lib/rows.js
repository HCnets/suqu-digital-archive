/**
 * 从 index.js 拆出的独立辅助函数
 */
const { safeJsonValue, cleanText, safeJsonArray } = require('./utils')

function rowToRegion(row) {
  return {
    id: row.id,
    parentId: row.parent_id || null,
    parentName: row.parent_name || '',
    level: row.level,
    name: row.name,
    fullName: row.full_name,
    code: row.code || '',
    description: row.description || '',
    displayMode: row.display_mode || 'current',
    mapMode: row.map_mode || 'single',
    sortOrder: Number(row.sort_order || 0),
    isDefault: Boolean(row.is_default),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function collectRegionAndDescendantIds(regionId, regions) {
  const ids = new Set([String(regionId)])
  let changed = true

  while (changed) {
    changed = false
    for (const region of regions) {
      if (region.parentId && ids.has(region.parentId) && !ids.has(region.id)) {
        ids.add(region.id)
        changed = true
      }
    }
  }

  return [...ids]
}

function rowToMediaAsset(row, includePrivate = false) {
  const asset = {
    id: row.id,
    originalName: row.original_name,
    storedName: row.stored_name,
    mediaType: row.media_type,
    mimeType: row.mime_type,
    extension: row.extension,
    sizeBytes: row.size_bytes,
    width: row.width || null,
    height: row.height || null,
    durationSeconds: row.duration_seconds || null,
    category: row.category || '',
    altText: row.alt_text || '',
    caption: row.caption || '',
    originalUrl: row.original_url || '',
    url: row.url,
    thumbnailUrl: row.thumbnail_url || '',
    checksumSha256: row.checksum_sha256,
    watermarkText: row.watermark_text || '',
    autoCompress: Boolean(row.auto_compress),
    processingStatus: row.processing_status,
    processingNote: row.processing_note || '',
    uploadedBy: row.uploaded_by || '',
    uploadedByUsername: row.uploaded_by_username || '',
    deletedAt: row.deleted_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
  if (includePrivate) {
    asset.storagePath = row.storage_path || ''
    asset.originalStoragePath = row.original_storage_path || ''
  }
  return asset
}

function rowToContentVersion(row) {
  return {
    id: row.id,
    contentId: row.content_id,
    versionNumber: row.version_number,
    title: row.title,
    summary: row.summary || '',
    body: row.body || '',
    data: safeJsonValue(row.data_json) || {},
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

function resolveReviewSignalLevel(items) {
  const order = ['none', 'low', 'medium', 'high', 'critical']
  return items.reduce((highest, item) => {
    return order.indexOf(item.level) > order.indexOf(highest) ? item.level : highest
  }, 'none')
}

function sortJsonValue(value) {
  if (Array.isArray(value)) return value.map(sortJsonValue)
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = sortJsonValue(value[key])
      return result
    }, {})
  }
  return value
}

function rowToContentSource(row) {
  return {
    id: row.id,
    sourceType: row.source_type || '',
    sourceTitle: row.source_title || '',
    sourceUrl: row.source_url || '',
    archiveRef: row.archive_ref || '',
    pageRef: row.page_ref || '',
    collector: row.collector || '',
    collectedAt: row.collected_at || '',
    trustLevel: row.trust_level || '',
    attachmentMediaId: row.attachment_media_id || '',
    notes: row.notes || '',
    createdAt: row.created_at,
  }
}

function sanitizePublicOralHistoryData(data) {
  const publicTranscript = cleanText(data.publicTranscript || data.public_transcript || data.publicVersion || data.public_version || data.transcript || data.content || '', 100000)
  const aiSummaryStatus = cleanText(data.aiSummaryStatus || data.ai_summary_status || '', 40)
  const aiSummaryAllowed = aiSummaryStatus === 'manual_imported' || aiSummaryStatus === 'editor_checked'
  const publicAiSummary = aiSummaryAllowed ? cleanText(data.aiSummary || data.ai_summary || '', 4000) : ''
  return {
    regionId: data.regionId || data.region_id || '',
    region_id: data.regionId || data.region_id || '',
    regionName: data.regionName || data.region_name || '',
    region_name: data.regionName || data.region_name || '',
    narrator: cleanText(data.narrator || data.name || '', 120),
    name: cleanText(data.narrator || data.name || '', 120),
    age: Number(data.age || 0) || 0,
    identity: cleanText(data.identity || data.role || '', 200),
    role: cleanText(data.identity || data.role || '', 200),
    title: cleanText(data.title || '', 300),
    content: publicTranscript,
    transcript: publicTranscript,
    publicTranscript,
    public_transcript: publicTranscript,
    aiSummary: publicAiSummary,
    ai_summary: publicAiSummary,
    aiSummaryStatus: aiSummaryAllowed ? aiSummaryStatus : 'none',
    ai_summary_status: aiSummaryAllowed ? aiSummaryStatus : 'none',
    collectionLocation: cleanText(data.collectionLocation || data.collection_location || data.location || '', 300),
    collection_location: cleanText(data.collectionLocation || data.collection_location || data.location || '', 300),
    date: cleanText(data.date || data.recordedAt || data.recorded_at || '', 120),
    recordedAt: cleanText(data.date || data.recordedAt || data.recorded_at || '', 120),
    recorded_at: cleanText(data.date || data.recordedAt || data.recorded_at || '', 120),
    emotion: cleanText(data.emotion || '', 120),
    audioUrl: cleanText(data.audioUrl || data.audio_url || '', 1000),
    audio_url: cleanText(data.audioUrl || data.audio_url || '', 1000),
    videoUrl: cleanText(data.videoUrl || data.video_url || '', 1000),
    video_url: cleanText(data.videoUrl || data.video_url || '', 1000),
    relatedArchiveId: cleanText(data.relatedArchiveId || data.related_archive_id || data.archiveId || data.archive_id || '', 120),
    related_archive_id: cleanText(data.relatedArchiveId || data.related_archive_id || data.archiveId || data.archive_id || '', 120),
    authorizationStatus: 'authorized',
    authorization_status: 'authorized',
  }
}

function parseRegionIdQuery(value) {
  if (Array.isArray(value)) {
    return value.flatMap(parseRegionIdQuery)
  }
  return String(value || '')
    .split(',')
    .map((item) => cleanText(item, 120))
    .filter(Boolean)
}

function filterArchivesByRegionIds(archives, regionIds) {
  if (!Array.isArray(regionIds) || regionIds.length === 0) return archives
  const allowed = new Set(regionIds)
  return archives.filter((archive) => allowed.has(archive.regionId || 'region-suqu'))
}

function hasValidArchiveCoordinates(archive) {
  const longitude = Number(archive?.longitude)
  const latitude = Number(archive?.latitude)
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return false
  if (longitude === 0 && latitude === 0) return false
  return longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90
}

function inferTrustLevelFromSources(sources) {
  if (!sources.length) return ''
  if (sources.some((source) => ['high', 'official', 'verified', '权威', '高'].includes(String(source.trustLevel || '').toLowerCase()))) {
    return 'high'
  }
  return 'normal'
}

function rowToPublicMessage(row) {
  const data = safeJsonValue(row.data_json) || {}
  return {
    id: data.id || row.id,
    name: data.name || '匿名群众',
    identity: data.identity || row.category || '群众',
    text: data.text || row.body || '',
    inReplyTo: data.inReplyTo || row.in_reply_to || '',
    createdAt: Number(data.createdAt || row.created_at),
  }
}

function rowToContentModule(row) {
  return {
    key: row.module_key,
    name: row.name,
    defaultPublishPositions: {
      map: Boolean(row.default_publish_map),
      list: Boolean(row.default_publish_list),
      home: Boolean(row.default_publish_home),
      topic: Boolean(row.default_publish_topic),
      guide: Boolean(row.default_publish_guide),
    },
  }
}

function rowToRiskTagTemplate(row) {
  return {
    id: row.id,
    label: row.label,
    level: row.level,
    category: row.category || '',
    description: row.description || '',
    isActive: Boolean(row.is_active),
    sortOrder: row.sort_order || 0,
    createdBy: row.created_by || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToArchive(row) {
  const media = safeJsonArray(row.media_json)
  const firstMedia = media.find((item) => item && typeof item === 'object' && item.url)
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content || '',
    regionId: '',
    regionName: '',
    address: '',
    coverImage: firstMedia?.url || '',
    type: row.type,
    year: row.year,
    longitude: row.longitude,
    latitude: row.latitude,
    media,
    sources: [{
      sourceType: 'legacy_seed',
      sourceTitle: '历史基础资料',
      sourceUrl: '',
      archiveRef: row.id,
      pageRef: '',
      collector: '',
      collectedAt: '',
      trustLevel: '基础资料',
      notes: '该条目来自系统早期基础点位库，后续可在后台补充正式来源证据。',
      createdAt: row.created_at,
    }],
    trustLevel: '基础资料',
    auditStatus: 'legacy',
    publishedAt: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToMessage(row, includePrivate = false) {
  const message = {
    id: row.id,
    name: row.name,
    identity: row.identity,
    text: row.text,
    inReplyTo: row.in_reply_to || '',
    createdAt: row.created_at,
  }
  if (includePrivate) message.ip = row.ip
  return message
}

function mergeCheckinPois(existing, incoming) {
  const next = []
  const seen = new Set()
  for (const value of [...existing, ...incoming]) {
    const cleaned = cleanText(value, 80)
    if (!cleaned || seen.has(cleaned)) continue
    seen.add(cleaned)
    next.push(cleaned)
  }
  return next
}

function rowToAuditLog(row) {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    before: safeJsonValue(row.before_json),
    after: safeJsonValue(row.after_json),
    actor: row.actor,
    ip: row.ip,
    createdAt: row.created_at,
  }
}

function parseDateBoundary(value, mode) {
  if (value === undefined || value === null || value === '') return null
  const numeric = Number(value)
  if (Number.isFinite(numeric) && numeric > 0) return numeric
  const text = String(value)
  const date = new Date(mode === 'end' && /^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T23:59:59.999` : text)
  const time = date.getTime()
  return Number.isFinite(time) ? time : null
}

function createEmptyAcceptanceManualRecord() {
  return {
    conclusion: 'pending',
    environment: '',
    owner: '',
    governmentRepresentative: '',
    narratorRepresentative: '',
    technicalOperator: '',
    testedAt: '',
    mobileResult: '',
    publicDomainResult: '',
    realMaterialResult: '',
    blockers: '',
    followUps: '',
    notes: '',
    updatedAt: null,
    updatedBy: '',
  }
}

module.exports = { rowToRegion, collectRegionAndDescendantIds, rowToMediaAsset, rowToContentVersion, resolveReviewSignalLevel, sortJsonValue, rowToContentSource, sanitizePublicOralHistoryData, parseRegionIdQuery, filterArchivesByRegionIds, hasValidArchiveCoordinates, inferTrustLevelFromSources, rowToPublicMessage, rowToContentModule, rowToRiskTagTemplate, rowToArchive, rowToMessage, mergeCheckinPois, rowToAuditLog, parseDateBoundary, createEmptyAcceptanceManualRecord }
