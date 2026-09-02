import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/components/theme-provider"
import {
  getMeOptions,
  getMeQueryKey,
  patchMeMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { usePageTitle } from "@/components/page-title"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { getPushPublicKey, postPushSubscribe } from "@/lib/api/sdk.gen"
import { Loader2, Save, Bell, BellOff, Download, Moon, Sun } from "lucide-react"
import { toast } from "sonner"
import { usePwaInstall } from "@/lib/hooks/use-pwa-install"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { z } from "zod"

const settingsSearchSchema = z.object({
  modal: z.string().optional(),
})

function SettingsPage() {
  usePageTitle("Pengaturan")
  const qc = useQueryClient()
  const { data: user, isLoading: userLoading } = useQuery(getMeOptions())
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()

  const buildTime = import.meta.env.VITE_BUILD_TIME as string | undefined
  const commitSha = import.meta.env.VITE_COMMIT_SHA as string | undefined
  const [name, setName] = useState("")
  const [initialized, setInitialized] = useState(false)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  )
  const [notifSubscribing, setNotifSubscribing] = useState(false)
  const [pushStatus, setPushStatus] = useState<"checking" | "subscribed" | "not-subscribed" | "unsupported">("checking")
  const [subLabel, setSubLabel] = useState("")
  const { canInstall, installed, install, iOS } = usePwaInstall()
  const { theme, setTheme } = useTheme()

  const [pwaDebug, setPwaDebug] = useState(() => getPwaDebugInfo())

  useEffect(() => {
    const interval = setInterval(() => setPwaDebug(getPwaDebugInfo()), 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatus("unsupported")
      return
    }
    const perm = Notification.permission
    setNotifPermission(perm)
    if (perm !== "granted") {
      setPushStatus("not-subscribed")
      return
    }
    let cancelled = false
    let settled = false
    const settle = (status: "not-subscribed" | "subscribed" | "unsupported") => {
      if (settled || cancelled) return
      settled = true
      clearTimeout(timeout)
      setPushStatus(status)
    }
    const timeout = setTimeout(() => {
      if (!settled && !cancelled) settle("not-subscribed")
    }, 6000)
    ;(async () => {
      try {
        let reg = await navigator.serviceWorker.getRegistration()
        if (!reg) {
          await navigator.serviceWorker.register("/sw.js", { scope: "/" })
          reg = await navigator.serviceWorker.getRegistration()
        }
        if (!reg) {
          settle("not-subscribed")
          return
        }
        const sub = await reg.pushManager.getSubscription()
        if (!sub) {
          settle("not-subscribed")
          return
        }
        const subJson = sub.toJSON()
        await postPushSubscribe({
          body: {
            endpoint: subJson.endpoint ?? "",
            keys: { p256dh: subJson.keys?.p256dh ?? "", auth: subJson.keys?.auth ?? "" },
          },
        })
        setSubLabel(shortSubscriptionLabel(subJson.endpoint ?? ""))
        settle("subscribed")
      } catch {
        settle("not-subscribed")
      }
    })()
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [])

  if (user && !initialized) {
    setName(user.name ?? "")
    setInitialized(true)
  }

  const updateProfile = useMutation({
    ...patchMeMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getMeQueryKey() })
      toast.success("Profil berhasil disimpan")
    },
    onError: () => {
      toast.error("Gagal menyimpan profil")
    },
  })

  if (userLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const handleSave = () => {
    const body: Record<string, unknown> = {}
    if (name !== user?.name) body.name = name
    if (Object.keys(body).length === 0) return
    updateProfile.mutate({ body })
  }

  const enableNotifications = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Browser tidak mendukung notifikasi push")
      setNotifPermission("unsupported")
      return
    }
    setNotifSubscribing(true)
    try {
      const perm = await withTimeout(Notification.requestPermission(), 8000, "Izin notifikasi tidak kunjung muncul. Coba via pengaturan browser.")
      setNotifPermission(perm)
      if (perm !== "granted") {
        toast.error("Izin notifikasi ditolak")
        setPushStatus("not-subscribed")
        return
      }

      let reg = await withTimeout(navigator.serviceWorker.getRegistration(), 8000, "Service worker tidak merespons. Muat ulang lalu coba lagi.")
      if (!reg) {
        reg = await withTimeout(navigator.serviceWorker.register("/sw.js", { scope: "/" }), 8000, "Service worker belum terpasang. Muat ulang lalu coba lagi.")
      }
      const pub = await getPushPublicKey()
      const pubKey = pub?.data?.public_key
      if (!pubKey) {
        toast.error("Konfigurasi push belum siap")
        return
      }
      const applicationServerKey = urlBase64ToUint8Array(pubKey)

      let subscription = await reg.pushManager.getSubscription()
      if (!subscription) {
        subscription = await withTimeout(
          reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as unknown as BufferSource,
          }),
          8000,
          "Gagal membuat langganan push. Muat ulang lalu coba lagi."
        )
      }

      const subJson = subscription.toJSON()
      await postPushSubscribe({
        body: {
          endpoint: subJson.endpoint ?? "",
          keys: { p256dh: subJson.keys?.p256dh ?? "", auth: subJson.keys?.auth ?? "" },
        },
      })
      setSubLabel(shortSubscriptionLabel(subJson.endpoint ?? ""))
      setPushStatus("subscribed")

      toast.success("Notifikasi diaktifkan. Kamu akan mendapat pemberitahuan saat ada jawaban baru.")
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengaktifkan notifikasi")
    } finally {
      setNotifSubscribing(false)
    }
  }

  // Deteksi browser untuk menampilkan instruksi yang sesuai.
  const browserName = (() => {
    const ua = navigator.userAgent
    if (ua.includes("Firefox")) return "Firefox"
    if (ua.includes("Edg/")) return "Edge"
    if (ua.includes("Chrome")) return "Chrome"
    if (ua.includes("Safari")) return "Safari"
    return "Browser"
  })()

  // PWA yang di-install: chrome://settings tidak bisa dibuka dari window standalone,
  // satu-satunya jalan adalah Site Settings lewat long-press ikon aplikasi.
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true

  // Chromium (Chrome/Edge) di mode browser bisa lompat langsung ke halaman izin
  // notifikasi. Kalau gagal (PWA standalone / diblokir) → fallback ke dialog instruksi.
  const openBrowserSettings = () => {
    if (!isStandalone) {
      const url =
        browserName === "Chrome"
          ? "chrome://settings/content/notifications"
          : browserName === "Edge"
            ? "edge://settings/content/notifications"
            : null
      if (url) {
        try {
          const win = window.open(url, "_blank")
          if (win) return
        } catch {
          // diblokir, fall through ke dialog
        }
      }
    }
    openModal("notif-help")
  }

  const notifHelpSteps = isStandalone
    ? [
        "Tekan lama ikon Pahamin di layar utama HP",
        "Pilih 'Site Settings' (Setelan Situs)",
        "Ketuk 'Notifications', lalu ubah menjadi 'Izinkan'",
        "Kembali ke aplikasi, lalu klik 'Aktifkan'",
      ]
    : browserName === "Chrome" || browserName === "Edge"
      ? [
          `Buka ikon gembok di samping alamat situs (${browserName})`,
          "Klik 'Izin situs' atau 'Notifikasi'",
          "Ubah status notifikasi menjadi 'Izinkan'",
          "Refresh halaman ini, lalu klik 'Aktifkan'",
        ]
      : browserName === "Firefox"
        ? [
            "Klik ikon gembok di samping alamat situs",
            "Pilih 'Edit izin situs...' atau 'Notifikasi'",
            "Ubah status notifikasi menjadi 'Izinkan'",
            "Refresh halaman ini, lalu klik 'Aktifkan'",
          ]
        : browserName === "Safari"
          ? [
              "Klik 'Safari' di menu bar → 'Pengaturan'",
              "Tab 'Situs Web' → 'Notifikasi'",
              "Cari situs ini, ubah menjadi 'Izinkan'",
              "Refresh halaman ini, lalu klik 'Aktifkan'",
            ]
          : [
              "Buka pengaturan notifikasi di browser kamu",
              "Cari izin untuk situs ini dan ubah menjadi 'Izinkan'",
              "Refresh halaman ini, lalu klik 'Aktifkan'",
            ]

  return (
    <main className="p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Pengaturan</h1>

      <div className="flex max-w-lg flex-col gap-4">
      <Card className="md:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" /> Tampilan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Sun className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Mode Gelap</p>
                <p className="text-xs text-muted-foreground">Gunakan tema gelap pada perangkat ini.</p>
              </div>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} aria-label="Mode gelap" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">PWA Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-3 text-xs font-mono">
            {JSON.stringify(pwaDebug, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off"/>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            onClick={handleSave}
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? (
              <Spinner />
            ) : (
              <Save />
            )}
            Simpan
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notifikasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Aktifkan notifikasi untuk mendapat pemberitahuan saat pertanyaanmu dijawab.
          </p>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              {notifSubscribing || pushStatus === "checking" ? (
                <Spinner />
              ) : notifPermission === "granted" && pushStatus === "subscribed" ? (
                <Bell className="h-5 w-5 text-green-600" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                {(() => {
                  if (notifPermission === "unsupported" || pushStatus === "unsupported") {
                    return <p className="text-sm font-medium">Browser tidak mendukung notifikasi push</p>
                  }
                  if (notifPermission === "denied") {
                    return (
                      <>
                        <p className="text-sm font-medium">Izin ditolak</p>
                        <p className="text-xs text-muted-foreground">Ubah di pengaturan browser untuk mengaktifkan.</p>
                      </>
                    )
                  }
                  if (notifPermission !== "granted") {
                    return (
                      <>
                        <p className="text-sm font-medium">Notifikasi nonaktif</p>
                        <p className="text-xs text-muted-foreground">Belum diaktifkan.</p>
                      </>
                    )
                  }
                  if (pushStatus === "checking") {
                    return (
                      <>
                        <p className="text-sm font-medium">Memeriksa status…</p>
                      </>
                    )
                  }
                  if (pushStatus === "subscribed") {
                    return (
                      <>
                        <p className="text-sm font-medium text-green-600">Terhubung</p>
                        {subLabel && <p className="text-xs text-muted-foreground">Subscribe: {subLabel}</p>}
                      </>
                    )
                  }
                  return (
                    <>
                      <p className="text-sm font-medium text-amber-600">Belum terdaftar di server push</p>
                      <p className="text-xs text-muted-foreground">Klik Aktifkan untuk mendaftarkan perangkat ini.</p>
                    </>
                  )
                })()}
              </div>
            </div>
            {notifPermission !== "unsupported" && pushStatus !== "unsupported" && (
              <Button
                variant={notifPermission === "granted" && pushStatus === "subscribed" ? "outline" : "default"}
                size="sm"
                onClick={notifPermission === "denied" ? openBrowserSettings : enableNotifications}
                disabled={notifSubscribing || pushStatus === "checking"}
              >
                {notifSubscribing ? (
                  <Spinner />
                ) : notifPermission === "denied" ? (
                  "Buka Pengaturan"
                ) : notifPermission === "granted" && pushStatus === "subscribed" ? (
                  "Perbarui"
                ) : (
                  "Aktifkan"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {!installed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" /> Instal Aplikasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Instal Pahamin ke perangkatmu untuk membuka aplikasi lebih cepat, lengkap dengan ikon di layar utama.
            </p>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Belum terpasang</p>
                  <p className="text-xs text-muted-foreground">
                    {iOS
                      ? "Ketuk ikon Bagikan di Safari, lalu pilih 'Tambah ke Layar Utama'."
                      : "Pasang aplikasi agar bisa diakses seperti aplikasi native."}
                  </p>
                </div>
              </div>
              {!iOS && (
                <Button size="sm" onClick={install} disabled={!canInstall}>
                  Pasang
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {buildTime
          ? `Versi build: ${format(parseISO(buildTime), "d MMM yyyy, HH:mm", { locale: id })}`
          : "Development Mode"}
        {buildTime && commitSha && " · "}
        {commitSha && `Commit: ${commitSha.slice(0, 7)}`}
      </p>

      {modal === "notif-help" && (
        <Dialog open onOpenChange={(o) => !o && closeModal()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mengaktifkan Notifikasi ({browserName})</DialogTitle>
              <DialogDescription>
                Izin notifikasi diblokir di browser. Ikuti langkah berikut untuk mengizinkan:
              </DialogDescription>
            </DialogHeader>
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              {notifHelpSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            <DialogFooter>
              <Button variant="outline" onClick={closeModal}>Tutup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </main>
  )
}

// Bungkus promise yang bisa nggantung (requestPermission/ready/subscribe) dengan batas waktu.
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      }
    )
  })
}

// Tampilkan endpoint subscription secara ringkas (host + ekor pendek) tanpa bocorin token perangkat.
function getPwaDebugInfo() {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')?.getAttribute("content") ?? null
  const displayMode = window.matchMedia("(display-mode: standalone)").matches
    ? "standalone"
    : window.matchMedia("(display-mode: minimal-ui)").matches
      ? "minimal-ui"
      : window.matchMedia("(display-mode: fullscreen)").matches
        ? "fullscreen"
        : "browser"
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  const swController = navigator.serviceWorker?.controller
  return {
    displayMode,
    prefersColorScheme: prefersDark ? "dark" : "light",
    themeColor: metaThemeColor,
    serviceWorker: swController ? { scriptURL: swController.scriptURL } : null,
    standalone: window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true,
    displayModeMediaQuery: {
      standalone: window.matchMedia("(display-mode: standalone)").matches,
      browser: window.matchMedia("(display-mode: browser)").matches,
    },
  }
}

function shortSubscriptionLabel(endpoint: string): string {
  try {
    const url = new URL(endpoint)
    const last = url.pathname.split("/").filter(Boolean).pop() ?? ""
    return `${url.hostname}/${last.length > 7 ? `…${last.slice(-7)}` : last}`
  } catch {
    return endpoint
  }
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

export const Route = createFileRoute("/_dashboard/settings")({
  component: SettingsPage,
  validateSearch: settingsSearchSchema,
})
