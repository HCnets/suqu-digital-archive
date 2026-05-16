import React, { useEffect, useRef, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useAppStore, type ArchiveData } from '@/store'
import { cn } from '@/lib/utils'
import { createRoot } from 'react-dom/client'

const MAP_STYLES = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  // 使用 ArcGIS World Imagery 作为卫星底图
  satellite: {
    version: 8,
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }
    },
    layers: [
      {
        id: 'satellite-layer',
        type: 'raster',
        source: 'esri-satellite',
        minzoom: 0,
        maxzoom: 22
      }
    ]
  } as maplibregl.StyleSpecification
}

const INITIAL_VIEW_STATE = {
  longitude: 115.3415,
  latitude: 23.3610,
  zoom: 15,
  pitch: 60,
  bearing: -20,
}

// 模拟太空坠入的初始高空状态
const SPACE_VIEW_STATE = {
  zoom: 4,
  pitch: 0,
  bearing: 0
}

interface GisMapProps {
  className?: string
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
    <div className="relative group cursor-pointer flex flex-col items-center pointer-events-auto">
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

export const GisMap: React.FC<GisMapProps> = ({ className }) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Record<string, maplibregl.Marker>>({})
  const tourIntervalRef = useRef<number | null>(null)
  
  const { getAllArchives, setSelectedPoiId, selectedPoiId, isAutoTouring, setAutoTouring, currentYear, mapStyle, isAdminOpen, setDraftCoords } = useAppStore()
  
  // 过滤出年份小于等于当前时间轴年份的档案
  const archives = useMemo(() => {
    return getAllArchives().filter(poi => poi.year <= currentYear)
  }, [getAllArchives, currentYear])

  // 自动巡航逻辑 (Orbit Fly)
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    let orbitAnimationFrame: number
    
    if (isAutoTouring) {
      let currentIndex = 0
      
      const goToNextAndOrbit = () => {
        if (currentIndex >= archives.length) {
          setAutoTouring(false)
          return
        }
        
        const poi = archives[currentIndex]
        setSelectedPoiId(poi.id)
        
        // 先飞过去
        map.flyTo({
          center: [poi.longitude, poi.latitude],
          zoom: 16.5,
          pitch: 70,
          bearing: 0,
          duration: 3000,
          essential: true
        })
        
        // 飞行到位后开始盘旋
        setTimeout(() => {
          let currentBearing = map.getBearing()
          const orbit = () => {
            currentBearing += 0.1 // 盘旋速度
            map.setBearing(currentBearing)
            orbitAnimationFrame = requestAnimationFrame(orbit)
          }
          orbit()
        }, 3000)
        
        currentIndex++
      }

      goToNextAndOrbit()
      // 每 12 秒跳到下一个点 (3秒飞行 + 9秒盘旋)
      tourIntervalRef.current = window.setInterval(() => {
        cancelAnimationFrame(orbitAnimationFrame)
        goToNextAndOrbit()
      }, 12000)
    } else {
      if (tourIntervalRef.current) clearInterval(tourIntervalRef.current)
      cancelAnimationFrame(orbitAnimationFrame)
    }

