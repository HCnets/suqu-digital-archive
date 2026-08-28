/**
 * 地图模型/工具（从 GisMap.tsx 拆分）
 */
import maplibregl from 'maplibre-gl'
import type { PublicMapView } from '@/store'
import type { FeatureCollection, Point } from 'geojson'
import { GUIDE_BOUNDARY, GUIDE_CONTOURS, GUIDE_LINES, GUIDE_POINTS } from './gis-guide-data'
import type { ArchivePointFeature } from './gis-types'
import { getArchiveTypeMeta } from './gis-model-presets'

export const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

export const MAP_STYLES = {
  museum: {
    version: 8,
    sources: {
      'gaode-road': {
        type: 'raster',
        tiles: [
          'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
          'https://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
          'https://webrd03.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
          'https://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        ],
        tileSize: 256,
        attribution: '地图底图 © 高德地图',
      },
      'guide-boundary': {
        type: 'geojson',
        data: GUIDE_BOUNDARY,
      },
      'guide-lines': {
        type: 'geojson',
        data: GUIDE_LINES,
      },
      'guide-contours': {
        type: 'geojson',
        data: GUIDE_CONTOURS,
      },
      'guide-points': {
        type: 'geojson',
        data: GUIDE_POINTS,
      },
    },
    layers: [
      {
        id: 'museum-background',
        type: 'background',
        paint: {
          'background-color': '#F4EDE4'
        }
      },
      {
        id: 'gaode-road-layer',
        type: 'raster',
        source: 'gaode-road',
        minzoom: 0,
        maxzoom: 19,
        paint: {
          'raster-opacity': 0.82,
          'raster-saturation': -0.18,
          'raster-contrast': -0.08,
        },
      },
      {
        id: 'guide-area-fill',
        type: 'fill',
        source: 'guide-boundary',
        paint: {
          'fill-color': '#FDF7EF',
          'fill-opacity': 0.78,
        },
      },
      {
        id: 'guide-area-outline',
        type: 'line',
        source: 'guide-boundary',
        paint: {
          'line-color': '#B8905B',
          'line-width': 2,
          'line-opacity': 0.7,
          'line-dasharray': [3, 2],
        },
      },
      {
        id: 'guide-contours',
        type: 'line',
        source: 'guide-contours',
        paint: {
          'line-color': '#BFA37A',
          'line-width': 1.2,
          'line-opacity': 0.24,
          'line-dasharray': [2, 4],
        },
      },
      {
        id: 'guide-water',
        type: 'line',
        source: 'guide-lines',
        filter: ['==', ['get', 'kind'], 'water'],
        paint: {
          'line-color': '#6BAAC7',
          'line-width': 4,
          'line-opacity': 0.42,
        },
      },
      {
        id: 'guide-road-shadow',
        type: 'line',
        source: 'guide-lines',
        filter: ['==', ['get', 'kind'], 'road'],
        paint: {
          'line-color': '#6B4423',
          'line-width': 8,
          'line-opacity': 0.08,
        },
      },
      {
        id: 'guide-road-casing',
        type: 'line',
        source: 'guide-lines',
        filter: ['==', ['get', 'kind'], 'road'],
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 9,
          'line-opacity': 0.86,
        },
      },
      {
        id: 'guide-road',
        type: 'line',
        source: 'guide-lines',
        filter: ['==', ['get', 'kind'], 'road'],
        paint: {
          'line-color': '#C27B3A',
          'line-width': 4,
          'line-opacity': 0.72,
        },
      },
      {
        id: 'guide-point-halo',
        type: 'circle',
        source: 'guide-points',
        paint: {
          'circle-color': '#FFFFFF',
          'circle-radius': 9,
          'circle-opacity': 0.9,
          'circle-stroke-color': '#D8C4A8',
          'circle-stroke-width': 1,
        },
      },
      {
        id: 'guide-point',
        type: 'circle',
        source: 'guide-points',
        paint: {
          'circle-color': [
            'match',
            ['get', 'kind'],
            'town',
            '#C41E3A',
            'landmark',
            '#0369A1',
            '#8B6914',
          ],
          'circle-radius': [
            'match',
            ['get', 'kind'],
            'town',
            5,
            'landmark',
            4.5,
            4,
          ],
          'circle-opacity': 0.86,
        },
      }
    ]
  } as maplibregl.StyleSpecification,
  satellite: {
    version: 8,
    sources: {
      'gaode-satellite': {
        type: 'raster',
        tiles: [
          'https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
          'https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
          'https://webst03.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
          'https://webst04.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        ],
        tileSize: 256,
        attribution: '地图底图 © 高德地图',
      }
    },
    layers: [
      {
        id: 'satellite-layer',
        type: 'raster',
        source: 'gaode-satellite',
        minzoom: 0,
        maxzoom: 18,
      }
    ]
  } as maplibregl.StyleSpecification
}

export const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 0,
  zoom: 2,
  pitch: 0,
  bearing: 0,
}

