import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, UserX, X } from "lucide-react"
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
import { z } from "zod"

const adminTutoringNewSearchSchema = z.object({
  student_id: z.coerce.number().optional(),
})

const modeOptions = [
  { label: "Private", value: "private" },
  { label: "Kelompok", value: "group" },
]
const SESSION_MINUTES = 90

const fmtRp = (n?: number) => `Rp ${(n ?? 0).toLocaleString("id-ID")}`

// 07:00 s/d 20:30, tiap 30 menit, biar durasi 90 menit (1 sesi les) bisa dipilih.
const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const total = 7 * 60 + i * 30
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
})

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

// slug preview email akun baru (disamakan dengan backend).
// Kode aslinya dibuat server saat simpan, di sini tampil "xxxxxx".
function slugPreview(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "")
}

// sesi-per-minggu dari durasi blok; null kalau bukan kelipatan 90.
function perWeekFor(start: string, end: string): number | null {
  const dur = toMinutes(end) - toMinutes(start)
  if (dur <= 0 || dur % SESSION_MINUTES !== 0) return null
  return dur / SESSION_MINUTES
}

const adminBookingFormSchema = z.object({
  class_id: z.string().min(1, "Pilih kelas dulu"),
  subject_id: z.string().min(1, "Pilih mata pelajaran dulu"),
  date: z.string().min(1, "Pilih tanggal mulai"),
  start_time: z.string().min(1, "Pilih jam mulai"),
  end_time: z.string().min(1, "Pilih jam selesai"),
  mode: z.enum(["private", "group"]),
  session_count: z.coerce.number().min(1, "Minimal 1 pertemuan").max(12, "Maksimal 12 pertemuan"),
  note: z.string().optional(),
}).superRefine((v, ctx) => {
  if (v.start_time && v.end_time) {
    const dur = toMinutes(v.end_time) - toMinutes(v.start_time)
    if (dur <= 0 || dur % SESSION_MINUTES !== 0) {
      ctx.addIssue({ code: "custom", message: "Durasi harus kelipatan 90 menit", path: ["end_time"] })
    }
  }
})

type AdminBookingFormValues = z.input<typeof adminBookingFormSchema>

