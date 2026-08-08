import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useQuery } from "@tanstack/react-query"
import { getTutoringBookingsOptions, getTutoringSessionsOptions, getTutoringTeachersOptions, getSubjectsOptions } from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringSubjectInfo, TutoringTeacherResponse } from "@/lib/api/types.gen"
import { Calendar, Loader2, Plus, Share2, UserRound, Users } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

function SubjectBadge({ subjects }: { subjects?: TutoringSubjectInfo[] }) {
  if (!subjects || subjects.length === 0) return null
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {subjects.map((s) => (
        <span key={s.id} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {s.name}
        </span>
      ))}
    </div>
  )
}

function statusBadge(s: string) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700", confirmed: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700", cancelled: "bg-gray-100 text-gray-700",
  }
  const labels: Record<string, string> = {
    pending: "Menunggu", confirmed: "Disetujui", rejected: "Ditolak", cancelled: "Dibatalkan",
  }
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[s] || ""}`}>{labels[s] || s}</span>
}

function modeBadge(mode?: string) {
  if (mode === "semi_private") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"><Users className="h-3 w-3" /> Semi Private</span>
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700"><UserRound className="h-3 w-3" /> Private</span>
}

function copyJoinLink(token: string) {
  const url = `${window.location.origin}/student/tutoring/join?token=${token}`
  navigator.clipboard.writeText(url).then(() => toast.success("Link undangan disalin")).catch(() => toast.error("Gagal menyalin link"))
}

function StudentTutoringIndex() {
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery(getTutoringBookingsOptions())
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery(getTutoringSessionsOptions())
  const [pickerOpen, setPickerOpen] = useState(false)

  if (bookingsLoading) return <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Booking Saya</h2>
          <Button onClick={() => setPickerOpen(true)}><Plus className="mr-1 h-4 w-4" /> Tambah Booking</Button>
        </div>
        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Guru</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Pertemuan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jam</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6">Undangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="p-8 text-center text-muted-foreground">Belum ada booking</TableCell></TableRow>
                ) : bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="pl-6 font-medium">{b.teacher_name}</TableCell>
                    <TableCell>{modeBadge(b.mode)}</TableCell>
                    <TableCell>{b.session_count ?? 1}×</TableCell>
                    <TableCell>{b.date}</TableCell>
                    <TableCell>{b.start_time} - {b.end_time}</TableCell>
                    <TableCell>{statusBadge(b.status!)}</TableCell>
                    <TableCell className="pr-6">
                      {b.mode === "semi_private" && b.status === "pending" && b.group_token && (
                        <Button variant="outline" size="sm" onClick={() => copyJoinLink(b.group_token!)}>
                          <Share2 className="mr-1 h-3.5 w-3.5" /> Ajak Teman
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Pertemuan Mendatang</h2>
          <span className="text-sm text-muted-foreground">Jadwal aktif setelah pembayaran dikonfirmasi admin</span>
        </div>
        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Guru</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jam</TableHead>
                  <TableHead className="pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionsLoading ? (
                  <TableRow><TableCell colSpan={4} className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="p-8 text-center text-muted-foreground">Belum ada jadwal pertemuan</TableCell></TableRow>
                ) : sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="pl-6 font-medium">{s.teacher_name}</TableCell>
                    <TableCell>{s.date}</TableCell>
                    <TableCell>{s.start_time} - {s.end_time}</TableCell>
                    <TableCell className="pr-6">
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Terjadwal</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <TeacherPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  )
}

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

// cari slot guru yang contain (day, start..end) request — utk label di kartu guru.
function matchingSlots(t: TutoringTeacherResponse, day: number, start: string, end: string) {
  return (t.slots ?? []).filter((s) => s.day_of_week === day && (s.start_time ?? "") <= start && (s.end_time ?? "") >= end)
}

function TeacherPickerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate()
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const [subjectId, setSubjectId] = useState("")
  const [day, setDay] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")

  const hasSlot = day !== "" && start !== "" && end !== ""
  const canSearch = subjectId !== "" && hasSlot

  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    ...getTutoringTeachersOptions({
      query: canSearch ? {
        subject_id: Number(subjectId),
        day_of_week: Number(day),
        start_time: start,
        end_time: end,
      } : undefined,
    }),
    enabled: canSearch,
  })

  const subjectOptions = subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }))
  const endOptions = TIME_OPTIONS.filter((t) => start === "" || t > start)
  const dayNum = day === "" ? 0 : Number(day)

  const goTeacher = (t: TutoringTeacherResponse) => {
    onOpenChange(false)
    navigate({
      to: "/student/tutoring/$teacherId",
      params: { teacherId: String(t.id) },
      search: { subject_id: Number(subjectId), day: dayNum, start_time: start, end_time: end },
    })
  }

  const goNoTeacher = () => {
    onOpenChange(false)
    navigate({
      to: "/student/tutoring/no-teacher",
      search: { subject_id: Number(subjectId), day: dayNum, start_time: start, end_time: end },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Booking Les Privat</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pick-subject">Mata Pelajaran</Label>
              <Select items={subjectOptions} value={subjectId} onValueChange={(v) => setSubjectId(v ?? "")}>
                <SelectTrigger id="pick-subject" className="w-full" size="sm">
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
              <Label htmlFor="pick-day">Hari</Label>
              <Select items={DAY_OPTIONS} value={day} onValueChange={(v) => setDay(v ?? "")}>
                <SelectTrigger id="pick-day" className="w-full" size="sm">
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
              <Label htmlFor="pick-start">Jam Mulai</Label>
              <Select items={TIME_OPTIONS.map((t) => ({ label: t, value: t }))} value={start} onValueChange={(v) => { setStart(v ?? ""); setEnd("") }}>
                <SelectTrigger id="pick-start" className="w-full" size="sm">
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
              <Label htmlFor="pick-end">Jam Selesai</Label>
              <Select items={endOptions.map((t) => ({ label: t, value: t }))} value={end} onValueChange={(v) => setEnd(v ?? "")}>
                <SelectTrigger id="pick-end" className="w-full" size="sm">
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
                <Button size="sm" onClick={goNoTeacher}>Kirim Tanpa Guru</Button>
              </div>
              <p className="px-4 text-xs text-muted-foreground">Kirim tanpa guru: admin yang carikan guru buat kamu.</p>
            </div>
          ) : (
            <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
              {teachers.map((t) => {
                const match = matchingSlots(t, dayNum, start, end)
                return (
                  <button key={t.id} type="button" onClick={() => goTeacher(t)} className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                      {t.avatar_url ? (
                        <img src={t.avatar_url} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        t.name?.[0]
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{t.name}</p>
                      <SubjectBadge subjects={t.subjects} />
                      {match.length > 0 && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {DAY_OPTIONS[dayNum].label} {match.map((s) => `${s.start_time}–${s.end_time}`).join(", ")}
                        </p>
                      )}
                    </div>
                    <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const Route = createFileRoute("/_dashboard/student/tutoring/")({
  component: StudentTutoringIndex,
})
