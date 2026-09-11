import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  postTutoringSessionsByIdRestoreMutation,
  getAdminInvoicesQueryKey,
  getAdminTutoringBookingsByIdSessionsQueryKey,
  getAdminTutoringEvidenceQueryKey,
  getAdminTutoringReportQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListSessionsResponse } from "@/lib/api/types.gen"
import { Spinner } from "@/components/ui/spinner"
import { refundClaimsByBookingQueryKey } from "@/lib/refund-claims"

interface RestoreSessionDialogProps {
  session: TutoringListSessionsResponse
  onClose: () => void
}

export function RestoreSessionDialog({ session, onClose }: RestoreSessionDialogProps) {
  const qc = useQueryClient()

  const { mutate: restore, isPending } = useMutation({
    ...postTutoringSessionsByIdRestoreMutation(),
    onSuccess: () => {
      toast.success("Sesi dikembalikan menjadi terjadwal")
      qc.invalidateQueries({ queryKey: getAdminTutoringEvidenceQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminTutoringReportQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminInvoicesQueryKey() })
      if (session.booking_id) {
        qc.invalidateQueries({ queryKey: getAdminTutoringBookingsByIdSessionsQueryKey({ path: { id: session.booking_id } }) })
        qc.invalidateQueries({ queryKey: refundClaimsByBookingQueryKey(session.booking_id) })
      }
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal mengembalikan sesi"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Kembalikan sesi ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Sesi {session.date} {session.start_time} – {session.end_time} akan diadakan kembali. Tagihan disesuaikan otomatis (invoice pending ditambah, refund dihitung ulang).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={() => session.id && restore({ path: { id: session.id } })}
          >
            {isPending && <Spinner />}
            Ya, kembalikan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
