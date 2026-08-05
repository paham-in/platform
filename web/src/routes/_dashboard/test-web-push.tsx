import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createFileRoute } from "@tanstack/react-router"
import { getPushPublicKey, postPushSubscribe } from "@/lib/api/sdk.gen"
import { Bell, BellRing, CheckCircle2, XCircle, Loader2 } from "lucide-react"

function TestWebPush() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  )
  const [swStatus, setSwStatus] = useState<string>("Belum didaftarkan")
  const [lastResult, setLastResult] = useState<string>("")

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      setPermission("unsupported")
      return
    }
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === "granted") {
      setLastResult("Izin notifikasi diberikan ✅")
    } else {
      setLastResult("Izin notifikasi ditolak ❌")
    }
  }

  const registerSW = async () => {
    if (!("serviceWorker" in navigator)) {
      setSwStatus("Service Worker tidak didukung")
      return
    }
    try {
      const reg = await navigator.serviceWorker.register("/sw.js")
      setSwStatus(`Terdaftar: ${reg.scope}`)
      setLastResult("Service Worker berhasil didaftarkan ✅")
    } catch (err: any) {
      setSwStatus("Gagal daftar Service Worker")
      setLastResult(`Error: ${err?.message || err}`)
    }
  }

  // Notifikasi lokal langsung dari halaman (tanpa service worker push).
  const sendLocalNotification = () => {
    if (permission !== "granted") {
      setLastResult("Izin notifikasi belum diberikan. Klik 'Minta Izin' dulu.")
      return
    }
    new Notification("paham.in — Test Notifikasi", {
      body: "Ini notifikasi lokal. Jika muncul, izin & browser berfungsi!",
      icon: "/logo192.png",
      badge: "/logo192.png",
    })
    setLastResult("Notifikasi lokal dikirim ✅ (cek layar)")
  }

  // Notifikasi via Service Worker (registration.showNotification).
  const sendSWNotification = async () => {
    if (permission !== "granted") {
      setLastResult("Izin notifikasi belum diberikan. Klik 'Minta Izin' dulu.")
      return
    }
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg) {
      setLastResult("Service Worker belum terdaftar. Klik 'Daftarkan SW' dulu.")
      return
    }
    await reg.showNotification("paham.in — Test SW", {
      body: "Notifikasi dari Service Worker. Tutup tab ini dan coba lagi?",
      icon: "/logo192.png",
      badge: "/logo192.png",
      data: { url: "/dashboard/test-web-push" },
    })
    setLastResult("Notifikasi SW dikirim ✅")
  }

  // Subscribe penuh: minta izin → daftar SW → subscribe → kirim ke backend.
  const subscribePush = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setLastResult("Browser tidak mendukung Web Push penuh.")
      return
    }
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== "granted") {
        setLastResult("Izin notifikasi ditolak — tidak bisa subscribe.")
        return
      }

      const reg = await navigator.serviceWorker.register("/sw.js")
      setSwStatus(`Terdaftar: ${reg.scope}`)

      // Ambil VAPID public key dari backend
      const pub = await getPushPublicKey()
      const pubKey = pub?.data?.public_key
      if (!pubKey) {
        setLastResult("Backend belum kirim VAPID public key. Cek .env VAPID_PUBLIC_KEY.")
        return
      }
      const applicationServerKey = urlBase64ToUint8Array(pubKey)

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      })

      // Kirim subscription ke backend
      const subJson = subscription.toJSON()
      await postPushSubscribe({
        body: {
          endpoint: subJson.endpoint ?? "",
          keys: { p256dh: subJson.keys?.p256dh ?? "", auth: subJson.keys?.auth ?? "" },
        },
      })

      setLastResult("Berhasil subscribe! Notifikasi dari backend akan muncul saat ada jawaban baru ✅")
    } catch (err: any) {
      setLastResult(`Gagal subscribe: ${err?.message || err}`)
    }
  }

  const isSupported = "Notification" in window && "serviceWorker" in navigator

  return (
    <main className="p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Test Web Push</h1>

        {!isSupported && (
          <Card>
            <CardContent className="flex items-center gap-3 text-amber-600">
              <XCircle className="h-5 w-5" />
              <span>Browser kamu tidak mendukung Web Push. Coba Chrome, Edge, atau Firefox.</span>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium">Status izin notifikasi</p>
            <p>
              {permission === "granted" ? (
                <span className="inline-flex items-center gap-1.5 text-green-600"><CheckCircle2 className="h-4 w-4" /> Diberikan</span>
              ) : permission === "denied" ? (
                <span className="inline-flex items-center gap-1.5 text-red-600"><XCircle className="h-4 w-4" /> Ditolak (ubah di pengaturan browser)</span>
              ) : permission === "unsupported" ? (
                <span className="inline-flex items-center gap-1.5 text-amber-600"><XCircle className="h-4 w-4" /> Tidak didukung</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Loader2 className="h-4 w-4" /> Belum diminta</span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={requestPermission} disabled={permission === "granted" || permission === "unsupported"}>
                <Bell className="h-4 w-4" /> Minta Izin
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium">Service Worker</p>
            <p className="text-sm text-muted-foreground">{swStatus}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={registerSW}>
                <Loader2 className="h-4 w-4" /> Daftarkan SW
              </Button>
              <Button onClick={subscribePush}>
                <Bell className="h-4 w-4" /> Subscribe Penuh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium">Kirim Notifikasi</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={sendLocalNotification}>
                <BellRing className="h-4 w-4" /> Notifikasi Lokal
              </Button>
              <Button variant="outline" onClick={sendSWNotification}>
                <BellRing className="h-4 w-4" /> Notifikasi via SW
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Coba: setelah izin diberikan, tutup tab ini (browser tetap jalan), lalu dari halaman lain kirim notif SW.
            </p>
          </CardContent>
        </Card>

        {lastResult && (
          <Card>
            <CardContent className="text-sm text-muted-foreground">
              <span className="font-medium">Hasil: </span>{lastResult}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

// helper: konversi base64url VAPID key ke Uint8Array (dibutuhkan pushManager.subscribe)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export const Route = createFileRoute("/_dashboard/test-web-push")({
  component: TestWebPush,
})
