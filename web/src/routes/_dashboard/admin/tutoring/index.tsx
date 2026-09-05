import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAdminTutoringBookingsOptions, getAdminTutoringBookingsQueryKey, patchAdminTutoringBookingsByIdAssignMutation, patchAdminTutoringBookingsByIdScheduleMutation, postAdminTutoringBookingsByIdRejectMutation, getTutoringTeachersOptions } from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListBookingsResponse, TutoringListTeachersResponse } from "@/lib/api/types.gen"
import { Plus, UserRound, Users, CalendarX2, CalendarClock, CalendarIcon, XCircle, MoreVertical, UserPlus } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { usePageTitle } from "@/components/page-title"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"

const adminTutoringSearchSchema = z.object({
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

function modeBadge(mode?: string) {
  if (mode === "group") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"><Users className="h-3 w-3" /> Kelompok</span>
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700"><UserRound className="h-3 w-3" /> Private</span>
}

function AssignTeacherDialog({ booking, onClose }: { booking: TutoringListBookingsResponse; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: teachers = [] } = useQuery({
    ...getTutoringTeachersOptions({
      query: {
        subject_id: booking.subject_id,
        date: booking.date,
        start_time: booking.start_time,
        end_time: booking.end_time,
      },
    }),
    enabled: !!booking.subject_id && !!booking.date && !!booking.start_time && !!booking.end_time,
  })
  const [teacher, setTeacher] = useState<TutoringListTeachersResponse | undefined>()

  const { mutate: assign, isPending } = useMutation({
    ...patchAdminTutoringBookingsByIdAssignMutation(),
    onSuccess: () => {
      toast.success("Guru ditetapkan, booking otomatis disetujui")
      qc.invalidateQueries({ queryKey: getAdminTutoringBookingsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal menetapkan guru"),
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader><DialogTitle>Assign Guru</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <p><span className="font-medium">{booking.student_name}</span>, {booking.subject_name || "Mapel?"} · {booking.date} {booking.start_time}–{booking.end_time}</p>
            <p className="text-xs text-muted-foreground">{booking.note || "-"}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Pilih Guru</p>
            <p className="text-xs text-muted-foreground">
              Hanya guru yang free di {booking.date} {booking.start_time}–{booking.end_time} yang ditampilkan.
            </p>
            <p className="text-xs text-muted-foreground">Guru yang dipilih otomatis disetujui, tanpa perlu approve lagi.</p>
            <Combobox
              autoHighlight
              items={teachers}
              value={teacher}
              onValueChange={(v) => setTeacher(v ?? undefined)}
              itemToStringLabel={(t) => (t ? t.name ?? "" : "")}
            >
              <ComboboxInput placeholder={teachers.length ? "Cari guru..." : "Tidak ada guru"} />
              <ComboboxContent>
                <ComboboxEmpty>Tidak ada guru ditemukan</ComboboxEmpty>
                <ComboboxList>
                  {(t: TutoringListTeachersResponse) => (
                    <ComboboxItem key={t.id} value={t}>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{t.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{t.email}</span>
                      </span>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={() => teacher && assign({ path: { id: booking.id! }, body: { teacher_id: teacher.id! } })} disabled={!teacher || isPending}>
              {isPending && <Spinner />} Assign
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
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
    ...patchAdminTutoringBookingsByIdScheduleMutation(),
    onSuccess: () => {
      toast.success("Jadwal booking diubah")
      qc.invalidateQueries({ queryKey: getAdminTutoringBookingsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal mengubah jadwal"),
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Ubah Jadwal</DialogTitle>
          <DialogDescription>{booking.student_name} · {booking.subject_name} — durasi tetap {dur} menit.</DialogDescription>
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
                {date ? format(parseYMD(date), "EEE, dd MMM yyyy", { locale: localeId }) : <span>Pilih tanggal</span>}
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

function RejectBookingDialog({ booking, onClose }: { booking: TutoringListBookingsResponse; onClose: () => void }) {
  const qc = useQueryClient()

  const { mutate: reject, isPending } = useMutation({
    ...postAdminTutoringBookingsByIdRejectMutation(),
    onSuccess: () => {
      toast.success("Booking ditolak")
      qc.invalidateQueries({ queryKey: getAdminTutoringBookingsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal menolak booking"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tolak Booking</AlertDialogTitle>
          <AlertDialogDescription>
            Yakin tolak booking {booking.student_name ?? "—"} · {booking.subject_name ?? "—"} · {booking.date} {booking.start_time}–{booking.end_time}? Murid akan diberi tahu.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={() => booking.id && reject({ path: { id: booking.id } })}
          >
            {isPending && <Spinner />}
            Tolak
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function AdminTutoring() {
  usePageTitle("Les Privat")
  const navigate = useNavigate({ from: Route.fullPath })
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()
  const { data: bookings = [], isLoading } = useQuery(getAdminTutoringBookingsOptions())
  const [assignBooking, setAssignBooking] = useState<TutoringListBookingsResponse | null>(null)
  const [scheduleTarget, setScheduleTarget] = useState<TutoringListBookingsResponse | null>(null)
  const [rejectTarget, setRejectTarget] = useState<TutoringListBookingsResponse | null>(null)

  useEffect(() => {
    if (modal !== "assign") setAssignBooking(null)
    if (modal !== "schedule") setScheduleTarget(null)
    if (modal !== "reject") setRejectTarget(null)
  }, [modal])

  return (
    <main className="p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Les Private</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Semua booking les privat dari seluruh murid dan guru.
          </p>
        </div>
        <Button className="hidden md:inline-flex" onClick={() => navigate({ to: "/admin/tutoring/new" })}>
          <Plus className="mr-1 h-4 w-4" /> Tambah Booking Manual
        </Button>
      </div>

      {/* Desktop table */}
      <Card className="hidden gap-0 pt-0 pb-0 md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6">Murid</TableHead>
                <TableHead>Mapel</TableHead>
                <TableHead>Guru</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Pertemuan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jam</TableHead>
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
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Empty className="border-0 p-8">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><CalendarX2 /></EmptyMedia>
                        <EmptyTitle>Belum ada booking les privat</EmptyTitle>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="pl-6 font-medium">{b.student_name ?? "—"}</TableCell>
                  <TableCell>{b.subject_name ?? "—"}</TableCell>
                  <TableCell>{b.teacher_name ?? "—"}</TableCell>
                  <TableCell>{modeBadge(b.mode)}</TableCell>
                  <TableCell>{b.session_count ?? 1}×</TableCell>
                  <TableCell>{b.date}</TableCell>
                  <TableCell>{b.start_time} - {b.end_time}</TableCell>
                  <TableCell>{statusBadge(b.status!)}</TableCell>
                  <TableCell className="pr-6">
                    <div className="flex items-center justify-end">
                      {b.status === "pending" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Aksi booking" />}>
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {!b.teacher_id ? (
                              <DropdownMenuItem onClick={() => { setAssignBooking(b); openModal("assign") }}>
                                <UserPlus className="h-4 w-4" /> Assign Guru
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem onClick={() => { setScheduleTarget(b); openModal("schedule") }}>
                              <CalendarClock className="h-4 w-4" /> Ubah Jadwal
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => { setRejectTarget(b); openModal("reject") }}>
                              <XCircle className="h-4 w-4" /> Tolak Booking
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile card list */}
      <Card className="gap-0 py-0 md:hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <Empty className="p-8">
              <EmptyHeader>
                <EmptyMedia variant="icon"><CalendarX2 /></EmptyMedia>
                <EmptyTitle>Belum ada booking les privat</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="divide-y">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{b.student_name ?? "—"}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{b.subject_name ?? "—"}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {modeBadge(b.mode)}
                      {statusBadge(b.status!)}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {b.teacher_name ?? "—"} · {b.date} {b.start_time}–{b.end_time} · {b.session_count ?? 1}×
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {b.status === "pending" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Aksi booking" className="shrink-0" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {!b.teacher_id ? (
                            <DropdownMenuItem onClick={() => { setAssignBooking(b); openModal("assign") }}>
                              <UserPlus className="h-4 w-4" /> Assign Guru
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem onClick={() => { setScheduleTarget(b); openModal("schedule") }}>
                            <CalendarClock className="h-4 w-4" /> Ubah Jadwal
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => { setRejectTarget(b); openModal("reject") }}>
                            <XCircle className="h-4 w-4" /> Tolak Booking
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

      {modal === "assign" && assignBooking && <AssignTeacherDialog booking={assignBooking} onClose={closeModal} />}
      {modal === "schedule" && scheduleTarget && <ScheduleBookingDialog booking={scheduleTarget} onClose={closeModal} />}
      {modal === "reject" && rejectTarget && <RejectBookingDialog booking={rejectTarget} onClose={closeModal} />}

      <Button
        onClick={() => navigate({ to: "/admin/tutoring/new" })}
        size="icon"
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:hidden"
        aria-label="Tambah Booking Manual"
      >
        <Plus className="size-6" />
      </Button>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/tutoring/")({
  component: AdminTutoring,
  validateSearch: adminTutoringSearchSchema,
})
