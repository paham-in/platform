import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getTutoringBookingsOptions, getTutoringBookingsQueryKey, patchTutoringBookingsByIdMutation } from "@/lib/api/@tanstack/react-query.gen"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

function TeacherTutoringIndex() {
  const qc = useQueryClient()
  const { data: bookings = [], isLoading } = useQuery(getTutoringBookingsOptions())
  const { mutate: updateStatus } = useMutation({
    ...patchTutoringBookingsByIdMutation(),
    onSuccess: () => qc.invalidateQueries({ queryKey: getTutoringBookingsQueryKey() }),
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal mengubah status"),
  })

  const statusBadge = (s: string) => {
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

  if (isLoading) return <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

  const pendingBookings = bookings.filter((b) => b.status === "pending")
  const otherBookings = bookings.filter((b) => b.status !== "pending")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-lg font-semibold">Permintaan Baru</h2>
        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Murid</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jam</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingBookings.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="p-8 text-center text-muted-foreground">Belum ada permintaan</TableCell></TableRow>
                ) : pendingBookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="pl-6 font-medium">{b.student_name}</TableCell>
                    <TableCell>{b.date}</TableCell>
                    <TableCell>{b.start_time} - {b.end_time}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">{b.note || "-"}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => updateStatus({ path: { id: b.id! }, body: { status: "confirmed" } })}>
                          <CheckCircle2 className="h-4 w-4" /> Setuju
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus({ path: { id: b.id! }, body: { status: "rejected" } })}>
                          <XCircle className="h-4 w-4" /> Tolak
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Riwayat Booking</h2>
        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Murid</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jam</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6">Dibuat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherBookings.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="p-8 text-center text-muted-foreground">Belum ada riwayat</TableCell></TableRow>
                ) : otherBookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="pl-6 font-medium">{b.student_name}</TableCell>
                    <TableCell>{b.date}</TableCell>
                    <TableCell>{b.start_time} - {b.end_time}</TableCell>
                    <TableCell>{statusBadge(b.status!)}</TableCell>
                    <TableCell className="text-muted-foreground">{b.created_at}</TableCell>
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

export const Route = createFileRoute("/_dashboard/teacher/tutoring/")({
  component: TeacherTutoringIndex,
})
