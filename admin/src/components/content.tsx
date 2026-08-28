/**
 * 后台通用组件（从 App.tsx 拆分）
 */
import { useCallback, useEffect, useState } from 'react'
import type {  AdminUser, PublishPositions, ContentModule, ManagedContent, ArchiveDetailBlock, ArchivePreviewDevice, CreateIntentKey, Region, Api, DraftAutoSaveFrequency } from '../types'
import {  SOURCE_TYPE_OPTIONS, TRUST_LEVEL_OPTIONS, AUTHORIZATION_STATUS_OPTIONS, SENSITIVE_LEVEL_OPTIONS, DASHBOARD_ACTION_OPTIONS, DASHBOARD_BADGE_MODE_OPTIONS, CONTENT_STATUS_FILTER_OPTIONS, BATCH_SENSITIVE_OPTIONS, WIZARD_MODE_OPTIONS, DRAFT_AUTOSAVE_CHOICE_OPTIONS, ARCHIVE_TYPE_OPTIONS, HERO_CATEGORY_OPTIONS, FILM_TYPE_OPTIONS, ROUTE_ICON_OPTIONS, DASHBOARD_ICON_OPTIONS, TODAY_METRIC_ICON_OPTIONS, DRAFT_AUTOSAVE_OPTIONS } from '../constants'
import {  parseStringArrayJson, parseNumberArrayJson, contentStatusLabel, sensitiveLabel, formatTime } from '../utils'
import { createDefaultArchiveDetailBlocks, readStoredEnum, DRAFT_AUTOSAVE_STORAGE_KEY, useDraftAutosave, uploadMediaAsset, oralAssetCategory, oralAssetCaption, ContentModuleDefaultsPanel, archiveDetailBlockTitle, SubmissionChecklistCard, ContentDetailPanel } from './panels'
import { Input, ChoiceChipField, DraftStatusNotice, ColorPresetField, PresetSelectField } from './fields'
import { ModuleBindingSelect, RegionBindingSelect, OptionCardSelect, PublishPositionField, ArchiveBindingSelect, ArchiveMultiSelectField } from './bindings'
import { MediaPickerField } from './media'
import { StringArrayEditor, JsonRowsEditor, SensitiveSegmentsEditor, NumberArrayEditor } from './editors'
import { useConfirm } from './confirm'
import { modulePublishDefaults, applyPublishDefaultsToContentForm, contentEntryModuleKey, contentCreationPlaybook, contentGuideSteps } from './content-meta'

