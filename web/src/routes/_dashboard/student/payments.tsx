import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useQuery } from "@tanstack/react-query"
import { getInvoicesOptions } from "@/lib/api/@tanstack/react-query.gen"
import type { InvoiceInvoiceResponse } from "@/lib/api/types.gen"
import { CreditCard, CheckCircle2, Clock, ReceiptText, Loader2 } from "lucide-react"

function StudentPayments() {
  const { data: invoices = [], isLoading } = useQuery(getInvoicesOptions())

  const total = invoices.reduce((sum, inv) => sum + (inv.amount ?? 0), 0)
  const totalPaid = invoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + (inv.amount ?? 0), 0)
  const totalPending = invoices.filter((inv) => inv.status === "pending").reduce((sum, inv) => sum + (inv.amount ?? 0), 0)

  const stats = [
    { icon: CreditCard, label: "Total Tagihan", value: total, color: "text-blue-600 bg-blue-100" },
    { icon: CheckCircle2, label: "Total Lunas", value: totalPaid, color: "text-green-600 bg-green-100" },
    { icon: Clock, label: "Tagihan Pending", value: totalPending, color: "text-orange-600 bg-orange-100" },
    { icon: ReceiptText, label: "Jumlah Invoice", value: invoices.length, color: "text-purple-600 bg-purple-100" },
  ]

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    )
  }

  return (
    <main className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Riwayat Pembayaran</h2>
          <p className="text-muted-foreground">Daftar tagihan dan status pembayaran kamu.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Periode</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead className="pr-6">Tgl Buat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-8 text-center text-muted-foreground">
                      Belum ada invoice
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv: InvoiceInvoiceResponse) => (
                    <TableRow key={inv.id}>
                      <TableCell className="pl-6 font-medium">
                        {inv.start_date} — {inv.end_date}
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
                      <TableCell className="pr-6 text-muted-foreground">{inv.created_at}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/payments")({
  component: StudentPayments,
})
