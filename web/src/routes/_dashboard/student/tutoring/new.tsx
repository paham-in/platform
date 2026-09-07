import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  postTutoringBookingsMutation,
  getTutoringBookingsQueryKey,
  getStudentClassEnrollmentsOptions,
  getClassesOptions,
  getSubjectsOptions,
  getUsersSearchOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import type { UserAdminListUsersResponse } from "@/lib/api/types.gen"
import { CalendarIcon, CheckCircle2, Search, Users, X } from "lucide-react"
import { addWeeks, format } from "date-fns"
import { id } from "date-fns/locale"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { usePageTitle } from "@/components/page-title"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"
import { z } from "zod"

const newBookingSearchSchema = z.object({
  modal: z.string().optional(),
})

const SESSION_MINUTES = 90

const fmtRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

// 07:00 s/d 20:30, tiap 30 menit, biar durasi 90 menit (1 sesi les) bisa dipilih.
const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const total = 7 * 60 + i * 30
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
})

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

const bookingFormSchema = z.object({
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

type BookingFormValues = z.input<typeof bookingFormSchema>

function NewBooking() {
  usePageTitle("Booking Baru")
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: myClasses = [] } = useQuery(getStudentClassEnrollmentsOptions())
  const { data: classes = [] } = useQuery(getClassesOptions())

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
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
  const classId = form.watch("class_id")
  const subjectId = form.watch("subject_id")
  const start = form.watch("start_time")
  const end = form.watch("end_time")
  const mode = form.watch("mode")
  const sessionCount = form.watch("session_count")
  const date = form.watch("date")
  const [dateOpen, setDateOpen] = useState(false)
  const [members, setMembers] = useState<UserAdminListUsersResponse[]>([])
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()
  const [friendQuery, setFriendQuery] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [friendPending, setFriendPending] = useState<UserAdminListUsersResponse[]>([])

  const { data: subjects = [] } = useQuery({
    ...getSubjectsOptions({ query: classId ? { class_id: Number(classId) } : undefined }),
    enabled: !!classId,
  })

  const bookableClasses = classes.filter((c) => c.allow_tutoring !== false)
  const selectedClass = bookableClasses.find((c) => c.id === Number(classId))
  const pricePerSession = mode === "group" ? (selectedClass?.group_price ?? 0) : (selectedClass?.price_per_session ?? 0)

  // debounce pencarian teman
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(friendQuery.trim()), 300)
    return () => clearTimeout(t)
  }, [friendQuery])

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
  const perWeek = hasSlot ? perWeekFor(start, end) : null
  // angka valid turunan (field boleh kosong sementara saat diketik)
  const sessions = Math.min(12, Math.max(1, Number(sessionCount) || 1))
  const totalSessions = perWeek ? sessions * perWeek : 0
  const startDate = date ? new Date(date + "T00:00:00") : null
  const endDate = startDate ? addWeeks(startDate, sessions - 1) : null

  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    ...getUsersSearchOptions({ query: searchTerm ? { q: searchTerm } : undefined }),
    enabled: searchTerm.length > 0,
  })

  // auto-pilih kelas: preferensi kelas yang sudah diakses, else kelas pertama (hanya yang allow tutoring)
  const { setValue } = form
  useEffect(() => {
    if (classId || bookableClasses.length === 0) return
    const preferred = myClasses
      .map((c) => String(c.class_id))
      .find((id) => bookableClasses.some((c) => String(c.id) === id))
    setValue("class_id", preferred ?? String(bookableClasses[0].id ?? ""))
  }, [myClasses, bookableClasses, classId, setValue])

  // kelas berubah → reset subject kalau sudah tidak ada di kelas baru
  useEffect(() => {
    if (subjectId && subjects.length > 0 && !subjects.some((s) => String(s.id) === subjectId)) {
      setValue("subject_id", "")
    }
  }, [subjects, subjectId, setValue])

  const subjectOptions = subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }))

  const { mutate: createBooking, isPending } = useMutation({
    ...postTutoringBookingsMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getTutoringBookingsQueryKey() })
      toast.success("Permintaan dikirim, admin akan carikan guru")
      navigate({ to: "/student/tutoring", replace: true })
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal booking"),
  })

  const onSubmit = (v: BookingFormValues) => {
    if (v.mode === "group" && members.length === 0) {
      toast.error("Tambahkan minimal 1 teman untuk mode kelompok")
      return
    }
    createBooking({
      body: {
        subject_id: Number(v.subject_id),
        date: v.date,
        start_time: v.start_time,
        end_time: v.end_time,
        mode: v.mode,
        session_count: Number(v.session_count),
        note: v.note || undefined,
        class_id: Number(v.class_id),
        member_emails: v.mode === "group" ? members.map((m) => m.email).filter((e): e is string => !!e) : undefined,
      },
    })
  }

  const slotsLeft = 4 - members.length
  const friendFull = members.length + friendPending.length >= 4
  const friendIds = new Set(friendPending.map((m) => m.id))

  useEffect(() => {
    if (modal !== "friend") {
      setFriendQuery("")
      setSearchTerm("")
      setFriendPending([])
    }
  }, [modal])

  return (
    <main className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Booking Baru</h1>
        <p className="text-sm text-muted-foreground">Pilih mapel, tanggal & jam, nanti admin yang akan mencarikan guru untukmu.</p>
      </div>
      <div className="flex max-w-lg flex-col gap-4 md:gap-6">
        <div className="space-y-4">
          <Controller
            name="class_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="new-class">Kelas</FieldLabel>
                {bookableClasses.length === 0 ? (
                  <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                    Belum ada kelas tersedia.
                  </p>
                ) : (
                  <Select items={bookableClasses.map((c) => ({ label: c.name, value: String(c.id) }))} value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="new-class" className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {bookableClasses.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                {myClasses.length === 0 && (
                  <FieldDescription>
                    Kamu belum punya akses kelas, akses diberikan otomatis setelah pembayaran booking diverifikasi admin.
                  </FieldDescription>
                )}
              </Field>
            )}
          />

          <Controller
            name="subject_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="new-subject">Mata Pelajaran</FieldLabel>
                <Select items={subjectOptions} value={field.value} onValueChange={(v) => { field.onChange(v); setValue("date", "") }}>
                  <SelectTrigger id="new-subject" className="w-full" aria-invalid={fieldState.invalid}>
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

          <Controller
            name="date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="new-date">Tanggal Mulai</FieldLabel>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        id="new-date"
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
                      onSelect={(d) => { field.onChange(d ? format(d, "yyyy-MM-dd") : ""); if (d) setDateOpen(false) }}
                    />
                  </PopoverContent>
                </Popover>
                <FieldDescription>Pertemuan berikutnya berjalan mingguan di hari & jam yang sama.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="start_time"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="new-start">Jam Mulai</FieldLabel>
                  <Select items={startOptions.map((t) => ({ label: t, value: t }))} value={field.value} onValueChange={(v) => { field.onChange(v); setValue("end_time", "") }}>
                    <SelectTrigger id="new-start" className="w-full" aria-invalid={fieldState.invalid}>
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
                  <FieldLabel htmlFor="new-end">Jam Selesai</FieldLabel>
                  <Select items={endOptions.map((t) => ({ label: t, value: t }))} value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="new-end" className="w-full" aria-invalid={fieldState.invalid}>
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
        </div>

        <div className="space-y-4 border-t pt-6">
          <Controller
            name="mode"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="new-mode">Mode</FieldLabel>
                <Select
                  items={modeOptions}
                  value={field.value}
                  onValueChange={(v) => field.onChange(v === "group" ? "group" : "private")}
                >
                  <SelectTrigger id="new-mode" className="w-full">
                    <SelectValue placeholder="Pilih mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {modeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {field.value === "group" ? "Maksimal 5 siswa termasuk kamu." : "Les sendiri berdua dengan guru."}
                </FieldDescription>
              </Field>
            )}
          />

          {mode === "group" && (
            <div className="space-y-1.5">
              <Label>Teman Sekelompok</Label>
              <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={() => openModal("friend")}>
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{members.length === 0 ? "Tambah Teman" : "Kelola Teman"}</span>
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">{members.length + 1}/5</span>
              </Button>
              <p className="text-xs text-muted-foreground">
                Pilih teman yang sudah punya akun Pahamin, maksimal 4 teman (total 5 siswa termasuk kamu).
              </p>
              {members.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {members.map((m) => (
                    <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
                      {m.name}
                      <button type="button" aria-label={`Hapus ${m.name}`} className="text-muted-foreground hover:text-foreground" onClick={() => setMembers(members.filter((x) => x.id !== m.id))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <Controller
            name="session_count"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="new-session-count">Jumlah Pertemuan</FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    id="new-session-count"
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
            {startDate && (
              <p className="text-xs text-muted-foreground">
                Sesi dijalankan setiap minggu mulai dari {format(startDate, "EEE, dd MMM yyyy", { locale: id })} sampai {format(endDate!, "EEE, dd MMM yyyy", { locale: id })} (estimasi).
              </p>
            )}
          </div>

        <div className="space-y-4 border-t pt-6">
          <Controller
            name="note"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="new-note">Catatan (opsional)</FieldLabel>
                <Input id="new-note" {...field} placeholder="Materi yang ingin dibahas..." autoComplete="off"/>
              </Field>
            )}
          />

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg bg-muted/50 px-4 py-3">
            <div className="text-sm">
              <p className="font-medium">Total ({sessions}× pertemuan{perWeek ? ` · ${totalSessions} sesi` : ""})</p>
              <p className="text-xs text-muted-foreground">
                {fmtRp(pricePerSession)} / sesi ({SESSION_MINUTES} menit)
                {selectedClass && (mode === "group" ? !selectedClass.group_price : !selectedClass.price_per_session) && (
                  <span className="ml-1 text-amber-600">(kelas tanpa harga)</span>
                )}
              </p>
            </div>
            <p className="text-lg font-bold tabular-nums">{fmtRp(pricePerSession * totalSessions)}</p>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => navigate({ to: "/student/tutoring", replace: true })}>Batal</Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
              {isPending && <Spinner />}
              Kirim Booking
            </Button>
          </div>
        </div>
      </div>

      {modal === "friend" && (
        <Dialog open onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Teman</DialogTitle>
            <DialogDescription>
              {slotsLeft > 0
                ? `Cari dan pilih maksimal ${slotsLeft} teman lagi, total 5 siswa termasuk kamu.`
                : "Kuota grup sudah penuh (5 siswa)."}
            </DialogDescription>
          </DialogHeader>

          <InputGroup>
            <InputGroupAddon align="inline-start" aria-hidden="true">
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              value={friendQuery}
              onChange={(e) => setFriendQuery(e.target.value)}
              placeholder="Cari nama atau email teman"
              autoFocus
            autoComplete="off"/>
          </InputGroup>

          <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {friendQuery.trim() === "" ? (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                Ketik nama atau email untuk mencari teman.
              </p>
            ) : searchLoading ? (
              <div className="space-y-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                Tidak ada teman dengan nama/email "{searchTerm}".
              </p>
            ) : (
              searchResults.map((u) => {
                const selected = friendIds.has(u.id)
                const disabled = friendFull && !selected
                return (
                  <button
                    key={u.id}
                    type="button"
                    disabled={disabled}
                    aria-pressed={selected}
                    onClick={() =>
                      setFriendPending((prev) =>
                        selected
                          ? prev.filter((x) => x.id !== u.id)
                          : prev.length >= slotsLeft ? prev : [...prev, u]
                      )
                    }
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 ${selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.name} className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        u.name?.[0]
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    {selected && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                  </button>
                )
              })
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <span className="text-xs text-muted-foreground">Maksimal 4 teman per grup.</span>
            <div className="flex gap-2">
              <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
              <Button
                disabled={friendPending.length === 0}
                onClick={() => {
                  setMembers((prev) => [...prev, ...friendPending].slice(0, 4))
                  closeModal()
                }}
              >
                Tambah {friendPending.length > 0 ? `${friendPending.length} Teman` : "Teman"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
        </Dialog>
      )}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/tutoring/new")({
  component: NewBooking,
  validateSearch: newBookingSearchSchema,
})
