import { create } from 'zustand'
import type maplibregl from 'maplibre-gl'
import { API_BASE, shouldUseBackend } from '@/lib/env'

export interface ArchiveData {
  id: string
  title: string
  description: string
  regionId?: string
  regionName?: string
  address?: string
  coverImage?: string
  longitude: number
  latitude: number
  type: 'government' | 'revolution' | 'culture'
  year: number
  historyPeriod?: string
  relatedPeople?: string[]
  relatedEvents?: string[]
  publishPositions?: {
    map: boolean
    list: boolean
    home: boolean
    topic: boolean
    guide: boolean
  }
  media?: {
    type: 'image' | 'video'
    url: string
    caption: string
  }[]
  detailBlocks?: {
    type: string
    key?: string
    title: string
    order: number
    enabled: boolean
  }[]
  displayTimeline?: {
    label: string
    value: string
  }[]
  sources?: {
    sourceType: string
    sourceTitle: string
    sourceUrl: string
    archiveRef: string
    pageRef: string
    collector: string
    collectedAt: string
    trustLevel: string
    notes: string
    createdAt?: number
  }[]
  oralHistories?: {
    narrator: string
    title: string
    summary: string
    transcript: string
    audioUrl: string
    videoUrl: string
    date: string
  }[]
  aiNarration?: {
    text: string
    audioUrl: string
    provider: string
    reviewedAt: string
  }
  learningQuestions?: string[]
  routeTips?: {
    title: string
    description: string
    duration: string
  }[]
  publicMessages?: {
    name: string
    text: string
    createdAt?: number
  }[]
  trustLevel?: string
  auditStatus?: string
  publishedAt?: number | null
  updatedAt?: number
  createdAt?: number
  content?: string
}

type ArchiveApiPayload = ArchiveData[] | { items?: ArchiveData[] }

export interface PublicRegion {
  id: string
  parentId: string | null
  parentName?: string
  level: string
  name: string
  fullName: string
  code?: string
  description?: string
  displayMode: 'current' | 'overview' | 'auto_location'
  mapMode: 'single' | 'aggregate' | 'mixed'
  sortOrder?: number
  isDefault?: boolean
  isActive?: boolean
}

export interface PublicMapView {
  longitude: number
  latitude: number
  zoom: number
  pitch: number
  bearing: number
}

export interface PublicRegionConfig {
  defaultRegion: PublicRegion | null
  regions: PublicRegion[]
  displayMode: 'current' | 'overview' | 'auto_location'
  mapMode: 'single' | 'aggregate' | 'mixed'
  scopeRegionIds: string[]
  mapView: PublicMapView
  generatedAt?: number
}

interface AppState {
  archives: Record<string, ArchiveData>
  fetchArchives: () => Promise<void>
  regionConfig: PublicRegionConfig
  selectedRegionId: string
  fetchRegionConfig: (regionId?: string) => Promise<void>
  selectRegion: (regionId: string) => Promise<void>
  
  selectedPoiId: string | null
  setSelectedPoiId: (id: string | null) => void
  getArchiveData: (id: string) => ArchiveData | null
  getAllArchives: () => ArchiveData[]
  isDetailModalOpen: boolean
  setDetailModalOpen: (isOpen: boolean) => void
  currentYear: number
  setCurrentYear: (year: number) => void
  isAutoTouring: boolean
  setAutoTouring: (isTouring: boolean) => void
  mapStyle: 'museum' | 'satellite'
  setMapStyle: (style: 'museum' | 'satellite') => void

  isIndoorMode: boolean
  setIndoorMode: (isIndoor: boolean) => void
  
  weather: 'clear' | 'rain' | 'snow'
  setWeather: (weather: 'clear' | 'rain' | 'snow') => void
  isRelicMode: boolean
  setRelicMode: (isRelic: boolean) => void
  activeEvent: string | null
  setActiveEvent: (eventTitle: string | null) => void

  isSwipeMode: boolean
  setSwipeMode: (isSwipe: boolean) => void

  isFpsMode: boolean
  setFpsMode: (isFps: boolean) => void

  isDirectorMode: boolean
  setDirectorMode: (isDirector: boolean) => void

  mainMapInstance: maplibregl.Map | null
  setMainMapInstance: (map: maplibregl.Map | null) => void
}

const DEFAULT_REGION_CONFIG: PublicRegionConfig = {
  defaultRegion: null,
  regions: [],
  displayMode: 'current',
  mapMode: 'single',
  scopeRegionIds: [],
  mapView: {
    longitude: 0,
    latitude: 0,
    zoom: 2,
    pitch: 0,
    bearing: 0,
  },
}

