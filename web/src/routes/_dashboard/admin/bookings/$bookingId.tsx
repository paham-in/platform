import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { useQuery } from "@tanstack/react-query"
import {
  getAdminInvoicesOptions,
  getAdminTutoringBookingsOptions,
  getAdminTutoringBookingsByIdSessionsOptions,
  getAdminTutoringEvidenceOptions,
  getAdminTutoringReportOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListSessionsResponse } from "@/lib/api/types.gen"
import { ArrowLeftRight, BookOpen, CalendarDays, CalendarX2, Users, UserRound, GraduationCap, MoreVertical, Check, X, CheckCircle2, XCircle, Plus, History, Repeat } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"
import { usePageHeaderAction } from "@/components/page-title"
import { useEffect, useMemo, useState } from "react"
import { SwapSessionTeacherDialog } from "@/components/admin/attendance/swap-session-teacher-dialog"
import { ApproveEvidenceDialog, CancelSessionDialog, RejectEvidenceDialog, RestoreSessionDialog, ToggleFeeDialog } from "@/components/admin/attendance"
import { ReassignTeacherDialog, ExtendBookingDialog } from "@/components/admin/tutoring"
import { InvoiceSection, RefundSection } from "@/components/admin/payments"

const adminBookingDetailSearchSchema = z.object({
  modal: z.string().optional(),
})

function statusBadge(s: string) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-700",
  }
  const labels: Record<string, string> = {
    pending: "Menunggu", confirmed: "Disetujui", rejected: "Ditolak", cancelled: "Dibatalkan",
  }
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[s] || ""}`}>{labels[s] || s}</span>
}

function sessionStatusBadge(s?: string) {
  const styles: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-700",
    review: "bg-amber-100 text-amber-700",
  }
  const labels: Record<string, string> = {
    scheduled: "Terjadwal", done: "Selesai", cancelled: "Dibatalkan", review: "Menunggu Validasi",
  }
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[s || ""] || ""}`}>{labels[s || ""] || s}</span>
}

const fmtRp = (n?: number) => `Rp ${(n ?? 0).toLocaleString("id-ID")}`

