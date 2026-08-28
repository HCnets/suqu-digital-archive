/**
 * 从 index.js 拆出的独立辅助函数
 */
const { cleanText } = require('./utils')
const { normalizeStringArray } = require('./data-normalize')

function normalizeLongTextLines(value, maxItems, maxLength) {
  if (Array.isArray(value)) return normalizeStringArray(value, maxItems, maxLength)
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => cleanText(line, maxLength))
    .filter(Boolean)
    .slice(0, maxItems)
}

function normalizeSongData(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const year = normalizeYearText(source.year || source.years || '', '红歌年份')
  if (year.error) return { error: year.error }

  const lyrics = normalizeLongTextLines(source.lyrics || content.body, 200, 500)
  const songSource = cleanText(source.source || source.origin || content.summary || content.category || '', 300)

  if (!year.value) return { error: '红歌请填写创作或流传年份。' }
  if (!songSource) return { error: '红歌请填写来源说明。' }
  if (!lyrics.length) return { error: '红歌请填写歌词，支持一行一句。' }

  return {
    data: {
      ...source,
      title: cleanText(source.title || content.title, 300),
      source: songSource,
      origin: songSource,
      year: year.value,
      years: year.value,
      lyrics,
      audioUrl: cleanText(source.audioUrl || source.audio_url || '', 1000),
      audio_url: cleanText(source.audioUrl || source.audio_url || '', 1000),
      singer: cleanText(source.singer || '', 120),
      composer: cleanText(source.composer || '', 120),
      lyricist: cleanText(source.lyricist || '', 120),
    },
  }
}

function normalizeFilmData(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const year = normalizeYearText(source.year || source.years || '', '影视年份')
  if (year.error) return { error: year.error }

  const rawType = cleanText(source.type || content.category || '', 40)
  const filmType = ['电影', '电视剧', '纪录片'].includes(rawType)
    ? rawType
    : rawType.includes('纪录')
      ? '纪录片'
      : rawType.includes('电影')
        ? '电影'
        : '电视剧'
  const description = cleanText(source.description || content.summary || '', 4000)
  const connection = cleanText(source.connection || content.body || '', 100000)

  if (!year.value) return { error: '红色影视请填写年份。' }
  if (!rawType) return { error: '红色影视请填写类型。' }
  if (!description) return { error: '红色影视请填写摘要或简介。' }
  if (!connection) return { error: '红色影视请填写与苏区的关联说明。' }

  return {
    data: {
      ...source,
      title: cleanText(source.title || content.title, 300),
      year: year.value,
      years: year.value,
      type: filmType,
      description,
      connection,
      coverImage: cleanText(source.coverImage || source.cover_image || '', 1000),
      cover_image: cleanText(source.coverImage || source.cover_image || '', 1000),
      videoUrl: cleanText(source.videoUrl || source.video_url || '', 1000),
      video_url: cleanText(source.videoUrl || source.video_url || '', 1000),
      accent: cleanText(source.accent || '#C41E3A', 40),
    },
  }
}

function normalizeResourceHubData(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const items = normalizeResourceHubItems(source.items)
  if (items.error) return { error: items.error }

  const pageTitle = cleanText(source.pageTitle || source.page_title || '', 300)
  const title = cleanText(source.title || content.title, 300)
  const subtitle = cleanText(source.subtitle || source.time || source.date || content.summary || content.category || '', 500)
  const text = cleanText(source.text || source.description || content.body || content.summary || '', 100000)
  const normalizedItems = items.items.length > 0 ? items.items : (title && subtitle && text ? [{ title, subtitle, text }] : [])

  if (!normalizedItems.length) return { error: '资源文库内容请填写标题、副标题和正文，或至少提供一个完整条目。' }

  return {
    data: {
      ...source,
      pageTitle,
      page_title: pageTitle,
      title,
      subtitle,
      time: cleanText(source.time || source.date || '', 120),
      date: cleanText(source.date || source.time || '', 120),
      source: cleanText(source.source || content.category || '', 300),
      location: cleanText(source.location || '', 300),
      author: cleanText(source.author || source.name || '', 120),
      imageUrl: cleanText(source.imageUrl || source.image_url || source.coverImage || source.cover_image || '', 1000),
      image_url: cleanText(source.imageUrl || source.image_url || source.coverImage || source.cover_image || '', 1000),
      text,
      description: text,
      items: normalizedItems,
    },
  }
}

