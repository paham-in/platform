import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"
import {
  getTutoringBookingsOptions,
  getTutoringSessionsOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListBookingsResponse } from "@/lib/api/types.gen"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { CalendarX2, Plus, UserRound, Users, CalendarDays, MoreVertical, XCircle, CalendarClock } from "lucide-react"
import { useState, useEffect } from "react"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"
import { CancelBookingDialog, ScheduleBookingDialog } from "@/components/student/tutoring"
import { z } from "zod"

const tutoringSearchSchema = z.object({
  modal: z.string().optional(),
})

function statusBadge(s: string) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700", confirmed: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700", cancelled: "bg-gray-100 text-gray-700",
  }
  const labels: Record<string, string> = {
    pending: "Menunggu", confirmed: "Disetujui", rejected: "Ditolak", cancelled: "Dibatalkan",
  }
  return <Badge variant="secondary" className={styles[s] || ""}>{labels[s] || s}</Badge>
}

function modeBadge(mode?: string) {
  if (mode === "group") {
    return <Badge variant="secondary" className="bg-blue-100 text-blue-700"><Users className="h-3 w-3" /> Kelompok</Badge>
  }
  return <Badge variant="secondary" className="bg-purple-100 text-purple-700"><UserRound className="h-3 w-3" /> Private</Badge>
}

// canCancel: murid hanya bisa batal saat pending (guru belum di-assign admin).
// Setelah confirmed, pembatalan lewat admin.
function canCancel(b: TutoringListBookingsResponse) {
  return b.status === "pending"
}

// canReschedule: booking pending milik sendiri; grup hanya oleh pembuatnya.
function canReschedule(b: TutoringListBookingsResponse) {
  return b.status === "pending" && (b.mode !== "group" || b.is_organizer)
}

// hasActions: dropdown hanya ditampilkan bila ada aksi selain Lihat Detail
// (row/kartu sudah bisa diklik ke halaman detail).
function hasActions(b: TutoringListBookingsResponse) {
  return canReschedule(b) || canCancel(b)
}

