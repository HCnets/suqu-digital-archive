/**
 * 地图模型/工具（从 GisMap.tsx 拆分）
 */
import React from 'react'
import type { ArchiveModelPreset } from './gis-types'

export const ARCHIVE_TYPE_META = {
  revolution: { label: '革命旧址', color: '#C41E3A' },
  government: { label: '政权机关', color: '#4B5563' },
  culture: { label: '文化记忆', color: '#8B6914' },
} as const

export const getArchiveTypeMeta = (type: string) => {
  if (type === 'government' || type === 'culture' || type === 'revolution') return ARCHIVE_TYPE_META[type]
  return ARCHIVE_TYPE_META.revolution
}

export const MODEL_PRESETS: Record<string, ArchiveModelPreset> = {
  'suqu-red-house': {
    kind: 'redCourtyard',
    label: '红屋',
    body: '#9F2F2C',
    roof: '#5E4A3C',
    accent: '#F2D6B5',
    base: '#B64236',
    width: 62,
    height: 58,
    offsetY: 38,
    footprintOffset: 0.00034,
    extrusionHeight: 78,
  },
  'blood-field': {
    kind: 'battlefield',
    label: '血田',
    body: '#7E8F62',
    roof: '#B23A32',
    accent: '#E9D4A7',
    base: '#557A3E',
    width: 62,
    height: 48,
    offsetY: 28,
    footprintOffset: 0.00042,
    extrusionHeight: 26,
  },
  'zijin-farmers-association': {
    kind: 'plaqueWall',
    label: '农会',
    body: '#9A4B3D',
    roof: '#6A4A34',
    accent: '#E7C85C',
    base: '#B87555',
    width: 58,
    height: 43,
    offsetY: 27,
    footprintOffset: 0.0003,
    extrusionHeight: 42,
  },
  'suqu-monument': {
    kind: 'memorial',
    label: '纪念碑',
    body: '#C8B69B',
    roof: '#9B3D2C',
    accent: '#B68A2D',
    base: '#D8C4A8',
    width: 52,
    height: 62,
    offsetY: 42,
    footprintOffset: 0.00028,
    extrusionHeight: 86,
  },
  'red-army-pavilion': {
    kind: 'pavilion',
    label: '红军亭',
    body: '#C9493A',
    roof: '#9D3F23',
    accent: '#F0C45B',
    base: '#C8B69B',
    width: 58,
    height: 51,
    offsetY: 33,
    footprintOffset: 0.00028,
    extrusionHeight: 58,
  },
  'zijin-party-committee': {
    kind: 'meetingHouse',
    label: '县委',
    body: '#B74C3F',
    roof: '#6A4A34',
    accent: '#F2D6B5',
    base: '#B8905B',
    width: 60,
    height: 48,
    offsetY: 30,
    footprintOffset: 0.00032,
    extrusionHeight: 52,
  },
  'soviet-arsenal': {
    kind: 'workshop',
    label: '兵工厂',
    body: '#8C7866',
    roof: '#5F5146',
    accent: '#D6B36A',
    base: '#A9774F',
    width: 58,
    height: 45,
    offsetY: 29,
    footprintOffset: 0.00034,
    extrusionHeight: 46,
  },
  'red-army-hospital': {
    kind: 'clinic',
    label: '医院',
    body: '#F2EFE6',
    roof: '#B94838',
    accent: '#C41E3A',
    base: '#D8C4A8',
    width: 57,
    height: 45,
    offsetY: 29,
    footprintOffset: 0.0003,
    extrusionHeight: 48,
  },
  'dongjiang-committee': {
    kind: 'meetingHouse',
    label: '东江特委',
    body: '#A8483A',
    roof: '#5F4A38',
    accent: '#F0C45B',
    base: '#B8905B',
    width: 60,
    height: 47,
    offsetY: 30,
    footprintOffset: 0.00032,
    extrusionHeight: 54,
  },
  'suqu-mass-line-hall': {
    kind: 'exhibitionHall',
    label: '实践馆',
    body: '#F4EFE6',
    roof: '#B63B2D',
    accent: '#B68A2D',
    base: '#D8C4A8',
    width: 64,
    height: 48,
    offsetY: 30,
    footprintOffset: 0.00034,
    extrusionHeight: 58,
  },
  'suqu-party-square': {
    kind: 'plaza',
    label: '广场',
    body: '#B54138',
    roof: '#B8905B',
    accent: '#F0C45B',
    base: '#C8B69B',
    width: 65,
    height: 40,
    offsetY: 24,
    footprintOffset: 0.00042,
    extrusionHeight: 24,
  },
  'scholar-culture-hall': {
    kind: 'academy',
    label: '书院',
    body: '#ECE3D2',
    roof: '#7D5C35',
    accent: '#8B6914',
    base: '#D8C4A8',
    width: 62,
    height: 47,
    offsetY: 30,
    footprintOffset: 0.00032,
    extrusionHeight: 50,
  },
  'suqu-education-base': {
    kind: 'campus',
    label: '教育基地',
    body: '#F1E9DE',
    roof: '#B23A32',
    accent: '#C41E3A',
    base: '#D8C4A8',
    width: 66,
    height: 50,
    offsetY: 32,
    footprintOffset: 0.00036,
    extrusionHeight: 62,
  },
  'suqu-town-hall': {
    kind: 'governmentHall',
    label: '镇政府',
    body: '#F2EFE8',
    roof: '#6B7280',
    accent: '#C41E3A',
    base: '#D8C4A8',
    width: 64,
    height: 47,
    offsetY: 30,
    footprintOffset: 0.00034,
    extrusionHeight: 56,
  },
  'paozi-village-defense': {
    kind: 'battlefield',
    label: '阻击战',
    body: '#7A8A55',
    roof: '#B54138',
    accent: '#D9C38E',
    base: '#587349',
    width: 63,
    height: 46,
    offsetY: 27,
    footprintOffset: 0.00042,
    extrusionHeight: 28,
  },
  'suqu-red-transport-station': {
    kind: 'transportStation',
    label: '交通站',
    body: '#B64B3D',
    roof: '#5B4939',
    accent: '#F0C45B',
    base: '#B8905B',
    width: 61,
    height: 47,
    offsetY: 30,
    footprintOffset: 0.00032,
    extrusionHeight: 50,
  },
}

