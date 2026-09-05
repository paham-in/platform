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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"
import { getAdminTutoringBookingsOptions, getAdminUsersOptions } from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListBookingsResponse } from "@/lib/api/types.gen"
import { UserRound, Users, CalendarX2, CalendarClock, XCircle, MoreVertical, UserPlus, Plus } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useState, useEffect } from "react"
import { usePageTitle } from "@/components/page-title"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"
import { AssignTeacherDialog, ScheduleBookingDialog, RejectBookingDialog } from "@/components/admin/tutoring"

const adminTutoringDetailSearchSchema = z.object({
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

function AdminTutoringDetail() {
  const { userId } = Route.useParams()
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()
  const navigate = useNavigate()
  const { data: bookings = [], isLoading } = useQuery(getAdminTutoringBookingsOptions())
  const { data: users = [] } = useQuery(getAdminUsersOptions())
  const [assignBooking, setAssignBooking] = useState<TutoringListBookingsResponse | null>(null)
  const [scheduleTarget, setScheduleTarget] = useState<TutoringListBookingsResponse | null>(null)
  const [rejectTarget, setRejectTarget] = useState<TutoringListBookingsResponse | null>(null)

  useEffect(() => {
    if (modal !== "assign") setAssignBooking(null)
    if (modal !== "schedule") setScheduleTarget(null)
    if (modal !== "reject") setRejectTarget(null)
  }, [modal])

  const studentBookings = bookings.filter((b) => b.student_id === Number(userId))
  const user = users.find((u) => u.id === Number(userId))
  const studentName = user?.name ?? studentBookings[0]?.student_name ?? "—"
  usePageTitle(studentName)

  return (
    <main className="p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{studentName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email ?? ""}</p>
        </div>
        <Button
          className="hidden md:inline-flex"
          onClick={() => navigate({ to: "/admin/tutoring/new", search: { student_id: Number(userId) } })}
        >
          <Plus className="mr-1 h-4 w-4" /> Tambah Booking Manual
        </Button>
      </div>

      {/* Desktop table */}
      <Card className="hidden gap-0 pt-0 pb-0 md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6">Mapel</TableHead>
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
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : studentBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Empty className="border-0 p-8">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><CalendarX2 /></EmptyMedia>
                        <EmptyTitle>Belum ada booking untuk murid ini</EmptyTitle>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : studentBookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="pl-6 font-medium">{b.subject_name ?? "—"}</TableCell>
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
          ) : studentBookings.length === 0 ? (
            <Empty className="p-8">
              <EmptyHeader>
                <EmptyMedia variant="icon"><CalendarX2 /></EmptyMedia>
                <EmptyTitle>Belum ada booking untuk murid ini</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="divide-y">
              {studentBookings.map((b) => (
                <div key={b.id} className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{b.subject_name ?? "—"}</p>
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
        onClick={() => navigate({ to: "/admin/tutoring/new", search: { student_id: Number(userId) } })}
        size="icon"
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:hidden"
        aria-label="Tambah Booking Manual"
      >
        <Plus className="size-6" />
      </Button>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/tutoring/$userId")({
  component: AdminTutoringDetail,
  validateSearch: adminTutoringDetailSearchSchema,
})
