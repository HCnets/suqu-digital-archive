/**
 * 后台通用组件（从 App.tsx 拆分）
 */
import {  useEffect, useRef, useState } from 'react'
import type {  AMapNamespace, AMapMapInstance, AMapMarkerInstance, AMapLngLatLike, AMapDistrictSearchResult, Region } from '../types'
import {  parseCoordinateDraft, isInsideDistrictBoundaries } from '../utils'

let amapNamespacePromise: Promise<AMapNamespace> | null = null
import { AMAP_KEY, AMAP_SECURITY_JS_CODE } from './api'
import { Input } from './fields'

export function ArchiveLocationPickerField({
  region,
  longitude,
  latitude,
  address,
  onApply,
}: {
  region: Region | null
  longitude: string
  latitude: string
  address: string
  onApply: (patch: { longitude: string; latitude: string; address: string }) => void
}) {
  const [open, setOpen] = useState(false)
  const hasMapConfig = Boolean(AMAP_KEY)

  return (
    <>
      <section className="wide-field map-picker-field">
        <div className="map-picker-inline-head">
          <div>
            <strong>地图定位</strong>
            <p>支持搜索地址、地图点选、拖动微调，并结合地区边界给出越界提醒。</p>
          </div>
          <div className="panel-actions">
            <button type="button" className="secondary" disabled={!hasMapConfig} onClick={() => setOpen(true)}>
              打开地图点选器
            </button>
            {(longitude || latitude || address) && (
              <button type="button" className="secondary" onClick={() => onApply({ longitude: '', latitude: '', address: '' })}>
                清空位置
              </button>
            )}
          </div>
        </div>
        <div className="map-picker-summary">
          <span>当前地区：{region?.fullName || region?.name || '未选择地区'}</span>
          <span>经度：{longitude || '-'}</span>
          <span>纬度：{latitude || '-'}</span>
          <span>地址：{address || '-'}</span>
        </div>
        {!hasMapConfig && (
          <p className="form-hint">
            地图点选服务尚未启用。你仍可先填写地址和精确坐标；需要地图搜索和点选时，请联系系统管理员开启地图服务。
          </p>
        )}
      </section>
      {open && (
        <ArchiveLocationPickerDialog
          region={region}
          initialLongitude={longitude}
          initialLatitude={latitude}
          initialAddress={address}
          onClose={() => setOpen(false)}
          onApply={(patch) => {
            onApply(patch)
            setOpen(false)
          }}
        />
      )}
    </>
  )
}

