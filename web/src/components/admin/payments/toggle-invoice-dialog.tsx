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
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  patchAdminInvoicesByIdToggleMutation,
  getAdminInvoicesQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { InvoiceInvoiceResponse } from "@/lib/api/types.gen"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { Spinner } from "@/components/ui/spinner"

interface ToggleInvoiceDialogProps {
  invoices: InvoiceInvoiceResponse[]
  targetStatus: "paid" | "pending"
  onClose: () => void
}

export function ToggleInvoiceDialog({ invoices, targetStatus, onClose }: ToggleInvoiceDialogProps) {
  const qc = useQueryClient()

  const targetLabel = targetStatus === "paid" ? "Lunas" : "Pending"

  const { mutate: toggleInvoice, isPending } = useMutation({
    ...patchAdminInvoicesByIdToggleMutation(),
    onSuccess: () => {
      toast.success(`Status invoice berhasil diubah menjadi ${targetLabel}`)
      qc.invalidateQueries({ queryKey: getAdminInvoicesQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || `Gagal mengubah status`),
  })

  const handleConfirm = () => {
    invoices.forEach((inv) => {
      if (inv.id) toggleInvoice({ path: { id: inv.id } })
    })
  }

  const formatPeriod = (inv: InvoiceInvoiceResponse) => {
    const f = (d?: string) => (d ? format(parseISO(d), "dd MMM yyyy", { locale: id }) : "—")
    return `${f(inv.start_date)} — ${f(inv.end_date)}`
  }

  const description =
    invoices.length === 1
      ? `Ubah status invoice ${formatPeriod(invoices[0])} menjadi ${targetLabel}?`
      : `Ubah status ${invoices.length} invoice menjadi ${targetLabel}?`

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Konfirmasi Perubahan Status</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            <span className="inline-flex items-center gap-2">
              {isPending && <Spinner />}
              {targetLabel}
            </span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
