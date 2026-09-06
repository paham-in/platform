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
import { patchAdminInvoicesByIdRefundMutation, getAdminInvoicesQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import type { InvoiceInvoiceResponse } from "@/lib/api/types.gen"

interface RefundInvoiceDialogProps {
  invoice: InvoiceInvoiceResponse
  onClose: () => void
}

export function RefundInvoiceDialog({ invoice, onClose }: RefundInvoiceDialogProps) {
  const qc = useQueryClient()
  const done = !!invoice.refund_done

  const { mutate: setRefund, isPending } = useMutation({
    ...patchAdminInvoicesByIdRefundMutation(),
    onSuccess: () => {
      toast.success(done ? "Tanda refund dibatalkan" : "Refund ditandai sudah ditransfer")
      qc.invalidateQueries({ queryKey: getAdminInvoicesQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal menyimpan status refund"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{done ? "Batalkan tanda refund?" : "Tandai sudah direfund?"}</AlertDialogTitle>
          <AlertDialogDescription>
            Refund Rp {(invoice.refund_amount ?? 0).toLocaleString("id-ID")} untuk tagihan Rp {(invoice.amount ?? 0).toLocaleString("id-ID")}
            {done ? " ditandai belum ditransfer." : ". Pastikan uang sudah ditransfer manual ke murid."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={() => invoice.id && setRefund({ path: { id: invoice.id }, body: { done: !done } })}
          >
            {isPending && <Spinner />}
            {done ? "Batalkan Tanda" : "Sudah Ditransfer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
