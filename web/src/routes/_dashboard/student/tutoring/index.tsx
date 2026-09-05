import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getTutoringBookingsOptions,
  getTutoringBookingsQueryKey,
  getTutoringSessionsOptions,
  getTutoringSessionsQueryKey,
  getClassesOptions,
  postTutoringBookingsByIdCancelMutation,
  patchTutoringBookingsByIdScheduleMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListBookingsResponse, TutoringListSessionsResponse } from "@/lib/api/types.gen"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { CalendarX2, Plus, UserRound, Users, CalendarDays, Eye, MoreVertical, XCircle, CalendarClock, CalendarIcon } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { usePageTitle } from "@/components/page-title"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"
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
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[s] || ""}`}>{labels[s] || s}</span>
}

function modeBadge(mode?: string) {
  if (mode === "group") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"><Users className="h-3 w-3" /> Kelompok</span>
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700"><UserRound className="h-3 w-3" /> Private</span>
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

// 07:00 s/d 20:30, tiap 30 menit.
const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const total = 7 * 60 + i * 30
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
})

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function minutesToHHMM(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`
}

function parseYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function ScheduleBookingDialog({ booking, onClose }: { booking: TutoringListBookingsResponse; onClose: () => void }) {
  const qc = useQueryClient()
  const dur = toMinutes(booking.end_time!) - toMinutes(booking.start_time!)
  const [date, setDate] = useState(booking.date ?? "")
  const [start, setStart] = useState(booking.start_time ?? "")
  const end = start ? minutesToHHMM(toMinutes(start) + dur) : ""
  const startOptions = TIME_OPTIONS.filter((t) => TIME_OPTIONS.includes(minutesToHHMM(toMinutes(t) + dur)))

  const { mutate: reschedule, isPending } = useMutation({
    ...patchTutoringBookingsByIdScheduleMutation(),
    onSuccess: () => {
      toast.success("Jadwal booking diubah")
      qc.invalidateQueries({ queryKey: getTutoringBookingsQueryKey() })
      qc.invalidateQueries({ queryKey: getTutoringSessionsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal mengubah jadwal"),
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Ubah Jadwal</DialogTitle>
          <DialogDescription>{booking.subject_name} — durasi tetap {dur} menit, status tetap menunggu guru.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tanggal</Label>
            <Popover>
              <PopoverTrigger
                render={
                  <Button variant="outline" data-empty={!date} className="w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground" />
                }
              >
                <CalendarIcon />
                {date ? format(parseYMD(date), "EEE, dd MMM yyyy", { locale: id }) : <span>Pilih tanggal</span>}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  disabled={(d) => {
                    const today = new Date(); today.setHours(0, 0, 0, 0)
                    return d < today
                  }}
                  selected={date ? parseYMD(date) : undefined}
                  onSelect={(d) => setDate(d ? format(d, "yyyy-MM-dd") : "")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Jam Mulai</Label>
              <Select items={startOptions.map((t) => ({ label: t, value: t }))} value={start} onValueChange={(v) => setStart(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih jam" />
                </SelectTrigger>
                <SelectContent>
                  {startOptions.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Jam Selesai</Label>
              <p className="flex h-9 items-center rounded-md border border-input bg-muted/50 px-3 text-sm tabular-nums">{end || "—"}</p>
              <p className="text-xs text-muted-foreground">Otomatis (durasi tetap).</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            disabled={!date || !start || isPending}
            onClick={() => booking.id && reschedule({ path: { id: booking.id }, body: { date, start_time: start, end_time: end } })}
          >
            {isPending && <Spinner />} Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CancelBookingDialog({ booking, onClose }: { booking: TutoringListBookingsResponse; onClose: () => void }) {
  const qc = useQueryClient()

  const { mutate: cancelBooking, isPending } = useMutation({
    ...postTutoringBookingsByIdCancelMutation(),
    onSuccess: () => {
      toast.success("Booking dibatalkan")
      qc.invalidateQueries({ queryKey: getTutoringBookingsQueryKey() })
      qc.invalidateQueries({ queryKey: getTutoringSessionsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal membatalkan booking"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Batalkan Booking</AlertDialogTitle>
          <AlertDialogDescription>
            Yakin batalkan booking {booking.subject_name ?? "—"} · {booking.date} {booking.start_time}–{booking.end_time}?
            Sesi terjadwal ikut dibatalkan dan invoice yang belum dibayar dihapus.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => booking.id && cancelBooking({ path: { id: booking.id } })} disabled={isPending}>
            {isPending && <Spinner />}
            Batalkan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
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

function BookingDetailDialog({ booking, sessions, className, onClose }: {
  booking: TutoringListBookingsResponse
  sessions: TutoringListSessionsResponse[]
  className: string
  onClose: () => void
}) {
  const bookingSessions = sessions.filter((s) => s.booking_id === booking.id)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail Booking</DialogTitle>
          <DialogDescription>Detail booking & sesi les</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Mata Pelajaran</p>
              <p>{booking.subject_name || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Kelas</p>
              <p>{className}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Guru</p>
              <p>{booking.teacher_name || "Menunggu admin carikan guru"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tipe</p>
              <p>{booking.mode === "group" ? "Kelompok" : "Private"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tanggal Mulai</p>
              <p>{booking.date}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Jam</p>
              <p>{booking.start_time} - {booking.end_time}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Pertemuan</p>
              <p>{booking.session_count ?? 1}×</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Status</p>
              <p>{statusBadge(booking.status!)}</p>
            </div>
            {booking.invoice_status && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Pembayaran</p>
                <p className="capitalize">{booking.invoice_status}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-muted-foreground">Dibuat</p>
              <p>{booking.created_at}</p>
            </div>
          </div>
          {booking.note && (
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="mb-0.5 text-xs font-medium text-muted-foreground">Catatan</p>
              <p className="whitespace-pre-wrap">{booking.note}</p>
            </div>
          )}

          <div className="border-t pt-4">
            <p className="mb-3 font-medium">Sesi Pertemuan</p>
            {bookingSessions.length === 0 ? (
              <p className="text-muted-foreground">Belum ada sesi terjadwal.</p>
            ) : (
              <div className="space-y-2">
                {bookingSessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {s.date && format(parseISO(s.date), "EEE, dd MMM yyyy", { locale: id })}
                        {" · "}
                        {s.start_time} - {s.end_time}
                      </p>
                      <div className="mt-1">{sessionStatusBadge(s.status)}</div>
                      {(s.overtime_minutes ?? 0) > 0 && (
                        <p className="mt-1 text-xs font-medium text-amber-600">
                          +{s.overtime_minutes} mnt (s.d. {s.actual_end_time}) · +{s.extra_sessions ?? 0} sesi
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StudentTutoringIndex() {
  usePageTitle("Les Privat")
  const navigate = useNavigate()
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery(getTutoringBookingsOptions())
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery(getTutoringSessionsOptions())
  const { data: classes = [] } = useQuery(getClassesOptions())
  const classNameById = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes])
  const [cancelTarget, setCancelTarget] = useState<TutoringListBookingsResponse | null>(null)
  const [detailTarget, setDetailTarget] = useState<TutoringListBookingsResponse | null>(null)
  const [scheduleTarget, setScheduleTarget] = useState<TutoringListBookingsResponse | null>(null)
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()

  useEffect(() => {
    if (modal !== "cancel") setCancelTarget(null)
    if (modal !== "detail") setDetailTarget(null)
    if (modal !== "schedule") setScheduleTarget(null)
  }, [modal])

  const upcomingSessions = sessions.filter((s) => s.status !== "cancelled")

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
                  <TableHead>Tipe</TableHead>
                  <TableHead>Pertemuan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jam</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-4">
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Empty className="border-0 p-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><CalendarX2 /></EmptyMedia>
                          <EmptyTitle>Belum ada booking</EmptyTitle>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="pl-6 font-medium">{b.teacher_name || "—"}</TableCell>
                    <TableCell>{modeBadge(b.mode)}</TableCell>
                    <TableCell>{b.session_count ?? 1}×</TableCell>
                    <TableCell>{b.date}</TableCell>
                    <TableCell>{b.start_time} - {b.end_time}</TableCell>
                    <TableCell>{statusBadge(b.status!)}</TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Aksi booking" />}>
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => { setDetailTarget(b); openModal("detail") }}>
                              <Eye className="h-4 w-4" /> Lihat Detail
                            </DropdownMenuItem>
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
                        </DropdownMenu>
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
                  <div key={b.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{b.teacher_name || "—"}</p>
                        <div className="mt-1">{modeBadge(b.mode)}</div>
                        <p className="mt-2 text-sm text-muted-foreground">{b.date} · {b.start_time} - {b.end_time}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{b.session_count ?? 1}× pertemuan</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {statusBadge(b.status!)}
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Aksi booking" className="shrink-0" />}>
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => { setDetailTarget(b); openModal("detail") }}>
                              <Eye className="h-4 w-4" /> Lihat Detail
                            </DropdownMenuItem>
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
                        </DropdownMenu>
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
                    <TableCell className="pl-6 font-medium">{s.teacher_name}</TableCell>
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
                      <p className="text-sm font-medium">{s.teacher_name}</p>
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
      {modal === "detail" && detailTarget && <BookingDetailDialog booking={detailTarget} sessions={sessions} className={detailTarget.class_id ? (classNameById.get(detailTarget.class_id) ?? "—") : "—"} onClose={closeModal} />}
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
