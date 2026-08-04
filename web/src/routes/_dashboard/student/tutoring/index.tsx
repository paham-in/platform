import { createFileRoute, Link } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useQuery } from "@tanstack/react-query"
import { getTutoringBookingsOptions, getTutoringTeachersOptions, getSubjectsOptions } from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringSubjectInfo, TutoringTeacherResponse } from "@/lib/api/types.gen"
import { Calendar, Loader2, Plus, Search, UserRound } from "lucide-react"
import { useState } from "react"

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

function StudentTutoringIndex() {
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery(getTutoringBookingsOptions())
  const [bookOpen, setBookOpen] = useState(false)

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700", confirmed: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700", cancelled: "bg-gray-100 text-gray-700",
    }
    const labels: Record<string, string> = {
      pending: "Menunggu", confirmed: "Disetujui", rejected: "Ditolak", cancelled: "Dibatalkan",
    }
    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[s] || ""}`}>{labels[s] || s}</span>
  }

  if (bookingsLoading) return <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Booking Saya</h2>
          <Button onClick={() => setBookOpen(true)}><Plus className="mr-1 h-4 w-4" /> Tambah Booking</Button>
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
                {bookings.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="p-8 text-center text-muted-foreground">Belum ada booking</TableCell></TableRow>
                ) : bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="pl-6 font-medium">{b.teacher_name}</TableCell>
                    <TableCell>{b.date}</TableCell>
                    <TableCell>{b.start_time} - {b.end_time}</TableCell>
                    <TableCell className="pr-6">{statusBadge(b.status!)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <TeacherPickerDialog open={bookOpen} onOpenChange={setBookOpen} />
    </div>
  )
}

function TeacherPickerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: teachers = [], isLoading: teachersLoading } = useQuery(getTutoringTeachersOptions())
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [search, setSearch] = useState("")

  const subjectOptions = [
    { label: "Semua Subjek", value: "all" },
    ...subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) })),
  ]

  const filteredTeachers = teachers.filter((t: TutoringTeacherResponse) => {
    const hasSubject = (t.subjects ?? []).length > 0
    const matchSubject = subjectFilter === "all" || (t.subjects ?? []).some((s) => s.id === Number(subjectFilter))
    const matchSearch = !search || (t.name ?? "").toLowerCase().includes(search.toLowerCase())
    return hasSubject && matchSubject && matchSearch
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Pilih Guru</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama guru..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select items={subjectOptions} value={subjectFilter} onValueChange={(v) => setSubjectFilter(v ?? "all")}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter Subjek" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {teachersLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filteredTeachers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <UserRound className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Tidak ada guru ditemukan</p>
            </div>
          ) : (
            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {filteredTeachers.map((t) => (
                <Link key={t.id} to="/student/tutoring/$teacherId" params={{ teacherId: String(t.id) }} onClick={() => onOpenChange(false)}>
                  <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                      {t.avatar_url ? (
                        <img src={t.avatar_url} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        t.name?.[0]
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{t.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{t.email}</p>
                      <SubjectBadge subjects={t.subjects} />
                    </div>
                    <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </Link>
              ))}
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