    return () => {
      if (tourIntervalRef.current) clearInterval(tourIntervalRef.current)
      cancelAnimationFrame(orbitAnimationFrame)
    }
  }, [isAutoTouring, archives])

  // 初始化地图
  useEffect(() => {
    if (!mapContainer.current) return
    if (mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[mapStyle],
      center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
      zoom: SPACE_VIEW_STATE.zoom, // 从高空开始
      pitch: SPACE_VIEW_STATE.pitch,
      bearing: SPACE_VIEW_STATE.bearing,
      attributionControl: false,
      interactive: false // 坠入期间禁止交互
    })

    map.addControl(new maplibregl.NavigationControl({
      visualizePitch: true
    }), 'bottom-right')

    map.on('load', () => {
      // 执行太空坠入动画 (Space-to-Ground Fly-in)
      setTimeout(() => {
        map.flyTo({
          center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
          zoom: INITIAL_VIEW_STATE.zoom,
          pitch: INITIAL_VIEW_STATE.pitch,
          bearing: INITIAL_VIEW_STATE.bearing,
          duration: 4000,
          essential: true,
          curve: 1.5,
        })
        
        // 动画结束后恢复交互
        setTimeout(() => {
          map.dragPan.enable()
          map.scrollZoom.enable()
          map.boxZoom.enable()
          map.dragRotate.enable()
          map.keyboardZoom.enable()
          map.doubleClickZoom.enable()
          map.touchZoomRotate.enable()
        }, 4000)
      }, 500)

      // 1. 插入 3D 地形 (DEM)
      map.addSource('terrain-source', {
        type: 'raster-dem',
        url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json', // MapLibre 官方测试 DEM
        tileSize: 256
      });
      map.setTerrain({ source: 'terrain-source', exaggeration: 1.5 }); // exaggeration 是地形夸张系数

      // 添加 3D 建筑图层 (如果底图支持)
      if (map.getSource('openmaptiles') || map.getSource('carto')) {
        const layers = map.getStyle().layers;
        let labelLayerId;
        for (let i = 0; i < layers.length; i++) {
          if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
            labelLayerId = layers[i].id;
            break;
          }
        }

        map.addLayer({
          'id': '3d-buildings',
          'source': 'carto',
          'source-layer': 'building',
          'filter': ['==', 'extrude', 'true'],
          'type': 'fill-extrusion',
          'minzoom': 14,
          'paint': {
            'fill-extrusion-color': '#1e293b',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.6
          }
        }, labelLayerId);
      }
    })

    map.on('click', (e) => {
        if (isAdminOpen) {
          // 如果处于录入模式，则拾取坐标，不触发点位详情
          setDraftCoords([e.lngLat.lng, e.lngLat.lat])
        } else {
          if (selectedPoiId) setSelectedPoiId(null)
        }
      })
      
      mapRef.current = map

      return () => {
        map.remove()
        mapRef.current = null
      }
    }, [mapStyle, isAdminOpen]) // 依赖 isAdminOpen 以便更新 click 事件

  // 渲染/更新 Markers
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    const initSources = () => {
      // 添加苏区镇边界图层 (模拟数据)
      if (!map.getSource('suqu-boundary')) {
        // 模拟苏区镇的边界点，围绕中心点 115.3400, 23.3600
        const boundaryData = {
          'type': 'FeatureCollection',
          'features': [
            {
              'type': 'Feature',
              'geometry': {
                'type': 'Polygon',
                'coordinates': [
                  [
                    [115.3200, 23.3400],
                    [115.3600, 23.3350],
                    [115.3750, 23.3550],
                    [115.3650, 23.3800],
                    [115.3350, 23.3850],
                    [115.3150, 23.3650],
                    [115.3200, 23.3400]
                  ]
                ]
              }
            }
          ]
        }

        map.addSource('suqu-boundary', {
          'type': 'geojson',
          'data': boundaryData as any
        });

        // 边界填充半透明发光
        map.addLayer({
          'id': 'suqu-boundary-fill',
          'type': 'fill',
          'source': 'suqu-boundary',
          'paint': {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.1
          }
        });

        // 边界线发光
        map.addLayer({
          'id': 'suqu-boundary-line',
          'type': 'line',
          'source': 'suqu-boundary',
          'paint': {
            'line-color': '#60a5fa',
            'line-width': 2,
            'line-opacity': 0.8
          }
        });
      }

      // 添加程序化 3D 建筑白模图层 (用于突出档案点)
      if (!map.getSource('poi-3d-buildings')) {
        map.addSource('poi-3d-buildings', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        map.addLayer({
          'id': 'poi-3d-buildings-layer',
          'type': 'fill-extrusion',
          'source': 'poi-3d-buildings',
          'paint': {
            // 使用 feature properties 里的颜色
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.85
          }
        });
      }
    }

    if (map.isStyleLoaded()) {
      initSources()
    } else {
      map.once('style.load', initSources)
    }
  }, [])

  // 渲染/更新 Markers 和 3D 白模
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    const currentArchiveIds = new Set(archives.map(a => a.id))
    Object.keys(markersRef.current).forEach(id => {
      if (!currentArchiveIds.has(id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
        if (selectedPoiId === id) setSelectedPoiId(null)
      }
    })

    // 更新 3D 白模数据源
    const buildingFeatures = archives.map(poi => {
      // 围绕坐标点生成一个小正方形 (模拟建筑占地)
      const offset = 0.0003;
      const color = poi.type === 'revolution' ? '#ef4444' : 
                    poi.type === 'government' ? '#3b82f6' : '#f59e0b';
      
      // 生成更高大且发光的建筑体
      return {
        type: 'Feature',
        properties: {
          color: color,
          height: Math.random() * 50 + 100 // 100-150米高
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [poi.longitude - offset, poi.latitude - offset],
            [poi.longitude + offset, poi.latitude - offset],
            [poi.longitude + offset, poi.latitude + offset],
            [poi.longitude - offset, poi.latitude + offset],
            [poi.longitude - offset, poi.latitude - offset]
          ]]
        }
      }
    });

    if (map.isStyleLoaded() && map.getSource('poi-3d-buildings')) {
      (map.getSource('poi-3d-buildings') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: buildingFeatures as any
      });
    }

    archives.forEach(poi => {
      let marker = markersRef.current[poi.id]
      
      const renderContent = (
        <div 
          className={`w-4 h-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] cursor-pointer transition-all duration-300 ${
            poi.id === selectedPoiId ? 'scale-150 ring-4 ring-white/50' : 'hover:scale-125'
          }`}
          style={{
            backgroundColor: poi.type === 'revolution' ? '#ef4444' : 
                           poi.type === 'government' ? '#3b82f6' : '#f59e0b'
          }}
          onClick={(e) => {
            e.stopPropagation()
            setSelectedPoiId(poi.id)
          }}
        />
      )

      if (!marker) {
        const el = document.createElement('div')
        const root = createRoot(el)
        ;(el as any)._reactRoot = root

        root.render(renderContent)

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([poi.longitude, poi.latitude])
          .addTo(map)
          
        markersRef.current[poi.id] = marker
      } else {
        // Update selected state style
        const el = marker.getElement()
        if ((el as any)._reactRoot) {
          (el as any)._reactRoot.render(renderContent)
        }
      }
    })
  }, [archives, selectedPoiId])

  return (
    <div ref={mapContainer} className={cn('w-full h-full relative', className)} />
  )
}