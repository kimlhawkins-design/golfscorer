// Golf Scorecard service worker.
// Goal: make the app installable and usable offline WITHOUT ever serving stale
// scorecard data. Live data comes from TanStack server functions over the network,
// so this worker only caches the static app shell (HTML fallback + built assets)
// and always prefers the network for navigations and data.

const VERSION = 'v1'
const CACHE = `golf-scorecard-${VERSION}`

// Pre-cache the bare minimum needed to launch offline.
const PRECACHE = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GETs. Mutations and server-function calls (POST, or
  // anything non-GET) pass straight through to the network, untouched.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // Page navigations: network-first so the freshest server-rendered data wins,
  // falling back to the cached shell only when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put('/', copy))
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
    )
    return
  }

  // Static build assets (scripts, styles, images, fonts, the manifest):
  // stale-while-revalidate for instant loads that quietly refresh in the
  // background. Data responses are not cached because they are never GET asset
  // requests of these types.
  const dest = request.destination
  if (['style', 'script', 'image', 'font', 'manifest'].includes(dest)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone()
              caches.open(CACHE).then((cache) => cache.put(request, copy))
            }
            return response
          })
          .catch(() => cached)
        return cached || network
      }),
    )
  }
})
