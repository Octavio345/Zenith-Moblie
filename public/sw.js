const CACHE_NAME = "zenith-cache-v7"

const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/assets/icons/zenith-icon-192-v6.png",
  "/assets/icons/zenith-icon-512-v6.png",
  "/assets/icons/zenith-icon-maskable-192-v6.png",
  "/assets/icons/zenith-icon-maskable-512-v6.png"
]

self.addEventListener("install", (event) => {
  console.log("Service Worker instalado")

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )

  self.clients.claim()
})

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