function AdminTutoringNew() {
  usePageTitle("Tambah Booking Manual")
  const qc = useQueryClient()
  const navigate = useNavigate({ from: Route.fullPath })
  const { student_id: presetStudentId } = Route.useSearch()
  const { data: students = [] } = useQuery(getAdminStudentsOptions())
  const { data: classes = [] } = useQuery(getAdminClassesOptions())

  const form = useForm<AdminBookingFormValues>({
    resolver: zodResolver(adminBookingFormSchema),
    mode: "onTouched",
    defaultValues: {
      class_id: "",
      subject_id: "",
      date: "",
      start_time: "",
      end_time: "",
      mode: "private",
      session_count: 1,
      note: "",
    },
  })
  const { setValue } = form
  const classId = form.watch("class_id")
  const subjectId = form.watch("subject_id")
  const startTime = form.watch("start_time")
  const endTime = form.watch("end_time")
  const date = form.watch("date")
  const mode = form.watch("mode")
  const sessionCount = form.watch("session_count")

  const [student, setStudent] = useState<UserAdminListUsersResponse>()
  const [teacher, setTeacher] = useState<TutoringListTeachersResponse | undefined>()
  const [dateOpen, setDateOpen] = useState(false)
  const [members, setMembers] = useState<UserAdminListUsersResponse[]>([])
  const [memberPick, setMemberPick] = useState<UserAdminListUsersResponse | null>(null)
  const [newMemberName, setNewMemberName] = useState("")
  const [newMemberNames, setNewMemberNames] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // prefill murid bila dibuka dari halaman booking seorang murid (?student_id=)
  useEffect(() => {
    if (student || !presetStudentId || students.length === 0) return
    const found = students.find((s) => s.id === presetStudentId)
    if (found) setStudent(found)
  }, [student, presetStudentId, students])

  // murid dikunci mengikuti konteks halaman asal; picker hanya tampil
  // bila form dibuka langsung tanpa ?student_id=
  const lockedStudent = presetStudentId ? (students.find((s) => s.id === presetStudentId) ?? student) : undefined

  // guru difilter by mapel + jadwal (bila tanggal & jam sudah diisi)
  const slotComplete = date !== "" && startTime !== "" && endTime !== ""
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    ...getTutoringTeachersOptions({
      query: subjectId
        ? {
            subject_id: Number(subjectId),
            ...(slotComplete ? { date, start_time: startTime, end_time: endTime } : {}),
          }
        : undefined,
    }),
    enabled: !!subjectId,
  })

  // mapel difilter by kelas (seperti form murid)
  const { data: subjects = [] } = useQuery({
    ...getSubjectsOptions({ query: classId ? { class_id: Number(classId) } : undefined }),
    enabled: !!classId,
  })

  const { mutateAsync: createBooking } = useMutation(postAdminTutoringBookingsMutation())

  // ganti murid → reset kelas supaya admin pilih ulang (tidak bawa pilihan murid sebelumnya)
  useEffect(() => {
    setValue("class_id", "")
  }, [student, setValue])

  const bookableClasses = classes.filter((c) => c.allow_tutoring !== false)
  const myClass = bookableClasses.find((c) => c.id === Number(classId))
  const pricePerSession = mode === "group" ? (myClass?.group_price ?? 0) : (myClass?.price_per_session ?? 0)

  const timesValid = startTime !== "" && endTime !== "" && startTime < endTime
  const perWeek = timesValid ? perWeekFor(startTime, endTime) : null
  // angka valid turunan (field boleh kosong sementara saat diketik)
  const sessions = Math.min(12, Math.max(1, Number(sessionCount) || 1))
  const totalSessions = perWeek ? sessions * perWeek : 0
  // jam mulai yang masih punya pilihan jam selesai valid (kelipatan 90 menit)
  const startOptions = TIME_OPTIONS.filter((t) =>
    TIME_OPTIONS.some((e) => {
      const dur = toMinutes(e) - toMinutes(t)
      return dur > 0 && dur % SESSION_MINUTES === 0
    })
  )
  // jam selesai hanya yang durasinya kelipatan 90 menit
  const endOptions = startTime === ""
    ? []
    : TIME_OPTIONS.filter((t) => {
        const dur = toMinutes(t) - toMinutes(startTime)
        return dur > 0 && dur % SESSION_MINUTES === 0
      })
  const save = async (v: AdminBookingFormValues) => {
    if (!student) { toast.error("Pilih murid dulu"); return }
    if (!teacher) { toast.error("Pilih guru dulu"); return }
    const emails = v.mode === "group"
      ? Array.from(new Set(
          members
            .map((m) => m.email?.trim())
            .filter((e): e is string => !!e && e !== student?.email?.trim())
        ))
      : undefined
    if (v.mode === "group" && (emails ?? []).length === 0 && newMemberNames.length === 0) {
      toast.error("Tambahkan minimal 1 member untuk mode kelompok")
      return
    }
    setSubmitting(true)
    try {
      const created = await createBooking({
        body: {
          student_id: student.id!,
          teacher_id: teacher.id!,
          subject_id: Number(v.subject_id),
          date: v.date,
          start_time: v.start_time,
          end_time: v.end_time,
          mode: v.mode,
          session_count: Number(v.session_count),
          note: v.note || undefined,
          class_id: Number(v.class_id),
          member_emails: emails,
          new_members: v.mode === "group" ? newMemberNames : undefined,
        },
      })
      const createdMails = created?.created_members ?? []
      if (createdMails.length > 0) {
        toast.success(`Booking dibuat + ${createdMails.length} akun baru (${createdMails.map((m) => m.email).join(", ")})`)
      } else {
        toast.success("Booking berhasil dibuat")
      }
      qc.invalidateQueries({ queryKey: getAdminTutoringBookingsQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminStudentClassEnrollmentsQueryKey() })
navigate({ to: "/admin/bookings", replace: true })
    } catch (err: any) {
      toast.error(err?.error || err?.message || "Gagal membuat booking")
    } finally {
      setSubmitting(false)
    }
  }

  const subjectOptions = subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }))

  // kelas berubah → reset subject (dan guru) kalau sudah tidak ada di kelas baru
  useEffect(() => {
    if (subjectId && classId && subjects.length > 0 && !subjects.some((s) => String(s.id) === subjectId)) {
      setValue("subject_id", "")
      setTeacher(undefined)
    }
  }, [subjects, subjectId, classId, setValue])

  return (
    <main className="p-4 md:p-6">
      <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Tambah Booking Manual</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daftarkan les privat untuk murid secara manual. Langsung disetujui + buat sesi & invoice.
          </p>
        </div>

      <div className="flex max-w-lg flex-col gap-4 md:gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-booking-student">Murid</Label>
            {lockedStudent ? (
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <span className="font-medium">{lockedStudent.name}</span>
                <span className="text-muted-foreground">, {lockedStudent.email}</span>
              </p>
            ) : (
            <Combobox
              autoHighlight
              items={students}
              value={student}
              onValueChange={(v) => {
                setStudent(v ?? undefined)
                // ganti murid utama → buang member yang sama (id/email) biar tidak dobel
                if (v) setMembers((prev) => prev.filter((m) => m.id !== v.id && m.email !== v.email))
              }}
              itemToStringLabel={(u) => (u ? `${u.name}, ${u.email}` : "")}
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
            )}

            <Controller
              name="class_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="admin-booking-class">Kelas</FieldLabel>
                  {!student ? (
                    <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">Pilih murid dulu</p>
                  ) : bookableClasses.length === 0 ? (
                    <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">Belum ada kelas tersedia.</p>
                  ) : (
                    <>
                      <Select
                        items={bookableClasses.map((c) => ({ label: c.name, value: String(c.id) }))}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="admin-booking-class" className="w-full" aria-invalid={fieldState.invalid}>
                          <SelectValue placeholder="Pilih kelas" />
                        </SelectTrigger>
                        <SelectContent>
                          {bookableClasses.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        Akses kelas murid diberikan setelah invoice booking lunas.
                      </FieldDescription>
                    </>
                  )}
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
          </div>
          <div className="space-y-4 border-t pt-6">
          <Controller
            name="mode"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="admin-booking-mode">Mode</FieldLabel>
                <Select
                  items={modeOptions}
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v === "group" ? "group" : "private")
                    setMembers([])
                    setNewMemberNames([])
                    setNewMemberName("")
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
                <FieldDescription>
                  {field.value === "group" ? "Maksimal 5 siswa termasuk murid utama." : "Les sendiri berdua dengan guru."}
                </FieldDescription>
              </Field>
            )}
          />

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
                    setMembers((prev) => (prev.length + newMemberNames.length + 1 > 4 ? prev : [...prev, v]))
                    setMemberPick(null)
                  }
                }}
                itemToStringLabel={(u) => (u ? `${u.name}, ${u.email}` : "")}
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
              <p className="text-xs text-muted-foreground">Pilih dari murid terdaftar, atau ketik nama di bawah untuk buatkan akun otomatis.</p>
              {(members.length > 0 || newMemberNames.length > 0) && (
                <div className="divide-y rounded-lg border">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{m.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                      </div>
                      <button type="button" aria-label={`Hapus ${m.name}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" onClick={() => setMembers(members.filter((x) => x.id !== m.id))}><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                  {newMemberNames.map((n) => (
                    <div key={n} className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{n}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {slugPreview(n) ? `${slugPreview(n)}.xxxxxx@pahamin.my.id` : "email dibuat otomatis saat disimpan"}
                        </p>
                      </div>
                      <button type="button" aria-label={`Hapus ${n}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" onClick={() => setNewMemberNames(newMemberNames.filter((x) => x !== n))}><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Nama anggota baru..."
                  autoComplete="off" />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  disabled={!newMemberName.trim() || members.length + newMemberNames.length + 1 > 4}
                  onClick={() => {
                    const name = newMemberName.trim()
                    if (!name) return
                    if (newMemberNames.some((x) => x.toLowerCase() === name.toLowerCase())) return
                    setNewMemberNames((prev) => [...prev, name])
                    setNewMemberName("")
                  }}
                >
                  Tambah
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Akun dibuat otomatis (nama.xxxxxx@pahamin.my.id) saat booking disimpan.</p>
              {(members.length > 0 || newMemberNames.length > 0) && (
                <p className="text-xs text-muted-foreground">{members.length + newMemberNames.length + 1}/5</p>
              )}
            </div>
          )}

          </div>
          <div className="space-y-4 border-t pt-6">
          <Controller
            name="subject_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="admin-booking-subject">Mata Pelajaran</FieldLabel>
                <Select
                  items={subjectOptions}
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v)
                    setTeacher(undefined)
                    setValue("start_time", "")
                    setValue("end_time", "")
                    setValue("date", "")
                  }}
                >
                  <SelectTrigger id="admin-booking-subject" className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Pilih mapel" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          </div>
          <div className="space-y-4 border-t pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="start_time"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="admin-booking-start">Jam Mulai</FieldLabel>
                      <Select items={startOptions.map((t) => ({ label: t, value: t }))} value={field.value} onValueChange={(v) => { field.onChange(v); setValue("end_time", ""); setTeacher(undefined) }}>
                        <SelectTrigger id="admin-booking-start" className="w-full" aria-invalid={fieldState.invalid}>
                          <SelectValue placeholder="Pilih jam" />
                        </SelectTrigger>
                        <SelectContent>
                          {startOptions.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>Durasi les kelipatan {SESSION_MINUTES} menit ({SESSION_MINUTES / 60} jam).</FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name="end_time"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="admin-booking-end">Jam Selesai</FieldLabel>
                      <Select items={endOptions.map((t) => ({ label: t, value: t }))} value={field.value} onValueChange={(v) => { field.onChange(v); setTeacher(undefined) }}>
                        <SelectTrigger id="admin-booking-end" className="w-full" aria-invalid={fieldState.invalid}>
                          <SelectValue placeholder="Pilih jam" />
                        </SelectTrigger>
                        <SelectContent>
                          {endOptions.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name="date"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="admin-booking-date">Tanggal Mulai</FieldLabel>
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                      <PopoverTrigger
                        render={
                          <Button
                            id="admin-booking-date"
                            variant="outline"
                            data-empty={!field.value}
                            aria-invalid={fieldState.invalid}
                            className="w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                          />
                        }
                      >
                        <CalendarIcon />
                        {field.value ? format(new Date(field.value + "T00:00:00"), "EEE, dd MMM yyyy", { locale: id }) : <span>Pilih tanggal</span>}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          disabled={(d) => {
                            const today = new Date(); today.setHours(0, 0, 0, 0)
                            return d < today
                          }}
                          selected={field.value ? new Date(field.value + "T00:00:00") : undefined}
                          onSelect={(d) => { field.onChange(d ? format(d, "yyyy-MM-dd") : ""); setTeacher(undefined); if (d) setDateOpen(false) }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FieldDescription>Pertemuan berikutnya berjalan mingguan di hari & jam yang sama.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <div className="space-y-2">
                <Label htmlFor="admin-booking-teacher">Guru</Label>
                {!subjectId ? (
                  <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">Pilih mapel dulu</p>
                ) : teachersLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Spinner />
                  </div>
                ) : teachers.length === 0 ? (
                  <Empty className="border-0 px-0 py-4">
                    <EmptyHeader className="gap-1">
                      <EmptyMedia variant="icon"><UserX /></EmptyMedia>
                      <EmptyTitle className="text-sm">
                        {slotComplete ? "Tidak ada guru yang free di jadwal ini" : "Tidak ada guru untuk mapel ini"}
                      </EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <Combobox
                    autoHighlight
                    items={teachers}
                    value={teacher}
                    onValueChange={(v) => setTeacher(v ?? undefined)}
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

              <Controller
                name="session_count"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="admin-booking-session-count">Jumlah Pertemuan</FieldLabel>
                    <div className="flex items-center gap-2">
                      <Input
                        id="admin-booking-session-count"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={12}
                        value={(field.value as number | string | undefined) ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        aria-invalid={fieldState.invalid}
                        className="w-24 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      autoComplete="off"/>
                      <span className="text-sm text-muted-foreground">kali</span>
                    </div>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="note"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Catatan (opsional)</FieldLabel>
                    <Input {...field} placeholder="Materi yang ingin dibahas..." autoComplete="off"/>
                  </Field>
                )}
              />

              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <div className="text-sm">
                  <p className="font-medium">Total ({sessions}× pertemuan{perWeek ? ` · ${totalSessions} sesi` : ""})</p>
                  <p className="text-xs text-muted-foreground">
                    {mode === "group" ? `${fmtRp(myClass?.group_price)} / sesi` : `${fmtRp(myClass?.price_per_session)} / sesi`} (90 menit)
                    {myClass && (mode === "group" ? !myClass.group_price : !myClass.price_per_session) && (
                      <span className="ml-1 text-amber-600">(kelas tanpa harga)</span>
                    )}
                  </p>
                </div>
                <p className="text-lg font-bold">Rp {(pricePerSession * totalSessions).toLocaleString("id-ID")}</p>
              </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={() => navigate({ to: "/admin/bookings", replace: true })}>Batal</Button>
            <Button onClick={form.handleSubmit(save)} disabled={submitting}>
              {submitting && <Spinner />}
              Buat Booking
            </Button>
          </div>
        </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/bookings/new")({
  component: AdminTutoringNew,
  validateSearch: adminTutoringNewSearchSchema,
})
