import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, CheckCircle2 } from "lucide-react"
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
  getAdminStudentsOptions,
  getTutoringTeachersOptions,
  getAdminTutoringAvailabilityOptions,
  getAdminClassesOptions,
  getAdminStudentClassesOptions,
  getSubjectsOptions,
} from "@/lib/api/@tanstack/react-query.gen"

interface CreateBookingDialogProps {
  onClose: () => void
}

export function CreateBookingDialog({ onClose }: CreateBookingDialogProps) {
  const qc = useQueryClient()
  const { data: students = [] } = useQuery(getAdminStudentsOptions())
  const { data: teachers = [] } = useQuery(getTutoringTeachersOptions())
  const { data: classes = [] } = useQuery(getAdminClassesOptions())
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const [student, setStudent] = useState<UserAdminUserResponse>()
  const [teacher, setTeacher] = useState<TutoringTeacherResponse | undefined>()
  const [subjectId, setSubjectId] = useState("")
  const [sessionCount, setSessionCount] = useState(1)
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; start: string; end: string } | null>(null)
  const [date, setDate] = useState("")
  const [note, setNote] = useState("")
  const [classId, setClassId] = useState("")

  const { data: studentClasses = [] } = useQuery({
    ...getAdminStudentClassesOptions({ query: { user_id: student?.id ?? 0 } }),
    enabled: !!student?.id,
  })

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    ...getAdminTutoringAvailabilityOptions({
      query: { teacher_id: teacher?.id ?? 0 },
    }),
    enabled: !!teacher?.id,
  })

  const { mutate: createBooking, isPending } = useMutation({
    ...postAdminTutoringBookingsMutation(),
    onSuccess: () => {
      toast.success("Booking berhasil dibuat")
      qc.invalidateQueries({ queryKey: getAdminTutoringBookingsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal membuat booking"),
  })

  const myClass = classes.find((c) => c.id === Number(classId))
  const pricePerSession = myClass?.price_per_session ?? 0

  // auto-pilih kelas kalau murid cuma punya 1 langganan
  useEffect(() => {
    if (student && !classId && studentClasses.length === 1) setClassId(String(studentClasses[0].class_id))
    if (!student) setClassId("")
  }, [student, studentClasses, classId])

  const canSubmit = student && teacher && selectedSlot && date && classId && subjectId && !isPending
  const save = () => {
    if (!student || !teacher || !selectedSlot || !date || !classId || !subjectId) return
    createBooking({
      body: {
        student_id: student.id!,
        teacher_id: teacher.id!,
        subject_id: Number(subjectId),
        date,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        mode: "private",
        session_count: sessionCount,
        note,
        class_id: Number(classId),
      },
    })
  }

  const subjectOptions = subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }))

  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  const countOptions = [1, 2, 3, 4, 5, 6, 8, 10, 12]

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Tambah Booking Manual</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Murid</Label>
            <Combobox
              autoHighlight
              items={students}
              value={student}
              onValueChange={(v) => { setStudent(v ?? undefined); setClassId("") }}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-booking-class">Kelas</Label>
            {!student ? (
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">Pilih murid dulu</p>
            ) : studentClasses.length === 0 ? (
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                Murid ini belum punya akses kelas.
              </p>
            ) : (
              <Select items={studentClasses.map((c) => ({ label: c.class?.name ?? "-", value: String(c.class_id) }))} value={classId} onValueChange={(v) => setClassId(v ?? "")}>
                <SelectTrigger id="admin-booking-class" className="w-full" size="sm">
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {studentClasses.map((c) => (
                    <SelectItem key={c.id} value={String(c.class_id)}>
                      {c.class?.name ?? "-"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Guru</Label>
            <Combobox
              autoHighlight
              items={teachers}
              value={teacher}
              onValueChange={(v) => {
                setTeacher(v ?? undefined)
                setSelectedSlot(null)
                setDate("")
              }}
              itemToStringLabel={(t) => (t ? t.name ?? "" : "")}
            >
              <ComboboxInput placeholder={teachers.length ? "Pilih guru..." : "Tidak ada guru"} />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-booking-subject">Mapel</Label>
            <Select items={subjectOptions} value={subjectId} onValueChange={(v) => setSubjectId(v ?? "")}>
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

          {teacher && (
            <div className="space-y-2">
              <Label>Slot Jadwal Guru</Label>
              {slotsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : slots.length === 0 ? (
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  Guru ini belum punya slot jadwal.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {slots.map((s) => {
                    const active = selectedSlot?.day === s.day_of_week && selectedSlot?.start === s.start_time
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setSelectedSlot({ day: s.day_of_week!, start: s.start_time!, end: s.end_time! }); setDate("") }}
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
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={save} disabled={!canSubmit}>
              {isPending && <Spinner />}
              Buat Booking
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
