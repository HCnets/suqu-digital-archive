/**
 * 地图模型/工具（从 GisMap.tsx 拆分）
 */
import type { FeatureCollection, LineString, Point, Polygon } from 'geojson'
import type { GuideContourFeature, GuideLineFeature, GuidePointFeature } from './gis-types'

export const GUIDE_BOUNDARY: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [115.318, 23.339],
          [115.365, 23.335],
          [115.382, 23.356],
          [115.371, 23.382],
          [115.338, 23.391],
          [115.309, 23.369],
          [115.318, 23.339],
        ]],
      },
    },
  ],
}

export const GUIDE_LINES: FeatureCollection<LineString, GuideLineFeature['properties']> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { kind: 'road', name: '苏区红色导览主线' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [115.323, 23.349],
          [115.333, 23.356],
          [115.342, 23.361],
          [115.353, 23.365],
          [115.367, 23.374],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { kind: 'road', name: '村落联络线' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [115.331, 23.379],
          [115.341, 23.365],
          [115.349, 23.351],
          [115.360, 23.342],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { kind: 'road', name: '旧址寻访环线' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [115.322, 23.365],
          [115.331, 23.378],
          [115.346, 23.383],
          [115.364, 23.372],
          [115.359, 23.352],
          [115.341, 23.361],
          [115.322, 23.365],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { kind: 'road', name: '纪念节点支线' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [115.318, 23.354],
          [115.329, 23.359],
          [115.338, 23.366],
          [115.350, 23.374],
          [115.370, 23.379],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { kind: 'water', name: '苏区溪流示意' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [115.315, 23.377],
          [115.329, 23.370],
          [115.343, 23.363],
          [115.358, 23.355],
          [115.376, 23.349],
        ],
      },
    },
  ],
}

export const GUIDE_CONTOURS: FeatureCollection<LineString, GuideContourFeature['properties']> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: '北部山地轮廓' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [115.312, 23.382],
          [115.326, 23.388],
          [115.347, 23.389],
          [115.368, 23.383],
          [115.379, 23.371],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: '中部谷地轮廓' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [115.314, 23.368],
          [115.330, 23.373],
          [115.349, 23.369],
          [115.366, 23.360],
          [115.380, 23.353],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: '南部村落轮廓' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [115.319, 23.345],
          [115.337, 23.349],
          [115.354, 23.347],
          [115.370, 23.340],
        ],
      },
    },
  ],
}

export const GUIDE_POINTS: FeatureCollection<Point, GuidePointFeature['properties']> = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: '苏区镇', kind: 'town' }, geometry: { type: 'Point', coordinates: [115.3415, 23.3610] } },
    { type: 'Feature', properties: { name: '炮子村', kind: 'village' }, geometry: { type: 'Point', coordinates: [115.3260, 23.3525] } },
    { type: 'Feature', properties: { name: '青溪村', kind: 'village' }, geometry: { type: 'Point', coordinates: [115.3590, 23.3515] } },
    { type: 'Feature', properties: { name: '赤溪村', kind: 'village' }, geometry: { type: 'Point', coordinates: [115.3310, 23.3780] } },
    { type: 'Feature', properties: { name: '龙上村', kind: 'village' }, geometry: { type: 'Point', coordinates: [115.3660, 23.3720] } },
    { type: 'Feature', properties: { name: '永坑村', kind: 'village' }, geometry: { type: 'Point', coordinates: [115.3560, 23.3415] } },
    { type: 'Feature', properties: { name: '游客服务点', kind: 'landmark' }, geometry: { type: 'Point', coordinates: [115.3435, 23.3580] } },
    { type: 'Feature', properties: { name: '纪念广场', kind: 'landmark' }, geometry: { type: 'Point', coordinates: [115.3510, 23.3665] } },
  ],
}

export const GUIDE_LABELS = GUIDE_POINTS.features.map(feature => ({
  id: feature.properties.name,
  name: feature.properties.name,
  kind: feature.properties.kind,
  longitude: feature.geometry.coordinates[0],
  latitude: feature.geometry.coordinates[1],
}))
