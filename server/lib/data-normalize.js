/**
 * 从 index.js 拆出的独立辅助函数
 */
const { cleanText } = require('./utils')

function normalizeYearText(value, fieldLabel) {
  const yearText = cleanText(value || '', 40)
  if (!yearText) return { value: '' }
  const year = Number(yearText)
  if (/^\d{4}$/.test(yearText) && (year < 1800 || year > 2100)) {
    return { error: `${fieldLabel}需在 1800 到 2100 之间。` }
  }
  return { value: yearText }
}

function normalizePositiveInteger(value, fieldLabel, maxValue) {
  if (value === undefined || value === null || value === '') return { value: 0 }
  const number = Number(value)
  if (!Number.isInteger(number) || number < 0 || number > maxValue) {
    return { error: `${fieldLabel}需填写 0 到 ${maxValue} 之间的整数。` }
  }
  return { value: number }
}

function normalizeHeroData(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const name = cleanText(source.name || content.title, 300)
  const role = cleanText(source.role || content.summary || '', 300)
  const years = cleanText(source.years || source.year || '', 80)
  const category = cleanText(source.category || content.category || '', 40)
  const allowedCategories = new Set(['leader', 'soldier', 'civilian'])
  const normalizedCategory = allowedCategories.has(category) ? category : ''
  const story = cleanText(source.story || content.body || content.summary || '', 100000)
  const legacy = cleanText(source.legacy || source.quote || '', 2000)

  if (!name) return { error: '英雄谱请填写人物姓名。' }
  if (!role) return { error: '英雄谱请填写身份或职务。' }
  if (!years) return { error: '英雄谱请填写生卒年或活动年代。' }
  if (!normalizedCategory) return { error: '英雄谱请选择人物类别。' }
  if (!story) return { error: '英雄谱请填写人物事迹正文。' }
  if (!legacy) return { error: '英雄谱请填写精神传承或人物引语。' }

  return {
    data: {
      ...source,
      name,
      role,
      years,
      category: normalizedCategory,
      story,
      legacy,
      quote: legacy,
      portraitUrl: cleanText(source.portraitUrl || source.portrait_url || '', 1000),
      portrait_url: cleanText(source.portraitUrl || source.portrait_url || '', 1000),
    },
  }
}

function normalizeResourceHubItems(value) {
  if (value === undefined || value === null || value === '') return { items: [] }
  if (!Array.isArray(value)) return { error: '资源文库条目必须是数组。' }
  if (value.length > 80) return { error: '资源文库条目最多 80 项。' }

  const items = []
  for (const [index, entry] of value.entries()) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return { error: `资源文库第 ${index + 1} 个条目格式不正确。` }
    }
    const title = cleanText(entry.title || entry.name || '', 300)
    const subtitle = cleanText(entry.subtitle || entry.time || entry.date || entry.source || '', 500)
    const text = cleanText(entry.text || entry.description || entry.body || entry.content || '', 100000)
    if (!title) return { error: `资源文库第 ${index + 1} 个条目请填写标题。` }
    if (!subtitle) return { error: `资源文库第 ${index + 1} 个条目请填写副标题、时间或来源。` }
    if (!text) return { error: `资源文库第 ${index + 1} 个条目请填写正文。` }
    items.push({
      title,
      subtitle,
      text,
      year: cleanText(entry.year || '', 40),
      source: cleanText(entry.source || '', 300),
      location: cleanText(entry.location || '', 300),
      author: cleanText(entry.author || entry.name || '', 120),
      imageUrl: cleanText(entry.imageUrl || entry.image_url || entry.coverImage || entry.cover_image || '', 1000),
    })
  }

  return { items }
}

function normalizeQuizAnswer(entry, options) {
  const rawAnswer = entry.answer ?? entry.answerIndex ?? entry.answer_index
  if (Number.isInteger(rawAnswer)) return rawAnswer
  const answerText = cleanText(rawAnswer ?? entry.correctAnswer ?? entry.correct_answer ?? entry.correctOption ?? entry.correct_option ?? '', 300)
  if (/^\d+$/.test(answerText)) return Number(answerText)
  if (/^[A-H]$/i.test(answerText)) return answerText.toUpperCase().charCodeAt(0) - 65
  const optionIndex = options.findIndex((option) => option === answerText)
  return optionIndex
}

