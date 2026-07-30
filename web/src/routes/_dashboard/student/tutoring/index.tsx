import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useQuery } from "@tanstack/react-query"
import { getTutoringBookingsOptions } from "@/lib/api/@tanstack/react-query.gen"
import { Loader2 } from "lucide-react"

function StudentTutoringIndex() {
  const { data: bookings = [], isLoading } = useQuery(getTutoringBookingsOptions())

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

  if (isLoading) return <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      {bookings.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Booking Saya</CardTitle></CardHeader>
          <CardContent className="p-0">
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

      <p className="text-center text-muted-foreground py-8">
        Untuk booking, pilih guru dari halaman guru nanti.
        {/* Teacher listing will be added here */}
      </p>
    </div>
  )
}

export const Route = createFileRoute("/_dashboard/student/tutoring/")({
  component: StudentTutoringIndex,
})
