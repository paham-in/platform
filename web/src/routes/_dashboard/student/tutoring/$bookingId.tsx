import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"
import {
  getTutoringBookingsOptions,
  getTutoringSessionsOptions,
  getClassesOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListBookingsResponse } from "@/lib/api/types.gen"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ArrowLeft, CalendarX2, CalendarClock, XCircle } from "lucide-react"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { usePageTitle } from "@/components/page-title"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"
import { CancelBookingDialog, ScheduleBookingDialog } from "@/components/student/tutoring"
import { z } from "zod"

const bookingDetailSearchSchema = z.object({
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

// canCancel: murid hanya bisa batal saat pending (guru belum di-assign admin).
// Setelah confirmed, pembatalan lewat admin.
function canCancel(b: TutoringListBookingsResponse) {
  return b.status === "pending"
}

// canReschedule: booking pending milik sendiri; grup hanya oleh pembuatnya.
function canReschedule(b: TutoringListBookingsResponse) {
  return b.status === "pending" && (b.mode !== "group" || b.is_organizer)
}

function StudentBookingDetail() {
  usePageTitle("Detail Booking")
  const navigate = useNavigate()
  const { bookingId } = Route.useParams()
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery(getTutoringBookingsOptions())
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery(getTutoringSessionsOptions())
  const { data: classes = [] } = useQuery(getClassesOptions())
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()

  const booking = bookings.find((b) => b.id === Number(bookingId))
  const bookingSessions = sessions.filter((s) => s.booking_id === Number(bookingId))
  const className = booking?.class_id ? (classes.find((c) => c.id === booking.class_id)?.name ?? "—") : "—"

  if (!bookingsLoading && !booking) {
    return (
      <main className="p-4 md:p-6">
        <Empty className="p-8">
          <EmptyHeader>
            <EmptyMedia variant="icon"><CalendarX2 /></EmptyMedia>
            <EmptyTitle>Booking tidak ditemukan</EmptyTitle>
          </EmptyHeader>
          <Button variant="outline" onClick={() => navigate({ to: "/student/tutoring" })}>Kembali ke daftar</Button>
        </Empty>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-6">
      <Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate({ to: "/student/tutoring" })}>
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Button>
      {bookingsLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : booking && (
        <div className="space-y-4 md:space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{booking.subject_name || "Detail Booking"}</h1>
              <p className="text-sm text-muted-foreground">{className} · {booking.mode === "group" ? "Kelompok" : "Private"}</p>
            </div>
            <div className="flex items-center gap-2">
              {canReschedule(booking) && (
                <Button variant="outline" onClick={() => openModal("schedule")}>
                  <CalendarClock className="h-4 w-4" /> Ubah Jadwal
                </Button>
              )}
              {canCancel(booking) && (
                <Button variant="destructive" onClick={() => openModal("cancel")}>
                  <XCircle className="h-4 w-4" /> Batalkan Booking
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardContent className="grid grid-cols-2 gap-3 p-4 text-sm md:grid-cols-4 md:p-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Guru</p>
                <p>{booking.teacher_name || "Menunggu admin carikan guru"}</p>
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
            </CardContent>
          </Card>

          {booking.note && (
            <Card>
              <CardContent className="p-4 text-sm md:p-6">
                <p className="mb-0.5 text-xs font-medium text-muted-foreground">Catatan</p>
                <p className="whitespace-pre-wrap">{booking.note}</p>
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="mb-2 text-lg font-semibold">Sesi Pertemuan</h2>
            <Card className="gap-0 py-0">
              <CardContent className="p-0">
                {sessionsLoading ? (
                  <div className="space-y-3 p-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : bookingSessions.length === 0 ? (
                  <Empty className="p-8">
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><CalendarX2 /></EmptyMedia>
                      <EmptyTitle>Belum ada sesi terjadwal</EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="divide-y">
                    {bookingSessions.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {s.date && format(parseISO(s.date), "EEE, dd MMM yyyy", { locale: id })}
                            {" · "}
                            {s.start_time} - {s.end_time}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {sessionStatusBadge(s.status)}
                            {s.is_substitute ? (
                              <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-medium text-cyan-700">Pengganti</span>
                            ) : null}
                          </div>
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
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {modal === "cancel" && booking && canCancel(booking) && <CancelBookingDialog booking={booking} onClose={closeModal} />}
      {modal === "schedule" && booking && canReschedule(booking) && <ScheduleBookingDialog booking={booking} onClose={closeModal} />}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/tutoring/$bookingId")({
  component: StudentBookingDetail,
  validateSearch: bookingDetailSearchSchema,
})