function normalizeQuizData(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const questions = normalizeQuizQuestions(source.questions || source.items || (source.question ? [source] : []))
  if (questions.error) return { error: questions.error }
  if (!questions.items.length) return { error: '党史题库请至少填写一道有效题目。' }

  return {
    data: {
      ...source,
      title: cleanText(source.title || content.title, 300),
      level: cleanText(source.level || content.category || '', 80),
      question: questions.items[0].q,
      q: questions.items[0].q,
      options: questions.items[0].options,
      answer: questions.items[0].answer,
      explanation: questions.items[0].explanation,
      questions: questions.items,
    },
  }
}

function normalizeQuizQuestions(value) {
  if (!Array.isArray(value)) return { error: '题目列表必须是数组。' }
  if (value.length > 200) return { error: '题目列表最多 200 道。' }

  const items = []
  for (const [index, entry] of value.entries()) {
    const label = `第 ${index + 1} 道题`
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return { error: `${label}必须是对象。` }
    }
    const q = cleanText(entry.q || entry.question || entry.title || '', 1000)
    const options = normalizeStringArray(entry.options, 8, 300)
    const answer = normalizeQuizAnswer(entry, options)
    const explanation = cleanText(entry.explanation || entry.analysis || entry.description || '', 2000)
    if (!q) return { error: `${label}请填写题干。` }
    if (options.length < 2) return { error: `${label}请至少填写 2 个选项。` }
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) {
      return { error: `${label}“${q.slice(0, 30)}”的正确答案不正确。` }
    }
    if (!explanation) return { error: `${label}请填写答案解析，便于审核和学习。` }
    items.push({ q, question: q, options, answer, explanation })
  }

  return { items }
}

function normalizeTourRouteData(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const items = normalizeTourRouteItems(source.items || source.stops || [])
  if (items.error) return { error: items.error }
  if (!items.items.length) return { error: '导览路线请至少填写一个有效站点。' }
  const name = cleanText(source.name || source.title || content.title, 300)
  const desc = cleanText(source.desc || source.description || content.summary || '', 2000)
  const color = cleanText(source.color || '#C41E3A', 40)
  const icon = cleanText(source.icon || source.iconChar || source.icon_char || '', 40)
  if (!name) return { error: '导览路线请填写路线名称。' }
  if (!desc) return { error: '导览路线请填写路线说明。' }

  return {
    data: {
      ...source,
      name,
      title: name,
      desc,
      description: desc,
      color,
      icon,
      iconChar: icon,
      icon_char: icon,
      items: items.items,
      stops: items.items,
    },
  }
}

function normalizeLongMarchData(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const stages = normalizeLongMarchStages(source.stages || source.items || [])
  if (stages.error) return { error: stages.error }
  if (!stages.items.length) return { error: '长征路线请至少填写一个历史阶段。' }

  const title = cleanText(source.title || source.name || content.title, 300)
  const description = cleanText(source.description || source.desc || content.summary || content.body || '', 4000)
  const spiritText = cleanText(source.spiritText || source.spirit_text || source.spirit || '', 4000)
  const timeRange = cleanText(source.timeRange || source.time_range || '', 200)

  if (!title) return { error: '长征路线请填写标题。' }
  if (!description) return { error: '长征路线请填写路线说明。' }

  return {
    data: {
      ...source,
      title,
      name: title,
      description,
      desc: description,
      stages: stages.items,
      items: stages.items,
      spiritText,
      spirit_text: spiritText,
      timeRange,
      time_range: timeRange,
    },
  }
}

