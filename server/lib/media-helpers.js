/**
 * 从 index.js 拆出的独立辅助函数
 */
const fs = require('fs')
const path = require('path')

function processStoredUpload({ normalized, targetDir, datePath, storedName, originalStoragePath, processingNote }) {
  const storagePath = path.join(targetDir, storedName)
  fs.copyFileSync(originalStoragePath, storagePath)
  return {
    storedName,
    mimeType: normalized.mimeType,
    extension: normalized.extension,
    sizeBytes: normalized.buffer.length,
    width: null,
    height: null,
    durationSeconds: null,
    url: `/uploads/${datePath}/${storedName}`.replace(/\\/g, '/'),
    thumbnailUrl: '',
    storagePath,
    processingStatus: 'stored',
    processingNote,
  }
}

function runBinary(command, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = execFile(command, args, { timeout: timeoutMs, windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        error.message = `${error.message}${stderr ? `: ${stderr}` : ''}`
        reject(error)
        return
      }
      resolve(stdout)
    })
    child.stdin?.end()
  })
}

function matchesMediaSignature(buffer, mimeType) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return false
  if (mimeType === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (mimeType === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9
  if (mimeType === 'image/webp') return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'
  if (mimeType === 'image/gif') return buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a'
  if (mimeType === 'video/webm') return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3
  if (mimeType === 'video/mp4' || mimeType === 'video/quicktime') return buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp'
  if (mimeType === 'audio/mpeg' || mimeType === 'audio/mp3') return buffer.toString('ascii', 0, 3) === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
  if (mimeType === 'audio/wav' || mimeType === 'audio/x-wav') return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WAVE'
  if (mimeType === 'audio/ogg') return buffer.length >= 4 && buffer.toString('ascii', 0, 4) === 'OggS'
  if (mimeType === 'audio/mp4' || mimeType === 'audio/m4a' || mimeType === 'audio/x-m4a') return buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp'
  if (mimeType === 'audio/aac') return buffer[0] === 0xff && (buffer[1] === 0xf1 || buffer[1] === 0xf9)
  if (mimeType === 'audio/webm') return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3
  if (mimeType === 'application/pdf') return buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-'
  return false
}

function getJpegDimensions(buffer) {
  let offset = 2
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) break
    const marker = buffer[offset + 1]
    const length = buffer.readUInt16BE(offset + 2)
    if (marker >= 0xc0 && marker <= 0xc3 && offset + 8 < buffer.length) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) }
    }
    offset += 2 + length
  }
  return {}
}

function getWebpDimensions(buffer) {
  const chunk = buffer.toString('ascii', 12, 16)
  if (chunk === 'VP8X' && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    }
  }
  if (chunk === 'VP8 ' && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    }
  }
  if (chunk === 'VP8L' && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21)
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    }
  }
  return {}
}

module.exports = { processStoredUpload, runBinary, matchesMediaSignature, getJpegDimensions, getWebpDimensions }
