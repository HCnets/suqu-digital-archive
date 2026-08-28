/**
 * 苏区红色地图组件（helpers 已拆到 gis-* 文件）
 */
import React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import maplibregl from 'maplibre-gl'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import { ensureGuideMapLayers, escapeHtml, getArchivePointData, getDisplayModeLabel, getMapModeLabel, getMapStyle, getMapView } from './gis-map-utils'
import { ARCHIVE_TYPE_META, ArchiveModelMarker, getArchiveModelPreset, getArchiveTypeMeta } from './gis-model-presets'
import type { BuildingFeature } from './gis-types'
import { GUIDE_LABELS } from './gis-guide-data'

export const GisMap: React.FC<GisMapProps> = ({ className, initialStyle, onMapLoad, timeLockYear }) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const archiveInteractionsReadyRef = useRef(false)
  const guideLabelRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const archiveModelRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const guideLabelFrameRef = useRef<number | null>(null)
  const [mapLoading, setMapLoading] = useState(true)
  const [mapInstanceVersion, setMapInstanceVersion] = useState(0)
  
  const { archives: storeArchives, getAllArchives, setSelectedPoiId, selectedPoiId, currentYear, mapStyle, isFpsMode, isDirectorMode, regionConfig, selectedRegionId, selectRegion } = useAppStore()
  
  const selectedPoiIdRef = useRef(selectedPoiId)
  useEffect(() => { selectedPoiIdRef.current = selectedPoiId }, [selectedPoiId])
  const rebuildRef = useRef<((map: maplibregl.Map) => void) | null>(null)
  const appliedRegionViewRef = useRef('')
  const configuredMapView = useMemo(() => getMapView(regionConfig.mapView), [regionConfig.mapView])
  const regionName = regionConfig.defaultRegion?.fullName || regionConfig.defaultRegion?.name || '未配置地区'
  
  // 过滤出年份小于等于当前时间轴年份的档案
  // timeLockYear 用于时空对照的历史侧：锁定只看某一年份及以前建立的点位
  // storeArchives 作为依赖确保档案数据加载后触发重新计算
  const effectiveYear = timeLockYear ?? currentYear
  const archives = useMemo(
    () => getAllArchives().filter(poi => poi.year <= effectiveYear),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveYear, getAllArchives, storeArchives]
  )

  const archiveTypeStats = useMemo(() => {
    return archives.reduce<Record<keyof typeof ARCHIVE_TYPE_META, number>>((acc, poi) => {
      const type = poi.type === 'government' || poi.type === 'culture' || poi.type === 'revolution' ? poi.type : 'revolution'
      acc[type] += 1
      return acc
    }, { revolution: 0, government: 0, culture: 0 })
  }, [archives])

  const selectArchivePoint = React.useCallback((archive: (typeof archives)[number]) => {
    setSelectedPoiId(archive.id)

    const map = mapRef.current
    if (!map) return

    popupRef.current?.remove()
    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 18,
      className: 'suqu-archive-popup',
    })
      .setLngLat([archive.longitude, archive.latitude])
      .setHTML(`
        <div style="min-width:150px;max-width:220px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="font-size:12px;color:#8B6914;margin-bottom:4px;">${escapeHtml(getArchiveTypeMeta(archive.type).label)}</div>
          <div style="font-size:14px;line-height:1.45;font-weight:700;color:#1A1A1A;">${escapeHtml(archive.title || '档案点位')}</div>
          <div style="margin-top:8px;font-size:12px;color:#5C5C5C;">已定位到档案点位</div>
        </div>
      `)
      .addTo(map)
  }, [setSelectedPoiId])

  // 初始化地图
  useEffect(() => {
    if (!mapContainer.current) return
    if (mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: getMapStyle(initialStyle || mapStyle),
      center: [configuredMapView.longitude, configuredMapView.latitude],
      zoom: configuredMapView.zoom,
      pitch: configuredMapView.pitch,
      bearing: configuredMapView.bearing,
      attributionControl: false,
      interactive: true,
      fadeDuration: 0,
      refreshExpiredTiles: false,
      maxTileCacheSize: 256,
      maxTileCacheZoomLevels: 8,
      cancelPendingTileRequestsWhileZooming: true,
    })

    map.addControl(new maplibregl.NavigationControl({
      visualizePitch: true
    }), 'bottom-right')

    const loadFallback = window.setTimeout(() => {
      setMapLoading(false)
    }, 2000)

    map.on('load', () => {
      window.clearTimeout(loadFallback)
      setMapLoading(false)
      if (rebuildRef.current) rebuildRef.current(map)
      setMapInstanceVersion(version => version + 1)

      // 添加 3D 建筑图层 (如果底图支持)
      if (map.getSource('openmaptiles') || map.getSource('carto')) {
        const layers = map.getStyle().layers;
        let labelLayerId;
        for (let i = 0; i < layers.length; i++) {
          const layout = layers[i].layout as { 'text-field'?: unknown } | undefined
          if (layers[i].type === 'symbol' && layout?.['text-field']) {
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

    map.on('click', (event) => {
      if (map.getLayer('archive-points-layer')) {
        const clickedArchivePoint = map.queryRenderedFeatures(event.point, {
          layers: ['archive-points-layer', 'archive-points-halo', 'archive-points-hit'],
        })
        if (clickedArchivePoint.length > 0) return
      }
      popupRef.current?.remove()
      popupRef.current = null
      if (selectedPoiIdRef.current) setSelectedPoiId(null)
    })
      
      mapRef.current = map
      setMapInstanceVersion(version => version + 1)
      if (onMapLoad) onMapLoad(map)

      return () => {
        window.clearTimeout(loadFallback)
        popupRef.current?.remove()
        popupRef.current = null
        archiveInteractionsReadyRef.current = false
        map.remove()
        mapRef.current = null
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialStyle, onMapLoad, setSelectedPoiId])

  useEffect(() => {
    if (!mapRef.current || isFpsMode) return
    const map = mapRef.current
    const viewKey = `${regionConfig.defaultRegion?.id || 'none'}:${configuredMapView.longitude}:${configuredMapView.latitude}:${configuredMapView.zoom}:${configuredMapView.pitch}:${configuredMapView.bearing}`
    if (appliedRegionViewRef.current === viewKey) return

    const applyRegionView = () => {
      const nextView = {
        center: [configuredMapView.longitude, configuredMapView.latitude] as [number, number],
        zoom: configuredMapView.zoom,
        pitch: configuredMapView.pitch,
        bearing: configuredMapView.bearing,
      }
      // 统一用 jumpTo：flyTo 在 style 未加载完成时可能失效（高德瓦片在 localhost 下被拒导致 style 永不 loaded）
      map.jumpTo(nextView)
      appliedRegionViewRef.current = viewKey
      window.requestAnimationFrame(() => {
        setMapInstanceVersion(version => version + 1)
      })
    }

    // 直接定位：jumpTo/flyTo 不依赖 style 加载完成（高德瓦片在本地/localhost 下可能被拒导致 style 永不 loaded）
    applyRegionView()
    if (!map.isStyleLoaded()) {
      // style 若最终加载完成，再对齐一次视图确保瓦片就位
      map.once('load', () => {
        if (appliedRegionViewRef.current === viewKey) {
          const nextView = {
            center: [configuredMapView.longitude, configuredMapView.latitude] as [number, number],
            zoom: configuredMapView.zoom,
            pitch: configuredMapView.pitch,
            bearing: configuredMapView.bearing,
          }
          map.jumpTo(nextView)
        }
      })
    }
  }, [configuredMapView, isFpsMode, regionConfig.defaultRegion?.id])
  // 初始化地图图层
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

  const initSources = () => {
      if (mapStyle === 'museum') {
        ensureGuideMapLayers(map)
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
          'minzoom': 11.5,
          'paint': {
            // 使用 feature properties 里的颜色
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              11.5,
              0,
              13.5,
              ['get', 'height'],
            ],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.72,
            'fill-extrusion-vertical-gradient': false
          }
        });
      }

      if (!map.getSource('archive-points')) {
        map.addSource('archive-points', {
          type: 'geojson',
          data: getArchivePointData(archives, selectedPoiIdRef.current),
        })

        map.addLayer({
          id: 'archive-points-hit',
          type: 'circle',
          source: 'archive-points',
          paint: {
            'circle-color': '#FFFFFF',
            'circle-radius': ['case', ['get', 'selected'], 20, 14],
            'circle-opacity': 0.01,
          },
        })

        map.addLayer({
          id: 'archive-points-halo',
          type: 'circle',
          source: 'archive-points',
          paint: {
            'circle-color': '#FFFFFF',
            'circle-radius': ['case', ['get', 'selected'], 14, 10],
            'circle-opacity': 0.95,
            'circle-stroke-color': '#D8C4A8',
            'circle-stroke-width': 1,
          },
        })

        map.addLayer({
          id: 'archive-points-layer',
          type: 'circle',
          source: 'archive-points',
          paint: {
            'circle-color': [
              'match',
              ['get', 'type'],
              'revolution',
              ARCHIVE_TYPE_META.revolution.color,
              'government',
              ARCHIVE_TYPE_META.government.color,
              ARCHIVE_TYPE_META.culture.color,
            ],
            'circle-radius': ['case', ['get', 'selected'], 9, 6.5],
            'circle-stroke-color': '#FFFFFF',
            'circle-stroke-width': 2,
            'circle-opacity': 0.96,
          },
        })

        if (!archiveInteractionsReadyRef.current) {
          map.on('mouseenter', 'archive-points-hit', () => {
            map.getCanvas().style.cursor = 'pointer'
          })
          map.on('mouseleave', 'archive-points-hit', () => {
            map.getCanvas().style.cursor = ''
          })
          map.on('click', 'archive-points-hit', (event) => {
            const feature = event.features?.[0]
            if (!feature) return
            const id = feature?.properties?.id
            const geometry = feature?.geometry
            if (typeof id !== 'string' || geometry?.type !== 'Point') return
            const [longitude, latitude] = geometry.coordinates as [number, number]
            const title = escapeHtml(feature.properties?.title || '档案点位')
            const typeLabel = escapeHtml(feature.properties?.typeLabel || '红色档案')

            setSelectedPoiId(id)
            popupRef.current?.remove()
            popupRef.current = new maplibregl.Popup({
              closeButton: false,
              closeOnClick: false,
              offset: 18,
              className: 'suqu-archive-popup',
            })
              .setLngLat([longitude, latitude])
              .setHTML(`
                <div style="min-width:150px;max-width:220px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  <div style="font-size:12px;color:#8B6914;margin-bottom:4px;">${typeLabel}</div>
                  <div style="font-size:14px;line-height:1.45;font-weight:700;color:#1A1A1A;">${title}</div>
                  <div style="margin-top:8px;font-size:12px;color:#5C5C5C;">已定位到档案点位</div>
                </div>
              `)
              .addTo(map)
          })
          archiveInteractionsReadyRef.current = true
        }
      }

      if (map.getSource('archive-points')) {
        (map.getSource('archive-points') as maplibregl.GeoJSONSource).setData(
          getArchivePointData(archives, selectedPoiIdRef.current),
        )
      }
    }

    let initialLayerFallback: number | undefined
    const initSourcesIfReady = () => {
      if (!map.isStyleLoaded()) return
      initSources()
    }

    if (map.isStyleLoaded()) {
      initSources()
    } else {
      map.once('style.load', initSourcesIfReady)
      map.once('load', initSourcesIfReady)
      initialLayerFallback = window.setTimeout(initSourcesIfReady, 1200)
    }

    rebuildRef.current = initSources
    return () => {
      if (initialLayerFallback) window.clearTimeout(initialLayerFallback)
      map.off('style.load', initSourcesIfReady)
      map.off('load', initSourcesIfReady)
    }
  }, [archives, mapInstanceVersion, mapStyle, setSelectedPoiId])

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
  }, [archives, selectedPoiId, isDirectorMode])

  useEffect(() => {
    if (selectedPoiId) return
    popupRef.current?.remove()
    popupRef.current = null
  }, [selectedPoiId])

  // 监听 FPS 模式切换
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    if (isFpsMode) {
      // 进入第一人称模式：拉低视角，贴近地面
      map.flyTo({
        center: [configuredMapView.longitude, configuredMapView.latitude],
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
        center: [configuredMapView.longitude, configuredMapView.latitude],
        zoom: configuredMapView.zoom,
        pitch: configuredMapView.pitch,
        bearing: configuredMapView.bearing,
        duration: 3000,
        essential: true
      })
    }
  }, [configuredMapView, isFpsMode])

  // 更新档案点位和 3D 白模
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    // 更新 3D 白模数据源
    const isCompactViewport = typeof window !== 'undefined' && window.innerWidth < 640
    const shouldShowDepthMarkers = !isCompactViewport
    const buildingFeatures: BuildingFeature[] = shouldShowDepthMarkers ? archives.map(poi => {
      const preset = getArchiveModelPreset(poi)
      const offset = preset.footprintOffset
      return {
        type: 'Feature',
        properties: {
          color: preset.base,
          height: preset.extrusionHeight,
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
    }) : [];

    if (map.isStyleLoaded() && map.getSource('poi-3d-buildings')) {
      (map.getSource('poi-3d-buildings') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: buildingFeatures
      });
    }
    if (map.isStyleLoaded() && map.getSource('archive-points')) {
      (map.getSource('archive-points') as maplibregl.GeoJSONSource).setData(getArchivePointData(archives, selectedPoiId))
    }
  }, [archives, mapInstanceVersion, selectedPoiId])

  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    const setHeavyLayerVisibility = (visibility: 'visible' | 'none') => {
      if (map.getLayer('poi-3d-buildings-layer')) {
        map.setLayoutProperty('poi-3d-buildings-layer', 'visibility', visibility)
      }
    }

    const positionGuideLabels = () => {
      guideLabelFrameRef.current = null
      setHeavyLayerVisibility('visible')
      const shouldShowLabels = mapStyle === 'museum' && map.getZoom() >= 10.8
      GUIDE_LABELS.forEach((label) => {
        const element = guideLabelRefs.current[label.id]
        if (!element) return
        if (!shouldShowLabels) {
          element.style.opacity = '0'
          element.style.visibility = 'hidden'
          return
        }
        const point = map.project([label.longitude, label.latitude])
        const yOffset = label.kind === 'town' ? -24 : 18
        element.style.opacity = '1'
        element.style.visibility = 'visible'
        element.style.transform = `translate3d(${Math.round(point.x)}px, ${Math.round(point.y + yOffset)}px, 0) translate(-50%, -50%)`
      })

      const shouldShowModels = map.getZoom() >= 11.2
      archives.forEach((archive) => {
        const element = archiveModelRefs.current[archive.id]
        if (!element) return
        if (!shouldShowModels) {
          element.style.opacity = '0'
          element.style.visibility = 'hidden'
          return
        }
        const point = map.project([archive.longitude, archive.latitude])
        const modelPreset = getArchiveModelPreset(archive)
        element.style.opacity = '1'
        element.style.visibility = 'visible'
        element.style.transform = `translate3d(${Math.round(point.x)}px, ${Math.round(point.y - modelPreset.offsetY)}px, 0) translate(-50%, -100%)`
      })
    }

    const hideGuideLabels = () => {
      setHeavyLayerVisibility('none')
      GUIDE_LABELS.forEach((label) => {
        const element = guideLabelRefs.current[label.id]
        if (!element) return
        element.style.opacity = '0'
        element.style.visibility = 'hidden'
      })
      archives.forEach((archive) => {
        const element = archiveModelRefs.current[archive.id]
        if (!element) return
        element.style.opacity = '0'
        element.style.visibility = 'hidden'
      })
    }

    const scheduleGuideLabelPosition = () => {
      if (guideLabelFrameRef.current !== null) return
      guideLabelFrameRef.current = window.requestAnimationFrame(positionGuideLabels)
    }

    scheduleGuideLabelPosition()
    // rAF 兜底：页面后台/低功耗时 rAF 可能暂停，用 setTimeout 保证 marker 最终定位（幂等，无副作用）
    const labelFallback = window.setTimeout(positionGuideLabels, 400)
    map.on('movestart', hideGuideLabels)
    map.on('dragstart', hideGuideLabels)
    map.on('zoomstart', hideGuideLabels)
    map.on('moveend', scheduleGuideLabelPosition)
    map.on('zoomend', scheduleGuideLabelPosition)
    map.on('rotateend', scheduleGuideLabelPosition)
    map.on('pitchend', scheduleGuideLabelPosition)
    map.on('resize', scheduleGuideLabelPosition)
    return () => {
      window.clearTimeout(labelFallback)
      map.off('movestart', hideGuideLabels)
      map.off('dragstart', hideGuideLabels)
      map.off('zoomstart', hideGuideLabels)
      map.off('moveend', scheduleGuideLabelPosition)
      map.off('zoomend', scheduleGuideLabelPosition)
      map.off('rotateend', scheduleGuideLabelPosition)
      map.off('pitchend', scheduleGuideLabelPosition)
      map.off('resize', scheduleGuideLabelPosition)
      if (guideLabelFrameRef.current !== null) {
        window.cancelAnimationFrame(guideLabelFrameRef.current)
        guideLabelFrameRef.current = null
      }
    }
  }, [archives, mapInstanceVersion, mapStyle])

  // 底图切换: 使用 setStyle 而不是销毁组件
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current
    const currentStyle = map.getStyle()
    const targetStyle = getMapStyle(mapStyle)
    if (!currentStyle || !currentStyle.layers) return
    // 通过 raster 图层 ID 判断当前底图类型（不依赖可选的 style.name 字段）
    const isCurrentlySatellite = currentStyle.layers?.some((layer) => layer.id === 'satellite-layer') ?? false
    if ((mapStyle === 'satellite' && isCurrentlySatellite) || (mapStyle === 'museum' && !isCurrentlySatellite)) return
    setMapLoading(true)
    popupRef.current?.remove()
    popupRef.current = null
    archiveInteractionsReadyRef.current = false

    let finished = false
    const finishStyleSwitch = () => {
      if (finished) return
      finished = true
      if (styleFallback !== undefined) window.clearTimeout(styleFallback)
      setMapLoading(false)
      if (rebuildRef.current) rebuildRef.current(map)
      setMapInstanceVersion(version => version + 1)
    }
    const styleFallback: number = window.setTimeout(finishStyleSwitch, 2500)
    map.once('style.load', finishStyleSwitch)
    map.setStyle(targetStyle as maplibregl.StyleSpecification)
    return () => {
      window.clearTimeout(styleFallback)
      map.off('style.load', finishStyleSwitch)
    }
  }, [mapStyle])

  return (
    <div className={cn('w-full h-full relative', className)}>
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute inset-0 z-20 pointer-events-none">
        {archives.map(archive => {
          return (
            <button
              key={archive.id}
              type="button"
              data-archive-model="true"
              ref={(node) => { archiveModelRefs.current[archive.id] = node }}
              className="pointer-events-auto absolute left-0 top-0 cursor-pointer border-0 bg-transparent p-0 text-left transition-opacity duration-150 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C41E3A]/30"
              aria-label={`查看${archive.title}档案点位简介`}
              onClick={(event) => {
                event.stopPropagation()
                selectArchivePoint(archive)
              }}
              style={{
                opacity: 0,
                transform: 'translate3d(-9999px, -9999px, 0) translate(-50%, -100%)',
                visibility: 'hidden',
                willChange: 'transform',
              }}
            >
              <ArchiveModelMarker archive={archive} />
            </button>
          )
        })}
        {mapStyle === 'museum' && GUIDE_LABELS.map(label => (
          <div
            key={label.id}
            data-guide-label="true"
            ref={(node) => { guideLabelRefs.current[label.id] = node }}
            className={`absolute left-0 top-0 flex items-center gap-1 rounded-full border bg-white/90 px-2.5 py-1 text-xs font-semibold shadow-sm transition-opacity duration-150 ${
              label.kind === 'town'
                ? 'border-[#C41E3A]/30 text-[#C41E3A]'
                : label.kind === 'landmark'
                  ? 'border-[#0369A1]/25 text-[#0369A1]'
                  : 'border-[#D8C4A8] text-[#7A5A16]'
            }`}
            style={{
              opacity: 0,
              transform: 'translate3d(-9999px, -9999px, 0) translate(-50%, -50%)',
              willChange: 'transform',
            }}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${
              label.kind === 'town'
                ? 'bg-[#C41E3A]'
                : label.kind === 'landmark'
                  ? 'bg-[#0369A1]'
                  : 'bg-[#8B6914]'
            }`} />
            {label.name}
          </div>
        ))}
      </div>
      <div className="absolute left-[410px] right-[360px] top-28 z-20 hidden pointer-events-none md:block">
        <div className="border border-white/70 bg-white/90 px-3.5 py-2.5 shadow-lg shadow-black/5 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] md:text-xs leading-tight text-[#5C5C5C]">
            {regionConfig.regions.length > 1 ? (
              <select
                className="pointer-events-auto max-w-[150px] border border-[#E8DFD5] bg-white px-2 py-1 text-[#1A1A1A] outline-none sm:max-w-[220px]"
                value={selectedRegionId || regionConfig.defaultRegion?.id || ''}
                onChange={event => { void selectRegion(event.target.value) }}
                aria-label="切换展示地区"
              >
                {regionConfig.regions.map(region => (
                  <option key={region.id} value={region.id}>{region.fullName || region.name}</option>
                ))}
              </select>
            ) : (
              <span className="font-semibold text-[#1A1A1A]">{regionName}</span>
            )}
            <span>{getDisplayModeLabel(regionConfig.displayMode)}</span>
            <span>{getMapModeLabel(regionConfig.mapMode)}</span>
            <span className="font-semibold text-[#1A1A1A]">{archives.length} 个已发布点位</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ARCHIVE_TYPE_META.revolution.color }} />
              {ARCHIVE_TYPE_META.revolution.label} {archiveTypeStats.revolution}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ARCHIVE_TYPE_META.government.color }} />
              {ARCHIVE_TYPE_META.government.label} {archiveTypeStats.government}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ARCHIVE_TYPE_META.culture.color }} />
              {ARCHIVE_TYPE_META.culture.label} {archiveTypeStats.culture}
            </span>
          </div>
        </div>
      </div>
      <div className="absolute left-4 top-48 z-20 pointer-events-none md:hidden">
        <div className="border border-white/70 bg-white/90 px-3 py-2 shadow-lg shadow-black/5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#1A1A1A]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ARCHIVE_TYPE_META.revolution.color }} />
            <span>{archives.length} 个红色阵地</span>
          </div>
        </div>
      </div>
      {mapLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{ backgroundColor: '#FEFAF6' }}>
          <div className="flex flex-col items-center gap-6">
            <svg width="64" height="64" viewBox="0 0 64 64" className="animate-spin">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#E8DFD5" strokeWidth="3" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#C41E3A" strokeWidth="3" strokeDasharray="176" strokeDashoffset="132" strokeLinecap="round" />
            </svg>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[#C41E3A] font-serif text-lg font-bold tracking-wider">
                {regionName === '未配置地区' ? '红色文化数字档案' : `${regionName}数字化档案`}
              </span>
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

interface GisMapProps {
  className?: string
  mapId?: string
  initialStyle?: string
  onMapLoad?: (map: maplibregl.Map) => void
  /** 历史时间锁定：传入年份时，本图仅显示该年份及以前建立的点位（用于时空对照的历史侧） */
  timeLockYear?: number
}
