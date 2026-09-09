import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router"
import { z } from "zod"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarX, Funnel, SearchX, UserRound, Users, X } from "lucide-react"
import { teacherScheduleOptions } from "@/lib/teacher-schedule"
import type { TeacherScheduleSession } from "@/lib/teacher-schedule"

const detailSearchSchema = z.object({
  status: z.string().optional(),
})

const statusLabels: Record<string, string> = {
  scheduled: "Terjadwal",
  confirmed: "Terkonfirmasi",
  review: "Menunggu Validasi",
  done: "Selesai",
  cancelled: "Dibatalkan",
  pending: "Menunggu",
}

const statusStyles: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  review: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-700",
}

function SessionStatusBadge({ status }: { status?: string }) {
  const s = status ?? ""
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[s] ?? "bg-muted text-muted-foreground"}`}>
      {statusLabels[s] ?? s}
    </span>
  )
}

function ModeBadge({ mode }: { mode?: string }) {
  if (mode === "group") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"><Users className="h-3 w-3" /> Kelompok</span>
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700"><UserRound className="h-3 w-3" /> Private</span>
}

function parseYMD(s?: string): Date | undefined {
  if (!s) return undefined
  const [y, m, d] = s.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

function formatDay(s?: string) {
  const d = parseYMD(s)
  return d ? format(d, "EEE, d MMM yyyy", { locale: localeId }) : "—"
}

function SessionRowCells({ s }: { s: TeacherScheduleSession }) {
  return (
    <>
      <TableCell className="whitespace-nowrap">{formatDay(s.date)}</TableCell>
      <TableCell className="whitespace-nowrap tabular-nums">{s.start_time}–{s.end_time}</TableCell>
      <TableCell>{s.student_name}</TableCell>
      <TableCell>{s.subject_name}</TableCell>
      <TableCell><ModeBadge mode={s.mode} /></TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-1">
          <SessionStatusBadge status={s.status} />
          {s.is_substitute && <Badge variant="outline">Pengganti</Badge>}
        </div>
      </TableCell>
    </>
  )
}

function SessionCard({ s }: { s: TeacherScheduleSession }) {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{formatDay(s.date)}</p>
          <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">{s.start_time}–{s.end_time}</p>
        </div>
        <SessionStatusBadge status={s.status} />
      </div>
      <p className="mt-2 truncate text-sm">{s.student_name} · {s.subject_name}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <ModeBadge mode={s.mode} />
        {s.is_substitute && <Badge variant="outline">Pengganti</Badge>}
      </div>
    </div>
  )
}

function AdminTeacherScheduleDetail() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { teacherId } = useParams({ from: "/_dashboard/admin/teacher-schedules/$teacherId/" })
  const { status } = Route.useSearch()
  const { data, isLoading, isError } = useQuery(teacherScheduleOptions(teacherId))

  const sessions = useMemo(() => data?.sessions ?? [], [data])
  const pending = useMemo(() => data?.pending_bookings ?? [], [data])
  const teacher = data?.teacher

  const availableStatuses = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.status).filter((s): s is string => !!s))),
    [sessions]
  )
  const activeStatus = status && availableStatuses.includes(status) ? status : undefined
  const visible = activeStatus ? sessions.filter((s) => s.status === activeStatus) : sessions

  const [filterOpen, setFilterOpen] = useState(false)

  if (isLoading) {
    return (
      <main className="p-4 md:p-6">
        <div className="mb-4 flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </main>
    )
  }

  if (isError || !data) {
    return (
      <main className="p-4 md:p-6">
        <Empty className="p-8">
          <EmptyHeader>
            <EmptyMedia variant="icon"><SearchX /></EmptyMedia>
            <EmptyTitle>Guru tidak ditemukan</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/admin/teacher-schedules" })}>
              Kembali ke daftar guru
            </Button>
          </EmptyContent>
        </Empty>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-6">
      <div className="mb-4 flex items-center gap-3">
        {teacher?.avatar_url ? (
          <img src={teacher.avatar_url} alt="" className="h-12 w-12 rounded-full" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {teacher?.name?.[0]}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">{teacher?.name}</h1>
          <p className="truncate text-sm text-muted-foreground">{teacher?.email}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {(teacher?.subjects ?? []).map((s) => <Badge key={s.id} variant="secondary">{s.name}</Badge>)}
          </div>
        </div>
      </div>

      {pending.length > 0 && (
        <Card className="mb-4 gap-0 py-0">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Menunggu Guru ({pending.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {pending.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
                  <span className="font-medium">{formatDay(b.date)}</span>
                  <span className="tabular-nums text-muted-foreground">{b.start_time}–{b.end_time}</span>
                  <span className="truncate">{b.student_name} · {b.subject_name}</span>
                  <ModeBadge mode={b.mode} />
                  <span className="text-xs text-muted-foreground">{b.session_count} sesi</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Sesi Mengajar ({visible.length})</h2>
        {availableStatuses.length > 0 && (
          <DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              <Funnel className="h-4 w-4" />
              {activeStatus ? statusLabels[activeStatus] ?? activeStatus : "Semua Status"}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuRadioGroup
                value={activeStatus ?? "all"}
                onValueChange={(v) => {
                  navigate({ search: (prev) => ({ ...prev, status: v === "all" ? undefined : v }), replace: true })
                  setFilterOpen(false)
                }}
              >
                <DropdownMenuRadioItem value="all">Semua Status</DropdownMenuRadioItem>
                {availableStatuses.map((s) => (
                  <DropdownMenuRadioItem key={s} value={s}>{statusLabels[s] ?? s}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {visible.length === 0 ? (
        <Empty className="border p-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">{activeStatus ? <SearchX /> : <CalendarX />}</EmptyMedia>
            <EmptyTitle>
              {activeStatus ? "Tidak ada sesi dengan status ini" : "Belum ada sesi mengajar"}
            </EmptyTitle>
          </EmptyHeader>
          {activeStatus && (
            <EmptyContent>
              <Button variant="outline" size="sm" onClick={() => navigate({ search: (prev) => ({ ...prev, status: undefined }), replace: true })}>
                <X className="mr-1 h-4 w-4" /> Tampilkan semua
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <>
          <Card className="hidden gap-0 pt-0 pb-0 md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="pl-6">Tanggal</TableHead>
                    <TableHead>Jam</TableHead>
                    <TableHead>Murid</TableHead>
                    <TableHead>Mapel</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((s) => (
                    <TableRow key={s.id}>
                      <SessionRowCells s={s} />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="gap-0 py-0 md:hidden">
            <CardContent className="p-0">
              <div className="divide-y">
                {visible.map((s) => (
                  <SessionCard key={s.id} s={s} />
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/teacher-schedules/$teacherId/")({
  component: AdminTeacherScheduleDetail,
  validateSearch: detailSearchSchema,
})