export const getMapView = (view?: Partial<PublicMapView>): PublicMapView => ({
  longitude: Number.isFinite(Number(view?.longitude)) ? Number(view?.longitude) : INITIAL_VIEW_STATE.longitude,
  latitude: Number.isFinite(Number(view?.latitude)) ? Number(view?.latitude) : INITIAL_VIEW_STATE.latitude,
  zoom: Number.isFinite(Number(view?.zoom)) ? Number(view?.zoom) : INITIAL_VIEW_STATE.zoom,
  pitch: Number.isFinite(Number(view?.pitch)) ? Number(view?.pitch) : INITIAL_VIEW_STATE.pitch,
  bearing: Number.isFinite(Number(view?.bearing)) ? Number(view?.bearing) : INITIAL_VIEW_STATE.bearing,
})

export const getDisplayModeLabel = (mode: string) => {
  if (mode === 'overview') return '地区总览'
  if (mode === 'auto_location') return '定位推荐'
  return '当前地区'
}

export const getMapModeLabel = (mode: string) => {
  if (mode === 'aggregate') return '聚合地图'
  if (mode === 'mixed') return '混合地图'
  return '单地区地图'
}

export const getArchivePointData = (
  archives: Array<{ id: string; title: string; type: string; longitude: number; latitude: number }>,
  selectedPoiId: string | null,
): FeatureCollection<Point, ArchivePointFeature['properties']> => ({
  type: 'FeatureCollection',
  features: archives.map((poi) => ({
    type: 'Feature',
    properties: {
      id: poi.id,
      title: poi.title,
      type: poi.type,
      typeLabel: getArchiveTypeMeta(poi.type).label,
      selected: poi.id === selectedPoiId,
    },
    geometry: {
      type: 'Point',
      coordinates: [poi.longitude, poi.latitude],
    },
  })),
})

export const addSourceIfMissing = (map: maplibregl.Map, id: string, source: maplibregl.SourceSpecification) => {
  if (!map.getSource(id)) map.addSource(id, source)
}

export const addLayerIfMissing = (map: maplibregl.Map, layer: maplibregl.LayerSpecification, beforeId?: string) => {
  if (!map.getLayer(layer.id)) map.addLayer(layer, beforeId)
}

export const getMapStyle = (style: string) => {
  if (style === 'satellite') return MAP_STYLES.satellite
  return MAP_STYLES.museum
}

export const ensureGuideMapLayers = (map: maplibregl.Map) => {
  addSourceIfMissing(map, 'guide-boundary', {
    type: 'geojson',
    data: GUIDE_BOUNDARY,
  })
  addSourceIfMissing(map, 'guide-lines', {
    type: 'geojson',
    data: GUIDE_LINES,
  })
  addSourceIfMissing(map, 'guide-contours', {
    type: 'geojson',
    data: GUIDE_CONTOURS,
  })
  addSourceIfMissing(map, 'guide-points', {
    type: 'geojson',
    data: GUIDE_POINTS,
  })

  const firstSymbolLayerId = map.getStyle().layers?.find(layer => layer.type === 'symbol')?.id

  addLayerIfMissing(map, {
    id: 'guide-area-fill',
    type: 'fill',
    source: 'guide-boundary',
    paint: {
      'fill-color': '#FDF7EF',
      'fill-opacity': 0.48,
    },
  }, firstSymbolLayerId)

  addLayerIfMissing(map, {
    id: 'guide-area-outline',
    type: 'line',
    source: 'guide-boundary',
    paint: {
      'line-color': '#B8905B',
      'line-width': 1.5,
      'line-opacity': 0.56,
      'line-dasharray': [3, 2],
    },
  }, firstSymbolLayerId)

  addLayerIfMissing(map, {
    id: 'guide-road-casing',
    type: 'line',
    source: 'guide-lines',
    filter: ['==', ['get', 'kind'], 'road'],
    paint: {
      'line-color': '#FFFFFF',
      'line-width': 7,
      'line-opacity': 0.72,
    },
  }, firstSymbolLayerId)

  addLayerIfMissing(map, {
    id: 'guide-road',
    type: 'line',
    source: 'guide-lines',
    filter: ['==', ['get', 'kind'], 'road'],
    paint: {
      'line-color': '#C27B3A',
      'line-width': 3,
      'line-opacity': 0.64,
    },
  }, firstSymbolLayerId)

  addLayerIfMissing(map, {
    id: 'guide-point-halo',
    type: 'circle',
    source: 'guide-points',
    paint: {
      'circle-color': '#FFFFFF',
      'circle-radius': 8,
      'circle-opacity': 0.9,
      'circle-stroke-color': '#D8C4A8',
      'circle-stroke-width': 1,
    },
  }, firstSymbolLayerId)

  addLayerIfMissing(map, {
    id: 'guide-point',
    type: 'circle',
    source: 'guide-points',
    paint: {
      'circle-color': [
        'match',
        ['get', 'kind'],
        'town',
        '#C41E3A',
        'landmark',
        '#0369A1',
        '#8B6914',
      ],
      'circle-radius': [
        'match',
        ['get', 'kind'],
        'town',
        5,
        'landmark',
        4.5,
        4,
      ],
      'circle-opacity': 0.88,
    },
  }, firstSymbolLayerId)
}
