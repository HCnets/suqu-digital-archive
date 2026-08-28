const CACHE_VERSION = 'suqu-cache-v20260805-pwa-1'
const MAP_CACHE = `${CACHE_VERSION}-map`
const STATIC_CACHE = `${CACHE_VERSION}-static`
const MAP_HOSTS = [
  'webrd01.is.autonavi.com',
  'webrd02.is.autonavi.com',
  'webrd03.is.autonavi.com',
  'webrd04.is.autonavi.com',
  'webst01.is.autonavi.com',
  'webst02.is.autonavi.com',
  'webst03.is.autonavi.com',
  'webst04.is.autonavi.com',
]
const MAX_MAP_CACHE_ITEMS = 520
const MAX_STATIC_CACHE_ITEMS = 160

// 离线壳：首屏 HTML、manifest、图标，安装时预缓存，弱网/离线也可打开应用
const PRECACHE_URLS = ['/', '/manifest.webmanifest', '/favicon.svg', '/icons.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/robots.txt']

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE)
    await Promise.all(PRECACHE_URLS.map((url) => cache.add(url).catch(() => null)))
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(
      keys
        .filter((key) => key.startsWith('suqu-cache-') && !key.startsWith(CACHE_VERSION))
        .map((key) => caches.delete(key)),
    )
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/')) return

  if (MAP_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, MAP_CACHE, MAX_MAP_CACHE_ITEMS))
    return
  }

  if (url.origin === self.location.origin) {
    // 首页 HTML 网络优先：保证拿到最新构建，离线时回退缓存
    if (url.pathname === '/' || url.pathname === '/index.html') {
      event.respondWith(networkFirst(request, STATIC_CACHE))
      return
    }
    if (isStaticAsset(url.pathname)) {
      event.respondWith(cacheFirst(request, STATIC_CACHE, MAX_STATIC_CACHE_ITEMS))
    }
  }
})

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response && response.ok) await cache.put(request, response.clone())
    return response
  } catch (err) {
    const cached = await cache.match(request)
    if (cached) return cached
    throw err
  }
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/admin-assets/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/uploads/') ||
    pathname.startsWith('/icons/') ||
    pathname === '/' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/favicon.svg' ||
    pathname === '/icons.svg' ||
    pathname === '/robots.txt'
  )
}

async function cacheFirst(request, cacheName, maxItems) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  await putCacheable(cache, request, response, maxItems)
  return response
}

async function staleWhileRevalidate(request, cacheName, maxItems) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const refresh = fetch(request)
    .then(async (response) => {
      await putCacheable(cache, request, response, maxItems)
      return response
    })
    .catch(() => null)

  if (cached) return cached
  const response = await refresh
  if (response) return response
  return fetch(request)
}

async function putCacheable(cache, request, response, maxItems) {
  if (!response || (response.status !== 0 && !response.ok)) return
  await cache.put(request, response.clone())
  await trimCache(cache, maxItems)
}

async function trimCache(cache, maxItems) {
  const keys = await cache.keys()
  if (keys.length <= maxItems) return
  await Promise.all(keys.slice(0, keys.length - maxItems).map((key) => cache.delete(key)))
}