function normalizeTourRouteItems(value) {
  if (!Array.isArray(value)) return { error: '导览站点必须是数组。' }
  if (value.length > 80) return { error: '导览站点最多 80 个。' }

  const items = []
  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index]
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return { error: `第 ${index + 1} 个导览站点格式不正确。` }
    }
    const name = cleanText(entry.name || entry.title || '', 300)
    const time = cleanText(entry.time || '', 80)
    const duration = cleanText(entry.duration || '', 120)
    const description = cleanText(entry.description || entry.body || entry.text || '', 4000)
    if (!name) return { error: `第 ${index + 1} 个导览站点请填写名称。` }
    if (!time) return { error: `第 ${index + 1} 个导览站点请填写到达时间。` }
    if (!duration) return { error: `第 ${index + 1} 个导览站点请填写预计时长。` }
    if (!description) return { error: `第 ${index + 1} 个导览站点请填写说明。` }
    items.push({
      id: cleanText(entry.id || String(index + 1), 120),
      name,
      title: name,
      time,
      duration,
      description,
    })
  }

  return { items }
}

function normalizeLongMarchStages(value) {
  if (!Array.isArray(value)) return { error: '长征路线阶段必须是数组。' }
  if (value.length > 80) return { error: '长征路线阶段最多 80 个。' }

  const items = []
  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index]
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return { error: `第 ${index + 1} 个长征路线阶段格式不正确。` }
    }
    const year = cleanText(entry.year || entry.time || '', 80)
    const title = cleanText(entry.title || entry.name || '', 300)
    const location = cleanText(entry.location || entry.duration || '', 300)
    const description = cleanText(entry.description || entry.body || entry.text || '', 4000)
    const latitudeValue = entry.lat ?? entry.latitude
    const longitudeValue = entry.lng ?? entry.longitude
    const latitude = latitudeValue === undefined || latitudeValue === '' ? null : Number(latitudeValue)
    const longitude = longitudeValue === undefined || longitudeValue === '' ? null : Number(longitudeValue)

    if (!year) return { error: `第 ${index + 1} 个长征路线阶段请填写年份。` }
    if (!title) return { error: `第 ${index + 1} 个长征路线阶段请填写标题。` }
    if (!location) return { error: `第 ${index + 1} 个长征路线阶段请填写地点。` }
    if (!description) return { error: `第 ${index + 1} 个长征路线阶段请填写说明。` }
    if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
      return { error: `第 ${index + 1} 个长征路线阶段纬度不正确。` }
    }
    if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
      return { error: `第 ${index + 1} 个长征路线阶段经度不正确。` }
    }

    items.push({
      id: cleanText(entry.id || String(index + 1), 120),
      year,
      title,
      name: title,
      location,
      description,
      lat: latitude,
      latitude,
      lng: longitude,
      longitude,
    })
  }

  return { items }
}

function normalizeDirectorWait(value, fieldLabel) {
  if (value === undefined || value === null || value === '') return { value: 0 }
  const number = Number(value)
  if (!Number.isInteger(number) || number < 0 || number > 120000) {
    return { error: `${fieldLabel}需填写 0 到 120000 之间的整数毫秒。` }
  }
  return { value: number }
}

function normalizeCocreationPrompts(value) {
  if (!Array.isArray(value)) return { error: '共创素材列表必须是数组。' }
  if (value.length > 80) return { error: '共创素材最多 80 条。' }

  const items = []
  for (const [index, entry] of value.entries()) {
    const label = `共创素材第 ${index + 1} 条`
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return { error: `${label}格式不正确。` }
    const author = cleanText(entry.author || entry.name || '', 120)
    const role = cleanText(entry.role || entry.subtitle || '', 300)
    const excerpt = cleanText(entry.excerpt || entry.summary || '', 500)
    const fullText = cleanText(entry.fullText || entry.full_text || entry.text || entry.content || '', 100000)
    if (!author) return { error: `${label}请填写作者或人物名称。` }
    if (!role) return { error: `${label}请填写身份/角色说明。` }
    if (!excerpt) return { error: `${label}请填写家书节选。` }
    if (!fullText) return { error: `${label}请填写完整家书正文。` }
    items.push({
      author,
      name: author,
      role,
      excerpt,
      fullText,
      full_text: fullText,
      avatar: cleanText(entry.avatar || '', 20),
    })
  }

  return { items }
}

function normalizeTodaySuquMetrics(value) {
  if (value === undefined || value === null || value === '') return { items: [] }
  if (!Array.isArray(value)) return { error: '今日苏区数据指标必须是数组。' }
  if (value.length > 60) return { error: '今日苏区数据指标最多 60 项。' }

  const items = []
  for (const [index, entry] of value.entries()) {
    const labelText = `今日苏区数据指标第 ${index + 1} 项`
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return { error: `${labelText}格式不正确。` }
    const number = cleanText(entry.number || entry.value || '', 80)
    const label = cleanText(entry.label || entry.title || '', 200)
    const detail = cleanText(entry.detail || entry.description || entry.text || '', 1000)
    if (!number) return { error: `${labelText}请填写数值。` }
    if (!label) return { error: `${labelText}请填写名称。` }
    if (!detail) return { error: `${labelText}请填写说明。` }
    items.push({
      iconKey: cleanText(entry.iconKey || entry.icon_key || entry.icon || '', 80),
      icon_key: cleanText(entry.iconKey || entry.icon_key || entry.icon || '', 80),
      number,
      label,
      detail,
    })
  }

  return { items }
}

