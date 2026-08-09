import { createFileRoute, Link } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useQuery } from "@tanstack/react-query"
import { getTutoringBookingsOptions, getTutoringSessionsOptions } from "@/lib/api/@tanstack/react-query.gen"
import { Loader2, Plus, Share2, UserRound, Users } from "lucide-react"
import { toast } from "sonner"

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
  if (mode === "semi_private") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"><Users className="h-3 w-3" /> Semi Private</span>
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700"><UserRound className="h-3 w-3" /> Private</span>
}

function copyJoinLink(token: string) {
  const url = `${window.location.origin}/student/tutoring/join?token=${token}`
  navigator.clipboard.writeText(url).then(() => toast.success("Link undangan disalin")).catch(() => toast.error("Gagal menyalin link"))
}

function StudentTutoringIndex() {
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery(getTutoringBookingsOptions())
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery(getTutoringSessionsOptions())

  if (bookingsLoading) return <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Booking Saya</h2>
          <Link to="/student/tutoring/new"><Button><Plus className="mr-1 h-4 w-4" /> Tambah Booking</Button></Link>
        </div>
        <Card className="pt-0 gap-0 pb-0">
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
                  <TableHead className="pr-6">Undangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="p-8 text-center text-muted-foreground">Belum ada booking</TableCell></TableRow>
                ) : bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="pl-6 font-medium">{b.teacher_name}</TableCell>
                    <TableCell>{modeBadge(b.mode)}</TableCell>
                    <TableCell>{b.session_count ?? 1}×</TableCell>
                    <TableCell>{b.date}</TableCell>
                    <TableCell>{b.start_time} - {b.end_time}</TableCell>
                    <TableCell>{statusBadge(b.status!)}</TableCell>
                    <TableCell className="pr-6">
                      {b.mode === "semi_private" && b.status === "pending" && b.group_token && (
                        <Button variant="outline" size="sm" onClick={() => copyJoinLink(b.group_token!)}>
                          <Share2 className="mr-1 h-3.5 w-3.5" /> Ajak Teman
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Pertemuan Mendatang</h2>
          <span className="text-sm text-muted-foreground">Jadwal aktif setelah pembayaran dikonfirmasi admin</span>
        </div>
        <Card className="pt-0 gap-0 pb-0">
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
                  <TableRow><TableCell colSpan={4} className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="p-8 text-center text-muted-foreground">Belum ada jadwal pertemuan</TableCell></TableRow>
                ) : sessions.map((s) => (
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
      </div>
    </div>
  )
}

export const Route = createFileRoute("/_dashboard/student/tutoring/")({
  component: StudentTutoringIndex,
})