function normalizeDirectorScriptData(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const scenes = normalizeDirectorScenes(source.scenes || source.steps || [])
  if (scenes.error) return { error: scenes.error }
  if (!scenes.items.length) return { error: '自动讲解脚本请至少填写一个讲解场景。' }

  const title = cleanText(source.title || source.name || content.title, 300)
  const description = cleanText(source.description || source.desc || content.summary || content.body || '', 2000)

  if (!title) return { error: '自动讲解脚本请填写标题。' }
  if (!description) return { error: '自动讲解脚本请填写说明。' }

  return {
    data: {
      ...source,
      title,
      name: title,
      description,
      desc: description,
      scenes: scenes.items,
      steps: scenes.items,
    },
  }
}

function normalizeDirectorScenes(value) {
  if (!Array.isArray(value)) return { error: '自动讲解场景必须是数组。' }
  if (value.length > 80) return { error: '自动讲解场景最多 80 个。' }

  const items = []
  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index]
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return { error: `第 ${index + 1} 个自动讲解场景格式不正确。` }
    }
    const narration = cleanText(entry.narration || entry.text || entry.speech || '', 8000)
    const title = cleanText(entry.title || entry.name || '', 300)
    const poiId = cleanText(entry.poiId || entry.poi_id || '', 120)
    const activeEvent = cleanText(entry.activeEvent || entry.active_event || '', 120)
    const waitBefore = normalizeDirectorWait(entry.waitBeforeMs ?? entry.waitBefore ?? entry.delayBefore, `第 ${index + 1} 个自动讲解场景开始前等待时间`)
    if (waitBefore.error) return { error: waitBefore.error }
    const waitAfter = normalizeDirectorWait(entry.waitAfterMs ?? entry.waitAfter ?? entry.delayAfter, `第 ${index + 1} 个自动讲解场景结束后等待时间`)
    if (waitAfter.error) return { error: waitAfter.error }

    if (!narration) return { error: `第 ${index + 1} 个自动讲解场景请填写讲解词。` }

    items.push({
      id: cleanText(entry.id || String(index + 1), 120),
      title,
      narration,
      text: narration,
      poiId,
      poi_id: poiId,
      activeEvent,
      active_event: activeEvent,
      openDetail: Boolean(entry.openDetail || entry.open_detail),
      open_detail: Boolean(entry.openDetail || entry.open_detail),
      waitBeforeMs: waitBefore.value,
      wait_before_ms: waitBefore.value,
      waitAfterMs: waitAfter.value,
      wait_after_ms: waitAfter.value,
    })
  }

  return { items }
}

function normalizePanoramaData(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const latitude = Number(source.lat ?? source.latitude)
  const longitude = Number(source.lng ?? source.longitude)
  const title = cleanText(source.title || content.title, 300)
  const description = cleanText(source.description || content.body || content.summary || '', 100000)
  const features = normalizeStringArray(source.features, 50, 300)

  if (!title) return { error: '全景点位请填写标题。' }
  if (!description) return { error: '全景点位请填写说明。' }
  if (!features.length) return { error: '全景点位请至少填写一个场景特色。' }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return { error: '全景点位纬度不正确。' }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return { error: '全景点位经度不正确。' }

  return {
    data: {
      ...source,
      id: cleanText(source.id || '', 120),
      title,
      description,
      bgColor: cleanText(source.bgColor || source.bg_color || '#FEFAF6', 40),
      bg_color: cleanText(source.bgColor || source.bg_color || '#FEFAF6', 40),
      accentColor: cleanText(source.accentColor || source.accent_color || '#C41E3A', 40),
      accent_color: cleanText(source.accentColor || source.accent_color || '#C41E3A', 40),
      features,
      lat: latitude,
      latitude,
      lng: longitude,
      longitude,
      imageUrl: cleanText(source.imageUrl || source.image_url || '', 1000),
      image_url: cleanText(source.imageUrl || source.image_url || '', 1000),
    },
  }
}

