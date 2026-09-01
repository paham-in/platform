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
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getTutoringBookingsOptions,
  getTutoringBookingsQueryKey,
  getTutoringSessionsOptions,
  getTutoringSessionsQueryKey,
  postTutoringBookingsByIdCancelMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListBookingsResponse } from "@/lib/api/types.gen"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { CalendarX2, Plus, UserRound, Users, CalendarDays } from "lucide-react"
import { useState, useEffect } from "react"
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

// canCancel: booking masih bisa dibatalkan murid, pending (guru belum acc)
// atau confirmed tapi invoice belum lunas (murid batal sebelum bayar).
function canCancel(b: TutoringListBookingsResponse) {
  if (b.status === "pending") return true
  return b.status === "confirmed" && b.invoice_status !== "paid"
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

function StudentTutoringIndex() {
  usePageTitle("Les Privat")
  const navigate = useNavigate()
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery(getTutoringBookingsOptions())
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery(getTutoringSessionsOptions())
  const [cancelTarget, setCancelTarget] = useState<TutoringListBookingsResponse | null>(null)
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()

  useEffect(() => {
    if (modal !== "cancel") setCancelTarget(null)
  }, [modal])

  const upcomingSessions = sessions.filter((s) => s.status !== "cancelled")

  return (
    <main className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="hidden md:block text-2xl font-bold tracking-tight">Les Privat</h1>
        <p className="text-sm text-muted-foreground">Booking jadwal les dengan guru</p>
      </div>
      <div className="space-y-4 md:space-y-6">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Booking Saya</h2>
          <Button onClick={() => navigate({ to: "/student/tutoring/new" })}><Plus className="mr-1 h-4 w-4" /> Tambah Booking</Button>
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
                  <TableHead className="pr-6">Aksi</TableHead>
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
                      {canCancel(b) && (
                        <Button variant="outline" size="sm" onClick={() => { setCancelTarget(b); openModal("cancel") }}>Batalkan</Button>
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
                  <div key={b.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{b.teacher_name || "—"}</p>
                        <div className="mt-1">{modeBadge(b.mode)}</div>
                        <p className="mt-2 text-sm text-muted-foreground">{b.date} · {b.start_time} - {b.end_time}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{b.session_count ?? 1}× pertemuan</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {statusBadge(b.status!)}
                        {canCancel(b) && (
                          <Button variant="outline" size="sm" onClick={() => { setCancelTarget(b); openModal("cancel") }}>Batalkan</Button>
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
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/tutoring/")({
  component: StudentTutoringIndex,
  validateSearch: tutoringSearchSchema,
})
