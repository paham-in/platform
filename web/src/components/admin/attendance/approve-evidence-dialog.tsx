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
  patchAdminTutoringEvidenceByIdMutation,
  getAdminTutoringEvidenceQueryKey,
  getAdminTutoringReportQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListSessionsResponse } from "@/lib/api/types.gen"
import { Spinner } from "@/components/ui/spinner"

const fmtRp = (n?: number) => `Rp ${(n ?? 0).toLocaleString("id-ID")}`

interface ApproveEvidenceDialogProps {
  session: TutoringListSessionsResponse
  onClose: () => void
}

export function ApproveEvidenceDialog({ session, onClose }: ApproveEvidenceDialogProps) {
  const qc = useQueryClient()

  const { mutate: approve, isPending } = useMutation({
    ...patchAdminTutoringEvidenceByIdMutation(),
    onSuccess: () => {
      toast.success("Bukti disetujui, sesi selesai")
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
            {(session.overtime_minutes ?? 0) > 0 && (
              <>
                {" "}Overtime +{session.overtime_minutes} menit (+{session.extra_sessions ?? 0} sesi): fee guru
                dan tagihan murid ikut bertambah.
              </>
            )}
          </AlertDialogDescription>
          {(session.overtime_fee ?? 0) > 0 && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm tabular-nums">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fee guru +</span>
                <span className="font-medium">{fmtRp(session.overtime_fee)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tagihan murid +</span>
                <span className="font-medium">{fmtRp(session.overtime_charge)}</span>
              </div>
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={() => session.id && approve({ path: { id: session.id }, body: { action: "approve" } })}
          >
            {isPending && <Spinner />}
            Setujui
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