export const FALLBACK_MODEL_PRESET: ArchiveModelPreset = {
  kind: 'meetingHouse',
  label: '阵地',
  body: '#B64B3D',
  roof: '#6A4A34',
  accent: '#F2D6B5',
  base: '#B8905B',
  width: 58,
  height: 46,
  offsetY: 30,
  footprintOffset: 0.0003,
  extrusionHeight: 48,
}

export const getArchiveModelPreset = (archive: { id: string; title: string; type: string }): ArchiveModelPreset => {
  const preset = MODEL_PRESETS[archive.id]
  if (preset) return preset
  if (archive.title.includes('纪念碑')) return { ...FALLBACK_MODEL_PRESET, kind: 'memorial', label: '纪念碑' }
  if (archive.title.includes('亭')) return { ...FALLBACK_MODEL_PRESET, kind: 'pavilion', label: '亭' }
  if (archive.title.includes('医院')) return { ...FALLBACK_MODEL_PRESET, kind: 'clinic', label: '医院' }
  if (archive.title.includes('广场')) return { ...FALLBACK_MODEL_PRESET, kind: 'plaza', label: '广场' }
  return FALLBACK_MODEL_PRESET
}

export const ArchiveModelMarker: React.FC<{ archive: { id: string; title: string; type: string } }> = ({ archive }) => {
  const preset = getArchiveModelPreset(archive)
  const markerWidth = Math.max(preset.width + 28, 92)
  const markerHeight = Math.max(preset.height + 24, 76)
  const roofDark = '#493326'
  const ink = '#5A281B'
  const line = 'rgba(255,255,255,0.86)'
  const roofTileLines = [0, 1, 2, 3, 4, 5]
  const windowXs = [26, 42, 58, 74]

  const plaque = (x = 44, y = 58, width = 32) => (
    <g>
      <rect x={x} y={y} width={width} height="12" rx="2" fill={preset.accent} stroke={line} strokeWidth="1" />
      <text x={x + width / 2} y={y + 8.5} textAnchor="middle" fontSize="7.5" fontWeight="700" fill={ink}>
        {preset.label}
      </text>
    </g>
  )

  const tiledRoof = (x: number, y: number, width: number, height: number, ridgeY = y + 2) => (
    <g>
      <path
        d={`M${x - 5} ${y + height} Q${x + width / 2} ${y - 5} ${x + width + 5} ${y + height} L${x + width} ${y + height + 7} Q${x + width / 2} ${y + height + 3} ${x} ${y + height + 7} Z`}
        fill={preset.roof}
        stroke={line}
        strokeWidth="1"
      />
      <path d={`M${x + 5} ${ridgeY + 3} Q${x + width / 2} ${ridgeY - 3} ${x + width - 5} ${ridgeY + 3}`} fill="none" stroke={roofDark} strokeWidth="1.3" opacity="0.75" />
      {roofTileLines.map((item) => {
        const lx = x + 6 + item * ((width - 12) / 5)
        return <path key={item} d={`M${lx} ${y + 4} L${lx - 7} ${y + height + 5}`} stroke="#F0D7B5" strokeWidth="0.75" opacity="0.72" />
      })}
    </g>
  )

  const baseShadow = (
    <ellipse cx="60" cy="82" rx="42" ry="8" fill="rgba(64,45,27,0.18)" />
  )

  const renderModel = () => {
    if (preset.kind === 'redCourtyard') {
      return (
        <>
          {baseShadow}
          <path d="M17 53 L101 48 L101 72 L17 77 Z" fill={preset.base} stroke={line} strokeWidth="1.2" />
          <path d="M24 55 L56 52 L56 76 L24 78 Z" fill={preset.body} stroke={line} strokeWidth="1.1" />
          <path d="M58 53 L94 50 L94 70 L58 73 Z" fill="#B84A3D" stroke={line} strokeWidth="1" />
          {tiledRoof(19, 35, 42, 15)}
          {tiledRoof(55, 38, 42, 12)}
          <rect x="36" y="57" width="12" height="20" rx="2" fill="#4B251E" />
          <path d="M42 57 L42 77" stroke="#8A5A42" strokeWidth="1" />
          <rect x="27" y="60" width="7" height="9" fill="#6B3028" stroke="#F2D6B5" strokeWidth="0.8" />
          <rect x="66" y="58" width="8" height="8" fill="#6B3028" stroke="#F2D6B5" strokeWidth="0.8" />
          <rect x="80" y="57" width="8" height="8" fill="#6B3028" stroke="#F2D6B5" strokeWidth="0.8" />
          <rect x="67" y="70" width="23" height="4" fill="#8A2D27" opacity="0.75" />
          <path d="M18 53 Q24 50 30 53 M94 50 Q100 47 105 50" stroke={preset.accent} strokeWidth="1.2" fill="none" />
          {plaque(64, 64, 23)}
        </>
      )
    }

    if (preset.kind === 'memorial') {
      return (
        <>
          {baseShadow}
          <rect x="30" y="72" width="60" height="7" rx="1.5" fill={preset.base} stroke={line} />
          <rect x="37" y="65" width="46" height="8" rx="1" fill="#E9DCC7" stroke={line} />
          <rect x="44" y="58" width="32" height="8" rx="1" fill="#C8B69B" stroke={line} />
          <path d="M52 18 L68 18 L75 59 L45 59 Z" fill="url(#stoneModelGrad)" stroke={line} strokeWidth="1.1" />
          <path d="M56 23 L64 23 M55 30 L65 30 M54 37 L66 37 M53 44 L67 44" stroke={preset.accent} strokeWidth="1.1" opacity="0.88" />
          <path d="M52 18 L48 22 L72 22 L68 18 Z" fill="#EFE4D1" stroke={line} />
          <path d="M39 74 L82 74 M45 67 L76 67" stroke="#9E8565" strokeWidth="1" />
          <path d="M24 79 L30 62 L36 79 M84 79 L90 62 L96 79" stroke="#5F7D4A" strokeWidth="2" fill="none" opacity="0.75" />
        </>
      )
    }

    if (preset.kind === 'pavilion') {
      return (
        <>
          {baseShadow}
          <rect x="29" y="73" width="62" height="6" rx="2" fill={preset.base} stroke={line} />
          <path d="M23 43 Q60 20 97 43 L91 52 Q60 38 29 52 Z" fill={preset.roof} stroke={line} strokeWidth="1.1" />
          <path d="M36 31 Q60 13 84 31 L80 39 Q60 28 40 39 Z" fill="#C05832" stroke={line} />
          <path d="M31 48 L89 48 L84 55 L36 55 Z" fill={preset.accent} stroke={line} />
          {[36, 48, 60, 72, 84].map((x) => (
            <rect key={x} x={x - 2} y="54" width="4" height="20" rx="2" fill={preset.body} stroke={line} strokeWidth="0.8" />
          ))}
          <rect x="43" y="58" width="34" height="6" rx="2" fill="#7A2D20" opacity="0.85" />
          <path d="M28 44 Q21 42 18 36 M92 44 Q99 42 102 36" stroke={preset.accent} strokeWidth="1.5" fill="none" />
        </>
      )
    }

    if (preset.kind === 'plaqueWall') {
      return (
        <>
          {baseShadow}
          <rect x="22" y="62" width="76" height="14" rx="2" fill={preset.base} stroke={line} />
          <rect x="27" y="37" width="66" height="30" rx="3" fill={preset.body} stroke={line} strokeWidth="1.2" />
          <path d="M24 37 L60 25 L96 37 Z" fill={preset.roof} stroke={line} />
          <rect x="35" y="43" width="50" height="14" rx="2" fill={preset.accent} stroke="#FFF4D6" strokeWidth="1" />
          <text x="60" y="52.5" textAnchor="middle" fontSize="8" fontWeight="700" fill={ink}>{preset.label}</text>
          <path d="M31 61 L90 61 M31 67 L90 67" stroke="#D8B980" strokeWidth="0.8" opacity="0.8" />
          <rect x="22" y="53" width="6" height="15" fill="#75352E" />
          <rect x="92" y="53" width="6" height="15" fill="#75352E" />
        </>
      )
    }

    if (preset.kind === 'workshop') {
      return (
        <>
          {baseShadow}
          <rect x="25" y="50" width="70" height="26" rx="2" fill={preset.body} stroke={line} />
          <path d="M23 50 L34 36 L45 50 L56 36 L67 50 L78 36 L97 50 Z" fill={preset.roof} stroke={line} />
          <rect x="39" y="58" width="12" height="18" fill="#3E312C" />
          <rect x="58" y="58" width="26" height="10" fill="#B9A07E" stroke="#F5E6CE" strokeWidth="0.8" />
          <path d="M62 63 L80 63 M67 58 L67 68 M73 58 L73 68" stroke="#67523E" strokeWidth="0.8" />
          <rect x="83" y="28" width="6" height="24" rx="2" fill="#6F6256" stroke={line} strokeWidth="0.8" />
          <path d="M86 27 Q81 20 89 16" stroke="#B7B1A8" strokeWidth="1.2" fill="none" opacity="0.85" />
          {plaque(31, 67, 26)}
        </>
      )
    }

    if (preset.kind === 'clinic') {
      return (
        <>
          {baseShadow}
          <rect x="28" y="48" width="64" height="28" rx="3" fill={preset.body} stroke={line} />
          {tiledRoof(24, 35, 72, 11)}
          <rect x="53" y="53" width="14" height="14" rx="2" fill="#FFFFFF" stroke="#D9C8B0" />
          <rect x="58" y="55" width="4" height="10" fill={preset.accent} />
          <rect x="55" y="58" width="10" height="4" fill={preset.accent} />
          <rect x="34" y="57" width="9" height="10" fill="#DDE7E8" stroke="#B9C9CC" strokeWidth="0.8" />
          <rect x="77" y="57" width="9" height="10" fill="#DDE7E8" stroke="#B9C9CC" strokeWidth="0.8" />
          <rect x="48" y="68" width="24" height="7" fill="#B83A31" opacity="0.9" />
          {plaque(47, 70, 26)}
        </>
      )
    }

    if (preset.kind === 'plaza' || preset.kind === 'battlefield') {
      const isField = preset.kind === 'battlefield'
      return (
        <>
          <ellipse cx="60" cy="77" rx="45" ry="13" fill={isField ? '#8FA868' : '#C8B69B'} stroke={line} />
          <path d="M23 76 Q43 63 60 76 T98 76" stroke={isField ? '#D5C37A' : '#AA9370'} strokeWidth="1.2" fill="none" opacity="0.85" />
          <rect x="54" y="42" width="12" height="32" rx="2" fill={preset.body} stroke={line} />
          <rect x="47" y="67" width="26" height="8" rx="1" fill={preset.accent} stroke={line} />
          <path d="M50 42 L70 42 L66 36 L54 36 Z" fill="#D8C4A8" stroke={line} />
          {isField && (
            <>
              <path d="M30 73 L41 49 L48 73" stroke="#6A4A34" strokeWidth="2" fill="none" />
              <path d="M77 72 L88 52 L95 72" stroke="#6A4A34" strokeWidth="2" fill="none" opacity="0.8" />
              <path d="M34 61 L46 56 M81 63 L92 58" stroke="#C41E3A" strokeWidth="1.5" />
            </>
          )}
          {plaque(45, 55, 30)}
        </>
      )
    }

    if (preset.kind === 'transportStation') {
      return (
        <>
          {baseShadow}
          <rect x="29" y="49" width="62" height="27" rx="2" fill={preset.body} stroke={line} />
          {tiledRoof(25, 35, 70, 13)}
          <rect x="40" y="58" width="12" height="18" rx="2" fill="#4B2E25" />
          <rect x="62" y="56" width="17" height="11" fill={preset.accent} stroke="#FFF4D6" />
          <path d="M27 78 L96 78" stroke="#5C3D2C" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M33 70 C45 63 55 63 67 70 S87 76 95 66" stroke="#F0C45B" strokeWidth="1.3" fill="none" />
          {plaque(58, 57, 24)}
        </>
      )
    }

    const isPublic = ['exhibitionHall', 'campus', 'governmentHall', 'academy'].includes(preset.kind)
    return (
      <>
        {baseShadow}
        <rect x="25" y="48" width="70" height="28" rx="3" fill={preset.body} stroke={line} />
        {tiledRoof(21, 34, 78, 13)}
        {isPublic && <path d="M41 34 Q60 20 79 34 L74 42 Q60 34 46 42 Z" fill="#C35437" stroke={line} />}
        {windowXs.map((x) => (
          <rect key={x} x={x} y="56" width="9" height="10" fill="#FFFFFF" opacity="0.68" stroke="#CDBBA3" strokeWidth="0.8" />
        ))}
        <rect x="55" y="62" width="11" height="14" rx="2" fill="#5A2B20" />
        <path d="M30 49 L90 49 M31 73 L90 73" stroke="#D8C4A8" strokeWidth="1" />
        {preset.kind === 'academy' && <path d="M36 67 Q60 60 84 67" stroke={preset.accent} strokeWidth="1.4" fill="none" />}
        {plaque(43, 68, 34)}
      </>
    )
  }

  return (
    <div
      className="relative select-none"
      title={`${archive.title} - ${preset.label}风格化模型`}
      style={{
        width: markerWidth,
        height: markerHeight,
        contain: 'layout paint style',
        filter: 'drop-shadow(0 8px 8px rgba(64, 45, 27, 0.2))',
      }}
    >
      <svg
        viewBox="0 0 120 90"
        width="100%"
        height="100%"
        role="img"
        aria-label={`${archive.title}风格化微缩建筑`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="stoneModelGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F8F1E6" />
            <stop offset="100%" stopColor={preset.body} />
          </linearGradient>
        </defs>
        {renderModel()}
      </svg>
    </div>
  )
}
