import React, { useMemo } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useAppStore, ArchiveData } from '@/store'
import { cn } from '@/lib/utils'

// 免费的科技风底图 (Carto Dark Matter)
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

// 苏区镇大致中心坐标
const INITIAL_VIEW_STATE = {
  longitude: 115.3415,
  latitude: 23.3610,
  zoom: 15,
  pitch: 60, // 倾斜角度，产生 3D 纵深感
  bearing: -20, // 旋转角度
}

interface GisMapProps {
  className?: string
}

export const GisMap: React.FC<GisMapProps> = ({ className }) => {
  const { getAllArchives, setSelectedPoiId, selectedPoiId } = useAppStore()
  const archives = getAllArchives()

  return (
    <div className={cn('w-full h-full relative', className)}>
      <Map
        mapLib={maplibregl}
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle={MAP_STYLE}
        interactiveLayerIds={['poi-labels']}
        onClick={() => setSelectedPoiId(null)} // 点击空白处取消选中
      >
        <NavigationControl position="bottom-right" showCompass showZoom />

        {/* 渲染所有档案点位 */}
        {archives.map((poi) => (
          <Marker
            key={poi.id}
            longitude={poi.longitude}
            latitude={poi.latitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setSelectedPoiId(poi.id)
            }}
          >
            <PoiMarker poi={poi} isSelected={selectedPoiId === poi.id} />
          </Marker>
        ))}
      </Map>
    </div>
  )
}

// 单个发光点位组件 (HTML/CSS 模拟的光柱和热点)
const PoiMarker: React.FC<{ poi: ArchiveData; isSelected: boolean }> = ({ poi, isSelected }) => {
  const baseColor = useMemo(() => {
    switch (poi.type) {
      case 'government': return 'bg-blue-500 shadow-blue-500/50'
      case 'revolution': return 'bg-red-500 shadow-red-500/50'
      case 'culture': return 'bg-amber-500 shadow-amber-500/50'
      default: return 'bg-white shadow-white/50'
    }
  }, [poi.type])

  return (
    <div className="relative group cursor-pointer flex flex-col items-center">
      {/* 悬停/选中时的光柱效果 */}
      <div 
        className={cn(
          "absolute bottom-4 w-[2px] rounded-full bg-gradient-to-t from-white to-transparent transition-all duration-500",
          isSelected ? "h-32 opacity-80" : "h-0 opacity-0 group-hover:h-20 group-hover:opacity-50"
        )}
      />
      
      {/* 底部发光锚点 */}
      <div 
        className={cn(
          "w-4 h-4 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] border-2 border-white/80 transition-transform duration-300",
          baseColor,
          isSelected ? "scale-150" : "group-hover:scale-125"
        )}
      />
      
      {/* 文字标签 */}
      <div 
        className={cn(
          "absolute top-full mt-2 whitespace-nowrap text-xs font-bold px-2 py-1 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-white transition-opacity",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        {poi.title}
      </div>
    </div>
  )
}