// Service Worker untuk Web Push test.
// Menangani event push (dari server) dan klik notifikasi.

self.addEventListener("install", (event) => {
  // Force aktivasi — tidak menunggu semua tab lama ditutup.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Saat backend mengirim push (tahap 2). Untuk sekarang, kita test
// notifikasi lokal dari halaman (showNotification langsung di halaman).
self.addEventListener("push", (event) => {
  let data = { title: "paham.in", body: "Ada notifikasi baru", url: "/" };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/logo192.png",
      badge: "/logo192.png",
      data: { url: data.url },
    })
  );
});

// Klik notifikasi → buka URL.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
