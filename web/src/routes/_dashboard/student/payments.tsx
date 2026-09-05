import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { deleteInvoicesByIdMutation, getInvoicesOptions, getInvoicesQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import type { InvoiceInvoiceResponse } from "@/lib/api/types.gen"
import { CreditCard, CheckCircle2, Clock, ReceiptText, MoreVertical, XCircle } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { usePageTitle } from "@/components/page-title"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"
import { useEffect, useState } from "react"
import { toast } from "sonner"

const paymentsSearchSchema = z.object({
  modal: z.string().optional(),
})

function formatDate(iso?: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

// canCancel: langganan milik sendiri yang masih pending dan bukan dari booking.
// Invoice booking hanya bisa hilang lewat pembatalan booking.
function canCancel(inv: InvoiceInvoiceResponse) {
  return inv.status === "pending" && !inv.booking_id
}

function CancelInvoiceDialog({ invoice, onClose }: { invoice: InvoiceInvoiceResponse; onClose: () => void }) {
  const qc = useQueryClient()

  const { mutate: cancelInvoice, isPending } = useMutation({
    ...deleteInvoicesByIdMutation(),
    onSuccess: () => {
      toast.success("Invoice dibatalkan")
      qc.invalidateQueries({ queryKey: getInvoicesQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal membatalkan invoice"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Batalkan Invoice</AlertDialogTitle>
          <AlertDialogDescription>
            Yakin batalkan tagihan Rp {invoice.amount?.toLocaleString("id-ID")} ({invoice.note || "tanpa catatan"})? Tindakan ini tidak bisa dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => invoice.id && cancelInvoice({ path: { id: invoice.id } })} disabled={isPending}>
            {isPending && <Spinner />}
            Batalkan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function StudentPayments() {
  usePageTitle("Riwayat Pembayaran")
  const { data: invoices = [], isLoading } = useQuery(getInvoicesOptions())
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()
  const [cancelTarget, setCancelTarget] = useState<InvoiceInvoiceResponse | null>(null)

  useEffect(() => {
    if (modal !== "cancel") setCancelTarget(null)
  }, [modal])

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Spinner />
      </main>
    )
  }

  const total = invoices.reduce((sum, inv) => sum + (inv.amount ?? 0), 0)
  const totalPaid = invoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + (inv.amount ?? 0), 0)
  const totalPending = invoices.filter((inv) => inv.status === "pending").reduce((sum, inv) => sum + (inv.amount ?? 0), 0)

  const stats = [
    { icon: CreditCard, label: "Total Tagihan", value: total, color: "text-blue-600 bg-blue-100" },
    { icon: CheckCircle2, label: "Total Lunas", value: totalPaid, color: "text-green-600 bg-green-100" },
    { icon: Clock, label: "Tagihan Pending", value: totalPending, color: "text-orange-600 bg-orange-100" },
    { icon: ReceiptText, label: "Jumlah Invoice", value: invoices.length, color: "text-purple-600 bg-purple-100" },
  ]

  return (
    <main className="p-4 md:p-6">
      <div className="space-y-4 md:space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Riwayat Pembayaran</h2>
          <p className="text-muted-foreground">Daftar tagihan dan status pembayaran kamu.</p>
        </div>

        <div className="hidden gap-4 md:gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}><CardContent className="flex flex-col gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div>
                <div className="text-2xl font-bold">
                  {s.label === "Jumlah Invoice" ? s.value : `Rp ${s.value.toLocaleString("id-ID")}`}
                </div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            </CardContent></Card>
          ))}
        </div>

        <Card className="sm:hidden">
          <CardContent className="divide-y">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.color}`}><s.icon className="h-4 w-4" /></div>
                <div>
                  <div className="text-base font-semibold">
                    {s.label === "Jumlah Invoice" ? s.value : `Rp ${s.value.toLocaleString("id-ID")}`}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="hidden gap-0 pt-0 pb-0 md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Periode</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead>Tgl Buat</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Empty className="border-0 p-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><ReceiptText /></EmptyMedia>
                          <EmptyTitle>Belum ada invoice</EmptyTitle>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv: InvoiceInvoiceResponse) => (
                    <TableRow key={inv.id}>
                      <TableCell className="pl-6 font-medium">
                        {formatDate(inv.start_date)} - {formatDate(inv.end_date)}
                      </TableCell>
                      <TableCell>Rp {inv.amount?.toLocaleString("id-ID")}</TableCell>
                      <TableCell>
                        {inv.status === "paid" ? (
                          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                            Lunas
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                            Pending
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {inv.note || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(inv.created_at)}</TableCell>
                      <TableCell className="pr-6">
                        <div className="flex items-center justify-end">
                          {canCancel(inv) ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Aksi invoice" />}>
                                <MoreVertical className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem variant="destructive" onClick={() => { setCancelTarget(inv); openModal("cancel") }}>
                                  <XCircle className="h-4 w-4" /> Batalkan Invoice
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0 md:hidden">
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <Empty className="p-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><ReceiptText /></EmptyMedia>
                  <EmptyTitle>Belum ada invoice</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="divide-y">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">{formatDate(inv.start_date)} - {formatDate(inv.end_date)}</p>
                      <p className="mt-0.5 text-base font-semibold">Rp {inv.amount?.toLocaleString("id-ID")}</p>
                      {inv.note && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{inv.note}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">Dibuat {formatDate(inv.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {inv.status === "paid" ? (
                        <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          Lunas
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                          Pending
                        </span>
                      )}
                      {canCancel(inv) ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Aksi invoice" className="shrink-0" />}>
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem variant="destructive" onClick={() => { setCancelTarget(inv); openModal("cancel") }}>
                              <XCircle className="h-4 w-4" /> Batalkan Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {modal === "cancel" && cancelTarget && <CancelInvoiceDialog invoice={cancelTarget} onClose={closeModal} />}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/payments")({
  component: StudentPayments,
  validateSearch: paymentsSearchSchema,
})