export function ArchiveLocationPickerDialog({
  region,
  initialLongitude,
  initialLatitude,
  initialAddress,
  onClose,
  onApply,
}: {
  region: Region | null
  initialLongitude: string
  initialLatitude: string
  initialAddress: string
  onClose: () => void
  onApply: (patch: { longitude: string; latitude: string; address: string }) => void
}) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<AMapMapInstance | null>(null)
  const markerRef = useRef<AMapMarkerInstance | null>(null)
  const clickHandlerRef = useRef<((event: { lnglat?: AMapLngLatLike }) => void) | null>(null)
  const dragHandlerRef = useRef<((event: { lnglat?: AMapLngLatLike }) => void) | null>(null)
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<Array<{ id: string; name: string; address: string; longitude: number; latitude: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(Boolean(initialLongitude || initialLatitude))
  const [boundaryPolygons, setBoundaryPolygons] = useState<Array<Array<[number, number]>>>([])
  const [draft, setDraft] = useState({
    longitude: initialLongitude,
    latitude: initialLatitude,
    address: initialAddress,
  })
  const contextRef = useRef<{
    AMap?: AMapNamespace
    geocoder?: InstanceType<AMapNamespace['Geocoder']>
    placeSearch?: InstanceType<AMapNamespace['PlaceSearch']>
    districtBoundaries?: Array<Array<[number, number]>>
  }>({})

  useEffect(() => {
    let disposed = false
    async function mountMap() {
      if (!AMAP_KEY) {
        setError('地图点选服务尚未启用，当前请先填写地址和精确坐标。')
        setLoading(false)
        return
      }
      try {
        const AMap = await loadAMap()
        if (disposed || !mapRef.current) return
        const center = parseCoordinateDraft(initialLongitude, initialLatitude) || [114.935, 23.635]
        const map = new AMap.Map(mapRef.current, {
          zoom: 13,
          center,
        })
        mapInstanceRef.current = map
        if (AMap.ToolBar && map.addControl) map.addControl(new AMap.ToolBar())
        const marker = new AMap.Marker({
          position: center,
          offset: new AMap.Pixel(-13, -30),
          draggable: true,
          cursor: 'move',
        })
        marker.setMap(map)
        markerRef.current = marker

        const geocoder = new AMap.Geocoder({})
        const placeSearch = new AMap.PlaceSearch({ pageSize: 8 })
        contextRef.current = {
          AMap,
          geocoder,
          placeSearch,
          districtBoundaries: [],
        }

        const applyPoint = async (lng: number, lat: number, nextAddress = '') => {
          marker.setPosition([lng, lat])
          map.setCenter([lng, lat])
          const resolvedAddress = nextAddress || await reverseGeocode(geocoder, lng, lat)
          setNotice(buildBoundaryNotice([lng, lat], contextRef.current.districtBoundaries || [], region))
          setDraft({
            longitude: String(Number(lng.toFixed(6))),
            latitude: String(Number(lat.toFixed(6))),
            address: resolvedAddress,
          })
        }

        if (region?.code) {
          const districtBoundaries = await loadDistrictBoundaries(AMap, region.code, region.fullName || region.name)
          contextRef.current.districtBoundaries = districtBoundaries.boundaries
          setBoundaryPolygons(districtBoundaries.boundaries)
          if ((!initialLongitude || !initialLatitude) && districtBoundaries.center) {
            map.setCenter(districtBoundaries.center)
            if (map.setZoom) map.setZoom(14)
            marker.setPosition(districtBoundaries.center)
          }
          if (!districtBoundaries.boundaries.length) {
            setNotice('当前地区暂未加载到边界数据，将仅提供位置提醒，不做越界限制。')
          }
        }

        const clickHandler = (event: { lnglat?: AMapLngLatLike }) => {
          const lnglat = event.lnglat
          if (!lnglat) return
          void applyPoint(lnglat.getLng(), lnglat.getLat())
        }
        clickHandlerRef.current = clickHandler
        map.on('click', clickHandler)
        const dragHandler = (event: { lnglat?: AMapLngLatLike }) => {
          const lnglat = event.lnglat
          if (!lnglat) return
          void applyPoint(lnglat.getLng(), lnglat.getLat())
        }
        dragHandlerRef.current = dragHandler
        marker.on?.('dragend', dragHandler)

        const parsed = parseCoordinateDraft(initialLongitude, initialLatitude)
        if (parsed) {
          void applyPoint(parsed[0], parsed[1], initialAddress)
        } else if (region?.fullName || region?.name) {
          setNotice('可先搜索地址，也可以直接点击地图或拖动定位点。')
        }
      } catch (err) {
        if (!disposed) setError(err instanceof Error ? err.message : '地图加载失败')
      } finally {
        if (!disposed) setLoading(false)
      }
    }
    void mountMap()
    return () => {
      disposed = true
      if (mapInstanceRef.current && clickHandlerRef.current && mapInstanceRef.current.off) {
        mapInstanceRef.current.off('click', clickHandlerRef.current)
      }
      if (markerRef.current && dragHandlerRef.current && markerRef.current.off) {
        markerRef.current.off('dragend', dragHandlerRef.current)
      }
      if (markerRef.current) markerRef.current.setMap(null)
      if (mapInstanceRef.current?.destroy) mapInstanceRef.current.destroy()
    }
  }, [initialAddress, initialLatitude, initialLongitude, region?.code, region?.fullName, region?.name])

  const searchPlaces = async () => {
    if (!keyword.trim()) return
    const placeSearch = contextRef.current.placeSearch
    if (!placeSearch) {
      setError('地图搜索尚未就绪，请稍后再试。')
      return
    }
    setError('')
    const rows = await searchPlaceCandidates(placeSearch, keyword.trim())
    setResults(rows)
    if (!rows.length) setNotice('没有找到匹配地点，请换一个关键词。')
  }

  const draftPoint = parseCoordinateDraft(draft.longitude, draft.latitude)
  const boundaryBlocked = Boolean(draftPoint && boundaryPolygons.length && !isInsideDistrictBoundaries(draftPoint, boundaryPolygons))

  const applyManualCoordinates = async () => {
    const nextPoint = parseCoordinateDraft(draft.longitude, draft.latitude)
    if (!nextPoint) {
      setError('请输入有效的经纬度，格式如 114.935 和 23.635。')
      return
    }
    setError('')
    const nextAddress = contextRef.current.geocoder
      ? (draft.address || await reverseGeocode(contextRef.current.geocoder, nextPoint[0], nextPoint[1]))
      : draft.address
    setDraft({
      longitude: String(Number(nextPoint[0].toFixed(6))),
      latitude: String(Number(nextPoint[1].toFixed(6))),
      address: nextAddress,
    })
    markerRef.current?.setPosition(nextPoint)
    mapInstanceRef.current?.setCenter(nextPoint)
    setNotice(buildBoundaryNotice(nextPoint, boundaryPolygons, region))
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="map-picker-dialog" role="dialog" aria-modal="true" aria-label="地图点选器" onClick={(event) => event.stopPropagation()}>
        <div className="media-picker-head">
          <div>
            <h3>地图点选器</h3>
            <p>搜索地址或直接点地图，自动回填经纬度和地址。</p>
          </div>
          <button type="button" className="secondary" onClick={onClose}>关闭</button>
        </div>
        <div className="map-picker-toolbar">
          <Input label="搜索地址" value={keyword} onChange={setKeyword} placeholder="输入地点、村名、旧址或学校名称" />
          <button type="button" onClick={() => void searchPlaces()} disabled={loading}>搜索</button>
          <button type="button" className="secondary" onClick={() => setShowAdvanced(value => !value)}>
            {showAdvanced ? '收起精确坐标' : '填写精确坐标'}
          </button>
        </div>
        {error && <div className="error">{error}</div>}
        {notice && <div className="notice">{notice}</div>}
        {showAdvanced && (
          <section className="map-advanced-panel">
            <div className="map-advanced-grid">
              <Input label="经度" type="number" value={draft.longitude} onChange={longitude => setDraft(current => ({ ...current, longitude }))} />
              <Input label="纬度" type="number" value={draft.latitude} onChange={latitude => setDraft(current => ({ ...current, latitude }))} />
              <Input label="位置说明" value={draft.address} onChange={address => setDraft(current => ({ ...current, address }))} />
            </div>
            <div className="panel-actions">
              <button type="button" className="secondary" onClick={() => void applyManualCoordinates()}>
                应用精确坐标
              </button>
              <span className="form-hint">普通情况下可直接搜索或点图，这里只在需要精确定位时使用。</span>
            </div>
          </section>
        )}
        <div className="map-picker-layout">
          <div className="map-canvas-wrap">
            <div ref={mapRef} className="map-canvas" />
            {loading && <div className="map-canvas-empty">地图加载中...</div>}
            {!loading && !AMAP_KEY && <div className="map-canvas-empty">地图点选服务尚未启用，当前请先填写精确坐标。</div>}
          </div>
          <div className="map-picker-side">
            <section className="map-picker-card">
              <strong>当前回填结果</strong>
              <span>地区：{region?.fullName || region?.name || '未选择地区'}</span>
              <span>经度：{draft.longitude || '-'}</span>
              <span>纬度：{draft.latitude || '-'}</span>
              <span>地址：{draft.address || '-'}</span>
            </section>
            <section className="map-picker-card">
              <strong>定位提示</strong>
              <ul className="map-tip-list">
                <li>先搜索地点，再从候选结果中确认，适合快速定位。</li>
                <li>在地图上单击可直接回填位置，拖动红色定位点可微调。</li>
                <li>如需精确数值，可展开“精确坐标”补充经纬度。</li>
                <li>选择超出地区边界时，系统会阻止直接保存。</li>
              </ul>
            </section>
            <section className="map-picker-card">
              <strong>搜索结果</strong>
              {results.length ? (
                <div className="map-search-results">
                  {results.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="search-result"
                      onClick={() => {
                        markerRef.current?.setPosition([item.longitude, item.latitude])
                        mapInstanceRef.current?.setCenter([item.longitude, item.latitude])
                        setDraft({
                          longitude: String(Number(item.longitude.toFixed(6))),
                          latitude: String(Number(item.latitude.toFixed(6))),
                          address: item.address || item.name,
                        })
                        setNotice(buildBoundaryNotice([item.longitude, item.latitude], contextRef.current.districtBoundaries || [], region))
                      }}
                    >
                      <strong>{item.name}</strong>
                      <span>{item.address || '无详细地址'}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="media-picker-empty">搜索后可在这里选择结果。</div>
              )}
            </section>
          </div>
        </div>
        <div className="panel-actions">
          <button
            type="button"
            onClick={() => onApply(draft)}
            disabled={!draft.longitude || !draft.latitude || boundaryBlocked}
          >
            使用这个位置
          </button>
          <button type="button" className="secondary" onClick={onClose}>取消</button>
        </div>
      </section>
    </div>
  )
}

export function loadAMap() {
  if (amapNamespacePromise) return amapNamespacePromise
  amapNamespacePromise = new Promise<AMapNamespace>((resolve, reject) => {
    const startLoad = () => {
      if (!window.AMapLoader) {
        reject(new Error('高德地图加载器不可用，请检查网络或脚本加载状态。'))
        return
      }
      if (AMAP_SECURITY_JS_CODE) {
        window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_JS_CODE }
      }
      window.AMapLoader.load({
        key: AMAP_KEY,
        version: '2.0',
        plugins: ['AMap.PlaceSearch', 'AMap.Geocoder', 'AMap.DistrictSearch', 'AMap.ToolBar'],
      }).then(resolve).catch(reject)
    }
    if (window.AMapLoader) {
      startLoad()
      return
    }
    const existing = document.getElementById('amap-loader-script') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', startLoad, { once: true })
      existing.addEventListener('error', () => reject(new Error('高德地图加载脚本失败，请检查网络连接。')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.id = 'amap-loader-script'
    script.src = 'https://webapi.amap.com/loader.js'
    script.async = true
    script.onload = () => startLoad()
    script.onerror = () => reject(new Error('高德地图加载脚本失败，请检查网络连接。'))
    document.head.appendChild(script)
  })
  return amapNamespacePromise
}

export function buildBoundaryNotice(point: [number, number], boundaries: Array<Array<[number, number]>>, region: Region | null) {
  if (!boundaries.length) {
    return region?.code ? '当前地区还没有加载到边界信息，暂时只做定位提示。' : '当前地区缺少边界信息，暂时无法做范围校验。'
  }
  return isInsideDistrictBoundaries(point, boundaries)
    ? '位置在当前地区边界内。'
    : '当前位置超出当前地区边界，请重新选择后再保存。'
}

export function reverseGeocode(geocoder: InstanceType<AMapNamespace['Geocoder']>, lng: number, lat: number) {
  return new Promise<string>((resolve) => {
    geocoder.getAddress([lng, lat], (status, result) => {
      if (status === 'complete' && result.regeocode?.formattedAddress) {
        resolve(result.regeocode.formattedAddress)
        return
      }
      resolve('')
    })
  })
}

export function searchPlaceCandidates(placeSearch: InstanceType<AMapNamespace['PlaceSearch']>, keyword: string) {
  return new Promise<Array<{ id: string; name: string; address: string; longitude: number; latitude: number }>>((resolve) => {
    placeSearch.search(keyword, (status, result) => {
      if (status !== 'complete') {
        resolve([])
        return
      }
      const rows = (result.poiList?.pois || [])
        .map((poi, index) => ({
          id: poi.id || `${keyword}-${index}`,
          name: poi.name || '未命名地点',
          address: poi.address || '',
          longitude: poi.location?.getLng?.() || 0,
          latitude: poi.location?.getLat?.() || 0,
        }))
        .filter((item) => item.longitude && item.latitude)
      resolve(rows)
    })
  })
}

export function loadDistrictBoundaries(AMap: AMapNamespace, regionCode: string, regionName: string) {
  const districtSearch = new AMap.DistrictSearch({ extensions: 'all', subdistrict: 0 })
  const search = (keyword: string) => new Promise<AMapDistrictSearchResult>((resolve) => {
    districtSearch.search(keyword, (_status, result) => resolve(result || {}))
  })
  return (async () => {
    const first = await search(regionCode)
    const firstRow = first.districtList?.[0]
    if (firstRow?.boundaries?.length) {
      return {
        boundaries: firstRow.boundaries.map((boundary) => boundary.map((point) => [point.getLng(), point.getLat()] as [number, number])),
        center: firstRow.center ? [firstRow.center.getLng(), firstRow.center.getLat()] as [number, number] : null,
      }
    }
    const second = await search(regionName)
    const secondRow = second.districtList?.[0]
    return {
      boundaries: (secondRow?.boundaries || []).map((boundary) => boundary.map((point) => [point.getLng(), point.getLat()] as [number, number])),
      center: secondRow?.center ? [secondRow.center.getLng(), secondRow.center.getLat()] as [number, number] : null,
    }
  })()
}

