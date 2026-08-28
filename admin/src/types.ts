import type { Dispatch, SetStateAction } from 'react'

/**
 * 后台类型定义（从 App.tsx 拆分而来）
 */
declare global {
  interface Window {
    _AMapSecurityConfig?: { securityJsCode?: string }
    AMapLoader?: AMapLoaderModule
  }
}

export type Permission = {
  code: string
  name: string
  group: string
}

export type Role = {
  id: string
  name: string
  description: string
  isSystem: boolean
  permissions: string[]
}

export type AdminUser = {
  id: string
  username: string
  realName: string
  phone: string
  email: string
  department: string
  roleId: string
  roleName: string
  status: 'active' | 'disabled' | 'locked'
  permissions?: string[]
  regionIds?: string[]
  regionScopeIds?: string[]
  allRegions?: boolean
  lastLoginAt?: number | null
  createdAt?: number
}

export type AuditLog = {
  id: number
  action: string
  entityType: string
  entityId: string
  actor: string
  ip: string
  createdAt: number
}

export type BackupFile = {
  name: string
  path: string
  sizeBytes: number
  uploadSizeBytes?: number
  hasUploads?: boolean
  createdAt: number
  updatedAt: number
}

export type AcceptanceEvidenceFile = {
  name: string
  sizeBytes: number
  createdAt: number
  updatedAt: number
  checkedAt: string
  ok: boolean
  failedChecks: string[]
  mysqlTarget: string
  healthStore: string
  runtimeClient: string
  runtimeAligned: boolean
  markdownName: string
}

export type AcceptanceManualRecord = {
  conclusion: string
  environment: string
  owner: string
  governmentRepresentative: string
  narratorRepresentative: string
  technicalOperator: string
  testedAt: string
  mobileResult: string
  publicDomainResult: string
  realMaterialResult: string
  blockers: string
  followUps: string
  notes: string
  updatedAt: number | null
  updatedBy: string
}

export type HealthStatus = {
  ok: boolean
  store: string
  configuredStore: string
  uptime?: number
  database?: {
    runtimeClient?: string
    runtimeAligned?: boolean
    targetReachable?: boolean
    schemaReady?: boolean
    coreTablesPresent?: boolean
  }
}

export type HelpArticle = {
  pageKey: string
  title: string
  summary: string
  steps: string[]
  tips?: string
  videoUrl?: string
}

export type TrashPurgeResult = {
  contentPurged: number
  mediaPurged: number
}

export type ImportResult = {
  importedAt: number
  counts: Record<string, number>
  sessionInvalidated?: boolean
}

export type PublishPositions = {
  map: boolean
  list: boolean
  home: boolean
  topic: boolean
  guide: boolean
}

export type ContentModule = {
  key: string
  name: string
  defaultPublishPositions: PublishPositions
}

export type ManagedContent = {
  id: string
  moduleKey: string
  moduleName: string
  title: string
  summary: string
  status: string
  sensitiveLevel: string
  category?: string
  riskTypes?: string[]
  currentStepId?: string
  publishedVersionId?: string | null
  publishedAt?: number | null
  deletedAt?: number | null
  updatedByUsername: string
  regionId?: string
  regionName?: string
  updatedAt: number
  currentVersion?: ContentVersion | null
  publishedVersion?: ContentVersion | null
  versions?: ContentVersion[]
  sources?: ContentSource[]
  reviewTasks?: ReviewTask[]
  workflowSteps?: WorkflowStep[]
  versionDiff?: VersionDiff
  reviewSignals?: ReviewSignals
  latestVersionNumber?: number
}

export type ContentVersion = {
  id: string
  versionNumber: number
  title: string
  summary: string
  body: string
  data: Record<string, unknown>
  createdBy?: string
  createdAt?: number
}

export type ContentSource = {
  id: string
  sourceType: string
  sourceTitle: string
  sourceUrl: string
  archiveRef: string
  pageRef: string
  collector: string
  collectedAt: string
  trustLevel: string
  attachmentMediaId: string
  notes: string
  createdAt: number
}

export type ReviewTask = {
  id: string
  contentId: string
  contentTitle: string
  moduleKey: string
  workflowId?: string
  stepId?: string
  stepOrder?: number
  stepName: string
  requiredPermission: string
  assigneeRoleName: string
  status: string
  returnSteps?: WorkflowStep[]
  reviewSignals?: ReviewSignals
  reviewerUsername?: string
  comment?: string
  reviewedAt?: number | null
  createdAt: number
}

export type ReviewSignals = {
  sensitiveLevel: string
  sensitiveLabel: string
  riskTypes: string[]
  aiUsed: boolean
  aiSummaryStatus: string
  aiFields: string[]
  sensitiveSegmentsCount: number
  highestLevel: string
  items: Array<{
    type: string
    level: string
    label: string
    detail?: string
  }>
}

