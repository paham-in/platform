import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, UserX, X } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import type { UserAdminListUsersResponse, TutoringListTeachersResponse } from "@/lib/api/types.gen"
import {
  postAdminTutoringBookingsMutation,
  getAdminTutoringBookingsQueryKey,
  getAdminUsersQueryKey,
  getAdminStudentClassEnrollmentsQueryKey,
  getAdminStudentsOptions,
  getTutoringTeachersOptions,
  getAdminClassesOptions,
  getSubjectsOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { usePageTitle } from "@/components/page-title"

const countOptions = [1, 2, 3, 4, 5, 6, 8, 10, 12]
const modeOptions = [
  { label: "Private", value: "private" },
  { label: "Kelompok", value: "group" },
]
const SESSION_MINUTES = 90

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

function AdminTutoringNew() {
  usePageTitle("Tambah Booking Manual")
  const qc = useQueryClient()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data: students = [] } = useQuery(getAdminStudentsOptions())
  const { data: classes = [] } = useQuery(getAdminClassesOptions())
  const { data: subjects = [] } = useQuery(getSubjectsOptions())

  const [student, setStudent] = useState<UserAdminListUsersResponse>()
  const [subjectId, setSubjectId] = useState("")
  const [teacher, setTeacher] = useState<TutoringListTeachersResponse | undefined>()
  const [sessionCount, setSessionCount] = useState(1)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [date, setDate] = useState("")
  const [note, setNote] = useState("")
  const [mode, setMode] = useState<"private" | "group">("private")
  const [members, setMembers] = useState<UserAdminListUsersResponse[]>([])
  const [memberPick, setMemberPick] = useState<UserAdminListUsersResponse | null>(null)
  const [classId, setClassId] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // guru difilter by mapel
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    ...getTutoringTeachersOptions({
      query: subjectId ? { subject_id: Number(subjectId) } : undefined,
    }),
    enabled: !!subjectId,
  })

  const { mutateAsync: createBooking } = useMutation(postAdminTutoringBookingsMutation())

  // ganti murid → reset kelas supaya admin pilih ulang (tidak bawa pilihan murid sebelumnya)
  useEffect(() => {
    setClassId("")
  }, [student])

  const myClass = classes.find((c) => c.id === Number(classId))
  const pricePerSession = myClass?.price_per_session ?? 0

  const timesValid = startTime !== "" && endTime !== "" && startTime < endTime
  const perWeek = timesValid ? perWeekFor(startTime, endTime) : null
  const totalSessions = perWeek ? sessionCount * perWeek : 0
  const canSubmit =
    !!student && classId && subjectId && teacher && timesValid && perWeek !== null && date && !submitting &&
    myClass?.allow_tutoring !== false &&
    (mode === "private" || members.length > 0)

  const memberEmails = mode === "group"
    ? Array.from(new Set(
        members
          .map((m) => m.email?.trim())
          .filter((e): e is string => !!e && e !== student?.email?.trim())
      ))
    : undefined

  const save = async () => {
    if (!student || !teacher || !timesValid || !date || !classId || !subjectId) return
    if (mode === "group" && (memberEmails ?? []).length === 0) return
    setSubmitting(true)
    try {
      await createBooking({
        body: {
          student_id: student.id!,
          teacher_id: teacher.id!,
          subject_id: Number(subjectId),
          date,
          start_time: startTime,
          end_time: endTime,
          mode,
          session_count: sessionCount,
          note,
          class_id: Number(classId),
          member_emails: memberEmails,
        },
      })
      toast.success("Booking berhasil dibuat")
      qc.invalidateQueries({ queryKey: getAdminTutoringBookingsQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminStudentClassEnrollmentsQueryKey() })
      navigate({ to: "/admin/tutoring" })
    } catch (err: any) {
      toast.error(err?.error || err?.message || "Gagal membuat booking")
    } finally {
      setSubmitting(false)
    }
  }

  const subjectOptions = subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }))

  return (
    <main className="p-4 md:p-6">
      <div className="mb-6">
          <h1 className="hidden md:block text-2xl font-bold tracking-tight">Tambah Booking Manual</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daftarkan les privat untuk murid secara manual. Langsung disetujui + buat sesi & invoice.
          </p>
        </div>

      <Card className="gap-0 pt-0 pb-0">
        <CardContent className="space-y-4 md:space-y-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="admin-booking-student">Murid</Label>
            <Combobox
              autoHighlight
              items={students}
              value={student}
              onValueChange={(v) => {
                setStudent(v ?? undefined)
                // ganti murid utama → buang member yang sama (id/email) biar tidak dobel
                if (v) setMembers((prev) => prev.filter((m) => m.id !== v.id && m.email !== v.email))
              }}
              itemToStringLabel={(u) => (u ? `${u.name} — ${u.email}` : "")}
            >
              <ComboboxInput id="admin-booking-student" placeholder={students.length ? "Pilih murid..." : "Tidak ada murid"} />
              <ComboboxContent>
                <ComboboxEmpty>Tidak ada murid ditemukan</ComboboxEmpty>
                <ComboboxList>
                  {(u: UserAdminListUsersResponse) => (
                    <ComboboxItem key={u.id} value={u}>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{u.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{u.email}</span>
                      </span>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>

            <div className="space-y-2">
              <Label htmlFor="admin-booking-class">Kelas</Label>
              {!student ? (
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">Pilih murid dulu</p>
              ) : classes.length === 0 ? (
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">Belum ada kelas tersedia.</p>
              ) : (
                <>
                  <Select
                    items={classes.map((c) => ({ label: c.name, value: String(c.id) }))}
                    value={classId}
                    onValueChange={(v) => setClassId(v ?? "")}
                  >
                    <SelectTrigger id="admin-booking-class" className="w-full">
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Akses kelas murid diberikan setelah invoice booking lunas.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-booking-mode">Mode</Label>
            {myClass && myClass.allow_tutoring === false ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                Kelas ini tidak menyediakan layanan les.
              </div>
            ) : (
            <>
            <Select
              items={modeOptions}
              value={mode}
              onValueChange={(v) => {
                setMode(v === "group" ? "group" : "private")
                setMembers([])
              }}
            >
              <SelectTrigger id="admin-booking-mode" className="w-full">
                <SelectValue placeholder="Pilih mode" />
              </SelectTrigger>
              <SelectContent>
                {modeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {mode === "group" ? "Maksimal 5 siswa termasuk murid utama." : "Les sendiri berdua dengan guru."}
            </p>
            </>
            )}
          </div>

          {mode === "group" && (
            <div className="space-y-2">
              <Label htmlFor="admin-booking-member">Member</Label>
              <Combobox
                autoHighlight
                items={students.filter((u) => u.id !== student?.id && !members.some((m) => m.id === u.id))}
                value={memberPick}
                onValueChange={(v) => {
                  setMemberPick(v ?? null)
                  if (v) {
                    setMembers((prev) => (prev.length + 1 > 4 ? prev : [...prev, v]))
                    setMemberPick(null)
                  }
                }}
                itemToStringLabel={(u) => (u ? `${u.name} — ${u.email}` : "")}
              >
                <ComboboxInput id="admin-booking-member" placeholder="Pilih murid (max 4)..." />
                <ComboboxContent>
                  <ComboboxEmpty>Tidak ada murid ditemukan</ComboboxEmpty>
                  <ComboboxList>
                    {(u: UserAdminListUsersResponse) => (
                      <ComboboxItem key={u.id} value={u}>
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate">{u.name}</span>
                          <span className="truncate text-xs text-muted-foreground">{u.email}</span>
                        </span>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              <p className="text-xs text-muted-foreground">Semua member harus sudah punya akun. Booking ditolak kalau ada email belum terdaftar.</p>
              {members.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {members.map((m) => (
                    <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
                      {m.name}
                      <button type="button" aria-label={`Hapus ${m.name}`} className="text-muted-foreground hover:text-foreground" onClick={() => setMembers(members.filter((x) => x.id !== m.id))}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                  <span className="text-xs text-muted-foreground">{members.length + 1}/5</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="admin-booking-subject">Mata Pelajaran</Label>
            <Select
              items={subjectOptions}
              value={subjectId}
              onValueChange={(v) => {
                setSubjectId(v ?? "")
                setTeacher(undefined)
                setStartTime("")
                setEndTime("")
                setDate("")
              }}
            >
              <SelectTrigger id="admin-booking-subject" className="w-full">
                <SelectValue placeholder="Pilih mapel" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-booking-teacher">Guru</Label>
            {!subjectId ? (
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">Pilih mapel dulu</p>
            ) : teachersLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : teachers.length === 0 ? (
              <Empty className="border-0 px-0 py-4">
                <EmptyHeader className="gap-1">
                  <EmptyMedia variant="icon"><UserX /></EmptyMedia>
                  <EmptyTitle className="text-sm">Tidak ada guru untuk mapel ini</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              <Combobox
                autoHighlight
                items={teachers}
                value={teacher}
                onValueChange={(v) => {
                  setTeacher(v ?? undefined)
                  setStartTime("")
                  setEndTime("")
                  setDate("")
                }}
                itemToStringLabel={(t) => (t ? t.name ?? "" : "")}
              >
                <ComboboxInput id="admin-booking-teacher" placeholder="Pilih guru..." />
                <ComboboxContent>
                  <ComboboxEmpty>Tidak ada guru ditemukan</ComboboxEmpty>
                  <ComboboxList>
                    {(t: TutoringListTeachersResponse) => (
                      <ComboboxItem key={t.id} value={t}>
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate">{t.name}</span>
                          <span className="truncate text-xs text-muted-foreground">{t.email}</span>
                        </span>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            )}
          </div>

          {teacher && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-booking-start">Jam Mulai</Label>
                  <Input
                    id="admin-booking-start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  autoComplete="off"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-booking-end">Jam Selesai</Label>
                  <Input
                    id="admin-booking-end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  autoComplete="off"/>
                </div>
              </div>
              {startTime !== "" && endTime !== "" && !(startTime < endTime) && (
                <p className="text-xs text-destructive">Jam selesai harus setelah jam mulai.</p>
              )}
              {timesValid && perWeek === null && (
                <p className="text-xs text-destructive">Durasi les harus kelipatan {SESSION_MINUTES} menit (1,5 jam).</p>
              )}

              <div className="space-y-2">
                <Label htmlFor="admin-booking-date">Tanggal Mulai</Label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        id="admin-booking-date"
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
                      onSelect={(d) => setDate(d ? format(d, "yyyy-MM-dd") : "")}
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">Pertemuan berikutnya berjalan mingguan di hari & jam yang sama.</p>
              </div>

              <div className="space-y-2">
                <Label>Jumlah Pertemuan</Label>
                <div className="flex flex-wrap gap-1.5">
                  {countOptions.map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={sessionCount === n}
                      onClick={() => setSessionCount(n)}
                      className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${sessionCount === n ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "hover:bg-muted/50"}`}
                    >
                      {n}×
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Catatan (opsional)</Label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Materi yang ingin dibahas..." autoComplete="off"/>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <div className="text-sm">
                  <p className="font-medium">Total ({sessionCount}× pertemuan{perWeek ? ` · ${totalSessions} sesi` : ""})</p>
                  <p className="text-xs text-muted-foreground">
                    Rp {pricePerSession.toLocaleString("id-ID")} / sesi (90 menit)
                    {myClass && !myClass.price_per_session && (
                      <span className="ml-1 text-amber-600">(kelas tanpa harga)</span>
                    )}
                  </p>
                </div>
                <p className="text-lg font-bold">Rp {(pricePerSession * totalSessions).toLocaleString("id-ID")}</p>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={() => navigate({ to: "/admin/tutoring" })}>Batal</Button>
            <Button onClick={save} disabled={!canSubmit}>
              {submitting && <Spinner />}
              Buat Booking
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/tutoring/new")({
  component: AdminTutoringNew,
})
