import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAdminTutoringBookingsOptions, getAdminTutoringBookingsQueryKey, patchAdminTutoringBookingsByIdAssignMutation, getTutoringTeachersOptions } from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListBookingsResponse, TutoringListTeachersResponse } from "@/lib/api/types.gen"
import { Plus, UserRound, Users, CalendarX2 } from "lucide-react"
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

function AdminTutoring() {
  usePageTitle("Les Privat")
  const navigate = useNavigate({ from: Route.fullPath })
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()
  const { data: bookings = [], isLoading } = useQuery(getAdminTutoringBookingsOptions())
  const [assignBooking, setAssignBooking] = useState<TutoringListBookingsResponse | null>(null)

  useEffect(() => {
    if (modal !== "assign") setAssignBooking(null)
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
                <TableHead className="pr-6">Aksi</TableHead>
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
                    <div className="flex items-center justify-end gap-2">
                      {b.status === "pending" && !b.teacher_id ? (
                        <Button size="sm" onClick={() => { setAssignBooking(b); openModal("assign") }}>Assign Guru</Button>
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
                    {b.status === "pending" && !b.teacher_id ? (
                      <Button size="sm" onClick={() => { setAssignBooking(b); openModal("assign") }}>Assign</Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {modal === "assign" && assignBooking && <AssignTeacherDialog booking={assignBooking} onClose={closeModal} />}

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