// "2026-09-12" → "Jumat, 12 September 2026". Parse manual (bukan new Date)
// supaya tidak geser hari karena zona waktu.
function parseYMD(s?: string): Date | undefined {
  if (!s) return undefined
  const [y, m, d] = s.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

function formatDay(s?: string) {
  const d = parseYMD(s)
  return d ? format(d, "EEEE, d MMMM yyyy", { locale: localeId }) : "—"
}

function feeBadge(paid?: boolean) {
  if (paid) return <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Sudah Dibayar</span>
  return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Belum Dibayar</span>
}

function AdminBookingDetail() {
  const { bookingId } = Route.useParams()
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery(getAdminTutoringBookingsOptions())
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery(getAdminTutoringBookingsByIdSessionsOptions({ path: { id: Number(bookingId) } }))
  const { data: evidence = [], isLoading: evidenceLoading } = useQuery(getAdminTutoringEvidenceOptions())
  const { data: reports = [] } = useQuery(getAdminTutoringReportOptions())
  const isLoading = bookingsLoading || sessionsLoading || evidenceLoading

  const booking = bookings.find((b) => b.id === Number(bookingId))
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    ...getAdminInvoicesOptions({ query: { user_id: booking?.student_id } }),
    enabled: booking?.student_id != null,
  })

  const [swapSession, setSwapSession] = useState<TutoringListSessionsResponse | null>(null)
  const [approveTarget, setApproveTarget] = useState<TutoringListSessionsResponse | null>(null)
  const [rejectTarget, setRejectTarget] = useState<TutoringListSessionsResponse | null>(null)
  const [feeTarget, setFeeTarget] = useState<TutoringListSessionsResponse | null>(null)
  const [cancelTarget, setCancelTarget] = useState<TutoringListSessionsResponse | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<TutoringListSessionsResponse | null>(null)
  const [reassignActive, setReassignActive] = useState(false)
  const [extendActive, setExtendActive] = useState(false)

  useEffect(() => {
    if (modal !== "swap") setSwapSession(null)
    if (modal !== "approve") setApproveTarget(null)
    if (modal !== "reject") setRejectTarget(null)
    if (modal !== "fee") setFeeTarget(null)
    if (modal !== "cancel") setCancelTarget(null)
    if (modal !== "restore") setRestoreTarget(null)
    if (modal !== "reassign") setReassignActive(false)
    if (modal !== "extend") setExtendActive(false)
  }, [modal])

  const evidenceById = new Map((evidence ?? []).map((s) => [s.id!, s]))
  const evOf = (s: TutoringListSessionsResponse) => evidenceById.get(s.id!) ?? s

  const feeInfo = (s: TutoringListSessionsResponse) => {
    const ev = evidenceById.get(s.id!)
    if (s.status === "done" && ev?.invoice_paid) {
      return (
        <div className="space-y-1">
          <div className="tabular-nums font-medium">{fmtRp(ev.fee_amount)}</div>
          {feeBadge(ev.fee_paid)}
        </div>
      )
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        {s.status === "done" ? "Tunggu invoice lunas" : s.status === "review" ? "Menunggu validasi" : "Belum terlaksana"}
      </Badge>
    )
  }

  const hasActions = (s: TutoringListSessionsResponse) =>
    s.status === "scheduled" || s.status === "review" || s.status === "cancelled" || (s.status === "done" && !!evidenceById.get(s.id!)?.invoice_paid)


  if (!isLoading && !booking) {
    return (
      <main className="p-4 md:p-6">
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-muted-foreground">Booking tidak ditemukan</p>
        </div>
      </main>
    )
  }

  const report = reports.find((r) => r.booking_id === Number(bookingId))
  const bookingInvoiceList = invoices.filter((i) => i.booking_id === Number(bookingId))
  const bookingInvoices = bookingInvoiceList.filter((i) => i.status !== "batal")
  const invoiceTotal = bookingInvoices.reduce((sum, i) => sum + (i.amount ?? 0), 0)
  const invoicePaid = bookingInvoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + (i.amount ?? 0), 0)
  const doneSessions = sessions.filter((s) => s.status === "done").length
  const totalSessions = booking?.session_count ?? sessions.length

  const summaryCards = [
    { label: "Total Tagihan", value: fmtRp(invoiceTotal) },
    { label: "Sudah Dibayar", value: fmtRp(invoicePaid) },
    { label: "Estimasi Refund", value: fmtRp(report?.refund_amount) },
    { label: "Fee Belum Dibayar", value: fmtRp(report?.fee_unpaid_total) },
    { label: "Sesi Selesai", value: `${doneSessions}/${totalSessions}` },
  ]

  // Aksi halaman di header mobile (dropdown hemat tempat). Versi inline di
  // bawah hanya tampil di desktop.
  const canReassign = !isLoading && booking?.status === "confirmed" && !sessions.some((s) => s.evidence_url)
  const canExtend = !isLoading && booking?.status === "confirmed"
  const headerAction = useMemo(() => {
    if (!canReassign && !canExtend) return null
    return (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon-lg" aria-label="Aksi booking" />}>
          <MoreVertical className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {canReassign && (
            <DropdownMenuItem onClick={() => { setReassignActive(true); openModal("reassign") }}>
              <ArrowLeftRight className="h-4 w-4" /> Ganti Guru
            </DropdownMenuItem>
          )}
          {canExtend && (
            <DropdownMenuItem onClick={() => { setExtendActive(true); openModal("extend") }}>
              <Plus className="h-4 w-4" /> Tambah Sesi
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }, [canReassign, canExtend])
  usePageHeaderAction(headerAction)

  return (
    <main className="p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        {isLoading || !booking ? (
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-56" />
          </div>
        ) : (
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{booking.student_name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {booking.mode === "group"
                ? <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"><Users className="h-3 w-3" /> Kelompok</span>
                : <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700"><UserRound className="h-3 w-3" /> Private</span>}
              {statusBadge(booking.status!)}
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                <span>{booking.subject_name ?? "—"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                <span className="tabular-nums">{formatDay(booking.date)}, {booking.start_time} - {booking.end_time}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Repeat className="h-3.5 w-3.5 shrink-0" />
                <span className="tabular-nums">{booking.session_count ?? 1}× pertemuan</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{booking.teacher_name ?? "Belum ada guru"}</span>
              </div>
            </div>
          </div>
        )}
        {!isLoading && booking?.status === "confirmed" && !sessions.some((s) => s.evidence_url) && (
          <Button variant="outline" className="hidden md:inline-flex" onClick={() => { setReassignActive(true); openModal("reassign") }}>
            <ArrowLeftRight className="mr-1 h-4 w-4" /> Ganti Guru
          </Button>
        )}
      </div>

      {!isLoading && booking && (
        <>
          <div className="mb-4 hidden grid-cols-5 gap-3 lg:grid">
            {summaryCards.map((s) => (
              <Card key={s.label}>
                <CardContent className="flex flex-col gap-0.5 py-3">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <span className="text-lg font-bold tabular-nums">{s.value}</span>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="mb-4 gap-0 py-0 lg:hidden">
            <CardContent className="divide-y p-0">
              {summaryCards.map((s) => (
                <div key={s.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <span className="font-bold tabular-nums">{s.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Daftar Sesi</h2>
        {!isLoading && booking?.status === "confirmed" && (
          <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={() => { setExtendActive(true); openModal("extend") }}>
            <Plus className="mr-1 h-4 w-4" /> Tambah Sesi
          </Button>
        )}
      </div>
      <Card className="hidden gap-0 pt-0 pb-0 md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6">Tanggal</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Guru</TableHead>
                <TableHead>Bukti</TableHead>
                <TableHead>Fee Guru</TableHead>
                <TableHead className="pr-6 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="ml-auto h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Empty className="border-0 p-8">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><CalendarX2 /></EmptyMedia>
                        <EmptyTitle>Belum ada sesi terjadwal</EmptyTitle>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="pl-6 tabular-nums">{formatDay(s.date)}</TableCell>
                  <TableCell className="tabular-nums">
                    {s.start_time} - {s.end_time}
                    {(s.overtime_minutes ?? 0) > 0 && (
                      <span className="mt-0.5 block text-xs font-medium text-amber-600">
                        +{s.overtime_minutes} mnt (s.d. {s.actual_end_time}) · +{s.extra_sessions ?? 0} sesi
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {sessionStatusBadge(s.status)}
                      {s.is_substitute ? (
                        <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-medium text-cyan-700">Pengganti</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{s.teacher_name ?? "—"}</TableCell>
                  <TableCell>
                    {s.evidence_url ? (
                      <a href={s.evidence_url} target="_blank" rel="noreferrer" className="inline-block overflow-hidden rounded-lg border">
                        <img src={s.evidence_url} alt="Bukti kehadiran" className="h-10 w-16 object-cover" />
                      </a>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Belum ada</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {feeInfo(s)}
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex items-center justify-end">
                      {hasActions(s) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Aksi sesi" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {s.status === "scheduled" ? (
                            <>
                              <DropdownMenuItem onClick={() => { setSwapSession(s); openModal("swap") }}>
                                <ArrowLeftRight className="h-4 w-4" /> Alihkan Sesi Ini
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onClick={() => { setCancelTarget(s); openModal("cancel") }}>
                                <X className="h-4 w-4" /> Batalkan Sesi
                              </DropdownMenuItem>
                            </>
                          ) : s.status === "review" ? (
                            <>
                              <DropdownMenuItem onClick={() => { setApproveTarget(s); openModal("approve") }}>
                                <Check className="h-4 w-4 text-green-600" /> Setujui
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setRejectTarget(s); openModal("reject") }}>
                                <X className="h-4 w-4 text-destructive" /> Tolak
                              </DropdownMenuItem>
                            </>
                          ) : s.status === "cancelled" ? (
                            <DropdownMenuItem onClick={() => { setRestoreTarget(s); openModal("restore") }}>
                              <History className="h-4 w-4" /> Kembalikan Sesi
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => { setFeeTarget(s); openModal("fee") }}>
                              {evOf(s).fee_paid ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                              {evOf(s).fee_paid ? "Tandai Belum" : "Tandai Sudah"}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0 md:hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <Empty className="p-8">
              <EmptyHeader>
                <EmptyMedia variant="icon"><CalendarX2 /></EmptyMedia>
                <EmptyTitle>Belum ada sesi terjadwal</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="divide-y">
              {sessions.map((s) => (
                <div key={s.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium tabular-nums">{formatDay(s.date)} · {s.start_time} - {s.end_time}</p>
                      {(s.overtime_minutes ?? 0) > 0 && (
                        <p className="mt-1 text-xs font-medium text-amber-600">
                          +{s.overtime_minutes} mnt (s.d. {s.actual_end_time}) · +{s.extra_sessions ?? 0} sesi
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {sessionStatusBadge(s.status)}
                        {s.is_substitute ? (
                          <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-medium text-cyan-700">Pengganti</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Guru: {s.teacher_name ?? "—"}</p>
                      {s.evidence_url ? (
                        <a href={s.evidence_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-primary hover:underline">
                          Lihat bukti
                        </a>
                      ) : (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-muted-foreground">Belum ada</Badge>
                        </div>
                      )}
                      <div className="mt-1">{feeInfo(s)}</div>
                    </div>
                    {hasActions(s) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Aksi sesi" className="shrink-0" />}>
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {s.status === "scheduled" ? (
                          <>
                            <DropdownMenuItem onClick={() => { setSwapSession(s); openModal("swap") }}>
                              <ArrowLeftRight className="h-4 w-4" /> Alihkan Sesi Ini
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => { setCancelTarget(s); openModal("cancel") }}>
                              <X className="h-4 w-4" /> Batalkan Sesi
                            </DropdownMenuItem>
                          </>
                        ) : s.status === "review" ? (
                          <>
                            <DropdownMenuItem onClick={() => { setApproveTarget(s); openModal("approve") }}>
                              <Check className="h-4 w-4 text-green-600" /> Setujui
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setRejectTarget(s); openModal("reject") }}>
                              <X className="h-4 w-4 text-destructive" /> Tolak
                            </DropdownMenuItem>
                          </>
                        ) : s.status === "cancelled" ? (
                          <DropdownMenuItem onClick={() => { setRestoreTarget(s); openModal("restore") }}>
                            <History className="h-4 w-4" /> Kembalikan Sesi
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => { setFeeTarget(s); openModal("fee") }}>
                            {evOf(s).fee_paid ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            {evOf(s).fee_paid ? "Tandai Belum" : "Tandai Sudah"}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <div className="mt-6">
        {!isLoading && booking && (
          <RefundSection
            bookingId={Number(bookingId)}
            modal={modal}
            openModal={openModal}
            closeModal={closeModal}
          />
        )}
        <InvoiceSection
          title="Tagihan"
          invoices={bookingInvoiceList}
          isLoading={isLoading || invoicesLoading}
          modal={modal}
          openModal={openModal}
          closeModal={closeModal}
        />
      </div>

      {modal === "swap" && swapSession && (
        <SwapSessionTeacherDialog session={swapSession} onClose={closeModal} />
      )}
      {modal === "approve" && approveTarget && <ApproveEvidenceDialog session={evOf(approveTarget)} onClose={closeModal} />}
      {modal === "reject" && rejectTarget && <RejectEvidenceDialog session={evOf(rejectTarget)} onClose={closeModal} />}
      {modal === "fee" && feeTarget && <ToggleFeeDialog session={evOf(feeTarget)} onClose={closeModal} />}
      {modal === "cancel" && cancelTarget && <CancelSessionDialog session={cancelTarget} onClose={closeModal} />}
      {modal === "restore" && restoreTarget && <RestoreSessionDialog session={restoreTarget} onClose={closeModal} />}
      {modal === "reassign" && reassignActive && booking && <ReassignTeacherDialog booking={booking} onClose={closeModal} />}
      {modal === "extend" && extendActive && booking && <ExtendBookingDialog booking={booking} onClose={closeModal} />}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/bookings/$bookingId")({
  component: AdminBookingDetail,
  validateSearch: adminBookingDetailSearchSchema,
})
