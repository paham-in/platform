import { createFileRoute, Link } from "@tanstack/react-router"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getTutoringTeachersOptions, getTutoringAvailabilityOptions, postTutoringBookingsMutation, getTutoringBookingsQueryKey, getStudentClassesOptions, getClassesOptions } from "@/lib/api/@tanstack/react-query.gen"
import { CalendarIcon, CheckCircle2, Copy, Loader2, UserRound, Users } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useEffect, useState } from "react"
import { toast } from "sonner"

const bookTeacherSearchSchema = z.object({
  mode: z.enum(["private", "semi_private"]).optional(),
  count: z.coerce.number().int().min(1).max(52).optional(),
})

function BookTeacher() {
  const { teacherId } = Route.useParams()
  const { mode: modeParam, count: countParam } = Route.useSearch()
  const qc = useQueryClient()
  const { data: teachers = [] } = useQuery(getTutoringTeachersOptions())
  const { data: slots = [], isLoading } = useQuery(getTutoringAvailabilityOptions({ query: { teacher_id: Number(teacherId) } }))
  const { data: myClasses = [] } = useQuery(getStudentClassesOptions())
  const { data: classes = [] } = useQuery(getClassesOptions())

  const [mode, setMode] = useState<"private" | "semi_private">(modeParam ?? "private")
  const [sessionCount, setSessionCount] = useState(countParam ?? 1)
  const [classId, setClassId] = useState("")
  const myClass = classes.find((c) => c.id === Number(classId))
  const pricePerSession = mode === "semi_private" ? (myClass?.semi_private_price ?? 0) : (myClass?.price_per_session ?? 0)
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; start: string; end: string } | null>(null)
  const [date, setDate] = useState("")
  const [note, setNote] = useState("")
  const [shareOpen, setShareOpen] = useState(false)
  const [newToken, setNewToken] = useState("")

  const teacher = teachers.find((u) => u.id === Number(teacherId))
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  const countOptions = [1, 2, 3, 4, 5, 6, 8, 10, 12]

  // auto-pilih kelas kalau murid cuma punya 1 langganan
  useEffect(() => {
    if (!classId && myClasses.length === 1) setClassId(String(myClasses[0].class_id))
  }, [myClasses, classId])

  const { mutate: createBooking, isPending } = useMutation({
    ...postTutoringBookingsMutation(),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: getTutoringBookingsQueryKey() })
      setDate(""); setNote(""); setSelectedSlot(null)
      if (mode === "semi_private" && data?.group_token) {
        setNewToken(data.group_token)
        setShareOpen(true)
        toast.success("Booking grup berhasil, ajak temanmu!")
      } else {
        toast.success("Booking berhasil dikirim, tunggu konfirmasi guru")
      }
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal booking"),
  })

  const canSubmit = !!selectedSlot && !!date && !!classId && !isPending

  const handleBook = () => {
    if (!selectedSlot || !date || !classId) return
    createBooking({
      body: { teacher_id: Number(teacherId), date, start_time: selectedSlot.start, end_time: selectedSlot.end, mode, session_count: sessionCount, note, class_id: Number(classId) },
    })
  }

  const joinLink = newToken ? `${window.location.origin}/student/tutoring/join?token=${newToken}` : ""

  if (isLoading) return <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  if (!teacher) return <div className="flex flex-col items-center gap-4 py-12"><p className="text-muted-foreground">Guru tidak ditemukan</p><Link to="/student/tutoring"><Button variant="outline">Kembali</Button></Link></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
          {teacher.avatar_url ? (
            <img src={teacher.avatar_url} alt={teacher.name} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            teacher.name?.[0]
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold">{teacher.name}</h2>
          <p className="text-sm text-muted-foreground">{teacher.email}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {mode === "semi_private" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"><Users className="h-3 w-3" /> Semi Private</span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700"><UserRound className="h-3 w-3" /> Private</span>
            )}
            <span className="text-sm text-muted-foreground">{sessionCount}× pertemuan</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <CardTitle>Jadwal Tersedia</CardTitle>
          <button type="button" onClick={() => setMode(mode === "private" ? "semi_private" : "private")} className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50">
            {mode === "private" ? "Ganti Semi Private" : "Ganti Private"}
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">Jumlah Pertemuan</span>
            <div className="flex flex-wrap gap-1.5">
              {countOptions.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSessionCount(n)}
                  className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${sessionCount === n ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "hover:bg-muted/50"}`}
                >
                  {n}×
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slots.length === 0 && <p className="col-span-full py-8 text-center text-muted-foreground">Belum ada jadwal tersedia</p>}
            {slots.map((s) => (
              <Card key={s.id} className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedSlot?.day === s.day_of_week && selectedSlot?.start === s.start_time ? "ring-2 ring-primary" : ""}`}
                onClick={() => { setSelectedSlot({ day: s.day_of_week!, start: s.start_time!, end: s.end_time! }); setDate("") }}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{dayNames[s.day_of_week!]}</p>
                      <p className="text-sm text-muted-foreground">{s.start_time} - {s.end_time}</p>
                    </div>
                  </div>
                  {selectedSlot?.day === s.day_of_week && selectedSlot?.start === s.start_time && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="border-t pt-4" />

          <div className="space-y-1.5">
            <Label>Tanggal Mulai</Label>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    data-empty={!date}
                    className="w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                  />
                }
              >
                <CalendarIcon />
                {date ? format(new Date(date + "T00:00:00"), "EEE, dd MMM yyyy", { locale: id }) : <span>Pilih tanggal</span>}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  disabled={(d) => {
                    const today = new Date(); today.setHours(0, 0, 0, 0)
                    if (d < today) return true
                    if (!selectedSlot) return false
                    return d.getDay() !== selectedSlot.day
                  }}
                  selected={date ? new Date(date + "T00:00:00") : undefined}
                  onSelect={(d) => setDate(d ? format(d, "yyyy-MM-dd") : "")}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">Pertemuan berikutnya berjalan mingguan di hari & jam yang sama.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="class-select">Kelas</Label>
            {myClasses.length === 0 ? (
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                Kamu belum punya akses kelas. Hubungi admin untuk berlangganan.
              </p>
            ) : (
              <Select items={myClasses.map((c) => ({ label: c.class?.name ?? "-", value: String(c.class_id) }))} value={classId} onValueChange={(v) => setClassId(v ?? "")}>
                <SelectTrigger id="class-select" className="w-full" size="sm">
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {myClasses.map((c) => (
                    <SelectItem key={c.id} value={String(c.class_id)}>
                      {c.class?.name ?? "-"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Catatan (opsional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Materi yang ingin dibahas..." />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
            <div className="text-sm">
              <p className="font-medium">Total ({sessionCount}× pertemuan)</p>
              <p className="text-xs text-muted-foreground">
                Rp {pricePerSession.toLocaleString("id-ID")} / pertemuan
                {myClass && (mode === "semi_private" ? !myClass.semi_private_price : !myClass.price_per_session) && (
                  <span className="ml-1 text-amber-600">(kelas tanpa harga)</span>
                )}
              </p>
            </div>
            <p className="text-lg font-bold">Rp {(pricePerSession * sessionCount).toLocaleString("id-ID")}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setSelectedSlot(null); setDate(""); setNote("") }}>Reset</Button>
            <Button onClick={handleBook} disabled={!canSubmit}>{isPending ? <Spinner /> : "Kirim Booking"}</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={shareOpen} onOpenChange={(o) => { if (!o) setShareOpen(false) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajak Teman Bergabung</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Bagikan link ini ke temanmu untuk bergabung ke grup semi-private. Maksimal 5 siswa termasuk kamu.</p>
            <div className="flex items-center gap-2">
              <Input readOnly value={joinLink} className="flex-1 text-xs" />
              <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(joinLink).then(() => toast.success("Link disalin"))}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Teman yang belum punya akun cukup daftar, lalu buka link ini.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShareOpen(false)}>Selesai</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const Route = createFileRoute("/_dashboard/student/tutoring/$teacherId")({
  component: BookTeacher,
  validateSearch: bookTeacherSearchSchema,
})
