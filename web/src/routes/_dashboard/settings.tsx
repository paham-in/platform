import { useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/components/theme-provider"
import {
  getMeOptions,
  getMeQueryKey,
  patchMeMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { postPushSubscribe } from "@/lib/api/sdk.gen"
import { isPushSupported, subscribeNotifications } from "@/lib/subscribe-notification"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { usePwaInstall } from "@/lib/hooks/use-pwa-install"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { z } from "zod"

const settingsSearchSchema = z.object({
  modal: z.string().optional(),
})

// Form hanya menyimpan angka lokal (tanpa prefix); prefix +62 tetap di addon.
const toRest = (phone?: string) => {
  const t = (phone ?? "").trim()
  if (t.startsWith("+62")) return t.slice(3)
  if (t.startsWith("62")) return t.slice(2)
  if (t.startsWith("0")) return t.slice(1)
  return t
}

function SettingsPage() {
  const qc = useQueryClient()
  const { data: user, isLoading: userLoading } = useQuery(getMeOptions())
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()

  const buildTime = import.meta.env.VITE_BUILD_TIME as string | undefined
  const commitSha = import.meta.env.VITE_COMMIT_SHA as string | undefined
  const form = useForm<{ name: string; phone: string }>({
    resolver: zodResolver(z.object({
      name: z.string().trim().min(1, "Isi nama dulu"),
      phone: z.string().refine((v) => {
        const t = v.trim()
        if (t === "") return true
        return /^8\d{6,12}$/.test(t)
      }, "Nomor tidak valid (cth: 812...)"),
    })),
    mode: "onTouched",
    defaultValues: { name: "", phone: "" },
  })
  const initializedRef = useRef(false)
  useEffect(() => {
    if (user && !initializedRef.current) {
      form.reset({ name: user.name ?? "", phone: toRest(user.phone) })
      initializedRef.current = true
    }
  }, [user, form])
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  )
  const [notifSubscribing, setNotifSubscribing] = useState(false)
  const [pushStatus, setPushStatus] = useState<"checking" | "subscribed" | "not-subscribed" | "unsupported">("checking")
  const [subLabel, setSubLabel] = useState("")
  const { canInstall, installed, install, iOS } = usePwaInstall()
  const { theme, setTheme, dynamicThemeColor, setDynamicThemeColor } = useTheme()

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
        <Spinner />
      </div>
    )
  }

  const handleSave = (v: { name: string; phone: string }) => {
    const rest = v.phone.trim()
    const body: { name?: string; phone?: string } = {}
    if (v.name !== user?.name) body.name = v.name
    if (rest !== toRest(user?.phone)) body.phone = rest === "" ? "" : `+62${rest}`
    if (Object.keys(body).length === 0) {
      toast.info("Tidak ada perubahan")
      return
    }
    updateProfile.mutate({ body })
  }

  const enableNotifications = async () => {
    if (!isPushSupported()) {
      toast.error("Browser tidak mendukung notifikasi push")
      setNotifPermission("unsupported")
      setPushStatus("unsupported")
      return
    }
    setNotifSubscribing(true)
    try {
      const result = await subscribeNotifications()
      if (!result.success) {
        setNotifPermission(Notification.permission)
        setPushStatus("not-subscribed")
        toast.error("Gagal mengaktifkan notifikasi")
        return
      }
      setNotifPermission("granted")
      setSubLabel(result.endpoint ? shortSubscriptionLabel(result.endpoint) : "")
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
      <div className="mx-auto w-full max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Pengaturan</h1>

      <div className="flex flex-col gap-4">
      <section>
        <h2 className="mb-1.5 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tampilan
        </h2>
        <Card className="gap-0 py-0">
          <CardContent className="p-0">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setTheme(theme === "dark" ? "light" : "dark")
                }
              }}
              className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">Mode Gelap</p>
                <p className="text-xs text-muted-foreground">Gunakan tema gelap pada perangkat ini.</p>
              </div>
              <span onClick={(e) => e.stopPropagation()}>
                <Switch checked={theme === "dark"} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} aria-label="Mode gelap" />
              </span>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setDynamicThemeColor(!dynamicThemeColor)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setDynamicThemeColor(!dynamicThemeColor)
                }
              }}
              className="flex cursor-pointer items-center justify-between gap-3 border-t px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">Warna tema dinamis</p>
                <p className="text-xs text-muted-foreground">Ikuti warna latar aplikasi. Matikan untuk memakai warna bawaan (#0c0c09).</p>
              </div>
              <span onClick={(e) => e.stopPropagation()}>
                <Switch checked={dynamicThemeColor} onCheckedChange={setDynamicThemeColor} aria-label="Warna tema dinamis" />
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-1.5 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Profil
        </h2>
        <Card className="gap-0 py-0">
          <CardContent className="space-y-4 p-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name">Nama</FieldLabel>
                  <Input id="name" {...field} aria-invalid={fieldState.invalid} autoComplete="off"/>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="phone">Nomor WhatsApp</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <InputGroupText>+62</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput id="phone" {...field} inputMode="tel" placeholder="812..." aria-invalid={fieldState.invalid} autoComplete="tel" />
                  </InputGroup>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Button
              onClick={form.handleSubmit(handleSave)}
              disabled={updateProfile.isPending}
              className="w-full"
            >
              {updateProfile.isPending ? (
                <Spinner />
              ) : (
                <Save />
              )}
              Simpan
            </Button>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-1.5 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Lainnya
        </h2>
        <div className="space-y-4">
        <Card className="gap-0 py-0">
          <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
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
                    <p className="text-sm font-medium">Notifikasi nonaktif</p>
                    <p className="text-xs text-muted-foreground">Belum diaktifkan.</p>
                  </>
                )
              })()}
            </div>
            {notifPermission !== "unsupported" && pushStatus !== "unsupported" && (
              <Button
                variant={notifPermission === "granted" && pushStatus === "subscribed" ? "outline" : "secondary"}
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
          <Card className="gap-0 py-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Instal aplikasi Pahamin</p>
                  <p className="text-xs text-muted-foreground">
                    {iOS
                      ? "Ketuk Bagikan di Safari, lalu Tambah ke Layar Utama."
                      : "Buka lebih cepat langsung dari layar utama HP."}
                  </p>
                </div>
                {!iOS && (
                  <Button size="sm" variant="secondary" onClick={install} disabled={!canInstall}>
                    Pasang
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </section>
      </div>

      <Card className="mt-4 gap-0 py-0">
        <CardContent className="p-4">
          <p className="text-sm font-medium">Versi aplikasi</p>
          <p className="text-xs text-muted-foreground">
            {buildTime
              ? `Build ${format(parseISO(buildTime), "d MMM yyyy, HH:mm", { locale: id })}`
              : "Development Mode"}
            {buildTime && commitSha && " · "}
            {commitSha && `Commit ${commitSha.slice(0, 7)}`}
          </p>
        </CardContent>
      </Card>

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
      </div>
    </main>
  )
}

// Tampilkan endpoint subscription secara ringkas (host + ekor pendek) tanpa bocorin token perangkat.
function shortSubscriptionLabel(endpoint: string): string {
  try {
    const url = new URL(endpoint)
    const last = url.pathname.split("/").filter(Boolean).pop() ?? ""
    return `${url.hostname}/${last.length > 7 ? `…${last.slice(-7)}` : last}`
  } catch {
    return endpoint
  }
}

export const Route = createFileRoute("/_dashboard/settings")({
  component: SettingsPage,
  validateSearch: settingsSearchSchema,
})
