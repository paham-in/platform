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
  postTutoringSessionsByIdCancelMutation,
  getAdminInvoicesQueryKey,
  getAdminTutoringBookingsByIdSessionsQueryKey,
  getAdminTutoringEvidenceQueryKey,
  getAdminTutoringReportQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListSessionsResponse } from "@/lib/api/types.gen"
import { Spinner } from "@/components/ui/spinner"
import { refundClaimsByBookingQueryKey } from "@/lib/refund-claims"

interface CancelSessionDialogProps {
  session: TutoringListSessionsResponse
  onClose: () => void
}

export function CancelSessionDialog({ session, onClose }: CancelSessionDialogProps) {
  const qc = useQueryClient()

  const { mutate: cancel, isPending } = useMutation({
    ...postTutoringSessionsByIdCancelMutation(),
    onSuccess: () => {
      toast.success("Sesi dibatalkan")
      qc.invalidateQueries({ queryKey: getAdminTutoringEvidenceQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminTutoringReportQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminInvoicesQueryKey() })
      if (session.booking_id) {
        qc.invalidateQueries({ queryKey: getAdminTutoringBookingsByIdSessionsQueryKey({ path: { id: session.booking_id } }) })
        qc.invalidateQueries({ queryKey: refundClaimsByBookingQueryKey(session.booking_id) })
      }
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal membatalkan sesi"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Batalkan sesi ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Sesi {session.date} {session.start_time} – {session.end_time} akan ditandai dibatalkan. Invoice tidak berubah. Beri tahu murid via WhatsApp.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={() => session.id && cancel({ path: { id: session.id } })}
          >
            {isPending && <Spinner />}
            Ya, batalkan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
