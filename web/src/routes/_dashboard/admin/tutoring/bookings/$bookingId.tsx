import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getAdminTutoringBookingsOptions,
  getAdminTutoringBookingsByIdSessionsOptions,
  getAdminTutoringBookingsByIdSessionsQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListSessionsResponse } from "@/lib/api/types.gen"
import { ArrowLeftRight, CalendarX2, Users, UserRound, MoreVertical } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { usePageTitle } from "@/components/page-title"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"
import { useEffect, useState } from "react"
import { ReassignTeacherDialog } from "@/components/admin/tutoring"
import { SwapSessionTeacherDialog } from "@/components/admin/attendance/swap-session-teacher-dialog"

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

function AdminBookingDetail() {
  const { bookingId } = Route.useParams()
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()
  const qc = useQueryClient()
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery(getAdminTutoringBookingsOptions())
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery(getAdminTutoringBookingsByIdSessionsOptions({ path: { id: Number(bookingId) } }))
  const isLoading = bookingsLoading || sessionsLoading

  const [swapSession, setSwapSession] = useState<TutoringListSessionsResponse | null>(null)

  useEffect(() => {
    if (modal !== "swap") setSwapSession(null)
  }, [modal])

  const invalidateSessions = () => qc.invalidateQueries({ queryKey: getAdminTutoringBookingsByIdSessionsQueryKey({ path: { id: Number(bookingId) } }) })

  const booking = bookings.find((b) => b.id === Number(bookingId))
  usePageTitle(booking?.student_name ? `Les ${booking.student_name}` : "Detail Booking")

  if (!isLoading && !booking) {
    return (
      <main className="p-4 md:p-6">
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-muted-foreground">Booking tidak ditemukan</p>
        </div>
      </main>
    )
  }

  const canReassignAll = !!booking?.teacher_id && booking?.status !== "cancelled" && booking?.status !== "rejected"

  return (
    <main className="p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        {isLoading || !booking ? (
          <>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-56" />
          </>
        ) : (
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{booking.student_name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              {booking.mode === "group"
                ? <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"><Users className="h-3 w-3" /> Kelompok</span>
                : <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700"><UserRound className="h-3 w-3" /> Private</span>}
              {statusBadge(booking.status!)}
              <span>{booking.subject_name ?? "—"} · {booking.date} {booking.start_time}–{booking.end_time} · {booking.session_count ?? 1}×</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Guru: {booking.teacher_name ?? "—"}</p>
          </div>
        )}
        {!isLoading && canReassignAll && (
          <Button variant="outline" onClick={() => openModal("reassign")}>
            <ArrowLeftRight className="h-4 w-4" /> Alihkan Semua Sisa Sesi
          </Button>
        )}
      </div>

      <h2 className="mb-2 text-lg font-semibold">Daftar Sesi</h2>
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
                    <TableCell className="pr-6"><Skeleton className="ml-auto h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
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
                  <TableCell className="pl-6 tabular-nums">{s.date}</TableCell>
                  <TableCell className="tabular-nums">{s.start_time} - {s.end_time}</TableCell>
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
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex items-center justify-end">
                      {s.status === "scheduled" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Aksi sesi" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => { setSwapSession(s); openModal("swap") }}>
                            <ArrowLeftRight className="h-4 w-4" /> Alihkan Sesi Ini
                          </DropdownMenuItem>
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
                      <p className="text-sm font-medium tabular-nums">{s.date} · {s.start_time} - {s.end_time}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {sessionStatusBadge(s.status)}
                        {s.is_substitute ? (
                          <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-medium text-cyan-700">Pengganti</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Guru: {s.teacher_name ?? "—"}</p>
                      {s.evidence_url && (
                        <a href={s.evidence_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-primary hover:underline">
                          Lihat bukti
                        </a>
                      )}
                    </div>
                    {s.status === "scheduled" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Aksi sesi" className="shrink-0" />}>
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => { setSwapSession(s); openModal("swap") }}>
                          <ArrowLeftRight className="h-4 w-4" /> Alihkan Sesi Ini
                        </DropdownMenuItem>
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

      {modal === "swap" && swapSession && (
        <SwapSessionTeacherDialog session={swapSession} onClose={closeModal} />
      )}
      {modal === "reassign" && booking && (
        <ReassignTeacherDialog booking={booking} onClose={() => { invalidateSessions(); closeModal() }} />
      )}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/tutoring/bookings/$bookingId")({
  component: AdminBookingDetail,
  validateSearch: adminBookingDetailSearchSchema,
})
