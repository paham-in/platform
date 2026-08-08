import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getTutoringEarningsOptions } from "@/lib/api/@tanstack/react-query.gen"
import { SearchX } from "lucide-react"

const fmtRp = (n?: number) => `Rp ${(n ?? 0).toLocaleString("id-ID")}`

function feeBadge(paid?: boolean) {
  if (paid) return <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Sudah Dibayar</span>
  return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Belum Dibayar</span>
}

function modeBadge(mode?: string) {
  if (mode === "semi_private") {
    return <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">Semi Private</span>
  }
  return <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">Private</span>
}

export function Earnings() {
  const { data, isLoading } = useQuery(getTutoringEarningsOptions())

  const sessions = data?.sessions ?? []
  const summary = [
    { label: "Total Sesi Selesai", value: String(data?.total_sessions ?? 0), className: "text-foreground" },
    { label: "Total Pendapatan", value: fmtRp(data?.total_fee), className: "text-green-600" },
    { label: "Sudah Dibayar", value: fmtRp(data?.fee_paid_total), className: "text-green-600" },
    { label: "Belum Dibayar", value: fmtRp(data?.fee_unpaid_total), className: "text-amber-600" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <TableHead className="pl-6">Murid</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead className="pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-8 text-center">
                    <SearchX className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
                    <p className="text-muted-foreground">Belum ada sesi yang selesai.</p>
                  </TableCell>
                </TableRow>
              ) : sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="pl-6 font-medium">{s.student_name ?? "—"}</TableCell>
                  <TableCell>{modeBadge(s.mode)}</TableCell>
                  <TableCell>{s.date}</TableCell>
                  <TableCell className="tabular-nums">{s.start_time} – {s.end_time}</TableCell>
                  <TableCell className="tabular-nums font-medium">{fmtRp(s.fee_amount)}</TableCell>
                  <TableCell className="pr-6">{feeBadge(s.fee_paid)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