function normalizeCheckinData(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const totalCount = normalizePositiveInteger(source.totalCount || source.total_count || 0, '打卡总数', 1000)
  if (totalCount.error) return { error: totalCount.error }
  const title = cleanText(source.title || content.title, 300)
  const description = cleanText(source.description || content.summary || '', 2000)
  const certificateTitle = cleanText(source.certificateTitle || source.certificate_title || '', 300)
  const stampLabel = cleanText(source.stampLabel || source.stamp_label || '', 120)
  const certificateText = cleanText(source.certificateText || source.certificate_text || content.body || '', 4000)

  if (!title) return { error: '打卡护照请填写标题。' }
  if (!description) return { error: '打卡护照请填写说明。' }
  if (!totalCount.value) return { error: '打卡护照请填写大于 0 的打卡总数。' }
  if (!certificateTitle) return { error: '打卡护照请填写证书标题。' }
  if (!stampLabel) return { error: '打卡护照请填写印章标签。' }
  if (!certificateText) return { error: '打卡护照请填写证书正文。' }

  return {
    data: {
      ...source,
      title,
      certificateTitle,
      certificate_title: certificateTitle,
      description,
      totalCount: totalCount.value,
      total_count: totalCount.value,
      stampLabel,
      stamp_label: stampLabel,
      certificateText,
      certificate_text: certificateText,
    },
  }
}

function normalizeCocreationData(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const prompts = normalizeCocreationPrompts(source.prompts || source.letters || source.items || (source.author ? [source] : []))
  if (prompts.error) return { error: prompts.error }
  if (!prompts.items.length) return { error: '群众共创请至少填写一封可续写家书。' }

  return {
    data: {
      ...source,
      title: cleanText(source.title || content.title, 300),
      description: cleanText(source.description || content.summary || content.body || '', 2000),
      prompts: prompts.items,
      letters: prompts.items,
      items: prompts.items,
    },
  }
}

function normalizeTodaySuquData(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const metrics = normalizeTodaySuquMetrics(source.metrics || source.todayData || source.today_data || [])
  if (metrics.error) return { error: metrics.error }
  const comparisons = normalizeTodaySuquComparisons(source.comparisons || source.beforeAfter || source.before_after || [])
  if (comparisons.error) return { error: comparisons.error }

  const title = cleanText(source.title || source.headline || content.title, 300)
  const beforeYear = cleanText(source.beforeYear || source.before_year || '', 40)
  const afterYear = cleanText(source.afterYear || source.after_year || '', 40)
  const transitionLabel = cleanText(source.transitionLabel || source.transition_label || '', 120)
  const introBefore = cleanText(source.introBefore || source.intro_before || content.summary || '', 4000)
  const introAfter = cleanText(source.introAfter || source.intro_after || content.body || '', 100000)
  if (!title) return { error: '今日苏区请填写标题。' }
  if (!beforeYear) return { error: '今日苏区请填写起始年份。' }
  if (!afterYear) return { error: '今日苏区请填写对比年份。' }
  if (!transitionLabel) return { error: '今日苏区请填写过渡标签。' }
  if (!introBefore) return { error: '今日苏区请填写过去介绍。' }
  if (!introAfter) return { error: '今日苏区请填写今日介绍。' }
  if (!metrics.items.length) return { error: '今日苏区请至少填写一个完整数据指标。' }
  if (!comparisons.items.length) return { error: '今日苏区请至少填写一个完整今昔对比。' }

  return {
    data: {
      ...source,
      title,
      headline: title,
      beforeYear,
      before_year: beforeYear,
      afterYear,
      after_year: afterYear,
      transitionLabel,
      transition_label: transitionLabel,
      introBefore,
      intro_before: introBefore,
      introAfter,
      intro_after: introAfter,
      metrics: metrics.items,
      todayData: metrics.items,
      today_data: metrics.items,
      comparisons: comparisons.items,
      beforeAfter: comparisons.items,
      before_after: comparisons.items,
    },
  }
}