export type WorkflowStep = {
  id: string
  workflowId: string
  stepOrder: number
  name: string
  requiredPermission: string
  roleId?: string
  isFinal: boolean
}

export type VersionDiff = {
  baseType: string
  baseVersionNumber?: number | null
  compareVersionNumber?: number | null
  hasChanges: boolean
  fields: Array<{
    key: string
    label: string
    before: string
    after: string
    changed: boolean
  }>
}

export type ArchiveDetailBlock = {
  type: string
  title: string
  order: number
  enabled: boolean
}

export type ArchivePreviewDevice = 'pc' | 'mobile' | 'screen'

export type CreateIntentKey = 'archive' | 'oral_history' | 'media' | 'review'

export type MediaPickerType = MediaAsset['mediaType']

export type AMapLoaderModule = {
  load: (options: {
    key: string
    version: string
    plugins?: string[]
  }) => Promise<AMapNamespace>
}

export type AMapNamespace = {
  Map: new (container: HTMLElement, options: Record<string, unknown>) => AMapMapInstance
  Marker: new (options: Record<string, unknown>) => AMapMarkerInstance
  Pixel: new (x: number, y: number) => unknown
  LngLat: new (lng: number, lat: number) => AMapLngLatLike
  DistrictSearch: new (options: Record<string, unknown>) => {
    search: (keyword: string, callback: (status: string, result: AMapDistrictSearchResult) => void) => void
  }
  PlaceSearch: new (options: Record<string, unknown>) => {
    search: (keyword: string, callback: (status: string, result: AMapPlaceSearchResult) => void) => void
  }
  Geocoder: new (options?: Record<string, unknown>) => {
    getAddress: (lnglat: [number, number], callback: (status: string, result: AMapGeocodeResult) => void) => void
  }
  ToolBar?: new (options?: Record<string, unknown>) => unknown
}

export type AMapMapInstance = {
  on: (event: string, handler: (event: { lnglat?: AMapLngLatLike }) => void) => void
  off?: (event: string, handler: (event: { lnglat?: AMapLngLatLike }) => void) => void
  setCenter: (position: [number, number]) => void
  setZoom?: (zoom: number) => void
  add?: (overlay: unknown) => void
  addControl?: (control: unknown) => void
  destroy?: () => void
}

export type AMapMarkerInstance = {
  setMap: (map: AMapMapInstance | null) => void
  setPosition: (position: [number, number]) => void
  on?: (event: string, handler: (event: { lnglat?: AMapLngLatLike }) => void) => void
  off?: (event: string, handler: (event: { lnglat?: AMapLngLatLike }) => void) => void
}

export type AMapLngLatLike = {
  getLng: () => number
  getLat: () => number
}

export type AMapDistrictSearchResult = {
  districtList?: Array<{
    boundaries?: Array<Array<AMapLngLatLike>>
    center?: AMapLngLatLike
  }>
}

export type AMapPlaceSearchResult = {
  poiList?: {
    pois?: Array<{
      id?: string
      name?: string
      address?: string
      location?: AMapLngLatLike
    }>
  }
}

export type AMapGeocodeResult = {
  regeocode?: {
    formattedAddress?: string
  }
}

export type TributeState = {
  count: number
  updatedAt?: number
}

export type AuthPayload = {
  csrfToken: string
  user: AdminUser
}

export type MediaAsset = {
  id: string
  originalName: string
  mediaType: 'image' | 'video' | 'audio' | 'document'
  mimeType: string
  sizeBytes: number
  width?: number | null
  height?: number | null
  durationSeconds?: number | null
  category: string
  altText: string
  caption: string
  url: string
  thumbnailUrl: string
  watermarkText: string
  autoCompress: boolean
  processingStatus: string
  processingNote: string
  uploadedByUsername: string
  deletedAt?: number | null
  createdAt: number
}

export type AiProvider = {
  id: string
  name: string
  providerType: string
  baseUrl: string
  defaultModel: string
  capabilities: string[]
  configJson?: Record<string, unknown> | null
  isEnabled: boolean
  hasApiKey: boolean
  lastTestedAt?: number | null
  lastTestStatus: string
  lastTestMessage: string
  createdAt: number
  updatedAt: number
}

export type AiTask = {
  id: string
  taskType: string
  targetType: string
  targetId: string
  providerId: string
  providerName: string
  prompt: string
  inputText: string
  inputJson?: Record<string, unknown> | null
  status: string
  resultText: string
  resultJson?: Record<string, unknown> | null
  errorMessage: string
  createdByUsername: string
  createdAt: number
  updatedAt: number
  completedAt?: number | null
}

