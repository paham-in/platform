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
import type { TutoringTeacherResponse } from "@/lib/api/types.gen"
import { CalendarIcon, CheckCircle2, Loader2, Plus, UserRound, Users, X } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useEffect, useState } from "react"
import { toast } from "sonner"

const DAY_OPTIONS = [
  { label: "Minggu", value: "0" },
  { label: "Senin", value: "1" },
  { label: "Selasa", value: "2" },
  { label: "Rabu", value: "3" },
  { label: "Kamis", value: "4" },
  { label: "Jumat", value: "5" },
  { label: "Sabtu", value: "6" },
]

const SESSION_MINUTES = 90

// 07:00 s/d 20:30, tiap 30 menit — biar durasi 90 menit (1 sesi les) bisa dipilih.
const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const total = 7 * 60 + i * 30
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
})

const countOptions = [1, 2, 3, 4, 5, 6, 8, 10, 12]

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
  const [day, setDay] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [teacher, setTeacher] = useState<TutoringTeacherResponse | undefined>()
  const [mode, setMode] = useState<"private" | "semi_private">("private")
  const [sessionCount, setSessionCount] = useState(1)
  const [classId, setClassId] = useState("")
  const [date, setDate] = useState("")
  const [note, setNote] = useState("")
  const [memberEmails, setMemberEmails] = useState<string[]>([])
  const [emailInput, setEmailInput] = useState("")

  const myClass = classes.find((c) => c.id === Number(classId))
  const pricePerSession = mode === "semi_private" ? (myClass?.semi_private_price ?? 0) : (myClass?.price_per_session ?? 0)
  const dayNum = day === "" ? 0 : Number(day)

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

  const hasSlot = day !== "" && start !== "" && end !== ""
  const canSearch = subjectId !== "" && hasSlot
  const perWeek = hasSlot ? perWeekFor(start, end) : null
  const totalSessions = perWeek ? sessionCount * perWeek : 0

  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    ...getTutoringTeachersOptions({
      query: canSearch
        ? { subject_id: Number(subjectId), day_of_week: Number(day), start_time: start, end_time: end }
        : undefined,
    }),
    enabled: canSearch,
  })

  // auto-pilih kelas kalau murid cuma punya 1 langganan
  useEffect(() => {
    if (!classId && myClasses.length === 1) setClassId(String(myClasses[0].class_id))
  }, [myClasses, classId])

  const subjectOptions = subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }))

  const changeSubject = (v: string | null) => { setSubjectId(v ?? ""); setTeacher(undefined); setDate("") }
  const changeDay = (v: string | null) => { setDay(v ?? ""); setTeacher(undefined); setDate("") }
  const changeStart = (v: string | null) => { setStart(v ?? ""); setEnd(""); setTeacher(undefined); setDate("") }
  const changeEnd = (v: string | null) => { setEnd(v ?? ""); setTeacher(undefined); setDate("") }

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
        member_emails: mode === "semi_private" ? memberEmails : undefined,
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
    <div className="mx-auto max-w-2xl space-y-6 py-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Booking Baru</h2>
          <p className="text-sm text-muted-foreground">Isi mapel & jam dulu, lalu pilih guru — atau kirim tanpa guru.</p>
        </div>
        <Link to="/student/tutoring"><Button variant="outline">Batal</Button></Link>
      </div>

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

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-day">Hari</Label>
              <Select items={DAY_OPTIONS} value={day} onValueChange={changeDay}>
                <SelectTrigger id="new-day" className="w-full" size="sm">
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
                Pilih mapel, hari, dan jam untuk menampilkan guru yang tersedia.
              </p>
            ) : teachersLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : teachers.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-8 text-center">
                <UserRound className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Tidak ada guru untuk mapel & jam ini.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setDay(""); setStart(""); setEnd("") }}>Cari Slot Lain</Button>
                  <Button size="sm" onClick={() => setTeacher(undefined)}>Kirim Tanpa Guru</Button>
                </div>
                <p className="px-4 text-xs text-muted-foreground">Kirim tanpa guru: admin yang carikan guru buat kamu.</p>
              </div>
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
                    if (day === "") return true
                    const today = new Date(); today.setHours(0, 0, 0, 0)
                    if (d < today) return true
                    return d.getDay() !== dayNum
                  }}
                  selected={date ? new Date(date + "T00:00:00") : undefined}
                  onSelect={(d) => setDate(d ? format(d, "yyyy-MM-dd") : "")}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">Pertemuan berikutnya berjalan mingguan di hari & jam yang sama.</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Mode</Label>
              <button type="button" onClick={() => setMode(mode === "private" ? "semi_private" : "private")} className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50">
                {mode === "private" ? "Ganti Semi Private" : "Ganti Private"}
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {mode === "semi_private" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"><Users className="h-3 w-3" /> Semi Private</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700"><UserRound className="h-3 w-3" /> Private</span>
              )}
              <span>{mode === "semi_private" ? "Maksimal 5 siswa termasuk kamu." : "Les sendiri berdua dengan guru."}</span>
            </div>
          </div>

          {mode === "semi_private" && (
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
            {myClasses.length === 0 ? (
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                Kamu belum punya akses kelas. Hubungi admin untuk berlangganan.
              </p>
            ) : (
              <Select items={myClasses.map((c) => ({ label: c.class?.name ?? "-", value: String(c.class_id) }))} value={classId} onValueChange={(v) => setClassId(v ?? "")}>
                <SelectTrigger id="new-class" className="w-full" size="sm">
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
            <Label htmlFor="new-note">Catatan (opsional)</Label>
            <Input id="new-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Materi yang ingin dibahas..." />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
            <div className="text-sm">
              <p className="font-medium">Total ({sessionCount}× pertemuan{perWeek ? ` · ${totalSessions} sesi` : ""})</p>
              <p className="text-xs text-muted-foreground">
                Rp {pricePerSession.toLocaleString("id-ID")} / sesi ({SESSION_MINUTES} menit)
                {myClass && (mode === "semi_private" ? !myClass.semi_private_price : !myClass.price_per_session) && (
                  <span className="ml-1 text-amber-600">(kelas tanpa harga)</span>
                )}
              </p>
            </div>
            <p className="text-lg font-bold">Rp {(pricePerSession * totalSessions).toLocaleString("id-ID")}</p>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Link to="/student/tutoring"><Button variant="outline">Batal</Button></Link>
            <Button onClick={handleBook} disabled={!canSubmit}>{isPending ? <Spinner /> : "Kirim Booking"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute("/_dashboard/student/tutoring/new")({
  component: NewBooking,
})
