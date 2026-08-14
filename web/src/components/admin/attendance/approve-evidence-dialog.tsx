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
import type { TutoringTutoringSessionResponse } from "@/lib/api/types.gen"
import { Spinner } from "@/components/ui/spinner"

interface ApproveEvidenceDialogProps {
  session: TutoringTutoringSessionResponse
  onClose: () => void
}

export function ApproveEvidenceDialog({ session, onClose }: ApproveEvidenceDialogProps) {
  const qc = useQueryClient()

  const { mutate: approve, isPending } = useMutation({
    ...patchAdminTutoringEvidenceByIdMutation(),
    onSuccess: () => {
      toast.success("Bukti disetujui — sesi selesai")
      qc.invalidateQueries({ queryKey: getAdminTutoringEvidenceQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminTutoringReportQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal menyetujui bukti"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Setujui bukti kehadiran ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Sesi {session.date} {session.start_time} – {session.end_time} ({session.teacher_name ?? "—"}) akan
            ditandai selesai dan fee guru masuk ke daftar pembayaran.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={() => session.id && approve({ path: { id: session.id }, body: { action: "approve" } })}
            disabled={isPending}
          >
            {isPending && <Spinner className="h-3 w-3" />}
            Setujui
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