export type RiskTagTemplate = {
  id: string
  label: string
  level: 'medium' | 'high' | 'critical'
  category: string
  description: string
  isActive: boolean
  sortOrder: number
  createdAt: number
  updatedAt: number
}

export type AiCallLog = {
  id: number
  providerName: string
  taskId: string
  taskType: string
  action: string
  status: string
  requestSummary: string
  responseSummary: string
  errorMessage: string
  durationMs: number
  createdAt: number
}

export type Region = {
  id: string
  parentId: string | null
  parentName: string
  level: string
  name: string
  fullName: string
  code: string
  description: string
  displayMode: string
  mapMode: string
  sortOrder: number
  isDefault: boolean
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export type AiResultDraft = {
  mediaUrl: string
  mimeType: string
  durationSeconds: string
  transcriptFileUrl: string
  subtitleFileUrl: string
  coverImageUrl: string
}

export type ShellTheme = 'civic' | 'heritage'

export type ShellDensity = 'standard' | 'comfortable' | 'compact'

export type ShellFontScale = 'standard' | 'large' | 'xlarge'

export type MenuGroupKey = 'workbench' | 'content' | 'review' | 'system'

export type MenuItem = {
  key: string
  label: string
  permission: string | string[]
  group: MenuGroupKey
  description: string
  mobile?: boolean
}

export type SubmissionChecklistItem = {
  label: string
  done: boolean
}

export type ArchiveEditForm = {
  title: string
  summary: string
  body: string
  sensitiveLevel: string
  regionId: string
  archiveType: string
  year: string
  longitude: string
  latitude: string
  address: string
  historyPeriod: string
  coverImage: string
  relatedPeople: string
  relatedEvents: string
  publishOnMap: boolean
  publishInList: boolean
  publishOnHome: boolean
  publishInTopic: boolean
  publishInGuide: boolean
  detailBlocks: ArchiveDetailBlock[]
  mediaJson: string
  archiveTimelineJson: string
  dataJson: string
  sourceType: string
  sourceTitle: string
  archiveRef: string
  sourcePageRef: string
  sourceCollector: string
  sourceCollectedAt: string
  sourceTrustLevel: string
  sourceUrl: string
  sourceNotes: string
  sourceAttachmentMediaId: string
  sourceAttachmentUrl: string
}

export type OralHistoryEditForm = {
  title: string
  summary: string
  sensitiveLevel: string
  regionId: string
  narrator: string
  age: string
  identity: string
  collectionLocation: string
  interviewer: string
  date: string
  emotion: string
  audioUrl: string
  videoUrl: string
  relatedArchiveId: string
  authorizationStatus: string
  authorizationFile: string
  authorizationScope: string
  authorizationExpiresAt: string
  authorizationNote: string
  transcriptReviewStatus: string
  aiSummaryStatus: string
  aiTranscriptionTaskId: string
  aiTranscriptionAppliedAt: string
  aiTranscriptionProviderName: string
  transcriptionSource: string
  transcriptionSourceMediaUrl: string
  transcriptionFileUrl: string
  transcriptionLanguage: string
  transcriptionDurationSeconds: string
  rawTranscript: string
  publicTranscript: string
  aiSummary: string
  sensitiveSegments: string
  dataJson: string
  sourceType: string
  sourceTitle: string
  archiveRef: string
  sourcePageRef: string
  sourceCollector: string
  sourceCollectedAt: string
  sourceTrustLevel: string
  sourceUrl: string
  sourceNotes: string
  sourceAttachmentMediaId: string
  sourceAttachmentUrl: string
}

export type OralHistoryFormSetter = Dispatch<SetStateAction<OralHistoryEditForm>>

export type JsonRowField = {
  key: string
  label: string
  type?: 'text' | 'textarea' | 'number' | 'checkbox' | 'lines' | 'select' | 'media'
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  mediaTypes?: MediaPickerType[]
  pickerTitle?: string
}

export type JsonRow = Record<string, unknown>

export type SensitiveSegmentRow = {
  start: string
  end: string
  level: string
  text: string
  action: string
}

export type PresetOption = {
  value: string
  label: string
  preview?: string
}

export type Api = <T>(path: string, options?: RequestInit) => Promise<T>

export type OralAssetTarget = 'audio' | 'video' | 'authorization'

export type DraftAutoSaveFrequency = 'off' | '5s' | '15s' | '30s'

export type DraftSaveState = 'idle' | 'restored' | 'saving' | 'saved'

export type StoredDraftSnapshot<T> = {
  savedAt: number
  value: T
}

export {}
