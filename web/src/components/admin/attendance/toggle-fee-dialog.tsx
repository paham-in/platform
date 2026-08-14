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
  patchAdminTutoringFeesByIdMutation,
  getAdminTutoringEvidenceQueryKey,
  getAdminTutoringReportQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringTutoringSessionResponse } from "@/lib/api/types.gen"
import { Spinner } from "@/components/ui/spinner"

const fmtRp = (n?: number) => `Rp ${(n ?? 0).toLocaleString("id-ID")}`

interface ToggleFeeDialogProps {
  session: TutoringTutoringSessionResponse
  onClose: () => void
}

export function ToggleFeeDialog({ session, onClose }: ToggleFeeDialogProps) {
  const qc = useQueryClient()
  const targetPaid = !session.fee_paid

  const { mutate: toggleFee, isPending } = useMutation({
    ...patchAdminTutoringFeesByIdMutation(),
    onSuccess: () => {
      toast.success("Status fee guru diperbarui")
      qc.invalidateQueries({ queryKey: getAdminTutoringEvidenceQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminTutoringReportQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal mengubah status fee"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {targetPaid ? "Tandai fee guru sudah dibayar?" : "Tandai fee guru belum dibayar?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Fee sesi {session.date} {session.start_time} – {session.end_time} ({session.teacher_name ?? "—"})
            sebesar {fmtRp(session.fee_amount)} akan ditandai {targetPaid ? "sudah dibayar" : "belum dibayar"}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            onClick={() => session.id && toggleFee({ path: { id: session.id } })}
            disabled={isPending}
          >
            {isPending && <Spinner className="h-3 w-3" />}
            {targetPaid ? "Tandai Sudah" : "Tandai Belum"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
