import { create } from 'zustand'

interface ArchiveData {
  id: string
  title: string
  description: string
  images?: string[]
}

interface AppState {
  selectedPoiId: string | null
  setSelectedPoiId: (id: string | null) => void
  getArchiveData: (id: string) => ArchiveData | null
}

const mockArchives: Record<string, ArchiveData> = {
  'suqu-gov': {
    id: 'suqu-gov',
    title: '苏区镇政府大楼',
    description: '苏区镇行政管理中心，负责全镇的经济建设、社会发展和公共服务。',
  },
  'revolution-site': {
    id: 'revolution-site',
    title: '紫金县苏区革命旧址群',
    description: '广东省重要的革命历史纪念地，见证了早期农民运动和苏维埃政权的建立。',
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedPoiId: null,
  setSelectedPoiId: (id) => set({ selectedPoiId: id }),
  getArchiveData: (id) => mockArchives[id] || null,
}))