function normalizeTodaySuquComparisons(value) {
  if (value === undefined || value === null || value === '') return { items: [] }
  if (!Array.isArray(value)) return { error: '今日苏区今昔对比必须是数组。' }
  if (value.length > 60) return { error: '今日苏区今昔对比最多 60 项。' }

  const items = []
  for (const [index, entry] of value.entries()) {
    const labelText = `今日苏区今昔对比第 ${index + 1} 项`
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return { error: `${labelText}格式不正确。` }
    const title = cleanText(entry.title || entry.name || '', 300)
    const before = cleanText(entry.before || entry.past || '', 4000)
    const after = cleanText(entry.after || entry.now || entry.present || '', 4000)
    if (!title) return { error: `${labelText}请填写标题。` }
    if (!before) return { error: `${labelText}请填写过去说明。` }
    if (!after) return { error: `${labelText}请填写今日说明。` }
    items.push({ title, before, after })
  }

  return { items }
}

function normalizePartyOathSegments(value, oathText) {
  let rawItems = value
  if (rawItems === undefined || rawItems === null || rawItems === '') {
    rawItems = oathText
      ? String(oathText).split(/[，,。；;\n\r]+/).map(text => ({ text })).filter(item => item.text.trim())
      : []
  }
  if (!Array.isArray(rawItems)) return { error: '入党誓词分句必须是数组。' }
  if (rawItems.length > 80) return { error: '入党誓词分句最多 80 句。' }

  const items = []
  for (const [index, entry] of rawItems.entries()) {
    const text = typeof entry === 'string'
      ? cleanText(entry, 300)
      : cleanText(entry?.text || entry?.title || '', 300)
    if (!text) return { error: `入党誓词分句第 ${index + 1} 句请填写内容。` }
    items.push({ text, key: index })
  }

  return { items }
}

function normalizeTimelineYear(value, fieldLabel) {
  const year = Number(value)
  if (!Number.isInteger(year) || year < 1800 || year > 2100) {
    return { error: `${fieldLabel}需在 1800 到 2100 之间。` }
  }
  return { value: year }
}

function normalizeTimelineEvents(value, minYear, maxYear) {
  if (!Array.isArray(value)) return { error: '历史时间轴事件必须是数组。' }
  if (value.length > 200) return { error: '历史时间轴事件最多 200 个。' }

  const items = []
  for (const [index, entry] of value.entries()) {
    const label = `历史时间轴事件第 ${index + 1} 个`
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return { error: `${label}格式不正确。` }
    const year = Number(entry.year)
    const title = cleanText(entry.title || entry.name || '', 300)
    const subtitle = cleanText(entry.subtitle || entry.summary || entry.description || '', 1000)
    if (!Number.isInteger(year) || year < 1800 || year > 2100) return { error: `${label}年份需在 1800 到 2100 之间。` }
    if (year < minYear || year > maxYear) return { error: `${label}年份必须位于时间轴起止年份范围内。` }
    if (!title) return { error: `${label}请填写标题。` }
    if (!subtitle) return { error: `${label}请填写副标题或说明。` }
    items.push({ year, title, subtitle })
  }

  items.sort((a, b) => a.year - b.year)
  return { items }
}

function normalizeTimelineMarks(value, events, minYear, maxYear) {
  const rawMarks = Array.isArray(value) && value.length ? value : events.map(item => item.year)
  if (!Array.isArray(rawMarks)) return { error: '时间轴关键年份必须是数组。' }
  if (rawMarks.length > 80) return { error: '时间轴关键年份最多 80 个。' }

  const items = Array.from(new Set(rawMarks
    .map(item => Number(typeof item === 'object' ? item?.year : item))
    .filter(year => Number.isInteger(year) && year >= minYear && year <= maxYear)))
    .sort((a, b) => a - b)

  return { items }
}

function normalizeArchiveDisplayTimeline(value) {
  if (value === undefined || value === null || value === '') return { items: [] }
  if (!Array.isArray(value)) return { error: '展陈时间线必须是数组。' }
  if (value.length > 40) return { error: '展陈时间线最多 40 项。' }

  const items = []
  for (const [index, entry] of value.entries()) {
    const labelText = `展陈时间线第 ${index + 1} 项`
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return { error: `${labelText}格式不正确。` }
    const label = cleanText(entry.label || entry.title || '', 120)
    const valueText = cleanText(entry.value || entry.text || entry.description || '', 500)
    if (!label) return { error: `${labelText}请填写标签。` }
    if (!valueText) return { error: `${labelText}请填写内容。` }
    items.push({
      label,
      value: valueText,
    })
  }

  return { items }
}

