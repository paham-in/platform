import { getPushPublicKey, postPushSubscribe } from "@/lib/api/sdk.gen"

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  )
}

// Bungkus promise yang bisa menggantung dengan batas waktu.
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

export type SubscribeResult = {
  success: boolean
  endpoint?: string
}

export async function subscribeNotifications(): Promise<SubscribeResult> {
  if (!isPushSupported()) return { success: false }

  const perm = await withTimeout(
    Notification.requestPermission(),
    8000,
    "Izin notifikasi tidak kunjung muncul."
  )
  if (perm !== "granted") return { success: false }

  let reg = await withTimeout(
    navigator.serviceWorker.getRegistration(),
    8000,
    "Service worker tidak merespons."
  )
  if (!reg) {
    reg = await withTimeout(
      navigator.serviceWorker.register("/sw.js", { scope: "/" }),
      8000,
      "Service worker belum terpasang."
    )
  }
  if (!reg) return { success: false }

  const pub = await getPushPublicKey()
  const pubKey = pub?.data?.public_key
  if (!pubKey) return { success: false }
  const applicationServerKey = urlBase64ToUint8Array(pubKey)

  let subscription = await reg.pushManager.getSubscription()
  if (!subscription) {
    subscription = await withTimeout(
      reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      }),
      8000,
      "Gagal membuat langganan push."
    )
  }

  const subJson = subscription.toJSON()
  await postPushSubscribe({
    body: {
      endpoint: subJson.endpoint ?? "",
      keys: { p256dh: subJson.keys?.p256dh ?? "", auth: subJson.keys?.auth ?? "" },
    },
  })
  return { success: true, endpoint: subJson.endpoint ?? undefined }
}