const reportBackendIssue = (message: string, error: unknown) => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.warn(`[红色文化数字档案] ${message}`, error)
  }
}

const isArchiveType = (value: unknown): value is ArchiveData['type'] => {
  return value === 'government' || value === 'revolution' || value === 'culture'
}

const normalizeArchive = (item: Partial<ArchiveData>): ArchiveData | null => {
  const longitude = Number(item.longitude)
  const latitude = Number(item.latitude)
  const year = Number(item.year)
  const id = String(item.id || '').trim()
  const title = String(item.title || '').trim()
  if (!id || !title || !Number.isFinite(longitude) || !Number.isFinite(latitude)) return null
  if (longitude === 0 && latitude === 0) return null

  const coverImage = String(item.coverImage || '').trim()
  const media = Array.isArray(item.media)
    ? item.media.map((entry) => ({
        type: entry?.type === 'video' ? 'video' as const : 'image' as const,
        url: String(entry?.url || '').trim(),
        caption: String(entry?.caption || '').trim(),
      })).filter((entry) => entry.url)
    : []
  if (coverImage && media.length === 0) {
    media.push({ type: 'image', url: coverImage, caption: title })
  }
  const sources = Array.isArray(item.sources)
    ? item.sources.map((source) => ({
        sourceType: String(source?.sourceType || '').trim(),
        sourceTitle: String(source?.sourceTitle || '').trim(),
        sourceUrl: String(source?.sourceUrl || '').trim(),
        archiveRef: String(source?.archiveRef || '').trim(),
        pageRef: String(source?.pageRef || '').trim(),
        collector: String(source?.collector || '').trim(),
        collectedAt: String(source?.collectedAt || '').trim(),
        trustLevel: String(source?.trustLevel || '').trim(),
        notes: String(source?.notes || '').trim(),
        createdAt: Number(source?.createdAt || 0) || undefined,
      })).filter((source) => source.sourceTitle || source.archiveRef || source.notes)
    : []
  const displayTimeline = Array.isArray(item.displayTimeline)
    ? item.displayTimeline.map((entry) => ({
        label: String(entry?.label || '').trim(),
        value: String(entry?.value || '').trim(),
      })).filter((entry) => entry.label && entry.value)
    : []
  const detailBlocks = Array.isArray(item.detailBlocks)
    ? item.detailBlocks.map((entry, index) => ({
        type: String(entry?.type || entry?.key || '').trim(),
        key: String(entry?.key || entry?.type || '').trim(),
        title: String(entry?.title || '').trim(),
        order: Number(entry?.order || index + 1),
        enabled: entry?.enabled === undefined ? true : Boolean(entry.enabled),
      })).filter((entry) => entry.type && entry.title && entry.enabled)
    : []
  const relatedPeople = Array.isArray(item.relatedPeople)
    ? item.relatedPeople.map(entry => String(entry || '').trim()).filter(Boolean)
    : []
  const relatedEvents = Array.isArray(item.relatedEvents)
    ? item.relatedEvents.map(entry => String(entry || '').trim()).filter(Boolean)
    : []
  const oralHistories = Array.isArray(item.oralHistories)
    ? item.oralHistories.map(entry => ({
        narrator: String(entry?.narrator || '').trim(),
        title: String(entry?.title || '').trim(),
        summary: String(entry?.summary || '').trim(),
        transcript: String(entry?.transcript || '').trim(),
        audioUrl: String(entry?.audioUrl || '').trim(),
        videoUrl: String(entry?.videoUrl || '').trim(),
        date: String(entry?.date || '').trim(),
      })).filter(entry => entry.narrator || entry.title || entry.transcript || entry.audioUrl || entry.videoUrl)
    : []
  const learningQuestions = Array.isArray(item.learningQuestions)
    ? item.learningQuestions.map(entry => String(entry || '').trim()).filter(Boolean)
    : []
  const routeTips = Array.isArray(item.routeTips)
    ? item.routeTips.map(entry => ({
        title: String(entry?.title || '').trim(),
        description: String(entry?.description || '').trim(),
        duration: String(entry?.duration || '').trim(),
      })).filter(entry => entry.title || entry.description || entry.duration)
    : []
  const publicMessages = Array.isArray(item.publicMessages)
    ? item.publicMessages.map(entry => ({
        name: String(entry?.name || '').trim(),
        text: String(entry?.text || '').trim(),
        createdAt: Number(entry?.createdAt || 0) || undefined,
      })).filter(entry => entry.text)
    : []

  return {
    id,
    title,
    description: String(item.description || '').trim(),
    regionId: String(item.regionId || '').trim(),
    regionName: String(item.regionName || '').trim(),
    address: String(item.address || '').trim(),
    coverImage,
    longitude,
    latitude,
    type: isArchiveType(item.type) ? item.type : 'revolution',
    year: Number.isFinite(year) ? year : 0,
    historyPeriod: String(item.historyPeriod || '').trim(),
    relatedPeople,
    relatedEvents,
    publishPositions: item.publishPositions,
    media,
    detailBlocks,
    displayTimeline,
    sources,
    oralHistories,
    aiNarration: item.aiNarration
      ? {
          text: String(item.aiNarration.text || '').trim(),
          audioUrl: String(item.aiNarration.audioUrl || '').trim(),
          provider: String(item.aiNarration.provider || '').trim(),
          reviewedAt: String(item.aiNarration.reviewedAt || '').trim(),
        }
      : undefined,
    learningQuestions,
    routeTips,
    publicMessages,
    trustLevel: String(item.trustLevel || '').trim(),
    auditStatus: String(item.auditStatus || '').trim(),
    publishedAt: Number(item.publishedAt || 0) || null,
    updatedAt: Number(item.updatedAt || 0) || undefined,
    createdAt: Number(item.createdAt || 0) || undefined,
    content: String(item.content || '').trim(),
  }
}

