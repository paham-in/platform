/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching"
import { NavigationRoute, registerRoute } from "workbox-routing"

// TypeScript: tipe global `self` untuk ServiceWorker (bukan Window).
declare let self: ServiceWorkerGlobalScope & typeof globalThis

// Precache app shell (hash assets dari build). "self.__WB_MANIFEST" diganti
// otomatis oleh vite-plugin-pwa (injectManifest) saat build.
precacheAndRoute(self.__WB_MANIFEST)

// Hapus cache precache versi lama saat SW aktif.
cleanupOutdatedCaches()

// SPA fallback: navigasi apa pun (termasuk offline) → cached index.html.
// Network-first supaya online selalu dapat HTML terbaru, offline jatuh ke cache.
registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")))

self.addEventListener("install", () => {
  // Jangan tunggu tab lama ditutup — SW baru langsung aktif.
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

// Push dari backend → tampilkan notifikasi.
self.addEventListener("push", (event) => {
  let data: { title: string; body: string; url: string } = {
    title: "paham.in",
    body: "Ada notifikasi baru",
    url: "/",
  }

  if (event.data) {
    try {
      const parsed = event.data.json()
      data = { ...data, ...parsed }
    } catch {
      data.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/logo192.png",
      badge: "/logo192.png",
      data: { url: data.url },
    })
  )
})

// Klik notifikasi → buka URL (focus tab yang ada, atau buka baru).
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) return client.focus()
      }
      return self.clients.openWindow(url)
    })
  )
})

// Kebijakan data: request API TIDAK di-cache (network-only default).
// App shell saja yang di-precache supaya aplikasi tetap terbuka saat offline.
