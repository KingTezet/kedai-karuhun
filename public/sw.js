/* Kedai Karuhun service worker - v10 */
const VERSION = 'kk-v10'
const STATIC = `${VERSION}-static`
const PRECACHE = ['/offline', '/branding/logo.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/') || url.pathname.startsWith('/admin')) return
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/offline')))
    return
  }
  const isStatic = url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/branding/')
  if (isStatic) {
    event.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(req)
        const net = fetch(req)
          .then((res) => { if (res.ok) cache.put(req, res.clone()); return res })
          .catch(() => hit)
        return hit || net
      }),
    )
  }
})

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch (_) { data = { body: event.data ? event.data.text() : '' } }
  const target = data.url || '/'
  const icon = `${self.location.origin}/api/brand/icon?sw=${Date.now()}`
  event.waitUntil(
    self.registration.showNotification(data.title || 'Kedai Karuhun', {
      body: data.body || 'Ada informasi baru.',
      icon,
      badge: icon,
      tag: data.type || target,
      renotify: true,
      data: { url: target },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('navigate' in c) c.navigate(target)
        if ('focus' in c) return c.focus()
      }
      return self.clients.openWindow(target)
    }),
  )
})
