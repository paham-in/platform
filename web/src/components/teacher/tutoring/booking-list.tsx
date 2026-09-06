import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import {
  getTutoringBookingsOptions,
  getTutoringSessionsOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { History, UserRound, Users } from "lucide-react"
import type { TutoringListBookingsResponse, TutoringListSessionsResponse } from "@/lib/api/types.gen"

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

function groupBookings(bookings: TutoringListBookingsResponse[]): TutoringListBookingsResponse[][] {  const groups: TutoringListBookingsResponse[][] = []
  const index = new Map<string, number>()
  for (const b of bookings) {
    if (b.mode === "group" && b.group_token) {
      const key = b.group_token
      const existing = index.get(key)
      if (existing !== undefined) {
        groups[existing].push(b)
      } else {
        index.set(key, groups.length)
        groups.push([b])
      }
    } else {
      groups.push([b])
    }
  }
  return groups
}

export function BookingList() {
  const navigate = useNavigate()
  const { data: bookings = [], isLoading } = useQuery(getTutoringBookingsOptions())
  const { data: sessions = [] } = useQuery(getTutoringSessionsOptions())

  const groups = groupBookings(bookings)

  const sessionsFor = (bookingId: number) => sessions.filter((s) => s.booking_id === bookingId)

  const progressText = (list: TutoringListSessionsResponse[], total: number) => {
    if (list.length === 0 || total <= 0) return null
    const done = list.filter((s) => s.status === "done").length
    const cancelled = list.filter((s) => s.status === "cancelled").length
    return `${done}/${total} selesai${cancelled > 0 ? ` · ${cancelled} batal` : ""}`
  }

  const groupProgress = (group: TutoringListBookingsResponse[]) => {
    const list = group.flatMap((b) => sessionsFor(b.id!))
    const total = group.reduce((sum, b) => sum + (b.session_count ?? 0), 0) || list.length
    return progressText(list, total)
  }

  return (
    <>
      {/* Desktop table */}
      <Card className="hidden gap-0 pt-0 pb-0 md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6">Murid</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6">Progres</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Empty className="border-0 p-8">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><History /></EmptyMedia>
                        <EmptyTitle>Belum ada booking</EmptyTitle>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : groups.map((group) => (
                <TableRow
                  key={group[0].id}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/teacher/bookings/$bookingId", params: { bookingId: String(group[0].id) } })}
                >
                  <TableCell className="pl-6">
                    <div className="font-medium">{group.map((b) => b.student_name).join(", ")}</div>
                    {group.length > 1 && <div className="text-xs text-muted-foreground">{group.length} murid</div>}
                  </TableCell>
                  <TableCell>{modeBadge(group[0].mode)}</TableCell>
                  <TableCell>{group[0].date}</TableCell>
                  <TableCell>{group[0].start_time} - {group[0].end_time}</TableCell>
                  <TableCell>{statusBadge(group[0].status!)}</TableCell>
                  <TableCell className="pr-6 tabular-nums">
                    {(() => {
                      const label = groupProgress(group)
                      return label ?? <span className="text-muted-foreground">—</span>
                    })()}
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
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <Empty className="p-8">
              <EmptyHeader>
                <EmptyMedia variant="icon"><History /></EmptyMedia>
                <EmptyTitle>Belum ada booking</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="divide-y">
              {groups.map((group) => (
                <div
                  key={group[0].id}
                  className="cursor-pointer p-4"
                  onClick={() => navigate({ to: "/teacher/bookings/$bookingId", params: { bookingId: String(group[0].id) } })}
                >
                  <div className="min-w-0">
                      <p className="text-sm font-medium">{group.map((b) => b.student_name).join(", ")}</p>
                      {group.length > 1 && <p className="mt-0.5 text-xs text-muted-foreground">{group.length} murid</p>}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {modeBadge(group[0].mode)}
                        {statusBadge(group[0].status!)}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{group[0].date} · {group[0].start_time} - {group[0].end_time}</p>
                      {(() => {
                        const label = groupProgress(group)
                        return label ? <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{label}</p> : null
                      })()}
                      <p className="mt-0.5 text-xs text-muted-foreground">Dibuat {group[0].created_at}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </>
  )
}
