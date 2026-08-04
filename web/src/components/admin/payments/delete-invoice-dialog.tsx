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
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { Spinner } from "@/components/ui/spinner"

interface DeleteInvoiceDialogProps {
  invoices: InvoiceInvoiceResponse[]
  onClose: () => void
}

export function DeleteInvoiceDialog({ invoices, onClose }: DeleteInvoiceDialogProps) {
  const qc = useQueryClient()

  const { mutate: deleteInvoice, isPending } = useMutation({
    ...deleteAdminInvoicesByIdMutation(),
    onSuccess: () => {
      toast.success(`${invoices.length} invoice berhasil dihapus`)
      qc.invalidateQueries({ queryKey: getAdminInvoicesQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal menghapus invoice"),
  })

  const handleConfirm = () => {
    invoices.forEach((inv) => {
      if (inv.id) deleteInvoice({ path: { id: inv.id } })
    })
  }

  const formatPeriod = (inv: InvoiceInvoiceResponse) => {
    const f = (d?: string) => (d ? format(parseISO(d), "dd MMM yyyy", { locale: id }) : "—")
    return `${f(inv.start_date)} — ${f(inv.end_date)}`
  }

  const description =
    invoices.length === 1
      ? `Yakin hapus invoice ${formatPeriod(invoices[0])}?`
      : `Yakin hapus ${invoices.length} invoice?`

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Invoice</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? <Spinner /> : "Hapus"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
