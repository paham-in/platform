import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ReceiptText } from "lucide-react"
import { getAdminInvoicesQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import type { InvoiceInvoiceResponse } from "@/lib/api/types.gen"
import { refundClaimsOptions, refundClaimsQueryKey, setClaimDoneMutation } from "@/lib/refund-claims"

interface RefundInvoiceDialogProps {
  invoice: InvoiceInvoiceResponse
  onClose: () => void
}

const fmtRp = (n?: number) => `Rp ${(n ?? 0).toLocaleString("id-ID")}`

export function RefundInvoiceDialog({ invoice, onClose }: RefundInvoiceDialogProps) {
  const qc = useQueryClient()
  const { data: claims = [], isLoading } = useQuery(refundClaimsOptions(invoice.id))

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: refundClaimsQueryKey(invoice.id!) })
    qc.invalidateQueries({ queryKey: getAdminInvoicesQueryKey() })
  }

  const { mutate: setDone, isPending, variables } = useMutation({
    ...setClaimDoneMutation(),
    onSuccess: (_, v) => {
      toast.success(v.done ? "Klaim ditandai sudah ditransfer" : "Tanda klaim dibatalkan")
      invalidate()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal menyimpan status klaim"),
  })

  const total = claims.reduce((s, c) => s + (c.amount ?? 0), 0)
  const unpaid = claims.filter((c) => !c.done).reduce((s, c) => s + (c.amount ?? 0), 0)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Refund Invoice</DialogTitle>
          <DialogDescription>
            Total utang {fmtRp(total)} · sisa {fmtRp(unpaid)} untuk tagihan {fmtRp(invoice.amount)}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : claims.length === 0 ? (
          <Empty className="border-0 py-6">
            <EmptyHeader>
              <EmptyMedia variant="icon"><ReceiptText /></EmptyMedia>
              <EmptyTitle>Belum ada klaim refund</EmptyTitle>
              <EmptyDescription>Klaim muncul otomatis tiap ada sesi dibatalkan.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="max-h-[50vh] divide-y overflow-y-auto rounded-md border">
            {claims.map((c) => {
              const pending = isPending && variables?.claimId === c.id
              return (
                <div key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {c.date ? `${c.date} ${c.start_time ?? ""}–${c.end_time ?? ""}` : (c.note || "Saldo migrasi")}
                    </p>
                    <p className="text-sm tabular-nums text-amber-600">{fmtRp(c.amount)}</p>
                  </div>
                  {c.done ? (
                    <Badge variant="outline" className="border-transparent bg-green-100 text-green-700">Sudah transfer</Badge>
                  ) : (
                    <Badge variant="outline" className="border-transparent bg-yellow-100 text-yellow-700">Belum transfer</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => c.id && setDone({ claimId: c.id, done: !c.done })}
                  >
                    {pending && <Spinner />}
                    {c.done ? "Batalkan" : "Tandai"}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
        <p className="text-xs text-muted-foreground">Pastikan uang sudah ditransfer manual ke murid sebelum menandai.</p>
      </DialogContent>
    </Dialog>
  )
}
