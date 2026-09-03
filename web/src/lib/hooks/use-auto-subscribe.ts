import { useEffect } from "react"
import { toast } from "sonner"
import { subscribeNotifications } from "@/lib/subscribe-notification"

const STORAGE_KEY = "pahamin_notif_prompted"

// Minta izin notifikasi sekali per user via toast action saat app dibuka (setelah login).
export function useAutoSubscribeNotifications(userId?: number) {
  useEffect(() => {
    if (userId == null) return
    try {
      const key = `${STORAGE_KEY}:${userId}`
      if (localStorage.getItem(key)) return
      localStorage.setItem(key, "1")

      toast("Aktifkan notifikasi untuk mendapat pemberitahuan penting dari Pahamin.", {
        duration: 10000,
        action: {
          label: "Aktifkan",
          onClick: () => {
            subscribeNotifications()
          },
        },
      })
    } catch {
      // localStorage tidak tersedia → skip
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])
}
