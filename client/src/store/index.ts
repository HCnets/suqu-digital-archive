import { create } from 'zustand'

export interface ArchiveData {
  id: string
  title: string
  description: string
  longitude: number
  latitude: number
  type: 'government' | 'revolution' | 'culture'
}

interface AppState {
  selectedPoiId: string | null
  setSelectedPoiId: (id: string | null) => void
  getArchiveData: (id: string) => ArchiveData | null
  getAllArchives: () => ArchiveData[]
}

// 广东省紫金县苏区镇大致中心坐标: 经度 ~115.3400, 纬度 ~23.3600
const mockArchives: Record<string, ArchiveData> = {
  'suqu-gov': {
    id: 'suqu-gov',
    title: '苏区镇政府大楼',
    description: '苏区镇行政管理中心，负责全镇的经济建设、社会发展和公共服务。',
    longitude: 115.3415,
    latitude: 23.3610,
    type: 'government'
  },
  'revolution-site': {
    id: 'revolution-site',
    title: '紫金县苏区革命旧址群',
    description: '广东省重要的革命历史纪念地，见证了早期农民运动和苏维埃政权的建立。',
    longitude: 115.3385,
    latitude: 23.3585,
    type: 'revolution'
  },
  'red-square': {
    id: 'red-square',
    title: '苏区红场',
    description: '历史集会与纪念活动的核心广场，保留有浓厚的革命色彩。',
    longitude: 115.3450,
    latitude: 23.3650,
    type: 'culture'
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedPoiId: null,
  setSelectedPoiId: (id) => set({ selectedPoiId: id }),
  getArchiveData: (id) => mockArchives[id] || null,
  getAllArchives: () => Object.values(mockArchives)
}))