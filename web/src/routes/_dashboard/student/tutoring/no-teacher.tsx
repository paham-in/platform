import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getSubjectsOptions, postTutoringBookingsMutation, getTutoringBookingsQueryKey, getStudentClassesOptions, getClassesOptions } from "@/lib/api/@tanstack/react-query.gen"
import { CalendarIcon, UserRound } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useEffect, useState } from "react"
import { toast } from "sonner"

const noTeacherSearchSchema = z.object({
  subject_id: z.coerce.number().int().optional(),
  day: z.coerce.number().int().min(0).max(6).optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
})

const DAY_OPTIONS = [
  { label: "Minggu", value: "0" },
  { label: "Senin", value: "1" },
  { label: "Selasa", value: "2" },
  { label: "Rabu", value: "3" },
  { label: "Kamis", value: "4" },
  { label: "Jumat", value: "5" },
  { label: "Sabtu", value: "6" },
]

const TIME_OPTIONS = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]

function BookNoTeacher() {
  const { subject_id: subjectIdParam, day: dayParam, start_time: startTimeParam, end_time: endTimeParam } = Route.useSearch()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const { data: myClasses = [] } = useQuery(getStudentClassesOptions())
  const { data: classes = [] } = useQuery(getClassesOptions())

  const [subjectId, setSubjectId] = useState(subjectIdParam ? String(subjectIdParam) : "")
  const [day, setDay] = useState(dayParam !== undefined ? String(dayParam) : "")
  const [start, setStart] = useState(startTimeParam ?? "")
  const [end, setEnd] = useState(endTimeParam ?? "")
  const [date, setDate] = useState("")
  const [sessionCount, setSessionCount] = useState(1)
  const [classId, setClassId] = useState("")
  const [note, setNote] = useState("")

  const myClass = classes.find((c) => c.id === Number(classId))
  const pricePerSession = myClass?.price_per_session ?? 0
  const countOptions = [1, 2, 3, 4, 5, 6, 8, 10, 12]
  const subjectOptions = subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }))
  const dayNum = day === "" ? 0 : Number(day)
  const endOptions = TIME_OPTIONS.filter((t) => start === "" || t > start)

  useEffect(() => {
    if (!classId && myClasses.length === 1) setClassId(String(myClasses[0].class_id))
  }, [myClasses, classId])

  const { mutate: createBooking, isPending } = useMutation({
    ...postTutoringBookingsMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getTutoringBookingsQueryKey() })
      toast.success("Permintaan dikirim, admin akan carikan guru")
      navigate({ to: "/student/tutoring" })
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal mengirim permintaan"),
  })

  const canSubmit = !!subjectId && day !== "" && !!start && !!end && !!date && !!classId && !isPending

  const handleBook = () => {
    if (!subjectId || day === "" || !start || !end || !date || !classId) return
    createBooking({
      body: {
        subject_id: Number(subjectId),
        date,
        start_time: start,
        end_time: end,
        mode: "private",
        session_count: sessionCount,
        note,
        class_id: Number(classId),
      },
    })
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 py-2">
      <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        <UserRound className="h-5 w-5 shrink-0" />
        <p>Tidak ada guru tersedia untuk slot ini. Kirim permintaan — admin yang akan mencarikan guru buat kamu.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nt-subject">Mata Pelajaran</Label>
              <Select items={subjectOptions} value={subjectId} onValueChange={(v) => setSubjectId(v ?? "")}>
                <SelectTrigger id="nt-subject" className="w-full" size="sm">
                  <SelectValue placeholder="Pilih mapel" />
                </SelectTrigger>
                <SelectContent>
                  {subjectOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nt-day">Hari</Label>
              <Select items={DAY_OPTIONS} value={day} onValueChange={(v) => setDay(v ?? "")}>
                <SelectTrigger id="nt-day" className="w-full" size="sm">
                  <SelectValue placeholder="Pilih hari" />
                </SelectTrigger>
                <SelectContent>
                  {DAY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nt-start">Jam Mulai</Label>
              <Select items={TIME_OPTIONS.map((t) => ({ label: t, value: t }))} value={start} onValueChange={(v) => { setStart(v ?? ""); setEnd("") }}>
                <SelectTrigger id="nt-start" className="w-full" size="sm">
                  <SelectValue placeholder="Pilih jam" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nt-end">Jam Selesai</Label>
              <Select items={endOptions.map((t) => ({ label: t, value: t }))} value={end} onValueChange={(v) => setEnd(v ?? "")}>
                <SelectTrigger id="nt-end" className="w-full" size="sm">
                  <SelectValue placeholder="Pilih jam" />
                </SelectTrigger>
                <SelectContent>
                  {endOptions.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
                    return d.getDay() !== dayNum
                  }}
                  selected={date ? new Date(date + "T00:00:00") : undefined}
                  onSelect={(d) => setDate(d ? format(d, "yyyy-MM-dd") : "")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label>Jumlah Pertemuan</Label>
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

          <div className="space-y-1.5">
            <Label htmlFor="nt-class">Kelas</Label>
            {myClasses.length === 0 ? (
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                Kamu belum punya akses kelas. Hubungi admin untuk berlangganan.
              </p>
            ) : (
              <Select items={myClasses.map((c) => ({ label: c.class?.name ?? "-", value: String(c.class_id) }))} value={classId} onValueChange={(v) => setClassId(v ?? "")}>
                <SelectTrigger id="nt-class" className="w-full" size="sm">
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
                {myClass && !myClass.price_per_session && (
                  <span className="ml-1 text-amber-600">(kelas tanpa harga)</span>
                )}
              </p>
            </div>
            <p className="text-lg font-bold">Rp {(pricePerSession * sessionCount).toLocaleString("id-ID")}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Link to="/student/tutoring"><Button variant="outline">Kembali</Button></Link>
            <Button onClick={handleBook} disabled={!canSubmit}>
              {isPending ? <Spinner /> : "Kirim Permintaan"}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Permintaan masuk ke admin. Setelah admin menunjuk guru, guru menyetujui lalu kamu mendapat invoice.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute("/_dashboard/student/tutoring/no-teacher")({
  component: BookNoTeacher,
  validateSearch: noTeacherSearchSchema,
})