function StudentTutoringIndex() {
  const navigate = useNavigate()
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery(getTutoringBookingsOptions())
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery(getTutoringSessionsOptions())
  const [cancelTarget, setCancelTarget] = useState<TutoringListBookingsResponse | null>(null)
  const [scheduleTarget, setScheduleTarget] = useState<TutoringListBookingsResponse | null>(null)
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()

  useEffect(() => {
    if (modal !== "cancel") setCancelTarget(null)
    if (modal !== "schedule") setScheduleTarget(null)
  }, [modal])

  const goDetail = (id?: number) => {
    if (id) navigate({ to: "/student/tutoring/$bookingId", params: { bookingId: String(id) } })
  }

  const upcomingSessions = sessions.filter((s) => s.status !== "cancelled")

  const progressText = (b: TutoringListBookingsResponse) => {
    const list = sessions.filter((s) => s.booking_id === b.id)
    const total = b.session_count ?? list.length
    if (list.length === 0 || total <= 0) return null
    const done = list.filter((s) => s.status === "done").length
    const cancelled = list.filter((s) => s.status === "cancelled").length
    return `${done}/${total} selesai${cancelled > 0 ? ` · ${cancelled} batal` : ""}`
  }

  const actionMenu = (b: TutoringListBookingsResponse) => (
    <DropdownMenuContent>
      {canReschedule(b) && (
        <DropdownMenuItem onClick={() => { setScheduleTarget(b); openModal("schedule") }}>
          <CalendarClock className="h-4 w-4" /> Ubah Jadwal
        </DropdownMenuItem>
      )}
      {canCancel(b) && (
        <DropdownMenuItem variant="destructive" onClick={() => { setCancelTarget(b); openModal("cancel") }}>
          <XCircle className="h-4 w-4" /> Batalkan Booking
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  )

  return (
    <main className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Les Privat</h1>
        <p className="text-sm text-muted-foreground">Booking jadwal les dengan guru</p>
      </div>
      <div className="space-y-4 md:space-y-6">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Booking Saya</h2>
          <Button className="hidden md:inline-flex" onClick={() => navigate({ to: "/student/tutoring/new" })}><Plus className="mr-1 h-4 w-4" /> Tambah Booking</Button>
        </div>
        <Card className="hidden gap-0 pt-0 pb-0 md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Guru</TableHead>
                  <TableHead>Mapel</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Pertemuan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jam</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progres</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingsLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="p-4">
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Empty className="border-0 p-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><CalendarX2 /></EmptyMedia>
                          <EmptyTitle>Belum ada booking</EmptyTitle>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : bookings.map((b) => (
                  <TableRow key={b.id} className="cursor-pointer" onClick={() => goDetail(b.id)}>
                    <TableCell className="pl-6 font-medium">{b.teacher_name || "—"}</TableCell>
                    <TableCell>{b.subject_name || "—"}</TableCell>
                    <TableCell>{modeBadge(b.mode)}</TableCell>
                    <TableCell>{b.session_count ?? 1}×</TableCell>
                    <TableCell>{b.date}</TableCell>
                    <TableCell>{b.start_time} - {b.end_time}</TableCell>
                    <TableCell>{statusBadge(b.status!)}</TableCell>
                    <TableCell className="tabular-nums">
                      {(() => {
                        const label = progressText(b)
                        return label ?? <span className="text-muted-foreground">—</span>
                      })()}
                    </TableCell>
                    <TableCell className="pr-6">
                      {hasActions(b) && (
                        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Aksi booking" />}>
                              <MoreVertical className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            {actionMenu(b)}
                          </DropdownMenu>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0 md:hidden">
          <CardContent className="p-0">
            {bookingsLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <Empty className="p-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><CalendarX2 /></EmptyMedia>
                  <EmptyTitle>Belum ada booking</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="divide-y">
                {bookings.map((b) => (
                  <div key={b.id} className="cursor-pointer p-4" onClick={() => goDetail(b.id)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{b.teacher_name || "—"}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{b.subject_name || "—"}</p>
                        <div className="mt-1">{modeBadge(b.mode)}</div>
                        <p className="mt-2 text-sm text-muted-foreground">{b.date} · {b.start_time} - {b.end_time}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{b.session_count ?? 1}× pertemuan</p>
                        {(() => {
                          const label = progressText(b)
                          return label ? <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{label}</p> : null
                        })()}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {statusBadge(b.status!)}
                        {hasActions(b) && (
                          <span onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Aksi booking" className="shrink-0" />}>
                                <MoreVertical className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              {actionMenu(b)}
                            </DropdownMenu>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Pertemuan Mendatang</h2>
          <span className="text-sm text-muted-foreground">Jadwal aktif setelah pembayaran dikonfirmasi admin</span>
        </div>
        <Card className="hidden gap-0 pt-0 pb-0 md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Guru</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jam</TableHead>
                  <TableHead className="pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-4">
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : upcomingSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Empty className="border-0 p-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><CalendarDays /></EmptyMedia>
                          <EmptyTitle>Belum ada jadwal pertemuan</EmptyTitle>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : upcomingSessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="pl-6">
                      <span className="font-medium">{s.teacher_name}</span>
                      {s.is_substitute ? (
                        <span className="ml-1.5 rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-medium text-cyan-700">Pengganti</span>
                      ) : null}
                    </TableCell>
                    <TableCell>{s.date}</TableCell>
                    <TableCell>{s.start_time} - {s.end_time}</TableCell>
                    <TableCell className="pr-6">
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Terjadwal</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0 md:hidden">
          <CardContent className="p-0">
            {sessionsLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : upcomingSessions.length === 0 ? (
              <Empty className="p-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><CalendarDays /></EmptyMedia>
                  <EmptyTitle>Belum ada jadwal pertemuan</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="divide-y">
                {upcomingSessions.map((s) => (
                  <div key={s.id} className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-medium">{s.teacher_name}</p>
                        {s.is_substitute ? (
                          <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-medium text-cyan-700">Pengganti</span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{s.date} · {s.start_time} - {s.end_time}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Terjadwal</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {modal === "cancel" && cancelTarget && <CancelBookingDialog booking={cancelTarget} onClose={closeModal} />}
      {modal === "schedule" && scheduleTarget && <ScheduleBookingDialog booking={scheduleTarget} onClose={closeModal} />}
      </div>

      <Button
        onClick={() => navigate({ to: "/student/tutoring/new" })}
        size="icon"
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:hidden"
        aria-label="Tambah Booking"
      >
        <Plus className="size-6" />
      </Button>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/tutoring/")({
  component: StudentTutoringIndex,
  validateSearch: tutoringSearchSchema,
})