const normalizeArchivePayload = (payload: ArchiveApiPayload) => {
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : []
  return rows.map(normalizeArchive).filter((item): item is ArchiveData => Boolean(item))
}

const isDisplayMode = (value: unknown): value is PublicRegionConfig['displayMode'] => {
  return value === 'current' || value === 'overview' || value === 'auto_location'
}

const isMapMode = (value: unknown): value is PublicRegionConfig['mapMode'] => {
  return value === 'single' || value === 'aggregate' || value === 'mixed'
}

const normalizeMapView = (value: Partial<PublicMapView> | undefined): PublicMapView => ({
  longitude: Number.isFinite(Number(value?.longitude)) ? Number(value?.longitude) : DEFAULT_REGION_CONFIG.mapView.longitude,
  latitude: Number.isFinite(Number(value?.latitude)) ? Number(value?.latitude) : DEFAULT_REGION_CONFIG.mapView.latitude,
  zoom: Number.isFinite(Number(value?.zoom)) ? Number(value?.zoom) : DEFAULT_REGION_CONFIG.mapView.zoom,
  pitch: Number.isFinite(Number(value?.pitch)) ? Number(value?.pitch) : DEFAULT_REGION_CONFIG.mapView.pitch,
  bearing: Number.isFinite(Number(value?.bearing)) ? Number(value?.bearing) : DEFAULT_REGION_CONFIG.mapView.bearing,
})

const normalizePublicRegion = (region: Partial<PublicRegion>): PublicRegion | null => {
  const id = String(region?.id || '').trim()
  const name = String(region?.name || '').trim()
  if (!id || !name) return null
  const displayMode = isDisplayMode(region.displayMode) ? region.displayMode : DEFAULT_REGION_CONFIG.displayMode
  const mapMode = isMapMode(region.mapMode) ? region.mapMode : DEFAULT_REGION_CONFIG.mapMode
  return {
    id,
    parentId: region.parentId ? String(region.parentId) : null,
    parentName: String(region.parentName || ''),
    level: String(region.level || 'town'),
    name,
    fullName: String(region.fullName || name),
    code: String(region.code || ''),
    description: String(region.description || ''),
    displayMode,
    mapMode,
    sortOrder: Number(region.sortOrder || 0),
    isDefault: Boolean(region.isDefault),
    isActive: region.isActive === undefined ? true : Boolean(region.isActive),
  }
}

const normalizeRegionConfig = (payload: Partial<PublicRegionConfig>): PublicRegionConfig => {
  const regions = Array.isArray(payload?.regions)
    ? payload.regions.map(normalizePublicRegion).filter((region): region is PublicRegion => Boolean(region))
    : []
  const defaultRegion = normalizePublicRegion(payload?.defaultRegion || {})
  const displayMode = isDisplayMode(payload?.displayMode) ? payload.displayMode : defaultRegion?.displayMode || DEFAULT_REGION_CONFIG.displayMode
  const mapMode = isMapMode(payload?.mapMode) ? payload.mapMode : defaultRegion?.mapMode || DEFAULT_REGION_CONFIG.mapMode
  const scopeRegionIds = Array.isArray(payload?.scopeRegionIds)
    ? payload.scopeRegionIds.map((id) => String(id || '').trim()).filter(Boolean)
    : []

  return {
    defaultRegion,
    regions,
    displayMode,
    mapMode,
    scopeRegionIds,
    mapView: normalizeMapView(payload?.mapView),
    generatedAt: Number(payload?.generatedAt || 0) || Date.now(),
  }
}

