import { createFileRoute, Link } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useQuery } from "@tanstack/react-query"
import { getTutoringBookingsOptions, getTutoringTeachersOptions } from "@/lib/api/@tanstack/react-query.gen"
import { Calendar, Loader2, UserRound } from "lucide-react"

function StudentTutoringIndex() {
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery(getTutoringBookingsOptions())
  const { data: teachers = [], isLoading: teachersLoading } = useQuery(getTutoringTeachersOptions())

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700", confirmed: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700", cancelled: "bg-gray-100 text-gray-700",
    }
    const labels: Record<string, string> = {
      pending: "Menunggu", confirmed: "Disetujui", rejected: "Ditolak", cancelled: "Dibatalkan",
    }
    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[s] || ""}`}>{labels[s] || s}</span>
  }

  if (bookingsLoading || teachersLoading) return <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      {bookings.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-6 pt-4">
              <h2 className="text-lg font-semibold">Booking Saya</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Guru</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jam</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="pl-6 font-medium">{b.teacher_name}</TableCell>
                    <TableCell>{b.date}</TableCell>
                    <TableCell>{b.start_time} - {b.end_time}</TableCell>
                    <TableCell>{statusBadge(b.status!)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold">Pilih Guru</h2>
        {teachers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <UserRound className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="font-medium">Belum ada guru tersedia</p>
                <p className="text-sm text-muted-foreground">Guru akan muncul di sini setelah terdaftar</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teachers.map((t) => (
              <Card key={t.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                    {t.avatar_url ? (
                      <img src={t.avatar_url} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      t.name?.[0]
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{t.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{t.email}</p>
                  </div>
                  <Link to="/student/tutoring/$teacherId" params={{ teacherId: String(t.id) }}>
                    <Button size="sm" variant="outline"><Calendar className="mr-1 h-4 w-4" /> Jadwal</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute("/_dashboard/student/tutoring/")({
  component: StudentTutoringIndex,
})