function normalizePartyOathData(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const title = cleanText(source.title || content.title, 300)
  const description = cleanText(source.description || content.summary || '', 2000)
  const oathText = cleanText(source.oathText || source.oath_text || content.body || '', 10000)
  const segments = normalizePartyOathSegments(source.segments || source.oathSegments || source.oath_segments, oathText)
  if (segments.error) return { error: segments.error }
  const completionTitle = cleanText(source.completionTitle || source.completion_title || '', 300)
  const completionText = cleanText(source.completionText || source.completion_text || '', 2000)
  const certificateTitle = cleanText(source.certificateTitle || source.certificate_title || '', 300)
  const certificateText = cleanText(source.certificateText || source.certificate_text || '', 2000)

  const normalizedText = oathText || segments.items.map(item => item.text).join('，')
  if (!title) return { error: '入党誓词请填写标题。' }
  if (!description) return { error: '入党誓词请填写说明。' }
  if (!normalizedText) return { error: '入党誓词请填写誓词全文。' }
  if (!segments.items.length) return { error: '入党誓词请至少填写或拆分出一句誓词分句。' }
  if (!completionTitle) return { error: '入党誓词请填写完成标题。' }
  if (!completionText) return { error: '入党誓词请填写完成提示。' }
  if (!certificateTitle) return { error: '入党誓词请填写证书标题。' }
  if (!certificateText) return { error: '入党誓词请填写证书说明。' }

  return {
    data: {
      ...source,
      title,
      description,
      oathText: normalizedText,
      oath_text: normalizedText,
      segments: segments.items,
      oathSegments: segments.items,
      oath_segments: segments.items,
      completionTitle,
      completion_title: completionTitle,
      completionText,
      completion_text: completionText,
      certificateTitle,
      certificate_title: certificateTitle,
      certificateText,
      certificate_text: certificateText,
    },
  }
}

function normalizeTimelineData(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const minYear = normalizeTimelineYear(source.minYear || source.min_year, '时间轴起始年份')
  if (minYear.error) return { error: minYear.error }
  const maxYear = normalizeTimelineYear(source.maxYear || source.max_year, '时间轴结束年份')
  if (maxYear.error) return { error: maxYear.error }
  if (minYear.value >= maxYear.value) return { error: '时间轴结束年份必须大于起始年份。' }

  const title = cleanText(source.title || content.title, 300)
  const description = cleanText(source.description || content.summary || '', 2000)
  const helperText = cleanText(source.helperText || source.helper_text || content.body || '', 1000)
  if (!title) return { error: '历史时间轴请填写标题。' }
  if (!description) return { error: '历史时间轴请填写说明。' }
  if (!helperText) return { error: '历史时间轴请填写底部提示语。' }

  const events = normalizeTimelineEvents(source.events || source.items || [], minYear.value, maxYear.value)
  if (events.error) return { error: events.error }
  if (!events.items.length) return { error: '历史时间轴请至少填写一个完整事件。' }

  const marks = normalizeTimelineMarks(source.marks || source.markYears || source.mark_years, events.items, minYear.value, maxYear.value)
  if (marks.error) return { error: marks.error }

  return {
    data: {
      ...source,
      title,
      description,
      minYear: minYear.value,
      min_year: minYear.value,
      maxYear: maxYear.value,
      max_year: maxYear.value,
      marks: marks.items,
      markYears: marks.items,
      mark_years: marks.items,
      events: events.items,
      items: events.items,
      helperText,
      helper_text: helperText,
    },
  }
}

