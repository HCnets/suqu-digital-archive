import React, { useEffect, useRef, useMemo, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import { createRoot } from 'react-dom/client'

const MAP_STYLES = {
  museum: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
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
  mapId?: string
  initialStyle?: string
  onMapLoad?: (map: maplibregl.Map) => void
}

export const GisMap: React.FC<GisMapProps> = ({ className, mapId, initialStyle, onMapLoad }) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Record<string, maplibregl.Marker>>({})
  const [mapLoading, setMapLoading] = useState(true)
  
  const { getAllArchives, setSelectedPoiId, selectedPoiId, currentYear, mapStyle, isAdminOpen, setDraftCoords, showHistoricalRoute, showSovietRegion, activeEvent, isFpsMode, isDirectorMode } = useAppStore()
  
  const selectedPoiIdRef = useRef(selectedPoiId)
  useEffect(() => { selectedPoiIdRef.current = selectedPoiId }, [selectedPoiId])
  const isAdminOpenRef = useRef(isAdminOpen)
  useEffect(() => { isAdminOpenRef.current = isAdminOpen }, [isAdminOpen])
  const routeAnimRef = useRef<number | null>(null)
  const rebuildRef = useRef<((map: maplibregl.Map) => void) | null>(null)
  
  // 过滤出年份小于等于当前时间轴年份的档案
  const archives = useMemo(() => {
    return getAllArchives().filter(poi => poi.year <= currentYear)
  }, [getAllArchives, currentYear])

  // 初始化地图
  useEffect(() => {
    if (!mapContainer.current) return
    if (mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: initialStyle ? MAP_STYLES[initialStyle as keyof typeof MAP_STYLES] : MAP_STYLES[mapStyle],
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
      setMapLoading(false)
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
          map.keyboard.enable()
          map.doubleClickZoom.enable()
          map.touchZoomRotate.enable()
        }, 4000)
      }, 500)

      // 1. 插入 3D 地形 (DEM) — 使用 AWS Terrain Tiles (Terrarium 编码), 稳定可靠无需 API Key
      map.addSource('terrain-source', {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 14
      });
      map.setTerrain({ source: 'terrain-source', exaggeration: 1.5 });

      // 添加 3D 建筑图层 (如果底图支持)
      if (map.getSource('openmaptiles') || map.getSource('carto')) {
        const layers = map.getStyle().layers;
        let labelLayerId;
        for (let i = 0; i < layers.length; i++) {
          if (layers[i].type === 'symbol' && (layers[i].layout as any)['text-field']) {
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
            'fill-extrusion-color': '#D4C5B2',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.7
          }
        }, labelLayerId);
      }
    })

    map.on('click', (e) => {
        if (isAdminOpenRef.current) {
          setDraftCoords([e.lngLat.lng, e.lngLat.lat])
        } else {
          if (selectedPoiIdRef.current) setSelectedPoiId(null)
        }
      })
      
      mapRef.current = map
      if (onMapLoad) onMapLoad(map)

      return () => {
        map.remove()
        mapRef.current = null
      }
    }, [])

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

      // 3. 星火燎原：革命辐射拓扑网 (模拟从苏区镇向外辐射的连接线)
      if (!map.getSource('spark-topology')) {
        map.addSource('spark-topology', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              // 海陆丰方向
              {
                type: 'Feature',
                properties: { target: '海丰' },
                geometry: {
                  type: 'LineString',
                  coordinates: [[115.3415, 23.3610], [115.3300, 23.2000], [115.3500, 22.9500]]
                }
              },
              // 广州方向
              {
                type: 'Feature',
                properties: { target: '广州起义' },
                geometry: {
                  type: 'LineString',
                  coordinates: [[115.3415, 23.3610], [114.5000, 23.4000], [113.2644, 23.1291]]
                }
              },
              // 延安方向 (示意)
              {
                type: 'Feature',
                properties: { target: '中央苏区' },
                geometry: {
                  type: 'LineString',
                  coordinates: [[115.3415, 23.3610], [115.0000, 24.5000], [115.5000, 25.8000]]
                }
              }
            ]
          }
        });

        // 基础辐射线
        map.addLayer({
          'id': 'spark-topology-line',
          'type': 'line',
          'source': 'spark-topology',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#C41E3A',
            'line-width': 2,
            'line-opacity': 0.25,
          }
        });
        
        map.addLayer({
          'id': 'spark-topology-flow',
          'type': 'line',
          'source': 'spark-topology',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#C41E3A',
            'line-width': 3,
            'line-opacity': 0.5,
            'line-dasharray': [0, 4, 3]
          }
        });
      }

      // 添加历史行军路线 (模拟数据)
      if (!map.getSource('historical-route')) {
        map.addSource('historical-route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [115.3100, 23.3300],
                [115.3200, 23.3400],
                [115.3350, 23.3550],
                [115.3400, 23.3600],
                [115.3500, 23.3650],
                [115.3600, 23.3800]
              ]
            }
          }
        });

        map.addLayer({
          'id': 'historical-route-line',
          'type': 'line',
          'source': 'historical-route',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#C41E3A',
            'line-width': 4,
            'line-opacity': 0,
            'line-dasharray': [0, 2, 2]
          }
        });
      }
    }

    if (map.isStyleLoaded()) {
      initSources()
    } else {
      map.once('style.load', initSources)
    }
    rebuildRef.current = initSources
  }, [])

  // 历史行军路线动画逻辑
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    const animateDashArray = (step: number) => {
      if (!map.getLayer('historical-route-line')) return

      const opacity = 0.5 + 0.5 * Math.sin(step / 10);
      
      if (map.getLayer('historical-route-line')) {
        map.setPaintProperty('historical-route-line', 'line-opacity', opacity);
      }
      
      if (map.getLayer('spark-topology-flow')) {
        const sparkOpacity = 0.4 + 0.6 * Math.sin(step / 5);
        map.setPaintProperty('spark-topology-flow', 'line-opacity', sparkOpacity);
      }

      routeAnimRef.current = requestAnimationFrame(() => animateDashArray(step + 1))
    }

    const updateRouteVisibility = () => {
      if (!map.getLayer('historical-route-line')) return
      
      if (showHistoricalRoute) {
        map.setPaintProperty('historical-route-line', 'line-opacity', 0.8)
        map.setPaintProperty('historical-route-line', 'line-dasharray', [2, 2])
        routeAnimRef.current = requestAnimationFrame(() => animateDashArray(0))
        
        map.flyTo({
          center: [115.3350, 23.3550],
          zoom: 13.5,
          pitch: 45,
          duration: 2000
        })
      } else {
        if (routeAnimRef.current) cancelAnimationFrame(routeAnimRef.current)
        routeAnimRef.current = null
        map.setPaintProperty('historical-route-line', 'line-opacity', 0)
      }
    }

    if (map.isStyleLoaded()) {
      updateRouteVisibility()
    } else {
      map.once('style.load', updateRouteVisibility)
    }

    return () => {
      if (routeAnimRef.current) cancelAnimationFrame(routeAnimRef.current)
      routeAnimRef.current = null
    }
  }, [showHistoricalRoute])

  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current
    const SOURCE_ID = 'soviet-region-source'
    const LAYER_ID = 'soviet-region-fill'
    const OUTLINE_ID = 'soviet-region-outline'

    if (showSovietRegion) {
      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { name: '海陆惠紫苏区' },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [114.40, 23.72],
                [115.72, 23.72],
                [115.75, 22.78],
                [114.38, 22.80],
                [114.40, 23.72]
              ]]
            }
          }
        })
        map.addLayer({
          id: LAYER_ID,
          type: 'fill',
          source: SOURCE_ID,
          paint: {
            'fill-color': '#C41E3A',
            'fill-opacity': 0.12
          }
        })
        map.addLayer({
          id: OUTLINE_ID,
          type: 'line',
          source: SOURCE_ID,
          paint: {
            'line-color': '#C41E3A',
            'line-width': 2,
            'line-opacity': 0.6,
            'line-dasharray': [4, 3]
          }
        })
      }

      const bounds: [[number, number], [number, number]] = [[114.38, 22.78], [115.75, 23.72]]
      map.fitBounds(bounds, { padding: 100, duration: 2000 })
    } else {
      if (map.getLayer(OUTLINE_ID)) map.removeLayer(OUTLINE_ID)
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    }
  }, [showSovietRegion])

  // DirectorMode: 地图跟随讲解飞行
  useEffect(() => {
    if (!mapRef.current || !isDirectorMode || !selectedPoiId) return
    const archive = archives.find(a => a.id === selectedPoiId)
    if (!archive) return
    mapRef.current.flyTo({
      center: [archive.longitude, archive.latitude],
      zoom: 17,
      pitch: 65,
      bearing: -20,
      duration: 2500,
      essential: true
    })
  }, [selectedPoiId, isDirectorMode])

  // 监听 FPS 模式切换
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    if (isFpsMode) {
      // 进入第一人称模式：拉低视角，贴近地面
      map.flyTo({
        center: [115.3415, 23.3610], // 苏区镇中心
        zoom: 18.5,                  // 极度放大
        pitch: 85,                   // 几乎平视
        bearing: 0,
        duration: 3000,
        essential: true
      })
      
      // 可以开启键盘漫游更灵敏的设置 (MapLibre 默认支持键盘漫游，只是需要配置焦点)
      map.getCanvas().focus()
    } else {
      // 退出第一人称模式：回到高空俯瞰
      map.flyTo({
        center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
        zoom: INITIAL_VIEW_STATE.zoom,
        pitch: INITIAL_VIEW_STATE.pitch,
        bearing: INITIAL_VIEW_STATE.bearing,
        duration: 3000,
        essential: true
      })
    }
  }, [isFpsMode])

  // 全局环境光与编年史大事件剧场联动
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    const updateEnvironment = () => {
      if (!map.isStyleLoaded()) return
      
      if (mapStyle !== 'satellite') return
      
      if (activeEvent === '紫金苏维埃政权成立' || activeEvent === '血战炮子村') {
        map.setPaintProperty('satellite-layer', 'raster-brightness-max', 0.6)
        map.setPaintProperty('satellite-layer', 'raster-saturation', -0.5)
        map.setPaintProperty('satellite-layer', 'raster-hue-rotate', 320)
      } else if (activeEvent === '苏维埃兵工厂建立') {
        map.setPaintProperty('satellite-layer', 'raster-brightness-max', 0.7)
        map.setPaintProperty('satellite-layer', 'raster-saturation', 0.2)
        map.setPaintProperty('satellite-layer', 'raster-hue-rotate', 40)
      } else {
        map.setPaintProperty('satellite-layer', 'raster-brightness-max', 1.0)
        map.setPaintProperty('satellite-layer', 'raster-saturation', 0)
        map.setPaintProperty('satellite-layer', 'raster-hue-rotate', 0)
      }
    }

    if (map.isStyleLoaded()) {
      updateEnvironment()
    } else {
      map.once('style.load', updateEnvironment)
    }
  }, [activeEvent, mapStyle])

  // 渲染/更新 Markers 和 3D 白模
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    const currentArchiveIds = new Set(archives.map(a => a.id))
    Object.keys(markersRef.current).forEach(id => {
      if (!currentArchiveIds.has(id)) {
        const el = markersRef.current[id].getElement()
        if (el && (el as any)._reactRoot) {
          (el as any)._reactRoot.unmount()
        }
        markersRef.current[id].remove()
        delete markersRef.current[id]
        if (selectedPoiId === id) setSelectedPoiId(null)
      }
    })

    // 更新 3D 白模数据源
    const buildingFeatures = archives.map(poi => {
      // 围绕坐标点生成一个小正方形 (模拟建筑占地)
      const offset = 0.0003;
      const color = poi.type === 'revolution' ? '#C41E3A' : 
                    poi.type === 'government' ? '#5C5C5C' : '#8B6914';
      
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
        <div className="relative group cursor-pointer flex flex-col items-center pointer-events-auto">
          <div className={`w-5 h-5 md:w-5 md:h-5 rounded-full shadow-md transition-all duration-300 border-2 border-white ${
            poi.id === selectedPoiId ? 'scale-150 ring-2 ring-[#C41E3A]/40' : 'hover:scale-125'
          }`}
            style={{
              backgroundColor: poi.type === 'revolution' ? '#C41E3A' : 
                             poi.type === 'government' ? '#5C5C5C' : '#8B6914'
            }}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedPoiId(poi.id)
            }}
          />
          <div className={`absolute top-full mt-1.5 whitespace-nowrap text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-[#E8DFD5] text-[#1A1A1A] shadow-sm transition-opacity pointer-events-none ${
            poi.id === selectedPoiId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            {poi.title}
          </div>
        </div>
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

  // 底图切换: 使用 setStyle 而不是销毁组件
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current
    const currentStyle = map.getStyle()
    const targetStyle = MAP_STYLES[mapStyle]
    if (!currentStyle || !currentStyle.name) return
    const isCurrentlySatellite = currentStyle.name?.includes('satellite') || currentStyle.layers?.some((l: any) => l.id === 'satellite-layer')
    if ((mapStyle === 'satellite' && isCurrentlySatellite) || (mapStyle === 'museum' && !isCurrentlySatellite)) return
    if (routeAnimRef.current) {
      cancelAnimationFrame(routeAnimRef.current)
      routeAnimRef.current = null
    }
    setMapLoading(true)
    map.setStyle(targetStyle as maplibregl.StyleSpecification)
    map.once('style.load', () => {
      setMapLoading(false)
      if (!map.getSource('terrain-source')) {
        map.addSource('terrain-source', {
          type: 'raster-dem',
          tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
          encoding: 'terrarium',
          tileSize: 256,
          maxzoom: 14
        })
        map.setTerrain({ source: 'terrain-source', exaggeration: 1.5 })
      }
      if (rebuildRef.current) rebuildRef.current(map)
    })
  }, [mapStyle])

  return (
    <div className={cn('w-full h-full relative', className)}>
      <div ref={mapContainer} className="w-full h-full" />
      {mapLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{ backgroundColor: '#FEFAF6' }}>
          <div className="flex flex-col items-center gap-6">
            <svg width="64" height="64" viewBox="0 0 64 64" className="animate-spin">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#E8DFD5" strokeWidth="3" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#C41E3A" strokeWidth="3" strokeDasharray="176" strokeDashoffset="132" strokeLinecap="round" />
            </svg>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[#C41E3A] font-serif text-lg font-bold tracking-wider">广东省苏区镇数字化档案</span>
              <span className="text-[#8B6914] text-sm tracking-widest">地图加载中</span>
              <div className="flex gap-1.5 mt-3">
                <span className="w-2 h-2 rounded-full bg-[#C41E3A] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#C41E3A] animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-2 h-2 rounded-full bg-[#C41E3A] animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}