const getArchiveRegionId = (archive: ArchiveData) => archive.regionId || ''

const EMPTY_ARCHIVES: Record<string, ArchiveData> = {}

export const useAppStore = create<AppState>()(
  (set, get) => ({
    archives: EMPTY_ARCHIVES,
    regionConfig: DEFAULT_REGION_CONFIG,
    selectedRegionId: DEFAULT_REGION_CONFIG.defaultRegion?.id || '',
    fetchRegionConfig: async (regionId) => {
      if (!shouldUseBackend()) return
      try {
        const targetRegionId = String(regionId || get().selectedRegionId || '').trim()
        const query = targetRegionId ? `?regionId=${encodeURIComponent(targetRegionId)}` : ''
        const response = await fetch(`${API_BASE}/regions/public-config${query}`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const payload = await response.json() as Partial<PublicRegionConfig>
        const regionConfig = normalizeRegionConfig(payload)
        set({ regionConfig, selectedRegionId: regionConfig.defaultRegion?.id || targetRegionId })
      } catch (error) {
        set({ regionConfig: DEFAULT_REGION_CONFIG, selectedRegionId: '' })
        reportBackendIssue('后端地区配置读取失败，当前不展示本地地区兜底数据。', error)
      }
    },
    selectRegion: async (regionId) => {
      const nextRegionId = String(regionId || '').trim()
      set({ selectedRegionId: nextRegionId })
      await get().fetchRegionConfig(nextRegionId)
    },
    fetchArchives: async () => {
      if (!shouldUseBackend()) {
        set({ archives: EMPTY_ARCHIVES })
        return
      }
      try {
        const response = await fetch(`${API_BASE}/archives`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const payload = await response.json() as ArchiveApiPayload
        const data = normalizeArchivePayload(payload)
        if (data.length === 0) {
          set({ archives: EMPTY_ARCHIVES })
          return
        }
        const archivesMap = data.reduce<Record<string, ArchiveData>>((acc, curr) => ({ ...acc, [curr.id]: curr }), {})
        set({ archives: archivesMap })
      } catch (error) {
        set({ archives: EMPTY_ARCHIVES })
        reportBackendIssue('后端档案读取失败，当前不展示未审核的前端兜底档案。', error)
      }
    },
    selectedPoiId: null,
    setSelectedPoiId: (id) => set({ selectedPoiId: id }),
    getArchiveData: (id) => get().archives[id] || null,
    getAllArchives: () => {
      const archives = Object.values(get().archives)
      const config = get().regionConfig
      if (!config || config.displayMode === 'overview') return archives
      const scopedRegionIds = new Set(config.scopeRegionIds || [])
      if (scopedRegionIds.size === 0) return archives
      return archives.filter((archive) => scopedRegionIds.has(getArchiveRegionId(archive)))
    },
    isDetailModalOpen: false,
    setDetailModalOpen: (isOpen) => set({ isDetailModalOpen: isOpen }),
    currentYear: 2026,
    setCurrentYear: (year) => set({ currentYear: year }),
    isAutoTouring: false,
    setAutoTouring: (isTouring) => set({ isAutoTouring: isTouring }),
    mapStyle: 'museum',
    setMapStyle: (style) => set({ mapStyle: style }),

    isIndoorMode: false,
    setIndoorMode: (isIndoor) => set({ isIndoorMode: isIndoor }),
    
    weather: 'clear',
    setWeather: (weather) => set({ weather }),

    isRelicMode: false,
    setRelicMode: (isRelic) => set({ isRelicMode: isRelic }),
    activeEvent: null,
    setActiveEvent: (eventTitle) => set({ activeEvent: eventTitle }),

    isSwipeMode: false,
    setSwipeMode: (isSwipe) => set({ isSwipeMode: isSwipe }),

    isFpsMode: false,
    setFpsMode: (isFps) => set({ isFpsMode: isFps }),

    isDirectorMode: false,
    setDirectorMode: (isDirector) => set({ isDirectorMode: isDirector }),

    mainMapInstance: null,
    setMainMapInstance: (map) => set({ mainMapInstance: map })
  })
)