function normalizeTributeCeremonyData(input, content) {
  const source = input && typeof input === 'object' ? input : {}
  const silenceSeconds = normalizePositiveInteger(source.silenceSeconds || source.silence_seconds, '默哀倒计时', 600)
  if (silenceSeconds.error) return { error: silenceSeconds.error }

  const title = cleanText(source.title || content.title, 300)
  const introText = cleanText(source.introText || source.intro_text || content.summary || '', 2000)
  const oathTitle = cleanText(source.oathTitle || source.oath_title || '', 300)
  const oathText = cleanText(source.oathText || source.oath_text || content.body || '', 10000)
  const silenceButtonText = cleanText(source.silenceButtonText || source.silence_button_text || '', 120)
  const silenceTitle = cleanText(source.silenceTitle || source.silence_title || '', 300)
  const silenceText = cleanText(source.silenceText || source.silence_text || '', 2000)
  const silenceMotto = cleanText(source.silenceMotto || source.silence_motto || '', 120)
  const doneTitle = cleanText(source.doneTitle || source.done_title || '', 300)
  const doneText = cleanText(source.doneText || source.done_text || '', 2000)
  const spiritTitle = cleanText(source.spiritTitle || source.spirit_title || '', 300)
  const spiritText = cleanText(source.spiritText || source.spirit_text || '', 4000)
  const spiritSource = cleanText(source.spiritSource || source.spirit_source || '', 500)
  const closeButtonText = cleanText(source.closeButtonText || source.close_button_text || '', 120)
  if (!title) return { error: '致敬仪式请填写标题。' }
  if (!introText) return { error: '致敬仪式请填写仪式说明。' }
  if (!oathTitle) return { error: '致敬仪式请填写誓词标题。' }
  if (!oathText) return { error: '致敬仪式请填写誓词或朗诵正文。' }
  if (!silenceButtonText) return { error: '致敬仪式请填写默哀按钮文案。' }
  if (!silenceTitle) return { error: '致敬仪式请填写默哀标题。' }
  if (!silenceText) return { error: '致敬仪式请填写默哀说明。' }
  if (!silenceMotto) return { error: '致敬仪式请填写默哀标语。' }
  if (!silenceSeconds.value) return { error: '致敬仪式请填写大于 0 的默哀倒计时。' }
  if (!doneTitle) return { error: '致敬仪式请填写完成标题。' }
  if (!doneText) return { error: '致敬仪式请填写完成说明。' }
  if (!spiritTitle) return { error: '致敬仪式请填写精神标题。' }
  if (!spiritText) return { error: '致敬仪式请填写精神文案。' }
  if (!spiritSource) return { error: '致敬仪式请填写精神来源。' }
  if (!closeButtonText) return { error: '致敬仪式请填写关闭按钮文案。' }

  return {
    data: {
      ...source,
      title,
      introText,
      intro_text: introText,
      oathTitle,
      oath_title: oathTitle,
      oathText,
      oath_text: oathText,
      silenceButtonText,
      silence_button_text: silenceButtonText,
      silenceTitle,
      silence_title: silenceTitle,
      silenceText,
      silence_text: silenceText,
      silenceMotto,
      silence_motto: silenceMotto,
      silenceSeconds: silenceSeconds.value,
      silence_seconds: silenceSeconds.value,
      doneTitle,
      done_title: doneTitle,
      doneText,
      done_text: doneText,
      spiritTitle,
      spirit_title: spiritTitle,
      spiritText,
      spirit_text: spiritText,
      spiritSource,
      spirit_source: spiritSource,
      closeButtonText,
      close_button_text: closeButtonText,
    },
  }
}

module.exports = { normalizeLongTextLines, normalizeSongData, normalizeFilmData, normalizeResourceHubData, normalizeQuizData, normalizeQuizQuestions, normalizeTourRouteData, normalizeLongMarchData, normalizeDirectorScriptData, normalizeDirectorScenes, normalizePanoramaData, normalizeCheckinData, normalizeCocreationData, normalizeTodaySuquData, normalizePartyOathData, normalizeTimelineData, normalizeTributeCeremonyData }
