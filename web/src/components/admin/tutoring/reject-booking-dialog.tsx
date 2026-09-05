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
  getAdminTutoringBookingsQueryKey,
  postAdminTutoringBookingsByIdRejectMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListBookingsResponse } from "@/lib/api/types.gen"

export function RejectBookingDialog({ booking, onClose }: { booking: TutoringListBookingsResponse; onClose: () => void }) {
  const qc = useQueryClient()

  const { mutate: reject, isPending } = useMutation({
    ...postAdminTutoringBookingsByIdRejectMutation(),
    onSuccess: () => {
      toast.success("Booking ditolak")
      qc.invalidateQueries({ queryKey: getAdminTutoringBookingsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal menolak booking"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tolak Booking</AlertDialogTitle>
          <AlertDialogDescription>
            Yakin tolak booking {booking.student_name ?? "—"} · {booking.subject_name ?? "—"} · {booking.date} {booking.start_time}–{booking.end_time}? Murid akan diberi tahu.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={() => booking.id && reject({ path: { id: booking.id } })}
          >
            {isPending && <Spinner />}
            Tolak
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
