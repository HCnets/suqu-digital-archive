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
  archives: Record<string, ArchiveData>
  fetchArchives: () => Promise<void>
  addArchive: (archive: ArchiveData) => Promise<void>
  
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
  
  isAdminOpen: boolean
  setAdminOpen: (isOpen: boolean) => void
  draftCoords: [number, number] | null
  setDraftCoords: (coords: [number, number] | null) => void
  
  isIndoorMode: boolean
  setIndoorMode: (isIndoor: boolean) => void
  
  weather: 'clear' | 'rain' | 'snow'
  setWeather: (weather: 'clear' | 'rain' | 'snow') => void
  showHistoricalRoute: boolean
  setShowHistoricalRoute: (show: boolean) => void

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

  mainMapInstance: any
  setMainMapInstance: (map: any) => void
}

const API_BASE = 'http://localhost:3001/api';

export const useAppStore = create<AppState>()(
  (set, get) => ({
    archives: {},
    fetchArchives: async () => {
      try {
        const response = await fetch(`${API_BASE}/archives`);
        const data: ArchiveData[] = await response.json();
        const archivesMap = data.reduce((acc, curr) => ({...acc, [curr.id]: curr}), {});
        set({ archives: archivesMap });
      } catch (error) {
        console.error('Failed to fetch archives:', error);
      }
    },
    addArchive: async (archive) => {
      try {
        const response = await fetch(`${API_BASE}/archives`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(archive)
        });
        const savedArchive = await response.json();
        set((state) => ({
          archives: { ...state.archives, [savedArchive.id]: savedArchive }
        }));
      } catch (error) {
        console.error('Failed to save archive:', error);
      }
    },
    
    selectedPoiId: null,
    setSelectedPoiId: (id) => set({ selectedPoiId: id }),
    getArchiveData: (id) => get().archives[id] || null,
    getAllArchives: () => Object.values(get().archives),
    isDetailModalOpen: false,
    setDetailModalOpen: (isOpen) => set({ isDetailModalOpen: isOpen }),
    currentYear: 2026,
    setCurrentYear: (year) => set({ currentYear: year }),
    isAutoTouring: false,
    setAutoTouring: (isTouring) => set({ isAutoTouring: isTouring }),
    mapStyle: 'museum',
    setMapStyle: (style) => set({ mapStyle: style }),
    
    isAdminOpen: false,
    setAdminOpen: (isOpen) => set({ isAdminOpen: isOpen, draftCoords: null }),
    draftCoords: null,
    setDraftCoords: (coords) => set({ draftCoords: coords }),
    
    isIndoorMode: false,
    setIndoorMode: (isIndoor) => set({ isIndoorMode: isIndoor }),
    
    weather: 'clear',
    setWeather: (weather) => set({ weather }),
    showHistoricalRoute: false,
    setShowHistoricalRoute: (show) => set({ showHistoricalRoute: show }),

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
