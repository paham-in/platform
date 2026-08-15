import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  patchAdminTutoringEvidenceByIdMutation,
  getAdminTutoringEvidenceQueryKey,
  getAdminTutoringReportQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListSessionsResponse } from "@/lib/api/types.gen"
import { Spinner } from "@/components/ui/spinner"

interface RejectEvidenceDialogProps {
  session: TutoringListSessionsResponse
  onClose: () => void
}

export function RejectEvidenceDialog({ session, onClose }: RejectEvidenceDialogProps) {
  const qc = useQueryClient()

  const { mutate: reject, isPending } = useMutation({
    ...patchAdminTutoringEvidenceByIdMutation(),
    onSuccess: () => {
      toast.success("Bukti ditolak — sesi kembali terjadwal")
      qc.invalidateQueries({ queryKey: getAdminTutoringEvidenceQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminTutoringReportQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal menolak bukti"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tolak bukti kehadiran ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Sesi {session.date} {session.start_time} – {session.end_time} ({session.teacher_name ?? "—"}) akan
            kembali ke status Terjadwal dan foto bukti dihapus. Guru bisa mengunggah ulang.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            variant="destructive"
            onClick={() => session.id && reject({ path: { id: session.id }, body: { action: "reject" } })}
            disabled={isPending}
          >
            {isPending && <Spinner className="h-3 w-3" />}
            Ya, tolak
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
