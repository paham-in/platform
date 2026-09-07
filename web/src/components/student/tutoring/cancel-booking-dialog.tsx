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
import { Spinner } from "@/components/ui/spinner"
import {
  postTutoringBookingsByIdCancelMutation,
  getTutoringBookingsQueryKey,
  getTutoringSessionsQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListBookingsResponse } from "@/lib/api/types.gen"

interface CancelBookingDialogProps {
  booking: TutoringListBookingsResponse
  onClose: () => void
}

export function CancelBookingDialog({ booking, onClose }: CancelBookingDialogProps) {
  const qc = useQueryClient()

  const { mutate: cancelBooking, isPending } = useMutation({
    ...postTutoringBookingsByIdCancelMutation(),
    onSuccess: () => {
      toast.success("Booking dibatalkan")
      qc.invalidateQueries({ queryKey: getTutoringBookingsQueryKey() })
      qc.invalidateQueries({ queryKey: getTutoringSessionsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal membatalkan booking"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Batalkan Booking</AlertDialogTitle>
          <AlertDialogDescription>
            Yakin batalkan booking {booking.subject_name ?? "—"} · {booking.date} {booking.start_time}–{booking.end_time}?
            Booking masih menunggu guru, jadi belum ada sesi maupun tagihan yang terbentuk.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => booking.id && cancelBooking({ path: { id: booking.id } })} disabled={isPending}>
            {isPending && <Spinner />}
            Batalkan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
