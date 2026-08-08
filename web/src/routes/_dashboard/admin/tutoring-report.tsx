import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAdminTutoringReportOptions } from "@/lib/api/@tanstack/react-query.gen"
import { SearchX } from "lucide-react"

const fmtRp = (n?: number) => `Rp ${(n ?? 0).toLocaleString("id-ID")}`

function modeBadge(mode?: string) {
  if (mode === "semi_private") {
    return <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">Semi Private</span>
  }
  return <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">Private</span>
}

function invoiceBadge(status?: string) {
  if (status === "paid") return <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Lunas</span>
  return <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">Pending</span>
}

function TutoringReport() {
  const { data: reports = [], isLoading } = useQuery(getAdminTutoringReportOptions())

  const totals = reports.reduce(
    (acc, r) => {
      acc.done += r.done_count ?? 0
      acc.cancelled += r.cancelled_count ?? 0
      acc.refund += r.refund_amount ?? 0
      acc.feeUnpaid += r.fee_unpaid_total ?? 0
      return acc
    },
    { done: 0, cancelled: 0, refund: 0, feeUnpaid: 0 }
  )

  const summary = [
    { label: "Sesi Terlaksana", value: String(totals.done), className: "text-green-600" },
    { label: "Sesi Batal", value: String(totals.cancelled), className: "text-red-600" },
    { label: "Estimasi Refund", value: fmtRp(totals.refund), className: "text-red-600" },
    { label: "Fee Guru Belum Dibayar", value: fmtRp(totals.feeUnpaid), className: "text-amber-600" },
  ]

  return (
    <main className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Rekap Les Privat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Jumlah pertemuan terlaksana, batal, dan estimasi refund per booking.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <span className={`text-2xl font-bold ${s.className}`}>{s.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="pt-0 gap-0 pb-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6">Guru</TableHead>
                <TableHead>Murid</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Terlaksana</TableHead>
                <TableHead>Batal</TableHead>
                <TableHead>Sisa</TableHead>
                <TableHead>Harga/Sesi</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead className="pr-6 text-right">Refund</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="pr-6 text-right"><Skeleton className="ml-auto h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="p-8 text-center">
                    <SearchX className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
                    <p className="text-muted-foreground">Belum ada booking les privat.</p>
                  </TableCell>
                </TableRow>
              ) : reports.map((r) => (
                <TableRow key={r.booking_id}>
                  <TableCell className="pl-6 font-medium">{r.teacher_name ?? "—"}</TableCell>
                  <TableCell>{r.student_name ?? "—"}</TableCell>
                  <TableCell>{modeBadge(r.mode)}</TableCell>
                  <TableCell className="tabular-nums">{r.session_count ?? 0}</TableCell>
                  <TableCell className="tabular-nums text-green-700">{r.done_count ?? 0}</TableCell>
                  <TableCell className="tabular-nums text-red-700">{r.cancelled_count ?? 0}</TableCell>
                  <TableCell className="tabular-nums">{(r.session_count ?? 0) - (r.done_count ?? 0) - (r.cancelled_count ?? 0)}</TableCell>
                  <TableCell className="tabular-nums">{fmtRp(r.price_per_session)}</TableCell>
                  <TableCell>{invoiceBadge(r.invoice_status)}</TableCell>
                  <TableCell className="pr-6 text-right font-semibold text-red-600">{fmtRp(r.refund_amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/tutoring-report")({
  component: TutoringReport,
})
