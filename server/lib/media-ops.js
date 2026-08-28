/**
 * 从 index.js 拆出的辅助函数
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const { processStoredUpload, runBinary } = require('./media-helpers')
const { getImageDimensions } = require('./misc')
const { cleanText } = require('./utils')
const { findMediaAsset } = require('./ai-ops')
const { rowToMediaAsset } = require('./rows')

// 运行期注入的依赖（由 index.js 调用 init() 传入）
let CONTENT_READ_STORE
let CONTENT_WRITE_STORE
let FFMPEG_BIN
let FFPROBE_BIN
function init(deps) {
  CONTENT_READ_STORE = deps.CONTENT_READ_STORE
  CONTENT_WRITE_STORE = deps.CONTENT_WRITE_STORE
  FFMPEG_BIN = deps.FFMPEG_BIN
  FFPROBE_BIN = deps.FFPROBE_BIN
}

async function processMediaUpload({ id, normalized, targetDir, datePath, storedName, originalStoragePath }) {
  if (normalized.mediaType === 'video') {
    return processVideoUpload({ id, normalized, targetDir, datePath, storedName, originalStoragePath })
  }
  if (normalized.mediaType === 'audio') {
    return processAudioUpload({ id, normalized, targetDir, datePath, storedName, originalStoragePath })
  }
  if (normalized.mediaType === 'document') {
    return processStoredUpload({
      normalized,
      targetDir,
      datePath,
      storedName,
      originalStoragePath,
      processingNote: 'Document stored after signature validation.',
    })
  }

  if (!sharp) {
    const storagePath = path.join(targetDir, storedName)
    fs.copyFileSync(originalStoragePath, storagePath)
    const dimensions = getImageDimensions(normalized.buffer, normalized.mimeType)
    return {
      storedName,
      mimeType: normalized.mimeType,
      extension: normalized.extension,
      sizeBytes: normalized.buffer.length,
      width: dimensions.width || null,
      height: dimensions.height || null,
      durationSeconds: null,
      url: `/uploads/${datePath}/${storedName}`.replace(/\\/g, '/'),
      thumbnailUrl: '',
      storagePath,
      processingStatus: 'failed',
      processingNote: 'Image processor sharp is unavailable; original image stored without thumbnail, compression, or watermark.',
    }
  }

  const shouldTransform = normalized.autoCompress || Boolean(normalized.watermarkText)
  const outputExtension = shouldTransform || normalized.mimeType === 'image/gif' ? '.webp' : normalized.extension
  const outputName = `${id}${outputExtension}`
  const storagePath = path.join(targetDir, outputName)
  const thumbnailName = `${id}-thumb.webp`
  const thumbnailPath = path.join(targetDir, thumbnailName)

  let width = null
  let height = null
  let processingNote = ''

  if (shouldTransform && normalized.mimeType !== 'image/gif') {
    let processedBuffer = await sharp(normalized.buffer)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .toBuffer()
    const metadata = await sharp(processedBuffer).metadata()
    if (normalized.watermarkText && (metadata.width || 0) >= 80 && (metadata.height || 0) >= 40) {
      processedBuffer = await sharp(processedBuffer)
        .composite([{
          input: createWatermarkSvg(normalized.watermarkText, metadata.width || 320, metadata.height || 180),
          gravity: 'southeast',
        }])
        .toBuffer()
    } else if (normalized.watermarkText) {
      processingNote = 'Watermark skipped because image is too small. '
    }
    await sharp(processedBuffer).webp({ quality: 82 }).toFile(storagePath)
    processingNote += 'Image compressed to WebP' + (normalized.watermarkText && !processingNote ? ' with watermark.' : '.')
  } else {
    fs.copyFileSync(originalStoragePath, storagePath)
    if (normalized.mimeType === 'image/gif' && shouldTransform) {
      processingNote = 'GIF stored without watermark/compression; animated processing requires a dedicated pipeline.'
    }
  }

  await sharp(storagePath)
    .resize({ width: 320, height: 240, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(thumbnailPath)

  const metadata = await sharp(storagePath).metadata()
  width = metadata.width || null
  height = metadata.height || null

  return {
    storedName: outputName,
    mimeType: outputExtension === '.webp' ? 'image/webp' : normalized.mimeType,
    extension: outputExtension,
    sizeBytes: fs.statSync(storagePath).size,
    width,
    height,
    durationSeconds: null,
    url: `/uploads/${datePath}/${outputName}`.replace(/\\/g, '/'),
    thumbnailUrl: `/uploads/${datePath}/${thumbnailName}`.replace(/\\/g, '/'),
    storagePath,
    processingStatus: 'processed',
    processingNote,
  }
}

function createWatermarkSvg(text, imageWidth, imageHeight) {
  const width = Math.max(1, Math.min(800, Number(imageWidth) || 320))
  const height = Math.max(1, Math.min(120, Math.floor((Number(imageHeight) || 180) * 0.18)))
  const fontSize = Math.max(1, Math.min(36, Math.floor(width / 24)))
  const padding = Math.max(1, Math.floor(fontSize * 0.75))
  const escaped = escapeXml(text)
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${width}" height="${height}" fill="rgba(0,0,0,0.32)"/>
      <text x="${width - padding}" y="${height - padding}" text-anchor="end"
        font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700"
        fill="rgba(255,255,255,0.88)">${escaped}</text>
    </svg>
  `)
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function normalizeMediaMetadata(input) {
  if (!input || typeof input !== 'object') return { error: 'Media metadata must be an object.' }
  return {
    category: cleanText(input.category || '', 80),
    altText: cleanText(input.altText || input.alt_text || '', 300),
    caption: cleanText(input.caption || '', 1000),
    watermarkText: cleanText(input.watermarkText || input.watermark_text || '', 120),
    autoCompress: Boolean(input.autoCompress || input.auto_compress),
  }
}

function normalizeMediaBatchPatch(input) {
  if (!input || typeof input !== 'object') return { error: 'Batch patch must be an object.' }

  const patch = {}
  if (input.category !== undefined) patch.category = cleanText(input.category, 80)
  if (input.altText !== undefined || input.alt_text !== undefined) patch.altText = cleanText(input.altText || input.alt_text || '', 300)
  if (input.caption !== undefined) patch.caption = cleanText(input.caption, 1000)
  if (input.watermarkText !== undefined || input.watermark_text !== undefined) patch.watermarkText = cleanText(input.watermarkText || input.watermark_text || '', 120)
  if (input.autoCompress !== undefined || input.auto_compress !== undefined) {
    patch.autoCompress = input.autoCompress === true || input.autoCompress === 'true' || input.autoCompress === 1 || input.autoCompress === '1'
      || input.auto_compress === true || input.auto_compress === 'true' || input.auto_compress === 1 || input.auto_compress === '1'
  }

  if (!Object.keys(patch).length) return { error: 'No batch fields provided.' }
  return { patch }
}

function applyMediaMetadataUpdate(before, patch, now) {
  const next = {
    category: patch.category !== undefined ? patch.category : before.category,
    altText: patch.altText !== undefined ? patch.altText : before.altText,
    caption: patch.caption !== undefined ? patch.caption : before.caption,
    watermarkText: patch.watermarkText !== undefined ? patch.watermarkText : before.watermarkText,
    autoCompress: patch.autoCompress !== undefined ? patch.autoCompress : before.autoCompress,
  }

  CONTENT_WRITE_STORE.updateMediaAssetFields(before.id, {
    category: next.category,
    altText: next.altText,
    caption: next.caption,
    watermarkText: next.watermarkText,
    autoCompress: next.autoCompress ? 1 : 0,
    updatedAt: now,
  })

  return findMediaAsset(before.id)
}

async function applyMediaMetadataUpdateAsync(before, patch, now) {
  const next = {
    category: patch.category !== undefined ? patch.category : before.category,
    altText: patch.altText !== undefined ? patch.altText : before.altText,
    caption: patch.caption !== undefined ? patch.caption : before.caption,
    watermarkText: patch.watermarkText !== undefined ? patch.watermarkText : before.watermarkText,
    autoCompress: patch.autoCompress !== undefined ? patch.autoCompress : before.autoCompress,
  }

  await CONTENT_WRITE_STORE.updateMediaAssetFields(before.id, {
    category: next.category,
    altText: next.altText,
    caption: next.caption,
    watermarkText: next.watermarkText,
    autoCompress: next.autoCompress ? 1 : 0,
    updatedAt: now,
  })

  return findMediaAssetAsync(before.id)
}

function decodeHeaderText(value) {
  try {
    return decodeURIComponent(String(value || ''))
  } catch {
    return String(value || '')
  }
}

function sanitizeFileName(value) {
  const name = path.basename(String(value || 'upload')).replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').trim()
  return cleanText(name || 'upload', 180)
}

async function processVideoUpload({ id, normalized, targetDir, datePath, storedName, originalStoragePath }) {
  const shouldTranscode = normalized.autoCompress || normalized.mimeType !== 'video/mp4'
  const outputExtension = shouldTranscode ? '.mp4' : normalized.extension
  const outputName = `${id}${outputExtension}`
  const storagePath = path.join(targetDir, outputName)
  const thumbnailName = `${id}-thumb.jpg`
  const thumbnailPath = path.join(targetDir, thumbnailName)
  const url = `/uploads/${datePath}/${outputName}`.replace(/\\/g, '/')
  const thumbnailUrl = `/uploads/${datePath}/${thumbnailName}`.replace(/\\/g, '/')

  let metadata = {}
  try {
    metadata = await probeVideo(originalStoragePath)
  } catch {
    metadata = {}
  }

  try {
    if (shouldTranscode) {
      await runBinary(FFMPEG_BIN, [
        '-y',
        '-i', originalStoragePath,
        '-map', '0:v:0',
        '-map', '0:a?',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '26',
        '-c:a', 'aac',
        '-movflags', '+faststart',
        storagePath,
      ], 120_000)
    } else {
      fs.copyFileSync(originalStoragePath, storagePath)
    }

    try {
      await runBinary(FFMPEG_BIN, [
        '-y',
        '-ss', '00:00:01',
        '-i', originalStoragePath,
        '-frames:v', '1',
        '-q:v', '3',
        thumbnailPath,
      ], 60_000)
    } catch {
      // Some very short or unusual videos cannot produce a thumbnail at 1s.
    }

    try {
      metadata = { ...metadata, ...(await probeVideo(storagePath)) }
    } catch {
      // Keep the original probe result if the processed file cannot be probed.
    }

    return {
      storedName: outputName,
      mimeType: shouldTranscode ? 'video/mp4' : normalized.mimeType,
      extension: outputExtension,
      sizeBytes: fs.statSync(storagePath).size,
      width: metadata.width || null,
      height: metadata.height || null,
      durationSeconds: metadata.durationSeconds || null,
      url,
      thumbnailUrl: fs.existsSync(thumbnailPath) ? thumbnailUrl : '',
      storagePath,
      processingStatus: 'processed',
      processingNote: shouldTranscode ? 'Video transcoded to H.264 MP4.' : 'Video stored with metadata and thumbnail processing.',
    }
  } catch (error) {
    const fallbackName = storedName
    const fallbackPath = path.join(targetDir, fallbackName)
    fs.copyFileSync(originalStoragePath, fallbackPath)
    return {
      storedName: fallbackName,
      mimeType: normalized.mimeType,
      extension: normalized.extension,
      sizeBytes: normalized.buffer.length,
      width: metadata.width || null,
      height: metadata.height || null,
      durationSeconds: metadata.durationSeconds || null,
      url: `/uploads/${datePath}/${fallbackName}`.replace(/\\/g, '/'),
      thumbnailUrl: '',
      storagePath: fallbackPath,
      processingStatus: 'failed',
      processingNote: `Video processor unavailable or failed: ${cleanText(error.message, 240)}`,
    }
  }
}

async function processAudioUpload({ id, normalized, targetDir, datePath, storedName, originalStoragePath }) {
  const shouldTranscode = normalized.autoCompress && normalized.mimeType !== 'audio/mpeg' && normalized.mimeType !== 'audio/mp3'
  const outputExtension = shouldTranscode ? '.mp3' : normalized.extension
  const outputName = `${id}${outputExtension}`
  const storagePath = path.join(targetDir, outputName)
  const url = `/uploads/${datePath}/${outputName}`.replace(/\\/g, '/')

  let metadata = {}
  try {
    metadata = await probeMediaDuration(originalStoragePath)
  } catch {
    metadata = {}
  }

  try {
    if (shouldTranscode) {
      await runBinary(FFMPEG_BIN, [
        '-y',
        '-i', originalStoragePath,
        '-vn',
        '-codec:a', 'libmp3lame',
        '-b:a', '96k',
        storagePath,
      ], 120_000)
    } else {
      fs.copyFileSync(originalStoragePath, storagePath)
    }

    try {
      metadata = { ...metadata, ...(await probeMediaDuration(storagePath)) }
    } catch {
      // Keep the original probe result if the processed file cannot be probed.
    }

    return {
      storedName: outputName,
      mimeType: shouldTranscode ? 'audio/mpeg' : normalized.mimeType,
      extension: outputExtension,
      sizeBytes: fs.statSync(storagePath).size,
      width: null,
      height: null,
      durationSeconds: metadata.durationSeconds || null,
      url,
      thumbnailUrl: '',
      storagePath,
      processingStatus: shouldTranscode ? 'processed' : 'stored',
      processingNote: shouldTranscode ? 'Audio transcoded to MP3.' : 'Audio stored with metadata processing.',
    }
  } catch (error) {
    const fallbackName = storedName
    const fallbackPath = path.join(targetDir, fallbackName)
    fs.copyFileSync(originalStoragePath, fallbackPath)
    return {
      storedName: fallbackName,
      mimeType: normalized.mimeType,
      extension: normalized.extension,
      sizeBytes: normalized.buffer.length,
      width: null,
      height: null,
      durationSeconds: metadata.durationSeconds || null,
      url: `/uploads/${datePath}/${fallbackName}`.replace(/\\/g, '/'),
      thumbnailUrl: '',
      storagePath: fallbackPath,
      processingStatus: 'failed',
      processingNote: `Audio processor unavailable or failed: ${cleanText(error.message, 240)}`,
    }
  }
}

async function findMediaAssetAsync(id, includePrivate = false) {
  const row = await CONTENT_READ_STORE.findMediaAssetRow(id)
  return row ? rowToMediaAsset(row, includePrivate) : null
}

async function probeVideo(filePath) {
  const stdout = await runBinary(FFPROBE_BIN, [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,duration:format=duration',
    '-of', 'json',
    filePath,
  ], 30_000)
  const payload = JSON.parse(stdout || '{}')
  const stream = Array.isArray(payload.streams) ? payload.streams[0] || {} : {}
  const duration = Number(stream.duration || payload.format?.duration || 0)
  return {
    width: Number(stream.width) || null,
    height: Number(stream.height) || null,
    durationSeconds: Number.isFinite(duration) && duration > 0 ? duration : null,
  }
}

async function probeMediaDuration(filePath) {
  const stdout = await runBinary(FFPROBE_BIN, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'json',
    filePath,
  ], 30_000)
  const payload = JSON.parse(stdout || '{}')
  const duration = Number(payload.format?.duration || 0)
  return {
    durationSeconds: Number.isFinite(duration) && duration > 0 ? duration : null,
  }
}

module.exports = { init, processMediaUpload, createWatermarkSvg, escapeXml, processVideoUpload, processAudioUpload, findMediaAssetAsync, probeVideo, probeMediaDuration }
