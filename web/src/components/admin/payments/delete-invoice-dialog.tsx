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
import { deleteAdminInvoicesByIdMutation, getAdminInvoicesQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import type { InvoiceInvoiceResponse } from "@/lib/api/types.gen"

interface DeleteInvoiceDialogProps {
  invoice: InvoiceInvoiceResponse
  onClose: () => void
}

export function DeleteInvoiceDialog({ invoice, onClose }: DeleteInvoiceDialogProps) {
  const qc = useQueryClient()

  const { mutate: deleteInvoice, isPending } = useMutation({
    ...deleteAdminInvoicesByIdMutation(),
    onSuccess: () => {
      toast.success("Invoice berhasil dihapus")
      qc.invalidateQueries({ queryKey: getAdminInvoicesQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal menghapus invoice"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Invoice</AlertDialogTitle>
          <AlertDialogDescription>
            Yakin hapus invoice {invoice.start_date} — {invoice.end_date}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="destructive" onClick={() => deleteInvoice({ path: { id: invoice.id! } })} disabled={isPending}>
            Hapus
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
