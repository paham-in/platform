import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAdminUsersOptions, getTutoringAvailabilityOptions, postTutoringBookingsMutation, getTutoringBookingsQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import { ChevronLeft, Loader2, Calendar } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

function BookTeacher() {
  const { teacherId } = Route.useParams()
  const qc = useQueryClient()
  const { data: allUsers = [] } = useQuery(getAdminUsersOptions())
  const { data: slots = [], isLoading } = useQuery(getTutoringAvailabilityOptions({ query: { teacher_id: Number(teacherId) } }))

  const [selectedSlot, setSelectedSlot] = useState<{ day: number; start: string; end: string } | null>(null)
  const [date, setDate] = useState("")
  const [note, setNote] = useState("")
  const [bookOpen, setBookOpen] = useState(false)

  const teacher = allUsers.find((u) => u.id === Number(teacherId))
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

  const { mutate: createBooking, isPending } = useMutation({
    ...postTutoringBookingsMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getTutoringBookingsQueryKey() })
      toast.success("Booking berhasil dikirim, tunggu konfirmasi guru")
      setBookOpen(false)
      setDate("")
      setNote("")
      setSelectedSlot(null)
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal booking"),
  })

  const handleBook = () => {
    if (!selectedSlot || !date) return
    createBooking({
      body: {
        teacher_id: Number(teacherId),
        date,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        note,
      },
    })
  }

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  if (!teacher) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-muted-foreground">Guru tidak ditemukan</p>
        <Link to="/tutoring"><Button variant="outline">Kembali</Button></Link>
      </div>
    )
  }

  return (
    <main className="p-6">
      <Link to="/tutoring" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Kembali
      </Link>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">{teacher.name?.[0]}</div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{teacher.name}</h1>
          <p className="text-sm text-muted-foreground">{teacher.email}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Jadwal Tersedia</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slots.length === 0 && <p className="col-span-full py-8 text-center text-muted-foreground">Belum ada jadwal tersedia</p>}
            {slots.map((s) => (
              <Card key={s.id} className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedSlot?.day === s.day_of_week && selectedSlot?.start === s.start_time ? "ring-2 ring-primary" : ""}`} onClick={() => { setSelectedSlot({ day: s.day_of_week!, start: s.start_time!, end: s.end_time! }); setBookOpen(true) }}>
                <CardContent className="flex items-center gap-3 p-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{dayNames[s.day_of_week!]}</p>
                    <p className="text-sm text-muted-foreground">{s.start_time} - {s.end_time}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={bookOpen} onOpenChange={(o) => { if (!o) setBookOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Les</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Guru</Label>
              <p className="text-sm text-muted-foreground">{teacher.name}</p>
            </div>
            {selectedSlot && (
              <div className="space-y-1.5">
                <Label>Slot</Label>
                <p className="text-sm text-muted-foreground">{dayNames[selectedSlot.day]} — {selectedSlot.start} - {selectedSlot.end}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Tanggal</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-1.5">
              <Label>Catatan (opsional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Materi yang ingin dibahas..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookOpen(false)}>Batal</Button>
            <Button onClick={handleBook} disabled={!date || isPending}>
              {isPending ? "..." : "Kirim Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/tutoring/$teacherId")({
  component: BookTeacher,
})
