import React, { useEffect, useRef, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useAppStore, type ArchiveData } from '@/store'
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

const PoiMarker: React.FC<{ poi: ArchiveData; isSelected: boolean }> = ({ poi, isSelected }) => {
  const baseColor = useMemo(() => {
    switch (poi.type) {
      case 'government': return 'bg-[#5C5C5C] ring-[#5C5C5C]/40'
      case 'revolution': return 'bg-[#C41E3A] ring-[#C41E3A]/40'
      case 'culture': return 'bg-[#8B6914] ring-[#8B6914]/40'
      default: return 'bg-[#5C5C5C] ring-[#5C5C5C]/40'
    }
  }, [poi.type])

  return (
    <div className="relative group cursor-pointer flex flex-col items-center pointer-events-auto">
      <div 
        className={cn(
          "absolute bottom-4 w-[2px] rounded-full bg-gradient-to-t from-[#C41E3A] to-transparent transition-all duration-500",
          isSelected ? "h-32 opacity-60" : "h-0 opacity-0 group-hover:h-20 group-hover:opacity-30"
        )}
      />
      
      <div 
        className={cn(
          "w-5 h-5 rounded-full shadow-md border-2 border-white transition-transform duration-300 ring-2",
          baseColor,
          isSelected ? "scale-150" : "group-hover:scale-125"
        )}
      />
      
      <div 
        className={cn(
          "absolute top-full mt-2 whitespace-nowrap text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-[#E8DFD5] text-[#1A1A1A] shadow-sm transition-opacity",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        {poi.title}
      </div>
    </div>
  )
}

export const GisMap: React.FC<GisMapProps> = ({ className, mapId, initialStyle, onMapLoad }) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Record<string, maplibregl.Marker>>({})
  const tourIntervalRef = useRef<number | null>(null)
  
  const { getAllArchives, setSelectedPoiId, selectedPoiId, isAutoTouring, setAutoTouring, currentYear, mapStyle, isAdminOpen, setDraftCoords, showHistoricalRoute, activeEvent, isFpsMode } = useAppStore()
  
  // 过滤出年份小于等于当前时间轴年份的档案
  const archives = useMemo(() => {
    return getAllArchives().filter(poi => poi.year <= currentYear)
  }, [getAllArchives, currentYear])

  // 自动巡航逻辑 (Orbit Fly)
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    let orbitAnimationFrame: number = 0
    
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
          map.keyboard.enable()
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
        if (isAdminOpen) {
          // 如果处于录入模式，则拾取坐标，不触发点位详情
          setDraftCoords([e.lngLat.lng, e.lngLat.lat])
        } else {
          if (selectedPoiId) setSelectedPoiId(null)
        }
      })
      
      mapRef.current = map
      if (onMapLoad) onMapLoad(map)

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
  }, [])

  // 历史行军路线动画逻辑
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current
    let animationFrameId: number

    const animateDashArray = (step: number) => {
      if (!map.getLayer('historical-route-line')) return

      // MapLibre 的 line-dasharray 格式: [dashLength, gapLength]
      // 我们可以通过不断改变数组的值来产生流动效果
      // 这里采用一个小技巧：设置数组为 [0, dash, gap] 等，但由于版本限制，我们使用简单的不断增减
      // 更好的方式是用 requestAnimationFrame 修改 line-dasharray，或者配合 step 
      const dashLength = 2;
      const gapLength = 2;
      const opacity = 0.5 + 0.5 * Math.sin(step / 10);
      
      if (map.getLayer('historical-route-line')) {
        map.setPaintProperty('historical-route-line', 'line-opacity', opacity);
      }
      
      if (map.getLayer('spark-topology-flow')) {
        // 让辐射流光也动起来
        const sparkOpacity = 0.4 + 0.6 * Math.sin(step / 5);
        map.setPaintProperty('spark-topology-flow', 'line-opacity', sparkOpacity);
      }

      animationFrameId = requestAnimationFrame(() => animateDashArray(step + 1))
    }

    const updateRouteVisibility = () => {
      if (!map.getLayer('historical-route-line')) return
      
      if (showHistoricalRoute) {
        map.setPaintProperty('historical-route-line', 'line-opacity', 0.8)
        map.setPaintProperty('historical-route-line', 'line-dasharray', [2, 2])
        animationFrameId = requestAnimationFrame(() => animateDashArray(0))
        
        // 飞行到路线区域
        map.flyTo({
          center: [115.3350, 23.3550],
          zoom: 13.5,
          pitch: 45,
          duration: 2000
        })
      } else {
        cancelAnimationFrame(animationFrameId)
        map.setPaintProperty('historical-route-line', 'line-opacity', 0)
      }
    }

    if (map.isStyleLoaded()) {
      updateRouteVisibility()
    } else {
      map.once('style.load', updateRouteVisibility)
    }

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [showHistoricalRoute])

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
        <div 
          className={`w-5 h-5 rounded-full shadow-md cursor-pointer transition-all duration-300 border-2 border-white ${
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