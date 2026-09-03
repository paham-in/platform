import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useQuery } from "@tanstack/react-query"
import { getTutoringBookingsOptions } from "@/lib/api/@tanstack/react-query.gen"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Loader2, UserRound, Users, History } from "lucide-react"
import type { TutoringListBookingsResponse } from "@/lib/api/types.gen"

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

// Kelompokkan booking satu grup jadi satu baris.
function groupBookings(bookings: TutoringListBookingsResponse[]): TutoringListBookingsResponse[][] {
  const groups: TutoringListBookingsResponse[][] = []
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
  const { data: bookings = [], isLoading } = useQuery(getTutoringBookingsOptions())

  if (isLoading) return <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

  const groups = groupBookings(bookings)

  return (
    <Card className="pt-0 gap-0 pb-0">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="pl-6">Murid</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jam</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-6">Dibuat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
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
              <TableRow key={group[0].id}>
                <TableCell className="pl-6">
                  <div className="font-medium">{group.map((b) => b.student_name).join(", ")}</div>
                  {group.length > 1 && <div className="text-xs text-muted-foreground">{group.length} murid</div>}
                </TableCell>
                <TableCell>{modeBadge(group[0].mode)}</TableCell>
                <TableCell>{group[0].date}</TableCell>
                <TableCell>{group[0].start_time} - {group[0].end_time}</TableCell>
                <TableCell>{statusBadge(group[0].status!)}</TableCell>
                <TableCell className="text-muted-foreground">{group[0].created_at}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
