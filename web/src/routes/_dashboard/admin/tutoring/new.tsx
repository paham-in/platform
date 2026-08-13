import { useState } from "react"
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
import { ArrowLeft, CalendarIcon, Loader2, CheckCircle2, UserRound, Users, UserX } from "lucide-react"
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
import type { UserAdminUserResponse, TutoringTeacherResponse } from "@/lib/api/types.gen"
import {
  postAdminTutoringBookingsMutation,
  getAdminTutoringBookingsQueryKey,
  getAdminUsersQueryKey,
  getAdminStudentClassesQueryKey,
  getAdminStudentsOptions,
  getTutoringTeachersOptions,
  getAdminTutoringAvailabilityOptions,
  getAdminClassesOptions,
  getSubjectsOptions,
} from "@/lib/api/@tanstack/react-query.gen"

const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
const countOptions = [1, 2, 3, 4, 5, 6, 8, 10, 12]
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
  const qc = useQueryClient()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data: students = [] } = useQuery(getAdminStudentsOptions())
  const { data: classes = [] } = useQuery(getAdminClassesOptions())
  const { data: subjects = [] } = useQuery(getSubjectsOptions())

  const [student, setStudent] = useState<UserAdminUserResponse>()
  const [subjectId, setSubjectId] = useState("")
  const [teacher, setTeacher] = useState<TutoringTeacherResponse | undefined>()
  const [sessionCount, setSessionCount] = useState(1)
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; start: string; end: string } | null>(null)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [date, setDate] = useState("")
  const [note, setNote] = useState("")
  const [mode, setMode] = useState<"private" | "group">("private")
  const [members, setMembers] = useState<UserAdminUserResponse[]>([])
  const [memberPick, setMemberPick] = useState<UserAdminUserResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // guru difilter by mapel
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    ...getTutoringTeachersOptions({
      query: subjectId ? { subject_id: Number(subjectId) } : undefined,
    }),
    enabled: !!subjectId,
  })

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    ...getAdminTutoringAvailabilityOptions({
      query: { teacher_id: teacher?.id ?? 0 },
    }),
    enabled: !!teacher?.id,
  })

  const { mutateAsync: createBooking } = useMutation(postAdminTutoringBookingsMutation())

  // kelas les dari properti kelas murid (users.class_id)
  const classId = student?.class_id ? String(student.class_id) : ""
  const myClass = classes.find((c) => c.id === Number(classId))
  const pricePerSession = myClass?.price_per_session ?? 0

  const timesValid = startTime !== "" && endTime !== "" && startTime < endTime
  const perWeek = timesValid ? perWeekFor(startTime, endTime) : null
  const totalSessions = perWeek ? sessionCount * perWeek : 0
  const canSubmit =
    !!student && classId && subjectId && teacher && selectedSlot && timesValid && perWeek !== null && date && !submitting &&
    (mode === "private" || members.length > 0)

  const memberEmails = mode === "group"
    ? Array.from(new Set(
        members
          .map((m) => m.email?.trim())
          .filter((e): e is string => !!e && e !== student?.email?.trim())
      ))
    : undefined

  const save = async () => {
    if (!student || !teacher || !selectedSlot || !timesValid || !date || !classId || !subjectId) return
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
      qc.invalidateQueries({ queryKey: getAdminStudentClassesQueryKey() })
      navigate({ to: "/admin/tutoring" })
    } catch (err: any) {
      toast.error(err?.error || err?.message || "Gagal membuat booking")
    } finally {
      setSubmitting(false)
    }
  }

  const subjectOptions = subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }))

  return (
    <main className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tambah Booking Manual</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daftarkan les privat untuk murid secara manual. Langsung confirmed + buat sesi & invoice.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: "/admin/tutoring" })}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
        </Button>
      </div>

      <Card className="gap-0 pt-0 pb-0">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Label>Murid</Label>
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
              <ComboboxInput placeholder={students.length ? "Pilih murid..." : "Tidak ada murid"} />
              <ComboboxContent>
                <ComboboxEmpty>Tidak ada murid ditemukan</ComboboxEmpty>
                <ComboboxList>
                  {(u: UserAdminUserResponse) => (
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
              <Label>Kelas</Label>
              {!student ? (
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">Pilih murid dulu</p>
              ) : classId ? (
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span className="font-medium">{myClass?.name ?? "-"}</span>
                  <span className="text-muted-foreground"> — kelas murid dari properti akun</span>
                </p>
              ) : (
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  Murid belum punya kelas. Set kelas dulu di halaman Kelola User.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Mode</Label>
              <button
                type="button"
                onClick={() => { setMode(mode === "private" ? "group" : "private"); setMembers([]) }}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50"
              >
                {mode === "private" ? "Ganti Kelompok" : "Ganti Private"}
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {mode === "group" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"><Users className="h-3 w-3" /> Kelompok</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700"><UserRound className="h-3 w-3" /> Private</span>
              )}
              <span>{mode === "group" ? "Maksimal 5 siswa termasuk murid utama." : "Les sendiri berdua dengan guru."}</span>
            </div>
          </div>

          {mode === "group" && (
            <div className="space-y-2">
              <Label>Member</Label>
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
                <ComboboxInput placeholder="Pilih murid (max 4)..." />
                <ComboboxContent>
                  <ComboboxEmpty>Tidak ada murid ditemukan</ComboboxEmpty>
                  <ComboboxList>
                    {(u: UserAdminUserResponse) => (
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
                      <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setMembers(members.filter((x) => x.id !== m.id))}>✕</button>
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
                setSelectedSlot(null)
                setStartTime("")
                setEndTime("")
                setDate("")
              }}
            >
              <SelectTrigger id="admin-booking-subject" className="w-full" size="sm">
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
            <Label>Guru</Label>
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
                  setSelectedSlot(null)
                  setStartTime("")
                  setEndTime("")
                  setDate("")
                }}
                itemToStringLabel={(t) => (t ? t.name ?? "" : "")}
              >
                <ComboboxInput placeholder="Pilih guru..." />
                <ComboboxContent>
                  <ComboboxEmpty>Tidak ada guru ditemukan</ComboboxEmpty>
                  <ComboboxList>
                    {(t: TutoringTeacherResponse) => (
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
            <div className="space-y-2">
              <Label>Slot Hari</Label>
              {slotsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : slots.length === 0 ? (
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  Guru ini belum punya slot jadwal.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {slots.map((s) => {
                    const active = selectedSlot?.day === s.day_of_week && selectedSlot?.start === s.start_time
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedSlot({ day: s.day_of_week!, start: s.start_time!, end: s.end_time! })
                          setStartTime("")
                          setEndTime("")
                          setDate("")
                        }}
                        className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${active ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "hover:bg-muted/50"}`}
                      >
                        <span>
                          <span className="font-medium">{dayNames[s.day_of_week!]}</span>
                          <span className="ml-2 text-muted-foreground">{s.start_time} - {s.end_time}</span>
                        </span>
                        {active && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {selectedSlot && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-booking-start">Jam Mulai</Label>
                  <Input
                    id="admin-booking-start"
                    type="time"
                    value={startTime}
                    min={selectedSlot.start}
                    max={selectedSlot.end}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Slot {selectedSlot.start} – {selectedSlot.end}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-booking-end">Jam Selesai</Label>
                  <Input
                    id="admin-booking-end"
                    type="time"
                    value={endTime}
                    min={selectedSlot.start}
                    max={selectedSlot.end}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              {startTime !== "" && endTime !== "" && !(startTime < endTime) && (
                <p className="text-xs text-destructive">Jam selesai harus setelah jam mulai.</p>
              )}
              {timesValid && (startTime < selectedSlot.start || endTime > selectedSlot.end) && (
                <p className="text-xs text-destructive">Jam harus dalam slot {selectedSlot.start} – {selectedSlot.end}.</p>
              )}
              {timesValid && perWeek === null && (
                <p className="text-xs text-destructive">Durasi les harus kelipatan {SESSION_MINUTES} menit (1,5 jam).</p>
              )}

              <div className="space-y-2">
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
                        return d.getDay() !== selectedSlot.day
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
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Materi yang ingin dibahas..." />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <div className="text-sm">
                  <p className="font-medium">Total ({sessionCount}× pertemuan{sessionCount > 0 && perWeek ? ` · ${totalSessions} sesi` : ""})</p>
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
