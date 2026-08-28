/**
 * 地图模型/工具（从 GisMap.tsx 拆分）
 */
import type { Feature, LineString, Point, Polygon } from 'geojson'

export type BuildingFeature = Feature<Polygon, { color: string; height: number }>

export type ArchivePointFeature = Feature<Point, { id: string; title: string; type: string; typeLabel: string; selected: boolean }>

export type GuideLineFeature = Feature<LineString, { kind: 'road' | 'water'; name: string }>

export type GuidePointFeature = Feature<Point, { name: string; kind: 'town' | 'village' | 'landmark' }>

export type GuideContourFeature = Feature<LineString, { name: string }>

export type ArchiveModelKind =
  | 'redCourtyard'
  | 'memorial'
  | 'pavilion'
  | 'plaqueWall'
  | 'meetingHouse'
  | 'workshop'
  | 'clinic'
  | 'exhibitionHall'
  | 'plaza'
  | 'academy'
  | 'campus'
  | 'governmentHall'
  | 'battlefield'
  | 'transportStation'

export type ArchiveModelPreset = {
  kind: ArchiveModelKind
  label: string
  body: string
  roof: string
  accent: string
  base: string
  width: number
  height: number
  offsetY: number
  footprintOffset: number
  extrusionHeight: number
}