function normalizeArchiveMedia(value) {
  if (value === undefined || value === null || value === '') return { items: [] }
  if (!Array.isArray(value)) return { error: '媒体列表必须是数组。' }
  if (value.length > 30) return { error: '媒体列表最多 30 项。' }

  const items = []
  for (const item of value) {
    if (typeof item === 'string') {
      const url = cleanText(item, 1000)
      if (url) items.push(url)
      continue
    }
    if (item && typeof item === 'object') {
      const url = cleanText(item.url || item.src || '', 1000)
      if (!url) continue
      items.push({
        url,
        type: cleanText(item.type || '', 40),
        caption: cleanText(item.caption || item.title || '', 300),
        altText: cleanText(item.altText || item.alt_text || '', 300),
      })
    }
  }

  return { items }
}

function normalizeStringArray(value, maxItems, maxLength) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => cleanText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems)
}

function normalizeSources(value) {
  if (!Array.isArray(value)) return { error: 'Sources must be an array.' }
  if (value.length > 30) return { error: 'Sources may contain at most 30 items.' }
  return {
    items: value.map((item) => ({
      sourceType: cleanText(item?.sourceType || item?.source_type || '', 80),
      sourceTitle: cleanText(item?.sourceTitle || item?.source_title || '', 300),
      sourceUrl: cleanText(item?.sourceUrl || item?.source_url || '', 1000),
      archiveRef: cleanText(item?.archiveRef || item?.archive_ref || '', 200),
      pageRef: cleanText(item?.pageRef || item?.page_ref || '', 80),
      collector: cleanText(item?.collector || '', 80),
      collectedAt: cleanText(item?.collectedAt || item?.collected_at || '', 40),
      trustLevel: cleanText(item?.trustLevel || item?.trust_level || '', 40),
      attachmentMediaId: cleanText(item?.attachmentMediaId || item?.attachment_media_id || '', 80),
      notes: cleanText(item?.notes || '', 2000),
    })),
  }
}

function normalizeCheckinProgress(input) {
  if (!input || typeof input !== 'object') return { error: 'Check-in payload must be an object.' }
  const visitedPois = Array.isArray(input.visitedPois) ? input.visitedPois : Array.isArray(input.visited_pois) ? input.visited_pois : []
  if (visitedPois.length > 200) return { error: 'Too many check-in pois.' }
  return {
    visitedPois: visitedPois.map((value) => cleanText(value, 80)).filter(Boolean),
  }
}

function normalizeMedia(value) {
  if (value === undefined || value === null) return { items: [] }
  if (!Array.isArray(value)) return { error: 'Archive media must be an array.' }
  if (value.length > 20) return { error: 'Archive media may contain at most 20 items.' }

  const items = []
  for (const item of value) {
    if (!item || typeof item !== 'object') return { error: 'Archive media item must be an object.' }
    const type = cleanText(item.type || 'image', 20)
    const url = cleanText(item.url, 1000)
    const caption = cleanText(item.caption || '', 1000)
    if (!['image', 'video'].includes(type)) return { error: 'Archive media type is invalid.' }
    if (!url) return { error: 'Archive media url is required.' }
    items.push({ type, url, caption })
  }
  return { items }
}

function normalizeMessage(input) {
  if (!input || typeof input !== 'object') return { error: 'Message payload must be an object.' }
  const name = cleanText(input.name || '匿名群众', 80)
  const identity = cleanText(input.identity || '群众', 40)
  const text = cleanText(input.text, 500)
  const inReplyTo = cleanText(input.inReplyTo || '', 120)

  if (!text) return { error: 'Message text is required.' }
  if (text.length < 2) return { error: 'Message text is too short.' }

  return { message: { name, identity, text, inReplyTo } }
}

function normalizeAcceptanceConclusion(value) {
  const allowed = new Set(['pending', 'passed', 'conditional', 'failed'])
  const normalized = String(value || '').trim()
  return allowed.has(normalized) ? normalized : 'pending'
}

module.exports = { normalizeYearText, normalizePositiveInteger, normalizeHeroData, normalizeResourceHubItems, normalizeQuizAnswer, normalizeTourRouteItems, normalizeLongMarchStages, normalizeDirectorWait, normalizeCocreationPrompts, normalizeTodaySuquMetrics, normalizeTodaySuquComparisons, normalizePartyOathSegments, normalizeTimelineYear, normalizeTimelineEvents, normalizeTimelineMarks, normalizeArchiveDisplayTimeline, normalizeArchiveMedia, normalizeStringArray, normalizeSources, normalizeCheckinProgress, normalizeMedia, normalizeMessage, normalizeAcceptanceConclusion }