export function ContentsPage({
  api,
  currentUser,
  entryIntent,
  onConsumeEntryIntent,
  onBackToCreateCenter,
}: {
  api: Api
  currentUser: AdminUser
  entryIntent: CreateIntentKey | ''
  onConsumeEntryIntent: () => void
  onBackToCreateCenter: () => void
}) {
  const initialContentForm = {
    moduleKey: 'archive',
    title: '',
    summary: '',
    body: '',
    category: '',
    sensitiveLevel: 'normal',
    sourceTitle: '',
    sourceType: '',
    archiveRef: '',
    sourcePageRef: '',
    sourceCollector: '',
    sourceCollectedAt: '',
    sourceTrustLevel: 'high',
    sourceUrl: '',
    sourceNotes: '',
    sourceAttachmentMediaId: '',
    sourceAttachmentUrl: '',
    regionId: '',
    archiveType: 'revolution',
    year: '',
    longitude: '',
    latitude: '',
    address: '',
    historyPeriod: '',
    relatedPeople: '',
    relatedEvents: '',
    publishOnMap: true,
    publishInList: true,
    publishOnHome: false,
    publishInTopic: false,
    publishInGuide: false,
    detailBlocks: createDefaultArchiveDetailBlocks(),
    coverImage: '',
    mediaJson: '',
    archiveTimelineJson: '',
    dataJson: '',
    songYear: '',
    songSource: '',
    songSinger: '',
    songComposer: '',
    songLyricist: '',
    songAudioUrl: '',
    songLyrics: '',
    heroName: '',
    heroRole: '',
    heroYears: '',
    heroCategory: 'leader',
    heroLegacy: '',
    heroPortraitUrl: '',
    filmYear: '',
    filmType: '电影',
    filmConnection: '',
    filmCoverImage: '',
    filmVideoUrl: '',
    filmAccent: '#C41E3A',
    oralNarrator: '',
    oralAge: '',
    oralIdentity: '',
    oralLocation: '',
    oralInterviewer: '',
    oralDate: '',
    oralEmotion: '',
    oralAudioUrl: '',
    oralVideoUrl: '',
    oralRawTranscript: '',
    oralPublicTranscript: '',
    oralAiSummary: '',
    oralSensitiveSegments: '',
    oralRelatedArchiveId: '',
    oralAuthorizationStatus: 'authorized',
    oralAuthorizationFile: '',
    oralTranscript: '',
    resourcePageTitle: '',
    resourceSubtitle: '',
    resourceTime: '',
    resourceSource: '',
    resourceLocation: '',
    resourceAuthor: '',
    resourceImageUrl: '',
    resourceItemsJson: '',
    routeTarget: '',
    routeDuration: '',
    routeIconKey: '',
    routeColor: '#C41E3A',
    routePois: '',
    routeOpening: '',
    directorScenesJson: '',
    learningArchiveId: '',
    learningOrder: '1',
    dashboardGroupKey: 'tools',
    dashboardGroupTitle: '辅助学习工具',
    dashboardActionKey: '',
    dashboardIconKey: 'chevron',
    dashboardSectionIconKey: 'map',
    dashboardOrder: '1',
    dashboardBadgeMode: '',
    tourIcon: '',
    tourItemsJson: '',
    quizQuestionsJson: '',
    panoramaBgColor: '#FEFAF6',
    panoramaAccentColor: '#C41E3A',
    panoramaFeatures: '',
    panoramaLatitude: '',
    panoramaLongitude: '',
    panoramaImageUrl: '',
    checkinTotalCount: '16',
    checkinCertificateTitle: '',
    checkinStampLabel: '',
    cocreationPromptsJson: '',
    todayBeforeYear: '1928',
    todayAfterYear: '2026',
    todayTransitionLabel: '传承 -> 发展',
    todayIntroBefore: '',
    todayIntroAfter: '',
    todayMetricsJson: '',
    todayComparisonsJson: '',
    oathText: '',
    oathSegmentsJson: '',
    oathCompletionTitle: '',
    oathCompletionText: '',
    oathCertificateTitle: '',
    oathCertificateText: '',
    timelineMinYear: '',
    timelineMaxYear: '',
    timelineMarks: '',
    timelineEventsJson: '',
    timelineHelperText: '',
    tributeIntroText: '',
    tributeOathTitle: '',
    tributeOathText: '',
    tributeSilenceButtonText: '',
    tributeSilenceTitle: '',
    tributeSilenceText: '',
    tributeSilenceMotto: '',
    tributeSilenceSeconds: '',
    tributeDoneTitle: '',
    tributeDoneText: '',
    tributeSpiritTitle: '',
    tributeSpiritText: '',
    tributeSpiritSource: '',
    tributeCloseButtonText: '',
  }
  const { confirm, confirmDialog } = useConfirm()
  const [contents, setContents] = useState<ManagedContent[]>([])
  const [modules, setModules] = useState<ContentModule[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [archiveOptions, setArchiveOptions] = useState<ManagedContent[]>([])
  const [filters, setFilters] = useState({ q: '', moduleKey: '', status: '', regionId: '' })
  const [selected, setSelected] = useState<ManagedContent | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(initialContentForm)
  const [wizardMode, setWizardMode] = useState<'guided' | 'advanced'>('guided')
  const [draftAutoSaveFrequency, setDraftAutoSaveFrequency] = useState<DraftAutoSaveFrequency>(() => readStoredEnum(DRAFT_AUTOSAVE_STORAGE_KEY, DRAFT_AUTOSAVE_OPTIONS.map(item => item.value), '15s'))
  const [guidedStepIndex, setGuidedStepIndex] = useState(0)
  const [showAdvancedJson, setShowAdvancedJson] = useState(false)
  const [draggedDetailBlockType, setDraggedDetailBlockType] = useState<string | null>(null)
  const [archivePreviewDevice, setArchivePreviewDevice] = useState<ArchivePreviewDevice>('pc')
  const [oralUploadBusy, setOralUploadBusy] = useState('')

  const canCreate = currentUser.permissions?.includes('content.create')
  const canReview = currentUser.permissions?.includes('content.review') || currentUser.permissions?.includes('content.final_review')
  const canDelete = currentUser.permissions?.includes('content.delete')
  const canPublish = currentUser.permissions?.includes('content.publish')
  const canPurge = currentUser.permissions?.includes('trash.purge')
  const canBatch = currentUser.permissions?.includes('batch.manage')
  const canUploadMedia = currentUser.permissions?.includes('media.manage')
  const canManageSettings = currentUser.permissions?.includes('settings.manage')
  const canUseAdvancedJson = currentUser.roleId === 'super_admin'
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [batchForm, setBatchForm] = useState({ moduleKey: '', category: '', sensitiveLevel: '' })
  const [savingModuleKey, setSavingModuleKey] = useState('')
  const [creatingAction, setCreatingAction] = useState<'draft' | 'submit' | ''>('')
  const creationGuide = contentCreationPlaybook(form.moduleKey)
  const guideSteps = contentGuideSteps(form.moduleKey)
  const createSubmissionChecklist = [
    { label: '已填写标题', done: Boolean(form.title.trim()) },
    { label: '已补充来源依据', done: Boolean(form.sourceTitle.trim() && (form.archiveRef.trim() || form.sourceUrl.trim() || form.sourceAttachmentUrl.trim())) },
    { label: '已填写摘要或正文', done: Boolean(form.summary.trim() || form.body.trim()) },
    ...(form.moduleKey === 'archive'
      ? [{ label: '已补充位置说明或坐标', done: Boolean(form.address.trim() || (form.longitude.trim() && form.latitude.trim())) }]
      : []),
    ...(form.moduleKey === 'oral_history'
      ? [
        { label: '已填写讲述人', done: Boolean(form.oralNarrator.trim()) },
        { label: '已补充授权状态或文件', done: Boolean(form.oralAuthorizationStatus || form.oralAuthorizationFile.trim()) },
        { label: '已填写公开稿或正文', done: Boolean(form.oralPublicTranscript.trim() || form.oralTranscript.trim() || form.body.trim()) },
      ]
      : []),
  ]
  const canSubmitCreateForReview = createSubmissionChecklist.every(item => item.done)
  const createDraftAutosave = useDraftAutosave({
    storageKey: 'suqu-admin-content-draft-create',
    enabled: formOpen,
    value: form,
    setValue: setForm,
    frequency: draftAutoSaveFrequency,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(DRAFT_AUTOSAVE_STORAGE_KEY, draftAutoSaveFrequency)
  }, [draftAutoSaveFrequency])

  useEffect(() => {
    setGuidedStepIndex(0)
  }, [form.moduleKey, formOpen, wizardMode])

  const load = useCallback(async () => {
    const search = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim()) search.set(key, value.trim())
    })
    const [contentPayload, moduleRows, regionRows, archivePayload] = await Promise.all([
      api<{ items: ManagedContent[] }>(`/admin/contents${search.toString() ? `?${search}` : ''}`),
      api<ContentModule[]>('/admin/content-modules'),
      api<Region[]>('/admin/region-options'),
      api<{ items: ManagedContent[] }>('/admin/contents?moduleKey=archive&pageSize=100'),
    ])
    setContents(contentPayload.items)
    setModules(moduleRows)
    setRegions(regionRows)
    setArchiveOptions(archivePayload.items.filter(item => item.status !== 'deleted'))
    if (selected && !contentPayload.items.some(item => item.id === selected.id)) setSelected(null)
    setSelectedIds(prev => prev.filter(id => contentPayload.items.some(item => item.id === id)))
  }, [api, filters, selected])

  useEffect(() => {
    load().catch(err => setError(err instanceof Error ? err.message : '加载失败'))
  }, [load])

  useEffect(() => {
    if (!modules.length) return
    setForm(current => {
      if (current.moduleKey !== 'archive') return current
      if (current.title || current.summary || current.body) return current
      return applyPublishDefaultsToContentForm(current, modulePublishDefaults(modules, 'archive'))
    })
  }, [modules])

  useEffect(() => {
    if (!entryIntent) return
    if (entryIntent === 'archive' || entryIntent === 'oral_history') {
      const moduleKey = contentEntryModuleKey(entryIntent)
      setSelected(null)
      setFormOpen(true)
      setWizardMode('guided')
      setShowAdvancedJson(false)
      setForm(current => {
        const next = {
          ...initialContentForm,
          regionId: current.regionId,
          sourceType: current.sourceType,
          sourceTitle: current.sourceTitle,
          moduleKey,
        }
        return moduleKey === 'archive'
          ? applyPublishDefaultsToContentForm(next, modulePublishDefaults(modules, moduleKey))
          : next
      })
    }
    onConsumeEntryIntent()
  }, [entryIntent, modules, onConsumeEntryIntent])

  const updateDetailBlocks = (updater: (blocks: ArchiveDetailBlock[]) => ArchiveDetailBlock[]) => {
    setForm(current => ({
      ...current,
      detailBlocks: updater(current.detailBlocks).map((block, index) => ({ ...block, order: index + 1 })),
    }))
  }

  const moveDetailBlock = (type: string, direction: -1 | 1) => {
    updateDetailBlocks((blocks) => {
      const next = [...blocks]
      const index = next.findIndex(block => block.type === type)
      const targetIndex = index + direction
      if (index < 0 || targetIndex < 0 || targetIndex >= next.length) return next
      const [item] = next.splice(index, 1)
      next.splice(targetIndex, 0, item)
      return next
    })
  }

  const moveDetailBlockTo = (sourceType: string, targetType: string) => {
    if (sourceType === targetType) return
    updateDetailBlocks((blocks) => {
      const next = [...blocks]
      const sourceIndex = next.findIndex(block => block.type === sourceType)
      const targetIndex = next.findIndex(block => block.type === targetType)
      if (sourceIndex < 0 || targetIndex < 0) return next
      const [item] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, item)
      return next
    })
  }

  const updateDetailBlock = (type: string, patch: Partial<ArchiveDetailBlock>) => {
    updateDetailBlocks(blocks => blocks.map(block => block.type === type ? { ...block, ...patch } : block))
  }

  const enabledDetailBlocks = form.detailBlocks.filter(block => block.enabled)

  const changeContentModule = (moduleKey: string) => {
    setForm(current => {
      const next = { ...current, moduleKey }
      return moduleKey === 'archive'
        ? applyPublishDefaultsToContentForm(next, modulePublishDefaults(modules, moduleKey))
        : next
    })
  }

  const jumpToGuideStep = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, guideSteps.length - 1))
    setGuidedStepIndex(safeIndex)
    if (typeof document === 'undefined') return
    const section = document.getElementById(`create-step-${guideSteps[safeIndex]?.key}`)
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const updateModulePublishDefault = (moduleKey: string, key: keyof PublishPositions, value: boolean) => {
    setModules(current => current.map(item => item.key === moduleKey
      ? { ...item, defaultPublishPositions: { ...item.defaultPublishPositions, [key]: value } }
      : item))
  }

  const saveModulePublishDefaults = async (module: ContentModule) => {
    setError('')
    setSavingModuleKey(module.key)
    try {
      const updated = await api<ContentModule>(`/admin/content-modules/${encodeURIComponent(module.key)}/default-publish-positions`, {
        method: 'PUT',
        body: JSON.stringify(module.defaultPublishPositions),
      })
      setModules(current => current.map(item => item.key === updated.key ? updated : item))
      if (form.moduleKey === updated.key && updated.key === 'archive') {
        setForm(current => applyPublishDefaultsToContentForm(current, updated.defaultPublishPositions))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '默认发布位置保存失败')
    } finally {
      setSavingModuleKey('')
    }
  }

  const uploadOralAsset = async (file: File | null, target: 'audio' | 'video' | 'authorization') => {
    if (!file) return
    setError('')
    setOralUploadBusy(target)
    try {
      const asset = await uploadMediaAsset(api, file, oralAssetCategory(target), oralAssetCaption(target))
      if (target === 'audio') setForm(current => ({ ...current, oralAudioUrl: asset.url }))
      if (target === 'video') setForm(current => ({ ...current, oralVideoUrl: asset.url }))
      if (target === 'authorization') setForm(current => ({ ...current, oralAuthorizationFile: asset.url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setOralUploadBusy('')
    }
  }

  const createContent = async (submitForReview = false) => {
    setError('')
    setCreatingAction(submitForReview ? 'submit' : 'draft')
    try {
      if (submitForReview && !form.sourceTitle.trim()) {
        throw new Error('提交审核前请先补充来源标题或采集依据。')
      }
      if (submitForReview && !form.archiveRef.trim() && !form.sourceUrl.trim() && !form.sourceAttachmentUrl.trim()) {
        throw new Error('提交审核前请至少补充档案编号、来源链接或佐证附件之一。')
      }
      if (submitForReview && !canSubmitCreateForReview) {
        throw new Error('提交审核前请先完成下方提交前检查。')
      }
      const parsedData = form.dataJson.trim() ? JSON.parse(form.dataJson) : {}
      const parsedMedia = form.mediaJson.trim() ? JSON.parse(form.mediaJson) : []
      const defaultRegion = regions.find(region => region.isDefault) || regions[0]
      const baseRegionData = { regionId: form.regionId || defaultRegion?.id || '' }
      const moduleData: Record<string, unknown> = {}
      let requestBody = form.body
      let requestCategory = form.category
      const resourceHubModules = ['letters', 'slogans', 'decrees', 'martyrs', 'women', 'origin', 'history', 'relics']
      const routePois = parseStringArrayJson(form.routePois)
      const relatedPeople = parseStringArrayJson(form.relatedPeople)
      const relatedEvents = parseStringArrayJson(form.relatedEvents)
      const detailBlocks = form.detailBlocks.map((block, index) => ({
        type: block.type,
        title: block.title.trim(),
        order: index + 1,
        enabled: block.enabled,
      }))
      if (form.moduleKey === 'archive') {
        requestCategory = form.archiveType
        Object.assign(moduleData, {
          archiveType: form.archiveType,
          type: form.archiveType,
          year: Number(form.year),
          longitude: Number(form.longitude),
          latitude: Number(form.latitude),
          address: form.address,
          historyPeriod: form.historyPeriod,
          relatedPeople,
          relatedEvents,
          publishPositions: {
            map: form.publishOnMap,
            list: form.publishInList,
            home: form.publishOnHome,
            topic: form.publishInTopic,
            guide: form.publishInGuide,
          },
          detailBlocks,
          coverImage: form.coverImage,
          media: parsedMedia,
          displayTimeline: form.archiveTimelineJson.trim() ? JSON.parse(form.archiveTimelineJson) : [],
        })
      } else if (form.moduleKey === 'song') {
        Object.assign(moduleData, {
          year: form.songYear,
          source: form.songSource,
          singer: form.songSinger,
          composer: form.songComposer,
          lyricist: form.songLyricist,
          audioUrl: form.songAudioUrl,
          lyrics: parseStringArrayJson(form.songLyrics),
        })
        if (!requestBody.trim()) requestBody = parseStringArrayJson(form.songLyrics).join('\n')
      } else if (form.moduleKey === 'hero') {
        requestCategory = form.heroCategory
        Object.assign(moduleData, {
          name: form.heroName,
          role: form.heroRole,
          years: form.heroYears,
          category: form.heroCategory,
          story: form.body,
          legacy: form.heroLegacy,
          portraitUrl: form.heroPortraitUrl,
        })
      } else if (form.moduleKey === 'film') {
        requestCategory = form.filmType
        Object.assign(moduleData, {
          year: form.filmYear,
          type: form.filmType,
          description: form.summary,
          connection: form.filmConnection || form.body,
          coverImage: form.filmCoverImage,
          videoUrl: form.filmVideoUrl,
          accent: form.filmAccent,
        })
      } else if (form.moduleKey === 'oral_history') {
        requestCategory = form.oralEmotion
        requestBody = form.oralPublicTranscript || form.oralTranscript || form.body
        Object.assign(moduleData, {
          narrator: form.oralNarrator,
          age: form.oralAge ? Number(form.oralAge) : '',
          identity: form.oralIdentity,
          collectionLocation: form.oralLocation,
          interviewer: form.oralInterviewer,
          date: form.oralDate,
          emotion: form.oralEmotion,
          audioUrl: form.oralAudioUrl,
          videoUrl: form.oralVideoUrl,
          rawTranscript: form.oralRawTranscript || form.oralTranscript || form.body,
          publicTranscript: form.oralPublicTranscript || form.oralTranscript || form.body,
          aiSummary: form.oralAiSummary,
          sensitiveSegments: form.oralSensitiveSegments.split(/\r?\n/).map(item => item.trim()).filter(Boolean),
          relatedArchiveId: form.oralRelatedArchiveId,
          authorizationStatus: form.oralAuthorizationStatus,
          authorizationFile: form.oralAuthorizationFile,
          transcript: form.oralPublicTranscript || form.oralTranscript || form.body,
        })
      } else if (resourceHubModules.includes(form.moduleKey)) {
        const parsedResourceItems = form.resourceItemsJson.trim() ? JSON.parse(form.resourceItemsJson) : []
        requestCategory = form.resourceSource || form.category
        Object.assign(moduleData, {
          pageTitle: form.resourcePageTitle,
          subtitle: form.resourceSubtitle,
          time: form.resourceTime,
          source: form.resourceSource,
          location: form.resourceLocation,
          author: form.resourceAuthor,
          imageUrl: form.resourceImageUrl,
          text: form.body,
          items: parsedResourceItems,
        })
      } else if (form.moduleKey === 'party_route') {
        requestCategory = form.routeIconKey || form.category
        Object.assign(moduleData, {
          subtitle: form.summary,
          target: form.routeTarget,
          duration: form.routeDuration,
          iconKey: form.routeIconKey,
          color: form.routeColor,
          pois: routePois,
          description: form.body,
          opening: form.routeOpening,
        })
      } else if (form.moduleKey === 'learning_course') {
        requestCategory = '学习课程'
        Object.assign(moduleData, {
          title: form.title,
          subtitle: form.summary,
          archiveId: form.learningArchiveId,
          order: form.learningOrder ? Number(form.learningOrder) : 0,
        })
      } else if (form.moduleKey === 'dashboard_entry') {
        requestCategory = form.dashboardGroupTitle || form.category || '学习面板入口'
        Object.assign(moduleData, {
          label: form.title,
          description: form.summary,
          groupKey: form.dashboardGroupKey,
          groupTitle: form.dashboardGroupTitle,
          actionKey: form.dashboardActionKey,
          iconKey: form.dashboardIconKey,
          sectionIconKey: form.dashboardSectionIconKey,
          badgeMode: form.dashboardBadgeMode,
          order: form.dashboardOrder ? Number(form.dashboardOrder) : 0,
        })
      } else if (form.moduleKey === 'tour_route') {
        const parsedTourItems = form.tourItemsJson.trim() ? JSON.parse(form.tourItemsJson) : []
        Object.assign(moduleData, {
          name: form.title,
          title: form.title,
          desc: form.summary,
          description: form.summary,
          color: form.routeColor,
          icon: form.tourIcon,
          items: parsedTourItems,
        })
      } else if (form.moduleKey === 'long_march') {
        const parsedLongMarchItems = form.tourItemsJson.trim() ? JSON.parse(form.tourItemsJson) : []
        requestCategory = '长征路线沙盘'
        Object.assign(moduleData, {
          name: form.title,
          title: form.title,
          desc: form.summary,
          description: form.summary,
          spiritText: form.body,
          timeRange: form.routeDuration,
          stages: parsedLongMarchItems,
          items: parsedLongMarchItems,
        })
      } else if (form.moduleKey === 'director_script') {
        const parsedDirectorScenes = form.directorScenesJson.trim() ? JSON.parse(form.directorScenesJson) : []
        requestCategory = '自动讲解'
        Object.assign(moduleData, {
          title: form.title,
          name: form.title,
          description: form.summary,
          desc: form.summary,
          scenes: parsedDirectorScenes,
          steps: parsedDirectorScenes,
        })
      } else if (form.moduleKey === 'quiz') {
        const parsedQuestions = form.quizQuestionsJson.trim() ? JSON.parse(form.quizQuestionsJson) : []
        requestCategory = form.category || '党史题库'
        Object.assign(moduleData, {
          level: form.category,
          questions: parsedQuestions,
        })
      } else if (form.moduleKey === 'panorama') {
        Object.assign(moduleData, {
          description: form.body,
          bgColor: form.panoramaBgColor,
          accentColor: form.panoramaAccentColor,
          features: parseStringArrayJson(form.panoramaFeatures),
          lat: form.panoramaLatitude ? Number(form.panoramaLatitude) : '',
          lng: form.panoramaLongitude ? Number(form.panoramaLongitude) : '',
          imageUrl: form.panoramaImageUrl,
        })
      } else if (form.moduleKey === 'checkin') {
        Object.assign(moduleData, {
          certificateTitle: form.checkinCertificateTitle,
          description: form.summary,
          totalCount: form.checkinTotalCount ? Number(form.checkinTotalCount) : 16,
          stampLabel: form.checkinStampLabel,
          certificateText: form.body,
        })
      } else if (form.moduleKey === 'cocreation') {
        const parsedPrompts = form.cocreationPromptsJson.trim() ? JSON.parse(form.cocreationPromptsJson) : []
        Object.assign(moduleData, {
          title: form.title,
          description: form.summary,
          prompts: parsedPrompts,
        })
      } else if (form.moduleKey === 'today_suqu') {
        const parsedMetrics = form.todayMetricsJson.trim() ? JSON.parse(form.todayMetricsJson) : []
        const parsedComparisons = form.todayComparisonsJson.trim() ? JSON.parse(form.todayComparisonsJson) : []
        if (!requestBody.trim()) requestBody = form.todayIntroAfter
        Object.assign(moduleData, {
          headline: form.title,
          beforeYear: form.todayBeforeYear,
          afterYear: form.todayAfterYear,
          transitionLabel: form.todayTransitionLabel,
          introBefore: form.todayIntroBefore || form.summary,
          introAfter: form.todayIntroAfter || requestBody,
          metrics: parsedMetrics,
          comparisons: parsedComparisons,
        })
      } else if (form.moduleKey === 'party_oath') {
        const parsedSegments = form.oathSegmentsJson.trim() ? JSON.parse(form.oathSegmentsJson) : []
        if (!requestBody.trim()) requestBody = form.oathText
        Object.assign(moduleData, {
          title: form.title,
          description: form.summary,
          oathText: form.oathText || requestBody,
          segments: parsedSegments,
          completionTitle: form.oathCompletionTitle,
          completionText: form.oathCompletionText || form.summary,
          certificateTitle: form.oathCertificateTitle,
          certificateText: form.oathCertificateText,
        })
      } else if (form.moduleKey === 'timeline') {
        const parsedEvents = form.timelineEventsJson.trim() ? JSON.parse(form.timelineEventsJson) : []
        const marks = parseNumberArrayJson(form.timelineMarks)
        if (!requestBody.trim()) requestBody = form.timelineHelperText
        Object.assign(moduleData, {
          title: form.title,
          description: form.summary,
          minYear: form.timelineMinYear ? Number(form.timelineMinYear) : '',
          maxYear: form.timelineMaxYear ? Number(form.timelineMaxYear) : '',
          marks,
          events: parsedEvents,
          helperText: form.timelineHelperText || requestBody,
        })
      } else if (form.moduleKey === 'tribute_ceremony') {
        if (!requestBody.trim()) requestBody = form.tributeOathText
        Object.assign(moduleData, {
          title: form.title,
          introText: form.tributeIntroText || form.summary,
          oathTitle: form.tributeOathTitle,
          oathText: form.tributeOathText || requestBody,
          silenceButtonText: form.tributeSilenceButtonText,
          silenceTitle: form.tributeSilenceTitle,
          silenceText: form.tributeSilenceText,
          silenceMotto: form.tributeSilenceMotto,
          silenceSeconds: form.tributeSilenceSeconds ? Number(form.tributeSilenceSeconds) : '',
          doneTitle: form.tributeDoneTitle,
          doneText: form.tributeDoneText,
          spiritTitle: form.tributeSpiritTitle,
          spiritText: form.tributeSpiritText,
          spiritSource: form.tributeSpiritSource,
          closeButtonText: form.tributeCloseButtonText,
        })
      }
      const created = await api<ManagedContent>('/admin/contents', {
        method: 'POST',
        body: JSON.stringify({
          moduleKey: form.moduleKey,
          title: form.title,
          summary: form.summary,
          body: requestBody,
          category: requestCategory,
          sensitiveLevel: form.sensitiveLevel,
          data: { ...parsedData, ...baseRegionData, ...moduleData },
          sources: form.sourceTitle ? [{
            sourceType: form.sourceType,
            sourceTitle: form.sourceTitle,
            archiveRef: form.archiveRef,
            pageRef: form.sourcePageRef,
            collector: form.sourceCollector,
            collectedAt: form.sourceCollectedAt,
            trustLevel: form.sourceTrustLevel,
            sourceUrl: form.sourceUrl || form.sourceAttachmentUrl,
            notes: [form.sourceNotes.trim(), form.sourceAttachmentUrl.trim() ? `佐证附件：${form.sourceAttachmentUrl.trim()}` : ''].filter(Boolean).join('\n'),
            attachmentMediaId: form.sourceAttachmentMediaId,
          }] : [],
        }),
      })
      if (submitForReview) {
        await api<ManagedContent>(`/admin/contents/${created.id}/submit`, { method: 'POST' })
      }
      createDraftAutosave.clearDraft()
      setForm(applyPublishDefaultsToContentForm(initialContentForm, modulePublishDefaults(modules, 'archive')))
      setFormOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setCreatingAction('')
    }
  }

  const submitContent = async (id: string) => {
    setError('')
    try {
      await api<ManagedContent>(`/admin/contents/${id}/submit`, { method: 'POST' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败')
    }
  }

  const reviewContent = async (id: string, decision: 'approve' | 'reject') => {
    setError('')
    try {
      await api<ManagedContent>(`/admin/contents/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '审核失败')
    }
  }

  const showDetail = async (id: string) => {
    setError('')
    setDetailLoading(true)
    try {
      const detail = await api<ManagedContent>(`/admin/contents/${id}`)
      setSelected(detail)
    } catch (err) {
      setError(err instanceof Error ? err.message : '详情加载失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const trashContent = async (id: string) => {
    if (!await confirm('确认将该内容移入回收站吗？')) return
    setError('')
    try {
      await api<ManagedContent>(`/admin/contents/${id}/trash`, { method: 'POST' })
      setSelected(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }

  const restoreContent = async (id: string) => {
    setError('')
    try {
      const restored = await api<ManagedContent>(`/admin/contents/${id}/restore`, { method: 'POST' })
      setSelected(restored)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '恢复失败')
    }
  }

  const purgeContent = async (id: string) => {
    if (!await confirm('确认永久删除该内容吗？此操作不可恢复。')) return
    setError('')
    try {
      await api<void>(`/admin/contents/${id}`, { method: 'DELETE' })
      setSelected(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '永久删除失败')
    }
  }

  const unpublishContent = async (id: string) => {
    setError('')
    try {
      const updated = await api<ManagedContent>(`/admin/contents/${id}/unpublish`, { method: 'POST' })
      setSelected(updated)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '下架失败')
    }
  }

  const toggleContentSelection = (id: string, checked: boolean) => {
    setSelectedIds(prev => (checked ? Array.from(new Set([...prev, id])) : prev.filter(item => item !== id)))
  }

  const toggleAllContentSelection = (checked: boolean) => {
    setSelectedIds(checked ? contents.map(item => item.id) : [])
  }

  const applyContentBatch = async () => {
    setError('')
    if (!selectedIds.length) {
      setError('请至少选择一条内容。')
      return
    }
    const patch: Record<string, unknown> = {}
    if (batchForm.moduleKey) patch.moduleKey = batchForm.moduleKey
    if (batchForm.category) patch.category = batchForm.category
    if (batchForm.sensitiveLevel) patch.sensitiveLevel = batchForm.sensitiveLevel
    if (!Object.keys(patch).length) {
      setError('请至少填写一个要批量更新的字段。')
      return
    }
    try {
      await api<{ items: ManagedContent[]; total: number }>('/admin/contents/actions/batch', {
        method: 'PUT',
        body: JSON.stringify({ ids: selectedIds, patch }),
      })
      setSelectedIds([])
      setBatchForm({ moduleKey: '', category: '', sensitiveLevel: '' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量更新失败')
    }
  }

  return (
    <section className="panel">
      {confirmDialog}
      <div className="panel-head">
        <div>
          <h2>统一内容</h2>
          <p>{contents.length} 条内容</p>
        </div>
        <div className="panel-actions">
          {canCreate && <button className="secondary" type="button" onClick={() => setFormOpen(!formOpen)}>{formOpen ? '收起录入表单' : '直接新建内容'}</button>}
          {canCreate && <button type="button" onClick={() => {
            setFormOpen(false)
            setSelected(null)
            onBackToCreateCenter()
          }}>返回按任务创建</button>}
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {canManageSettings && (
        <ContentModuleDefaultsPanel
          modules={modules}
          savingModuleKey={savingModuleKey}
          onChange={updateModulePublishDefault}
          onSave={saveModulePublishDefaults}
        />
      )}
      <form className="inline-form content-filter" onSubmit={event => { event.preventDefault(); void load() }}>
        <Input label="关键词" value={filters.q} onChange={q => setFilters({ ...filters, q })} />
        <ModuleBindingSelect
          label="内容类型"
          value={filters.moduleKey}
          modules={modules}
          onChange={moduleKey => setFilters({ ...filters, moduleKey })}
          placeholder="全部内容类型"
        />
        <ChoiceChipField
          label="状态"
          value={filters.status}
          options={CONTENT_STATUS_FILTER_OPTIONS}
          onChange={status => setFilters({ ...filters, status })}
        />
        <RegionBindingSelect
          label="地区"
          value={filters.regionId}
          regions={regions}
          onChange={regionId => setFilters({ ...filters, regionId })}
          placeholder="全部授权地区"
        />
        <button>筛选</button>
        <button type="button" className="secondary" onClick={() => setFilters({ q: '', moduleKey: '', status: '', regionId: '' })}>清空</button>
      </form>
      {canBatch && (
        <form className="inline-form batch-form" onSubmit={event => { event.preventDefault(); void applyContentBatch() }}>
          <label className="check-row">
            <input type="checkbox" checked={contents.length > 0 && selectedIds.length === contents.length} onChange={event => toggleAllContentSelection(event.target.checked)} />
            <span>已选择 {selectedIds.length} 项</span>
          </label>
          <ModuleBindingSelect
            label="内容类型"
            value={batchForm.moduleKey}
            modules={modules}
            onChange={moduleKey => setBatchForm({ ...batchForm, moduleKey })}
            placeholder="保持不变"
          />
          <Input label="分类" value={batchForm.category} onChange={category => setBatchForm({ ...batchForm, category })} />
          <ChoiceChipField
            label="敏感等级"
            value={batchForm.sensitiveLevel}
            options={BATCH_SENSITIVE_OPTIONS}
            onChange={sensitiveLevel => setBatchForm({ ...batchForm, sensitiveLevel })}
          />
          <button type="submit" disabled={!selectedIds.length}>应用</button>
          <button type="button" className="secondary" onClick={() => { setSelectedIds([]); setBatchForm({ moduleKey: "", category: "", sensitiveLevel: "" }) }}>清空选择</button>
        </form>
      )}
      {formOpen && (
        <form className="inline-form content-form" onSubmit={event => { event.preventDefault(); void createContent(false) }}>
          <section className="wide-field create-guide-panel">
            <div className="create-guide-head">
              <div>
                <h3>{creationGuide.title}</h3>
                <p>{creationGuide.summary}</p>
              </div>
              <div className="create-guide-actions">
                <ChoiceChipField
                  label="录入方式"
                  value={wizardMode}
                  options={WIZARD_MODE_OPTIONS}
                  onChange={nextMode => setWizardMode(nextMode as 'guided' | 'advanced')}
                />
                <ChoiceChipField
                  label="自动保存"
                  value={draftAutoSaveFrequency}
                  options={DRAFT_AUTOSAVE_CHOICE_OPTIONS}
                  onChange={nextFrequency => setDraftAutoSaveFrequency(nextFrequency as DraftAutoSaveFrequency)}
                />
                {canUseAdvancedJson && (
                  <button type="button" className="secondary" onClick={() => setShowAdvancedJson(current => !current)}>
                    {showAdvancedJson ? '收起补充设置' : '显示补充设置'}
                  </button>
                )}
              </div>
            </div>
            <DraftStatusNotice text={createDraftAutosave.statusLabel} />
            <div className="create-guide-grid">
              <div className="create-guide-card">
                <strong>开始前准备</strong>
                <ul>
                  {creationGuide.materials.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="create-guide-card">
                <strong>建议步骤</strong>
                <ol>
                  {creationGuide.steps.map((item) => <li key={item}>{item}</li>)}
                </ol>
              </div>
            </div>
            {wizardMode === 'guided' && (
              <div className="guide-step-strip" role="tablist" aria-label="录入步骤导航">
                {guideSteps.map((step, index) => (
                  <button
                    key={step.key}
                    type="button"
                    className={index === guidedStepIndex ? 'active' : 'secondary'}
                    onClick={() => jumpToGuideStep(index)}
                  >
                    {index + 1}. {step.title}
                  </button>
                ))}
              </div>
            )}
            {wizardMode === 'guided' && <p className="form-hint">{guideSteps[guidedStepIndex]?.hint}</p>}
            {wizardMode === 'guided' && (
              <p className="form-hint">先把当前卡片里的必填信息补齐，再继续下面的详细字段。补充信息默认只给超级管理员查看。</p>
            )}
          </section>
          <div id="create-step-base" className="wide-field guided-step-anchor" />
          <ModuleBindingSelect
            label="内容类型"
            value={form.moduleKey}
            modules={modules}
            onChange={changeContentModule}
          />
          <Input label="标题" value={form.title} onChange={title => setForm({ ...form, title })} />
          <Input label="摘要" value={form.summary} onChange={summary => setForm({ ...form, summary })} />
          <OptionCardSelect
            label="敏感等级"
            value={form.sensitiveLevel}
            options={SENSITIVE_LEVEL_OPTIONS}
            onChange={sensitiveLevel => setForm({ ...form, sensitiveLevel })}
          />
          <RegionBindingSelect
            label="所属地区"
            value={form.regionId}
            regions={regions}
            onChange={regionId => setForm({ ...form, regionId })}
            placeholder="使用默认地区"
          />
          <div id="create-step-module" className="wide-field guided-step-anchor" />
          {form.moduleKey === 'archive' ? (
            <div className="archive-fields wide-field">
              <OptionCardSelect
                label="档案类型"
                value={form.archiveType}
                options={ARCHIVE_TYPE_OPTIONS}
                onChange={archiveType => setForm({ ...form, archiveType })}
              />
              <Input label="年份" type="number" value={form.year} onChange={year => setForm({ ...form, year })} />
              <Input label="经度" type="number" value={form.longitude} onChange={longitude => setForm({ ...form, longitude })} />
              <Input label="纬度" type="number" value={form.latitude} onChange={latitude => setForm({ ...form, latitude })} />
              <Input label="地址/位置说明" value={form.address} onChange={address => setForm({ ...form, address })} />
              <Input label="历史时期" value={form.historyPeriod} onChange={historyPeriod => setForm({ ...form, historyPeriod })} />
              <MediaPickerField
                api={api}
                label="封面图片"
                value={form.coverImage}
                onChange={coverImage => setForm({ ...form, coverImage })}
                mediaTypes={['image']}
                canUseLibrary={Boolean(canUploadMedia)}
                pickerTitle="选择档案封面图片"
              />
              <StringArrayEditor
                title="相关人物"
                hint="维护与该点位直接相关的人物名单，按展示顺序排列。"
                value={form.relatedPeople}
                onChange={relatedPeople => setForm({ ...form, relatedPeople })}
                placeholder="例如：彭湃"
                itemLabel="人物名称"
              />
              <StringArrayEditor
                title="相关事件"
                hint="维护与该点位直接相关的关键事件，按展示顺序排列。"
                value={form.relatedEvents}
                onChange={relatedEvents => setForm({ ...form, relatedEvents })}
                placeholder="例如：农民运动讲习会旧址启用"
                itemLabel="事件名称"
              />
              <PublishPositionField
                values={{
                  map: form.publishOnMap,
                  list: form.publishInList,
                  home: form.publishOnHome,
                  topic: form.publishInTopic,
                  guide: form.publishInGuide,
                }}
                onChange={patch => setForm({
                  ...form,
                  publishOnMap: patch.map ?? form.publishOnMap,
                  publishInList: patch.list ?? form.publishInList,
                  publishOnHome: patch.home ?? form.publishOnHome,
                  publishInTopic: patch.topic ?? form.publishInTopic,
                  publishInGuide: patch.guide ?? form.publishInGuide,
                })}
              />
              <div className="wide-field detail-block-editor">
                <div className="detail-block-head">
                  <div>
                    <strong>详情页展示安排</strong>
                    <small>可拖动或使用上下按钮调整顺序；关闭的板块不会在前台详情页展示。</small>
                  </div>
                  <button type="button" className="secondary" onClick={() => setForm({ ...form, detailBlocks: createDefaultArchiveDetailBlocks() })}>恢复默认</button>
                </div>
                <div className="detail-block-layout">
                  <div className="detail-block-list" aria-label="详情板块拖拽排序列表">
                    {form.detailBlocks.map((block, index) => (
                      <article
                        key={block.type}
                        className={`detail-block-row${block.enabled ? '' : ' disabled'}${draggedDetailBlockType === block.type ? ' dragging' : ''}`}
                        draggable
                        onDragStart={() => setDraggedDetailBlockType(block.type)}
                        onDragOver={event => event.preventDefault()}
                        onDrop={() => {
                          if (draggedDetailBlockType) moveDetailBlockTo(draggedDetailBlockType, block.type)
                          setDraggedDetailBlockType(null)
                        }}
                        onDragEnd={() => setDraggedDetailBlockType(null)}
                      >
                        <div className="drag-handle" aria-hidden="true">⋮⋮</div>
                        <label className="check-row">
                          <input type="checkbox" checked={block.enabled} onChange={event => updateDetailBlock(block.type, { enabled: event.target.checked })} />
                          <span>{index + 1}</span>
                        </label>
                        <div className="detail-block-main">
                          <span>{archiveDetailBlockTitle(block.type)}</span>
                          <input
                            value={block.title}
                            aria-label={`${archiveDetailBlockTitle(block.type)}板块标题`}
                            onChange={event => updateDetailBlock(block.type, { title: event.target.value })}
                          />
                        </div>
                        <div className="detail-block-actions">
                          <button type="button" className="secondary" disabled={index === 0} onClick={() => moveDetailBlock(block.type, -1)}>上移</button>
                          <button type="button" className="secondary" disabled={index === form.detailBlocks.length - 1} onClick={() => moveDetailBlock(block.type, 1)}>下移</button>
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="detail-preview-panel">
                    <div className="detail-preview-head">
                      <strong>发布预览</strong>
                      <div className="device-switch" role="group" aria-label="详情页预览设备">
                        <button type="button" className={archivePreviewDevice === 'pc' ? 'active' : ''} onClick={() => setArchivePreviewDevice('pc')}>PC</button>
                        <button type="button" className={archivePreviewDevice === 'mobile' ? 'active' : ''} onClick={() => setArchivePreviewDevice('mobile')}>移动</button>
                        <button type="button" className={archivePreviewDevice === 'screen' ? 'active' : ''} onClick={() => setArchivePreviewDevice('screen')}>大屏</button>
                      </div>
                    </div>
                    <div className={`archive-detail-preview ${archivePreviewDevice}`}>
                      <div className="preview-title">{form.title || '档案标题待填写'}</div>
                      <div className="preview-meta">
                        <span>{form.year || '年份'}</span>
                        <span>{form.historyPeriod || '历史时期'}</span>
                        <span>{form.address || '位置说明'}</span>
                      </div>
                      <div className="preview-blocks">
                        {enabledDetailBlocks.length ? enabledDetailBlocks.map((block, index) => (
                          <section key={block.type}>
                            <span>{index + 1}</span>
                            <strong>{block.title || archiveDetailBlockTitle(block.type)}</strong>
                            <small>详情页板块</small>
                          </section>
                        )) : (
                          <p>请至少启用一个详情板块。</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <StringArrayEditor
                title="补充媒体列表"
                hint="用于维护档案详情页里补充展示的图片、视频或音频素材，支持直接从素材库选择。"
                value={form.mediaJson}
                onChange={mediaJson => setForm({ ...form, mediaJson })}
                api={api}
                canUseLibrary={Boolean(canUploadMedia)}
                mediaTypes={['image', 'video', 'audio']}
                pickerTitle="选择补充媒体"
                placeholder="/uploads/example.webp"
              />
              <JsonRowsEditor
                title="展陈时间线"
                hint="用于档案详情页展示关键时间节点。"
                value={form.archiveTimelineJson}
                onChange={archiveTimelineJson => setForm({ ...form, archiveTimelineJson })}
                newItem={{ label: '', value: '' }}
                fields={[
                  { key: 'label', label: '标签', placeholder: '历史年份' },
                  { key: 'value', label: '内容', type: 'textarea', placeholder: '1927年，发生了什么' },
                ]}
              />
            </div>
          ) : form.moduleKey === 'song' ? (
            <div className="archive-fields wide-field">
              <Input label="创作 / 流传年份" value={form.songYear} onChange={songYear => setForm({ ...form, songYear })} />
              <Input label="来源说明" value={form.songSource} onChange={songSource => setForm({ ...form, songSource })} />
              <Input label="演唱者" value={form.songSinger} onChange={songSinger => setForm({ ...form, songSinger })} />
              <Input label="作曲" value={form.songComposer} onChange={songComposer => setForm({ ...form, songComposer })} />
              <Input label="作词" value={form.songLyricist} onChange={songLyricist => setForm({ ...form, songLyricist })} />
              <MediaPickerField
                api={api}
                label="音频素材"
                value={form.songAudioUrl}
                onChange={songAudioUrl => setForm({ ...form, songAudioUrl })}
                mediaTypes={['audio']}
                canUseLibrary={Boolean(canUploadMedia)}
                pickerTitle="选择红歌音频"
              />
              <StringArrayEditor
                title="歌词"
                hint="按一句一条维护歌词，便于审核时逐句查看，也方便后续前台高亮展示。"
                value={form.songLyrics}
                onChange={songLyrics => setForm({ ...form, songLyrics })}
                itemLabel="歌词句子"
                placeholder="请填写经审核的歌词句子"
              />
            </div>
          ) : form.moduleKey === 'hero' ? (
            <div className="archive-fields wide-field">
              <Input label="人物姓名" value={form.heroName} onChange={heroName => setForm({ ...form, heroName })} />
              <Input label="身份/职务" value={form.heroRole} onChange={heroRole => setForm({ ...form, heroRole })} />
              <Input label="生卒/活动年代" value={form.heroYears} onChange={heroYears => setForm({ ...form, heroYears })} />
              <OptionCardSelect
                label="人物类别"
                value={form.heroCategory}
                options={HERO_CATEGORY_OPTIONS}
                onChange={heroCategory => setForm({ ...form, heroCategory })}
              />
              <MediaPickerField
                api={api}
                label="头像/照片"
                value={form.heroPortraitUrl}
                onChange={heroPortraitUrl => setForm({ ...form, heroPortraitUrl })}
                mediaTypes={['image']}
                canUseLibrary={Boolean(canUploadMedia)}
                pickerTitle="选择人物图片"
              />
              <label className="wide-field">
                <span>精神传承/引语</span>
                <textarea value={form.heroLegacy} onChange={event => setForm({ ...form, heroLegacy: event.target.value })} />
              </label>
            </div>
          ) : form.moduleKey === 'film' ? (
            <div className="archive-fields wide-field">
              <Input label="年份" value={form.filmYear} onChange={filmYear => setForm({ ...form, filmYear })} />
              <OptionCardSelect
                label="影视类型"
                value={form.filmType}
                options={FILM_TYPE_OPTIONS}
                onChange={filmType => setForm({ ...form, filmType })}
              />
              <MediaPickerField
                api={api}
                label="封面图片"
                value={form.filmCoverImage}
                onChange={filmCoverImage => setForm({ ...form, filmCoverImage })}
                mediaTypes={['image']}
                canUseLibrary={Boolean(canUploadMedia)}
                pickerTitle="选择影视封面"
              />
              <MediaPickerField
                api={api}
                label="视频素材"
                value={form.filmVideoUrl}
                onChange={filmVideoUrl => setForm({ ...form, filmVideoUrl })}
                mediaTypes={['video']}
                canUseLibrary={Boolean(canUploadMedia)}
                pickerTitle="选择影视视频"
              />
              <ColorPresetField label="主题色" value={form.filmAccent} onChange={filmAccent => setForm({ ...form, filmAccent })} />
              <label className="wide-field">
                <span>与本地红色资源关联</span>
                <textarea value={form.filmConnection} onChange={event => setForm({ ...form, filmConnection: event.target.value })} />
              </label>
            </div>
          ) : form.moduleKey === 'oral_history' ? (
            <div className="archive-fields wide-field">
              <Input label="讲述人" value={form.oralNarrator} onChange={oralNarrator => setForm({ ...form, oralNarrator })} />
              <Input label="年龄" type="number" value={form.oralAge} onChange={oralAge => setForm({ ...form, oralAge })} />
              <Input label="身份说明" value={form.oralIdentity} onChange={oralIdentity => setForm({ ...form, oralIdentity })} />
              <Input label="采集地点" value={form.oralLocation} onChange={oralLocation => setForm({ ...form, oralLocation })} />
              <Input label="采访人" value={form.oralInterviewer} onChange={oralInterviewer => setForm({ ...form, oralInterviewer })} />
              <Input label="采集时间" value={form.oralDate} onChange={oralDate => setForm({ ...form, oralDate })} />
              <Input label="情感标签" value={form.oralEmotion} onChange={oralEmotion => setForm({ ...form, oralEmotion })} />
              <MediaPickerField
                api={api}
                label="音频素材"
                value={form.oralAudioUrl}
                onChange={oralAudioUrl => setForm({ ...form, oralAudioUrl })}
                mediaTypes={['audio']}
                canUseLibrary={Boolean(canUploadMedia)}
                pickerTitle="选择口述历史音频"
              />
              <label>
                <span>上传音频</span>
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/mp4,audio/m4a,audio/x-m4a,audio/aac,audio/webm"
                  disabled={!canUploadMedia || oralUploadBusy === 'audio'}
                  onChange={event => {
                    const selectedFile = event.target.files?.[0] || null
                    void uploadOralAsset(selectedFile, 'audio')
                    event.currentTarget.value = ''
                  }}
                />
              </label>
              <MediaPickerField
                api={api}
                label="视频素材"
                value={form.oralVideoUrl}
                onChange={oralVideoUrl => setForm({ ...form, oralVideoUrl })}
                mediaTypes={['video']}
                canUseLibrary={Boolean(canUploadMedia)}
                pickerTitle="选择口述历史视频"
              />
              <label>
                <span>上传视频</span>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  disabled={!canUploadMedia || oralUploadBusy === 'video'}
                  onChange={event => {
                    const selectedFile = event.target.files?.[0] || null
                    void uploadOralAsset(selectedFile, 'video')
                    event.currentTarget.value = ''
                  }}
                />
              </label>
              <ArchiveBindingSelect
                label="关联档案点位"
                value={form.oralRelatedArchiveId}
                options={archiveOptions}
                onChange={oralRelatedArchiveId => setForm({ ...form, oralRelatedArchiveId })}
                placeholder="暂不关联"
              />
              <OptionCardSelect
                label="授权状态"
                value={form.oralAuthorizationStatus}
                options={AUTHORIZATION_STATUS_OPTIONS}
                onChange={oralAuthorizationStatus => setForm({ ...form, oralAuthorizationStatus })}
              />
              <MediaPickerField
                api={api}
                label="授权文件"
                value={form.oralAuthorizationFile}
                onChange={oralAuthorizationFile => setForm({ ...form, oralAuthorizationFile })}
                mediaTypes={['document', 'image']}
                canUseLibrary={Boolean(canUploadMedia)}
                pickerTitle="选择授权文件"
              />
              <label>
                <span>上传授权扫描件</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  disabled={!canUploadMedia || oralUploadBusy === 'authorization'}
                  onChange={event => {
                    const selectedFile = event.target.files?.[0] || null
                    void uploadOralAsset(selectedFile, 'authorization')
                    event.currentTarget.value = ''
                  }}
                />
              </label>
              {!canUploadMedia && <p className="form-hint wide-field">当前账号不能上传媒体，可先填写已有素材地址。</p>}
              <label className="wide-field">
                <span>采访完整转写</span>
                <textarea value={form.oralRawTranscript} onChange={event => setForm({ ...form, oralRawTranscript: event.target.value })} />
              </label>
              <label className="wide-field">
                <span>可公开版本</span>
                <textarea value={form.oralPublicTranscript} onChange={event => setForm({ ...form, oralPublicTranscript: event.target.value })} />
              </label>
              <label className="wide-field">
                <span>AI 摘要</span>
                <textarea value={form.oralAiSummary} onChange={event => setForm({ ...form, oralAiSummary: event.target.value })} />
              </label>
              <SensitiveSegmentsEditor
                title="敏感片段标记"
                hint="用于标记采访初稿材料中需要脱敏、改写或不得公开的片段。"
                value={form.oralSensitiveSegments}
                onChange={oralSensitiveSegments => setForm({ ...form, oralSensitiveSegments })}
              />
              <label className="wide-field">
                <span>旧版正文备份</span>
                <textarea value={form.oralTranscript} placeholder="可留空；旧内容回填时使用，优先维护可公开版本" onChange={event => setForm({ ...form, oralTranscript: event.target.value })} />
              </label>
            </div>
          ) : ['letters', 'slogans', 'decrees', 'martyrs', 'women', 'origin', 'history', 'relics'].includes(form.moduleKey) ? (
            <div className="archive-fields wide-field">
              <Input label="文库栏目标题" value={form.resourcePageTitle} onChange={resourcePageTitle => setForm({ ...form, resourcePageTitle })} />
              <Input label="条目副标题" value={form.resourceSubtitle} onChange={resourceSubtitle => setForm({ ...form, resourceSubtitle })} />
              <Input label="时间 / 年代" value={form.resourceTime} onChange={resourceTime => setForm({ ...form, resourceTime })} />
              <Input label="来源 / 分类" value={form.resourceSource} onChange={resourceSource => setForm({ ...form, resourceSource })} />
              <Input label="地点" value={form.resourceLocation} onChange={resourceLocation => setForm({ ...form, resourceLocation })} />
              <Input label="作者 / 人物" value={form.resourceAuthor} onChange={resourceAuthor => setForm({ ...form, resourceAuthor })} />
              <MediaPickerField
                api={api}
                label="图片"
                value={form.resourceImageUrl}
                onChange={resourceImageUrl => setForm({ ...form, resourceImageUrl })}
                mediaTypes={['image']}
                canUseLibrary={Boolean(canUploadMedia)}
                pickerTitle="选择资源文库图片"
              />
              <JsonRowsEditor
                title="文库多条目"
                hint="适合家书、标语、法令、英烈名录等同一栏目下的多条资料。"
                value={form.resourceItemsJson}
                onChange={resourceItemsJson => setForm({ ...form, resourceItemsJson })}
                api={api}
                canUseLibrary={Boolean(canUploadMedia)}
                newItem={{ title: '', subtitle: '', time: '', source: '', location: '', author: '', text: '', imageUrl: '' }}
                fields={[
                  { key: 'title', label: '条目标题', placeholder: '条目一' },
                  { key: 'subtitle', label: '副标题', placeholder: '简短说明' },
                  { key: 'time', label: '时间 / 年代', placeholder: '1927年' },
                  { key: 'source', label: '来源 / 分类', placeholder: '档案来源' },
                  { key: 'location', label: '地点', placeholder: '苏区镇' },
                  { key: 'author', label: '作者 / 人物', placeholder: '相关人物' },
                  { key: 'text', label: '正文', type: 'textarea', placeholder: '请填写经审核的正文内容' },
                  { key: 'imageUrl', label: '配图', type: 'media', placeholder: '/uploads/example.webp', mediaTypes: ['image'], pickerTitle: '选择文库条目配图' },
                ]}
              />
            </div>
          ) : form.moduleKey === 'party_route' ? (
            <div className="archive-fields wide-field">
              <Input label="适用对象" value={form.routeTarget} onChange={routeTarget => setForm({ ...form, routeTarget })} />
              <Input label="预计时长" value={form.routeDuration} onChange={routeDuration => setForm({ ...form, routeDuration })} />
              <PresetSelectField label="路线图标" value={form.routeIconKey} options={ROUTE_ICON_OPTIONS} onChange={routeIconKey => setForm({ ...form, routeIconKey })} customLabel="自定义图标名称" />
              <ColorPresetField label="主题色" value={form.routeColor} onChange={routeColor => setForm({ ...form, routeColor })} />
              <ArchiveMultiSelectField
                label="路线点位"
                value={form.routePois}
                options={archiveOptions.filter(item => item.status === 'published')}
                onChange={routePois => setForm({ ...form, routePois })}
              />
              <label className="wide-field">
                <span>开场讲解词</span>
                <textarea value={form.routeOpening} onChange={event => setForm({ ...form, routeOpening: event.target.value })} />
              </label>
            </div>
          ) : form.moduleKey === 'learning_course' ? (
            <div className="archive-fields wide-field">
              <ArchiveBindingSelect
                label="绑定档案点位"
                value={form.learningArchiveId}
                options={archiveOptions.filter(item => item.status === 'published')}
                onChange={learningArchiveId => setForm({ ...form, learningArchiveId })}
              />
              <Input label="排序" type="number" value={form.learningOrder} onChange={learningOrder => setForm({ ...form, learningOrder })} />
              <p className="form-hint wide-field">课程标题使用上方“标题”，课程说明使用“摘要”。请选择已审核发布的档案点位。</p>
            </div>
          ) : form.moduleKey === 'dashboard_entry' ? (
            <div className="archive-fields wide-field">
              <Input label="分组标题" value={form.dashboardGroupTitle} onChange={dashboardGroupTitle => setForm({ ...form, dashboardGroupTitle })} />
              <OptionCardSelect
                label="点击后打开"
                value={form.dashboardActionKey}
                options={DASHBOARD_ACTION_OPTIONS}
                onChange={dashboardActionKey => setForm({ ...form, dashboardActionKey })}
              />
              <Input label="排序" type="number" value={form.dashboardOrder} onChange={dashboardOrder => setForm({ ...form, dashboardOrder })} />
              <OptionCardSelect
                label="徽标模式"
                value={form.dashboardBadgeMode}
                options={DASHBOARD_BADGE_MODE_OPTIONS}
                onChange={dashboardBadgeMode => setForm({ ...form, dashboardBadgeMode })}
              />
              <details className="wide-field json-raw-details">
                <summary>展示细节（管理员按需调整）</summary>
                <div className="advanced-raw-grid">
                  <Input label="归类名称" value={form.dashboardGroupKey} onChange={dashboardGroupKey => setForm({ ...form, dashboardGroupKey })} placeholder="相同归类名称会放到同一组" />
                  <PresetSelectField label="入口图标" value={form.dashboardIconKey} options={DASHBOARD_ICON_OPTIONS} onChange={dashboardIconKey => setForm({ ...form, dashboardIconKey })} customLabel="自定义入口图标" />
                  <PresetSelectField label="分组图标" value={form.dashboardSectionIconKey} options={DASHBOARD_ICON_OPTIONS} onChange={dashboardSectionIconKey => setForm({ ...form, dashboardSectionIconKey })} customLabel="自定义分组图标" />
                </div>
              </details>
              <p className="form-hint wide-field">入口标题使用上方“标题”，说明使用“摘要”。同一分组标题下的入口会按排序展示。</p>
            </div>
          ) : form.moduleKey === 'tour_route' || form.moduleKey === 'long_march' ? (
            <div className="archive-fields wide-field">
              {form.moduleKey === 'tour_route' ? (
                <>
                  <PresetSelectField label="路线图标" value={form.tourIcon} options={ROUTE_ICON_OPTIONS} onChange={tourIcon => setForm({ ...form, tourIcon })} customLabel="自定义路线图标名称" />
                  <ColorPresetField label="主题色" value={form.routeColor} onChange={routeColor => setForm({ ...form, routeColor })} />
                </>
              ) : (
                <Input label="时间范围" value={form.routeDuration} onChange={routeDuration => setForm({ ...form, routeDuration })} />
              )}
              <JsonRowsEditor
                title={form.moduleKey === 'tour_route' ? '导览站点' : '长征阶段'}
                hint={form.moduleKey === 'tour_route' ? '按前台导览顺序维护站点、时间和讲解内容。' : '按长征路线顺序维护阶段、地点和说明。'}
                value={form.tourItemsJson}
                onChange={tourItemsJson => setForm({ ...form, tourItemsJson })}
                newItem={form.moduleKey === 'tour_route'
                  ? { name: '', time: '', duration: '', description: '' }
                  : { year: '', title: '', location: '', description: '' }}
                fields={form.moduleKey === 'tour_route'
                  ? [
                    { key: 'name', label: '站点名称', placeholder: '请填写已审核站点名称' },
                    { key: 'time', label: '时间', placeholder: '09:00' },
                    { key: 'duration', label: '时长', placeholder: '30分钟' },
                    { key: 'description', label: '讲解内容', type: 'textarea', placeholder: '请填写经审核的内容文本' },
                  ]
                  : [
                    { key: 'year', label: '年份', placeholder: '1934' },
                    { key: 'title', label: '阶段标题', placeholder: '请填写经审核的阶段标题' },
                    { key: 'location', label: '地点', placeholder: '请填写经审核的地点' },
                    { key: 'description', label: '阶段说明', type: 'textarea', placeholder: '请填写经审核的内容文本' },
                  ]}
              />
              {form.moduleKey === 'long_march' && <p className="form-hint wide-field">路线说明使用上方“摘要”，长征精神或补充说明使用“正文”。</p>}
            </div>
          ) : form.moduleKey === 'director_script' ? (
            <div className="archive-fields wide-field">
              <JsonRowsEditor
                title="自动讲解场景"
                hint="按播放顺序维护讲解节点，可绑定点位、控制停顿和是否打开详情。"
                value={form.directorScenesJson}
                onChange={directorScenesJson => setForm({ ...form, directorScenesJson })}
                newItem={{ title: '', poiId: '', narration: '', waitBeforeMs: '', waitAfterMs: '', openDetail: false }}
                fields={[
                  { key: 'title', label: '场景标题', placeholder: '开场' },
                  { key: 'poiId', label: '关联点位', type: 'select', placeholder: '不绑定点位也可保存', options: archiveOptions.filter(item => item.status === 'published').map(item => ({ value: item.id, label: item.title })) },
                  { key: 'narration', label: '讲解词', type: 'textarea', placeholder: '请填写经审核的讲解词' },
                  { key: 'waitBeforeMs', label: '开始前等待（毫秒）', type: 'number' },
                  { key: 'waitAfterMs', label: '结束后等待（毫秒）', type: 'number' },
                  { key: 'openDetail', label: '打开详情', type: 'checkbox' },
                ]}
              />
              <p className="form-hint wide-field">脚本说明使用上方“摘要”。如需更细控制，可在场景里补充点位、停顿和打开详情等设置。</p>
            </div>
          ) : form.moduleKey === 'quiz' ? (
            <div className="archive-fields wide-field">
              <Input label="题库等级 / 分类" value={form.category} onChange={category => setForm({ ...form, category })} />
              <JsonRowsEditor
                title="题目"
                hint="答案序号从 0 开始，对应下方选项行的顺序。"
                value={form.quizQuestionsJson}
                onChange={quizQuestionsJson => setForm({ ...form, quizQuestionsJson })}
                newItem={{ q: '', options: [''], answer: 0, explanation: '' }}
                fields={[
                  { key: 'q', label: '题干', type: 'textarea', placeholder: '请填写经审核的题干' },
                  { key: 'options', label: '选项', type: 'lines', placeholder: '一行一个选项' },
                  { key: 'answer', label: '正确答案序号', type: 'number' },
                  { key: 'explanation', label: '解析', type: 'textarea', placeholder: '请填写经审核的解析' },
                ]}
              />
            </div>
          ) : form.moduleKey === 'panorama' ? (
            <div className="archive-fields wide-field">
              <ColorPresetField label="背景色" value={form.panoramaBgColor} onChange={panoramaBgColor => setForm({ ...form, panoramaBgColor })} />
              <ColorPresetField label="强调色" value={form.panoramaAccentColor} onChange={panoramaAccentColor => setForm({ ...form, panoramaAccentColor })} />
              <Input label="纬度" type="number" value={form.panoramaLatitude} onChange={panoramaLatitude => setForm({ ...form, panoramaLatitude })} />
              <Input label="经度" type="number" value={form.panoramaLongitude} onChange={panoramaLongitude => setForm({ ...form, panoramaLongitude })} />
              <MediaPickerField
                api={api}
                label="全景图片"
                value={form.panoramaImageUrl}
                onChange={panoramaImageUrl => setForm({ ...form, panoramaImageUrl })}
                mediaTypes={['image']}
                canUseLibrary={Boolean(canUploadMedia)}
                pickerTitle="选择全景图片"
              />
              <StringArrayEditor
                title="点位特征"
                hint="用卡片维护这个全景点位的亮点特征，便于讲解和前台展示。"
                value={form.panoramaFeatures}
                onChange={panoramaFeatures => setForm({ ...form, panoramaFeatures })}
                itemLabel="特征"
                placeholder="例如：红军标语墙、旧址全景、讲解热点"
              />
            </div>
          ) : form.moduleKey === 'checkin' ? (
            <div className="archive-fields wide-field">
              <Input label="打卡总数" type="number" value={form.checkinTotalCount} onChange={checkinTotalCount => setForm({ ...form, checkinTotalCount })} />
              <Input label="证书标题" value={form.checkinCertificateTitle} onChange={checkinCertificateTitle => setForm({ ...form, checkinCertificateTitle })} />
              <Input label="印章标签" value={form.checkinStampLabel} onChange={checkinStampLabel => setForm({ ...form, checkinStampLabel })} />
            </div>
          ) : form.moduleKey === 'cocreation' ? (
            <div className="archive-fields wide-field">
              <JsonRowsEditor
                title="共创素材"
                hint="维护群众共创入口展示的作者、身份、节选和完整文本。"
                value={form.cocreationPromptsJson}
                onChange={cocreationPromptsJson => setForm({ ...form, cocreationPromptsJson })}
                newItem={{ author: '', role: '', excerpt: '', fullText: '' }}
                fields={[
                  { key: 'author', label: '作者/人物', placeholder: '彭湃' },
                  { key: 'role', label: '身份', placeholder: '农民运动领袖' },
                  { key: 'excerpt', label: '节选', type: 'textarea' },
                  { key: 'fullText', label: '完整文本', type: 'textarea' },
                ]}
              />
            </div>
          ) : form.moduleKey === 'today_suqu' ? (
            <div className="archive-fields wide-field">
              <Input label="起始年份" value={form.todayBeforeYear} onChange={todayBeforeYear => setForm({ ...form, todayBeforeYear })} />
              <Input label="对比年份" value={form.todayAfterYear} onChange={todayAfterYear => setForm({ ...form, todayAfterYear })} />
              <Input label="过渡标签" value={form.todayTransitionLabel} onChange={todayTransitionLabel => setForm({ ...form, todayTransitionLabel })} />
              <label className="wide-field">
                <span>过去介绍</span>
                <textarea
                  value={form.todayIntroBefore}
                  placeholder="用于顶部今昔对比的第一段"
                  onChange={event => setForm({ ...form, todayIntroBefore: event.target.value })}
                />
              </label>
              <label className="wide-field">
                <span>今日介绍</span>
                <textarea value={form.todayIntroAfter} placeholder="用于顶部今昔对比的第二段" onChange={event => setForm({ ...form, todayIntroAfter: event.target.value })} />
              </label>
              <JsonRowsEditor
                title="数据指标"
                hint="维护今日苏区数据卡片，图标建议从预设中选择，保持前台展示统一。"
                value={form.todayMetricsJson}
                onChange={todayMetricsJson => setForm({ ...form, todayMetricsJson })}
                newItem={{ iconKey: '', number: '', label: '', detail: '' }}
                fields={[
                  { key: 'iconKey', label: '图标', type: 'select', placeholder: '请选择图标', options: TODAY_METRIC_ICON_OPTIONS.map(item => ({ value: item.value, label: item.label })) },
                  { key: 'number', label: '数值', placeholder: '4.2万' },
                  { key: 'label', label: '指标名称', placeholder: '户籍人口' },
                  { key: 'detail', label: '说明', type: 'textarea', placeholder: '下辖16个行政村' },
                ]}
              />
              <JsonRowsEditor
                title="今昔对比"
                hint="维护今日苏区前后对比项，所有文本仍需来源可追溯并走审核。"
                value={form.todayComparisonsJson}
                onChange={todayComparisonsJson => setForm({ ...form, todayComparisonsJson })}
                newItem={{ title: '', before: '', after: '' }}
                fields={[
                  { key: 'title', label: '对比标题', placeholder: '请填写经审核的对比标题' },
                  { key: 'before', label: '过去', type: 'textarea', placeholder: '请填写经审核的过去内容' },
                  { key: 'after', label: '今日', type: 'textarea', placeholder: '请填写经审核的今日内容' },
                ]}
              />
            </div>
          ) : form.moduleKey === 'party_oath' ? (
            <div className="archive-fields wide-field">
              <label className="wide-field">
                <span>誓词全文</span>
                <textarea
                  value={form.oathText}
                  placeholder="填写完整誓词；未填写分句时，后端会按标点自动拆分"
                  onChange={event => setForm({ ...form, oathText: event.target.value })}
                />
              </label>
              <JsonRowsEditor
                title="誓词分句"
                hint="逐句维护誓词展示顺序；未填写时仍可由后端按全文自动拆分。"
                value={form.oathSegmentsJson}
                onChange={oathSegmentsJson => setForm({ ...form, oathSegmentsJson })}
                newItem={{ text: '' }}
                fields={[
                  { key: 'text', label: '分句文本', type: 'textarea', placeholder: '我志愿加入中国共产党' },
                ]}
              />
              <Input label="完成标题" value={form.oathCompletionTitle} onChange={oathCompletionTitle => setForm({ ...form, oathCompletionTitle })} />
              <label className="wide-field">
                <span>完成提示</span>
                <textarea value={form.oathCompletionText} onChange={event => setForm({ ...form, oathCompletionText: event.target.value })} />
              </label>
              <Input label="证书标题" value={form.oathCertificateTitle} onChange={oathCertificateTitle => setForm({ ...form, oathCertificateTitle })} />
              <label className="wide-field">
                <span>证书说明</span>
                <textarea
                  value={form.oathCertificateText}
                  placeholder="可填写证书中的固定说明；姓名会由前端单独展示"
                  onChange={event => setForm({ ...form, oathCertificateText: event.target.value })}
                />
              </label>
            </div>
          ) : form.moduleKey === 'timeline' ? (
            <div className="archive-fields wide-field">
              <Input label="起始年份" type="number" value={form.timelineMinYear} onChange={timelineMinYear => setForm({ ...form, timelineMinYear })} />
              <Input label="结束年份" type="number" value={form.timelineMaxYear} onChange={timelineMaxYear => setForm({ ...form, timelineMaxYear })} />
              <NumberArrayEditor
                title="关键年份"
                hint="用于时间线刻度展示；不填时系统会优先参考下方历史事件中的年份。"
                value={form.timelineMarks}
                onChange={timelineMarks => setForm({ ...form, timelineMarks })}
                itemLabel="年份"
                placeholder="1927"
              />
              <JsonRowsEditor
                title="历史事件"
                hint="按时间线顺序维护事件，关键年份未填写时可由事件年份自动生成。"
                value={form.timelineEventsJson}
                onChange={timelineEventsJson => setForm({ ...form, timelineEventsJson })}
                newItem={{ year: '', title: '', subtitle: '' }}
                fields={[
                  { key: 'year', label: '年份', type: 'number', placeholder: '1927' },
                  { key: 'title', label: '事件标题', placeholder: '请填写经审核的事件标题' },
                  { key: 'subtitle', label: '事件说明', type: 'textarea', placeholder: '请填写经审核的事件说明' },
                ]}
              />
              <label className="wide-field">
                <span>底部提示语</span>
                <textarea value={form.timelineHelperText} onChange={event => setForm({ ...form, timelineHelperText: event.target.value })} />
              </label>
            </div>
          ) : form.moduleKey === 'tribute_ceremony' ? (
            <div className="archive-fields wide-field">
              <label className="wide-field">
                <span>仪式说明</span>
                <textarea value={form.tributeIntroText} onChange={event => setForm({ ...form, tributeIntroText: event.target.value })} />
              </label>
              <Input label="誓词标题" value={form.tributeOathTitle} onChange={tributeOathTitle => setForm({ ...form, tributeOathTitle })} />
              <label className="wide-field">
                <span>誓词/朗诵正文</span>
                <textarea value={form.tributeOathText} onChange={event => setForm({ ...form, tributeOathText: event.target.value })} />
              </label>
              <Input label="默哀按钮" value={form.tributeSilenceButtonText} onChange={tributeSilenceButtonText => setForm({ ...form, tributeSilenceButtonText })} />
              <Input label="默哀标题" value={form.tributeSilenceTitle} onChange={tributeSilenceTitle => setForm({ ...form, tributeSilenceTitle })} />
              <Input label="默哀秒数" type="number" value={form.tributeSilenceSeconds} onChange={tributeSilenceSeconds => setForm({ ...form, tributeSilenceSeconds })} />
              <label className="wide-field">
                <span>默哀说明</span>
                <textarea value={form.tributeSilenceText} onChange={event => setForm({ ...form, tributeSilenceText: event.target.value })} />
              </label>
              <Input label="默哀标语" value={form.tributeSilenceMotto} onChange={tributeSilenceMotto => setForm({ ...form, tributeSilenceMotto })} />
              <Input label="完成标题" value={form.tributeDoneTitle} onChange={tributeDoneTitle => setForm({ ...form, tributeDoneTitle })} />
              <label className="wide-field">
                <span>完成说明</span>
                <textarea value={form.tributeDoneText} onChange={event => setForm({ ...form, tributeDoneText: event.target.value })} />
              </label>
              <Input label="精神标题" value={form.tributeSpiritTitle} onChange={tributeSpiritTitle => setForm({ ...form, tributeSpiritTitle })} />
              <label className="wide-field">
                <span>精神文案</span>
                <textarea value={form.tributeSpiritText} onChange={event => setForm({ ...form, tributeSpiritText: event.target.value })} />
              </label>
              <Input label="精神来源" value={form.tributeSpiritSource} onChange={tributeSpiritSource => setForm({ ...form, tributeSpiritSource })} />
              <Input label="关闭按钮" value={form.tributeCloseButtonText} onChange={tributeCloseButtonText => setForm({ ...form, tributeCloseButtonText })} />
            </div>
          ) : (
            <Input label="分类" value={form.category} onChange={category => setForm({ ...form, category })} />
          )}
          <div id="create-step-final" className="wide-field guided-step-anchor" />
          <div className="archive-fields wide-field">
            <OptionCardSelect
              label="来源类型"
              value={form.sourceType}
              options={SOURCE_TYPE_OPTIONS}
              onChange={sourceType => setForm({ ...form, sourceType })}
            />
            <Input label="来源标题" value={form.sourceTitle} onChange={sourceTitle => setForm({ ...form, sourceTitle })} />
            <Input label="档案编号" value={form.archiveRef} onChange={archiveRef => setForm({ ...form, archiveRef })} />
            <Input label="页码 / 段落" value={form.sourcePageRef} onChange={sourcePageRef => setForm({ ...form, sourcePageRef })} />
            <Input label="采集人 / 整理人" value={form.sourceCollector} onChange={sourceCollector => setForm({ ...form, sourceCollector })} />
            <Input label="采集时间" type="date" value={form.sourceCollectedAt} onChange={sourceCollectedAt => setForm({ ...form, sourceCollectedAt })} />
            <OptionCardSelect
              label="可信度"
              value={form.sourceTrustLevel}
              options={TRUST_LEVEL_OPTIONS}
              onChange={sourceTrustLevel => setForm({ ...form, sourceTrustLevel })}
            />
            <Input label="来源链接" value={form.sourceUrl} onChange={sourceUrl => setForm({ ...form, sourceUrl })} />
            <MediaPickerField
              api={api}
              label="佐证附件"
              value={form.sourceAttachmentUrl}
              onChange={sourceAttachmentUrl => setForm({ ...form, sourceAttachmentUrl, sourceAttachmentMediaId: sourceAttachmentUrl ? form.sourceAttachmentMediaId : '' })}
              mediaTypes={['document', 'image', 'audio', 'video']}
              canUseLibrary={Boolean(canUploadMedia)}
              pickerTitle="选择来源佐证附件"
            />
            {!canUploadMedia && <p className="form-hint wide-field">当前账号不能上传媒体，可先填写来源链接或档案编号。</p>}
            <label className="wide-field">
              <span>来源说明</span>
              <textarea
                value={form.sourceNotes}
                placeholder="例如：第 12 页记载苏区镇交通站位置，已与口述历史交叉核对。"
                onChange={event => setForm({ ...form, sourceNotes: event.target.value })}
              />
            </label>
          </div>
          {showAdvancedJson && canUseAdvancedJson && (
            <details className="wide-field json-raw-details" open={false}>
              <summary>其他补充明细（仅管理员）</summary>
              <textarea value={form.dataJson} onChange={event => setForm({ ...form, dataJson: event.target.value })} />
            </details>
          )}
          <label className="wide-field">
            <span>正文</span>
            <textarea value={form.body} onChange={event => setForm({ ...form, body: event.target.value })} />
          </label>
          <SubmissionChecklistCard title="提交前检查" items={createSubmissionChecklist} />
          {wizardMode === 'guided' ? (
            <div className="wide-field create-form-footer">
              <button type="button" className="secondary" disabled={guidedStepIndex === 0} onClick={() => jumpToGuideStep(guidedStepIndex - 1)}>上一步</button>
              <button type="button" className="secondary" disabled={guidedStepIndex >= guideSteps.length - 1} onClick={() => jumpToGuideStep(guidedStepIndex + 1)}>保存并下一步</button>
              <button type="submit" disabled={creatingAction !== ''}>{creatingAction === 'draft' ? '创建中...' : '创建草稿'}</button>
              <button type="button" disabled={creatingAction !== '' || !canSubmitCreateForReview} onClick={() => void createContent(true)}>{creatingAction === 'submit' ? '提交中...' : '创建并提交审核'}</button>
            </div>
          ) : (
            <div className="wide-field create-form-footer">
              <button type="submit" disabled={creatingAction !== ''}>{creatingAction === 'draft' ? '创建中...' : '创建草稿'}</button>
              <button type="button" disabled={creatingAction !== '' || !canSubmitCreateForReview} onClick={() => void createContent(true)}>{creatingAction === 'submit' ? '提交中...' : '创建并提交审核'}</button>
            </div>
          )}
        </form>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {canBatch && <th><input type="checkbox" checked={contents.length > 0 && selectedIds.length === contents.length} onChange={event => toggleAllContentSelection(event.target.checked)} /></th>}
              <th>标题</th>
              <th>内容类型</th>
              <th>地区</th>
              <th>状态</th>
              <th>敏感等级</th>
              <th>更新人</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {contents.map(item => (
              <tr key={item.id}>
                {canBatch && <td><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={event => toggleContentSelection(item.id, event.target.checked)} /></td>}
                <td>{item.title}</td>
                <td>{item.moduleName}</td>
                <td>{item.regionName || item.regionId || '-'}</td>
                <td>{contentStatusLabel(item.status)}</td>
                <td>{sensitiveLabel(item.sensitiveLevel)}</td>
                <td>{item.updatedByUsername || '-'}</td>
                <td>{formatTime(item.updatedAt)}</td>
                <td className="actions-cell">
                  <button className="secondary" onClick={() => showDetail(item.id)}>{detailLoading && selected?.id === item.id ? '加载中...' : '详情'}</button>
                  {['draft', 'rejected'].includes(item.status) && <button className="secondary" onClick={() => submitContent(item.id)}>提交</button>}
                  {canReview && ['pending_review', 'in_review'].includes(item.status) && (
                    <>
                      <button className="secondary" onClick={() => reviewContent(item.id, 'approve')}>通过</button>
                      <button className="secondary" onClick={() => reviewContent(item.id, 'reject')}>驳回</button>
                    </>
                  )}
                  {canPublish && item.status === 'published' && <button className="secondary" onClick={() => unpublishContent(item.id)}>下架</button>}
                  {canDelete && item.status !== 'deleted' && <button className="secondary" onClick={() => trashContent(item.id)}>删除</button>}
                  {canDelete && item.status === 'deleted' && <button className="secondary" onClick={() => restoreContent(item.id)}>恢复</button>}
                  {canPurge && item.status === 'deleted' && <button className="secondary" onClick={() => purgeContent(item.id)}>永久删除</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <ContentDetailPanel
          api={api}
          content={selected}
          regions={regions}
          archiveOptions={archiveOptions}
          canUploadMedia={Boolean(canUploadMedia)}
          canEditContent={Boolean(currentUser.permissions?.includes('content.edit'))}
          onClose={() => setSelected(null)}
          onUpdated={async updated => {
            setSelected(updated)
            await load()
          }}
          onRestore={canDelete && selected.status === 'deleted' ? () => restoreContent(selected.id) : undefined}
          onPurge={canPurge && selected.status === 'deleted' ? () => purgeContent(selected.id) : undefined}
        />
      )}
    </section>
  )
}

