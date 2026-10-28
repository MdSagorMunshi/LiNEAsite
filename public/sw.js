/* ============================================================
   LiNEA site — service worker (offline PWA shell)
   Strategy:
   · HTML navigations  → network-first, cache fallback (fresh UI)
   · /assets/* (vite content-hashed) → cache-first (immutable)
   · other same-origin GET → stale-while-revalidate
   · /api/* and cross-origin → network only, never intercepted

   CACHE_NAME carries a build stamp (`__SW_BUILD_STAMP__` token,
   replaced by vite.config.ts on every `vite build`), so each
   deploy starts a fresh cache and the activate step purges the
   previous one — hashed assets never accumulate.
   ============================================================ */

const CACHE_NAME = 'linea-site-shell-__SW_BUILD_STAMP__'

self.addEventListener('install', () => {
  // activate immediately; the shell warms up as the user browses
  void self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  // same-origin only — GitHub API, raw mirrors and the APK CDN stay untouched
  if (url.origin !== self.location.origin) return
  // the Next.js proxy must always hit the network
  if (url.pathname.startsWith('/api/')) return

  // document navigations: network-first (deploys show up), cache when offline
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req)
          const cache = await caches.open(CACHE_NAME)
          cache.put(req, fresh.clone())
          return fresh
        } catch {
          const cached = await caches.match(req)
          return (
            cached ??
            new Response('OFFLINE — LiNEA shell not yet cached', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' },
            })
          )
        }
      })(),
    )
    return
  }

  // vite emits content-hashed filenames under assets/ — immutable, cache-first
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req)
        if (cached) return cached
        const fresh = await fetch(req)
        if (fresh.ok) {
          const cache = await caches.open(CACHE_NAME)
          cache.put(req, fresh.clone())
        }
        return fresh
      })(),
    )
    return
  }

  // screenshots, fonts, favicon, manifest, og image — serve cached, refresh in background
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      const cached = await cache.match(req)
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone())
          return res
        })
        .catch(() => null)
      return cached ?? (await network) ?? new Response('OFFLINE', { status: 503 })
    })(),
  )
})
