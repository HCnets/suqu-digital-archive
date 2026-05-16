import { create } from 'zustand'

export interface ArchiveData {
  id: string
  title: string
  description: string
  longitude: number
  latitude: number
  type: 'government' | 'revolution' | 'culture'
  year: number
  media?: {
    type: 'image' | 'video'
    url: string
    caption: string
  }[]
  content?: string
}

interface AppState {
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
}

// 扩展多媒体和时间维度
const mockArchives: Record<string, ArchiveData> = {
  'suqu-gov': {
    id: 'suqu-gov',
    title: '苏区镇政府大楼',
    description: '苏区镇行政管理中心，负责全镇的经济建设、社会发展和公共服务。',
    longitude: 115.3415,
    latitude: 23.3610,
    type: 'government',
    year: 1980,
    content: '苏区镇政府大楼始建于上世纪80年代，历经多次修缮，见证了苏区镇从传统农业镇向现代化城镇的迈进。',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1541887089-1300ce4c194e?q=80&w=1000&auto=format&fit=crop', caption: '政府大楼历史影像' }
    ]
  },
  'revolution-site': {
    id: 'revolution-site',
    title: '紫金县苏区革命旧址群',
    description: '广东省重要的革命历史纪念地，见证了早期农民运动和苏维埃政权的建立。',
    longitude: 115.3385,
    latitude: 23.3585,
    type: 'revolution',
    year: 1927,
    content: '1927年，紫金县苏维埃政府在此成立。这里不仅是革命先烈浴血奋战的指挥中心，更是广东早期农运的重要发源地。',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?q=80&w=1000&auto=format&fit=crop', caption: '革命旧址群全貌' }
    ]
  },
  'red-square': {
    id: 'red-square',
    title: '苏区红场',
    description: '历史集会与纪念活动的核心广场，保留有浓厚的革命色彩。',
    longitude: 115.3450,
    latitude: 23.3650,
    type: 'culture',
    year: 1930,
    content: '红场是苏维埃时期举行重大集会和阅兵的场所。如今，它已成为爱国主义教育基地，每年吸引大量游客前来瞻仰。',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=1000&auto=format&fit=crop', caption: '红场纪念碑' }
    ]
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedPoiId: null,
  setSelectedPoiId: (id) => set({ selectedPoiId: id }),
  getArchiveData: (id) => mockArchives[id] || null,
  getAllArchives: () => Object.values(mockArchives),
  isDetailModalOpen: false,
  setDetailModalOpen: (isOpen) => set({ isDetailModalOpen: isOpen }),
  currentYear: 2026,
  setCurrentYear: (year) => set({ currentYear: year }),
  isAutoTouring: false,
  setAutoTouring: (isTouring) => set({ isAutoTouring: isTouring })
}))