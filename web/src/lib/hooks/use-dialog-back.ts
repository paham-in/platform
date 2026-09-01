import { useCallback } from "react"
import { useNavigate, useRouter } from "@tanstack/react-router"

/**
 * Mengelola dialog sebagai "stack" di URL lewat search param `modal`.
 *
 * - Buka dialog = push `?modal=<name>` ke history (stack + dialog).
 * - Tutup (tombol / back browser / outside / ESC) = pop satu entry
 *   (`router.history.back()`), jadi back berikutnya benar-benar keluar halaman,
 *   bukan kembali ke dialog.
 * - State-dialog persist di URL (refresh/share tetap kebuka).
 *
 * Halaman yang memakai ini harus:
 * 1. Menambahkan `modal: z.string().optional()` ke `validateSearch`.
 * 2. `const { modal } = Route.useSearch()`.
 * 3. Buka dialog: set payload (jika ada) lalu panggil `openModal("nama")`.
 * 4. Render dialog: `{modal === "nama" && <Dialog onClose={closeModal} />}`.
 * 5. Bersihkan payload saat `modal` berubah (useEffect di halaman).
 */
export function useDialogBack() {
  const navigate = useNavigate()
  const router = useRouter()

  const openModal = useCallback(
    (name: string) => {
      navigate({ search: (prev) => ({ ...(prev as Record<string, unknown>), modal: name }) as never })
    },
    [navigate],
  )

  const closeModal = useCallback(() => router.history.back(), [router])

  return { openModal, closeModal }
}
