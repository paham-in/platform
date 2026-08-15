import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getTutoringTeachersOptions,
  postTutoringBookingsMutation,
  getTutoringBookingsQueryKey,
  getStudentClassesOptions,
  getClassesOptions,
  getSubjectsOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListTeachersResponse } from "@/lib/api/types.gen"
import { CalendarIcon, CheckCircle2, ChevronLeft, Loader2, Plus, X, UserX } from "lucide-react"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useEffect, useState } from "react"
import { toast } from "sonner"

const SESSION_MINUTES = 90

// 07:00 s/d 20:30, tiap 30 menit — biar durasi 90 menit (1 sesi les) bisa dipilih.
const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const total = 7 * 60 + i * 30
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
})

const countOptions = [1, 2, 3, 4, 5, 6, 8, 10, 12]

const modeOptions = [
  { label: "Private", value: "private" },
  { label: "Kelompok", value: "group" },
]

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

// sesi-per-minggu dari durasi blok; null kalau bukan kelipatan 90.
function perWeekFor(start: string, end: string): number | null {
  const dur = toMinutes(end) - toMinutes(start)
  if (dur <= 0 || dur % SESSION_MINUTES !== 0) return null
  return dur / SESSION_MINUTES
}

function NewBooking() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const { data: myClasses = [] } = useQuery(getStudentClassesOptions())
  const { data: classes = [] } = useQuery(getClassesOptions())

  const [subjectId, setSubjectId] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [teacher, setTeacher] = useState<TutoringListTeachersResponse | undefined>()
  const [mode, setMode] = useState<"private" | "group">("private")
  const [sessionCount, setSessionCount] = useState(1)
  const [classId, setClassId] = useState("")
  const [date, setDate] = useState("")
  const [note, setNote] = useState("")
  const [memberEmails, setMemberEmails] = useState<string[]>([])
  const [emailInput, setEmailInput] = useState("")

  const myClass = classes.find((c) => c.id === Number(classId))
  const pricePerSession = mode === "group" ? (myClass?.group_price ?? 0) : (myClass?.price_per_session ?? 0)

  // jam selesai hanya yang durasinya kelipatan 90 menit (1 sesi les)
  const endOptions = start === ""
    ? []
    : TIME_OPTIONS.filter((t) => {
        const dur = toMinutes(t) - toMinutes(start)
        return dur > 0 && dur % SESSION_MINUTES === 0
      })
  // jam mulai yang masih punya pilihan jam selesai valid
  const startOptions = TIME_OPTIONS.filter((t) =>
    TIME_OPTIONS.some((e) => {
      const dur = toMinutes(e) - toMinutes(t)
      return dur > 0 && dur % SESSION_MINUTES === 0
    })
  )

  const hasSlot = start !== "" && end !== "" && date !== ""
  const canSearch = subjectId !== "" && hasSlot
  const perWeek = hasSlot ? perWeekFor(start, end) : null
  const totalSessions = perWeek ? sessionCount * perWeek : 0

  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    ...getTutoringTeachersOptions({
      query: canSearch
        ? { subject_id: Number(subjectId), date, start_time: start, end_time: end }
        : undefined,
    }),
    enabled: canSearch,
  })

  // auto-pilih kelas: preferensi kelas yang sudah diakses, else kelas pertama
  useEffect(() => {
    if (classId || classes.length === 0) return
    const preferred = myClasses
      .map((c) => String(c.class_id))
      .find((id) => classes.some((c) => String(c.id) === id))
    setClassId(preferred ?? String(classes[0].id ?? ""))
  }, [myClasses, classes, classId])

  const subjectOptions = subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }))

  const changeSubject = (v: string | null) => { setSubjectId(v ?? ""); setTeacher(undefined); setDate("") }
  const changeStart = (v: string | null) => { setStart(v ?? ""); setEnd(""); setTeacher(undefined); setDate("") }
  const changeEnd = (v: string | null) => { setEnd(v ?? ""); setTeacher(undefined); setDate("") }
  const changeDate = (d: Date | undefined) => { setDate(d ? format(d, "yyyy-MM-dd") : ""); setTeacher(undefined) }

  const { mutate: createBooking, isPending } = useMutation({
    ...postTutoringBookingsMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getTutoringBookingsQueryKey() })
      toast.success(teacher ? "Booking berhasil dikirim, tunggu konfirmasi guru" : "Permintaan dikirim, admin akan carikan guru")
      navigate({ to: "/student/tutoring" })
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal booking"),
  })

  const canSubmit =
    canSearch && !!date && !!classId && !isPending &&
    (mode === "private" || memberEmails.length > 0)

  const handleBook = () => {
    if (!canSearch || !date || !classId) return
    createBooking({
      body: {
        teacher_id: teacher?.id,
        subject_id: Number(subjectId),
        date,
        start_time: start,
        end_time: end,
        mode,
        session_count: sessionCount,
        note,
        class_id: Number(classId),
        member_emails: mode === "group" ? memberEmails : undefined,
      },
    })
  }

  const addMemberEmail = () => {
    const e = emailInput.trim()
    if (!e) return
    if (memberEmails.includes(e)) {
      setEmailInput("")
      return
    }
    if (memberEmails.length + 1 > 4) return // max 4 member + organizer = 5
    setMemberEmails([...memberEmails, e])
    setEmailInput("")
  }

  return (
    <main className="p-6">
      <div className="mb-6">
        <Link to="/student/tutoring" className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Kembali
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Booking Baru</h1>
        <p className="text-sm text-muted-foreground">Pilih mapel, tanggal & jam dulu, lalu pilih guru — atau kirim tanpa guru.</p>
      </div>
      <div className="mx-auto max-w-2xl space-y-6 py-2">

      <Card className="gap-0 pt-0 pb-0">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="new-subject">Mata Pelajaran</Label>
            <Select items={subjectOptions} value={subjectId} onValueChange={changeSubject}>
              <SelectTrigger id="new-subject" className="w-full" size="sm">
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
                    return d < today
                  }}
                  selected={date ? new Date(date + "T00:00:00") : undefined}
                  onSelect={changeDate}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">Pertemuan berikutnya berjalan mingguan di hari & jam yang sama.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-start">Jam Mulai</Label>
              <Select items={startOptions.map((t) => ({ label: t, value: t }))} value={start} onValueChange={changeStart}>
                <SelectTrigger id="new-start" className="w-full" size="sm">
                  <SelectValue placeholder="Pilih jam" />
                </SelectTrigger>
                <SelectContent>
                  {startOptions.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Durasi les kelipatan {SESSION_MINUTES} menit ({SESSION_MINUTES / 60} jam).</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-end">Jam Selesai</Label>
              <Select items={endOptions.map((t) => ({ label: t, value: t }))} value={end} onValueChange={changeEnd}>
                <SelectTrigger id="new-end" className="w-full" size="sm">
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

          <div className="space-y-2">
            <Label>Pilih Guru</Label>
            {!canSearch ? (
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                Pilih mapel, tanggal, dan jam untuk menampilkan guru yang tersedia.
              </p>
            ) : teachersLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : teachers.length === 0 ? (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><UserX /></EmptyMedia>
                  <EmptyTitle>Tidak ada guru untuk mapel & jam ini</EmptyTitle>
                </EmptyHeader>
                <EmptyContent className="gap-1">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setStart(""); setEnd(""); setDate("") }}>Cari Jam Lain</Button>
                    <Button size="sm" onClick={() => setTeacher(undefined)}>Kirim Tanpa Guru</Button>
                  </div>
                  <p className="px-4 text-xs text-muted-foreground">Kirim tanpa guru: admin yang carikan guru buat kamu.</p>
                </EmptyContent>
              </Empty>
            ) : (
              <>
                <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
                  {teachers.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTeacher(t)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${teacher?.id === t.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                        {t.avatar_url ? (
                          <img src={t.avatar_url} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          t.name?.[0]
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{t.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{t.email}</p>
                      </div>
                      {teacher?.id === t.id && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                    </button>
                  ))}
                </div>
                {teacher && (
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                    <span>Guru dipilih: <span className="font-medium">{teacher.name}</span></span>
                    <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setTeacher(undefined)}>
                      Tanpa Guru
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Mode</Label>
            <Select
              items={modeOptions}
              value={mode}
              onValueChange={(v) => setMode(v === "group" ? "group" : "private")}
            >
              <SelectTrigger id="new-mode" className="w-full" size="sm">
                <SelectValue placeholder="Pilih mode" />
              </SelectTrigger>
              <SelectContent>
                {modeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {mode === "group" ? "Maksimal 5 siswa termasuk kamu." : "Les sendiri berdua dengan guru."}
            </p>
          </div>

          {mode === "group" && (
            <div className="space-y-1.5">
              <Label>Email Teman</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMemberEmail() } }}
                  placeholder="email.teman@contoh.com"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addMemberEmail} disabled={!emailInput.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Semua member wajib punya akun dulu. Email belum terdaftar → booking ditolak.
              </p>
              {memberEmails.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {memberEmails.map((e) => (
                    <span key={e} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
                      {e}
                      <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setMemberEmails(memberEmails.filter((x) => x !== e))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <span className="text-xs text-muted-foreground">{memberEmails.length + 1}/5</span>
                </div>
              )}
            </div>
          )}

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
            <Label htmlFor="new-class">Kelas</Label>
            {classes.length === 0 ? (
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                Belum ada kelas tersedia.
              </p>
            ) : (
              <Select items={classes.map((c) => ({ label: c.name, value: String(c.id) }))} value={classId} onValueChange={(v) => setClassId(v ?? "")}>
                <SelectTrigger id="new-class" className="w-full" size="sm">
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {myClasses.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Kamu belum punya akses kelas — akses diberikan otomatis setelah pembayaran booking diverifikasi admin.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-note">Catatan (opsional)</Label>
            <Input id="new-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Materi yang ingin dibahas..." />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
            <div className="text-sm">
              <p className="font-medium">Total ({sessionCount}× pertemuan{perWeek ? ` · ${totalSessions} sesi` : ""})</p>
              <p className="text-xs text-muted-foreground">
                Rp {pricePerSession.toLocaleString("id-ID")} / sesi ({SESSION_MINUTES} menit)
                {myClass && (mode === "group" ? !myClass.group_price : !myClass.price_per_session) && (
                  <span className="ml-1 text-amber-600">(kelas tanpa harga)</span>
                )}
              </p>
            </div>
            <p className="text-lg font-bold">Rp {(pricePerSession * totalSessions).toLocaleString("id-ID")}</p>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Link to="/student/tutoring"><Button variant="outline">Batal</Button></Link>
            <Button onClick={handleBook} disabled={!canSubmit}>
              {isPending && <Spinner />}
              Kirim Booking
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/tutoring/new")({
  component: NewBooking,
})
