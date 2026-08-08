import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAdminTutoringFeesOptions, getAdminTutoringFeesQueryKey, patchAdminTutoringFeesByIdMutation } from "@/lib/api/@tanstack/react-query.gen"
import { SearchX } from "lucide-react"
import { toast } from "sonner"

const teacherFeesSearchSchema = z.object({
  status: z.enum(["paid", "unpaid"]).optional(),
})

const fmtRp = (n?: number) => `Rp ${(n ?? 0).toLocaleString("id-ID")}`

function feeBadge(paid?: boolean) {
  if (paid) return <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Sudah Dibayar</span>
  return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Belum Dibayar</span>
}

function TeacherFees() {
  const navigate = useNavigate({ from: Route.fullPath })
  const qc = useQueryClient()
  const { status } = Route.useSearch()
  const { data: sessions = [], isLoading } = useQuery(getAdminTutoringFeesOptions())

  const filtered = status
    ? sessions.filter((s) => (status === "paid" ? s.fee_paid : !s.fee_paid))
    : sessions

  const toggle = useMutation({
    ...patchAdminTutoringFeesByIdMutation(),
    onSuccess: () => {
      toast.success("Status fee guru diperbarui")
      qc.invalidateQueries({ queryKey: getAdminTutoringFeesQueryKey() })
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal mengubah status fee"),
  })

  const setFilter = (s: "paid" | "unpaid" | undefined) => {
    navigate({ search: (prev) => ({ ...prev, status: s }), replace: true })
  }

  return (
    <main className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Guru</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Catat pembayaran fee ke guru per pertemuan yang terlaksana.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant={!status ? "default" : "outline"} onClick={() => setFilter(undefined)}>Semua</Button>
        <Button size="sm" variant={status === "unpaid" ? "default" : "outline"} onClick={() => setFilter(status === "unpaid" ? undefined : "unpaid")}>Belum Dibayar</Button>
        <Button size="sm" variant={status === "paid" ? "default" : "outline"} onClick={() => setFilter(status === "paid" ? undefined : "paid")}>Sudah Dibayar</Button>
      </div>

      <Card className="pt-0 gap-0 pb-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6">Guru</TableHead>
                <TableHead>Murid</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Fee Guru</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="pr-6 text-right"><Skeleton className="ml-auto h-8 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-8 text-center">
                    <SearchX className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
                    <p className="text-muted-foreground">Tidak ada sesi terlaksana.</p>
                  </TableCell>
                </TableRow>
              ) : filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="pl-6 font-medium">{s.teacher_name ?? "—"}</TableCell>
                  <TableCell>{s.student_name ?? "—"}</TableCell>
                  <TableCell>{s.date}</TableCell>
                  <TableCell className="tabular-nums">{s.start_time} – {s.end_time}</TableCell>
                  <TableCell className="tabular-nums font-medium">{fmtRp(s.fee_amount)}</TableCell>
                  <TableCell>{feeBadge(s.fee_paid)}</TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button
                      size="sm"
                      variant={s.fee_paid ? "outline" : "default"}
                      onClick={() => toggle.mutate({ path: { id: s.id! } })}
                      disabled={toggle.isPending}
                    >
                      {s.fee_paid ? "Tandai Belum" : "Tandai Sudah"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/teacher-fees")({
  component: TeacherFees,
  validateSearch: teacherFeesSearchSchema,
})
