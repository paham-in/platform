import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getAdminTutoringEvidenceOptions, getAdminUsersOptions, getAdminTutoringReportOptions } from "@/lib/api/@tanstack/react-query.gen"
import { Check, CheckCircle2, ClipboardCheck, MoreVertical, X, XCircle } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ApproveEvidenceDialog, RejectEvidenceDialog, ToggleFeeDialog } from "@/components/admin/attendance"
import type { TutoringListSessionsResponse } from "@/lib/api/types.gen"
import { usePageTitle } from "@/components/page-title"
import { useState, useEffect } from "react"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"

const attendanceDetailSearchSchema = z.object({
  status: z.enum(["review", "done"]).optional(),
  modal: z.string().optional(),
})

const statusFilters = [
  { key: "review", label: "Menunggu Validasi" },
  { key: "done", label: "Selesai" },
] as const

const fmtRp = (n?: number) => `Rp ${(n ?? 0).toLocaleString("id-ID")}`

function statusBadge(s?: string) {
  if (s === "review") return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Menunggu Validasi</span>
  if (s === "done") return <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Selesai</span>
  if (s === "scheduled") return <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">Terjadwal</span>
  return <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">{s || "—"}</span>
}

function feeBadge(paid?: boolean) {
  if (paid) return <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Sudah Dibayar</span>
  return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Belum Dibayar</span>
}

function AttendanceDetail() {
  const { userId } = Route.useParams()
  const navigate = useNavigate({ from: Route.fullPath })
  const { status, modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()
  const { data: sessions = [], isLoading } = useQuery(getAdminTutoringEvidenceOptions({ query: { status } }))
  const { data: users = [] } = useQuery(getAdminUsersOptions())
  const { data: reports = [] } = useQuery(getAdminTutoringReportOptions())
  const [approveTarget, setApproveTarget] = useState<TutoringListSessionsResponse | null>(null)
  const [rejectTarget, setRejectTarget] = useState<TutoringListSessionsResponse | null>(null)
  const [feeTarget, setFeeTarget] = useState<TutoringListSessionsResponse | null>(null)

  useEffect(() => {
    if (modal !== "approve") setApproveTarget(null)
    if (modal !== "reject") setRejectTarget(null)
    if (modal !== "fee") setFeeTarget(null)
  }, [modal])

  const user = users.find((u) => u.id === Number(userId))
  usePageTitle(user?.name ?? "Validasi & Fee Guru")
  const studentSessions = sessions.filter((s) => s.student_id === Number(userId))
  const studentReports = reports.filter((r) => r.student_id === Number(userId))

  const summary = studentReports.reduce(
    (acc, r) => {
      acc.total += r.session_count ?? 0
      acc.done += r.done_count ?? 0
      acc.cancelled += r.cancelled_count ?? 0
      acc.refund += r.refund_amount ?? 0
      acc.feeUnpaid += r.fee_unpaid_total ?? 0
      return acc
    },
    { total: 0, done: 0, cancelled: 0, refund: 0, feeUnpaid: 0 }
  )

  const summaryCards = [
    { label: "Total Sesi", value: String(summary.total), className: "text-foreground" },
    { label: "Sesi Terlaksana", value: String(summary.done), className: "text-green-600" },
    { label: "Sesi Batal", value: String(summary.cancelled), className: "text-red-600" },
    { label: "Estimasi Refund", value: fmtRp(summary.refund), className: "text-red-600" },
    { label: "Fee Guru Belum Dibayar", value: fmtRp(summary.feeUnpaid), className: "text-amber-600" },
  ]

  const setFilter = (s: "review" | "done" | undefined) => {
    navigate({ search: (prev) => ({ ...prev, status: s }), replace: true })
  }

  return (
    <main className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">{user?.name ?? "—"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user?.email ?? ""}</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summaryCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <span className={`text-2xl font-bold ${s.className}`}>{s.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant={!status ? "default" : "outline"} onClick={() => setFilter(undefined)}>
          Semua
        </Button>
        {statusFilters.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={status === f.key ? "default" : "outline"}
            onClick={() => setFilter(status === f.key ? undefined : f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Card className="pt-0 gap-0 pb-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6">Guru</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bukti</TableHead>
                <TableHead>Fee Guru</TableHead>
                <TableHead className="pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-8 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : studentSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Empty className="border-0 p-8">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><ClipboardCheck /></EmptyMedia>
                        <EmptyTitle>Tidak ada sesi dengan bukti kehadiran untuk murid ini</EmptyTitle>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : studentSessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="pl-6 font-medium">{s.teacher_name ?? "—"}</TableCell>
                  <TableCell>{s.date}</TableCell>
                  <TableCell className="tabular-nums">{s.start_time} – {s.end_time}</TableCell>
                  <TableCell>{statusBadge(s.status)}</TableCell>
                  <TableCell>
                    {s.evidence_url ? (
                      <a href={s.evidence_url} target="_blank" rel="noreferrer" className="inline-block overflow-hidden rounded-lg border">
                        <img src={s.evidence_url} alt="Bukti kehadiran" className="h-10 w-16 object-cover" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {s.status === "done" && s.invoice_paid ? (
                      <div className="space-y-1">
                        <div className="tabular-nums font-medium">{fmtRp(s.fee_amount)}</div>
                        {feeBadge(s.fee_paid)}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {s.status === "done" ? "Tunggu invoice lunas" : s.status === "review" ? "Menunggu validasi" : "Belum terlaksana"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={s.status !== "review" && !(s.status === "done" && s.invoice_paid)}
                          />
                        }
                      >
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {s.status === "review" ? (
                          <>
                            <DropdownMenuItem onClick={() => { setApproveTarget(s); openModal("approve") }}>
                              <Check className="h-4 w-4 text-green-600" /> Setujui
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setRejectTarget(s); openModal("reject") }}>
                              <X className="h-4 w-4 text-destructive" /> Tolak
                            </DropdownMenuItem>
                          </>
                        ) : s.status === "done" && s.invoice_paid ? (
                          <DropdownMenuItem onClick={() => { setFeeTarget(s); openModal("fee") }}>
                            {s.fee_paid ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            {s.fee_paid ? "Tandai Belum" : "Tandai Sudah"}
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {modal === "approve" && approveTarget && <ApproveEvidenceDialog session={approveTarget} onClose={closeModal} />}
      {modal === "reject" && rejectTarget && <RejectEvidenceDialog session={rejectTarget} onClose={closeModal} />}
      {modal === "fee" && feeTarget && <ToggleFeeDialog session={feeTarget} onClose={closeModal} />}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/attendance/$userId")({
  component: AttendanceDetail,
  validateSearch: attendanceDetailSearchSchema,
})
