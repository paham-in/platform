import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { CalendarIcon } from "lucide-react"
import {
  getAdminTutoringBookingsQueryKey,
  patchAdminTutoringBookingsByIdScheduleMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListBookingsResponse } from "@/lib/api/types.gen"

// 07:00 s/d 20:30, tiap 30 menit.
const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const total = 7 * 60 + i * 30
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
})

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function minutesToHHMM(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`
}

function parseYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function ScheduleBookingDialog({ booking, onClose }: { booking: TutoringListBookingsResponse; onClose: () => void }) {
  const qc = useQueryClient()
  const dur = toMinutes(booking.end_time!) - toMinutes(booking.start_time!)
  const [date, setDate] = useState(booking.date ?? "")
  const [start, setStart] = useState(booking.start_time ?? "")
  const end = start ? minutesToHHMM(toMinutes(start) + dur) : ""
  const startOptions = TIME_OPTIONS.filter((t) => TIME_OPTIONS.includes(minutesToHHMM(toMinutes(t) + dur)))

  const { mutate: reschedule, isPending } = useMutation({
    ...patchAdminTutoringBookingsByIdScheduleMutation(),
    onSuccess: () => {
      toast.success("Jadwal booking diubah")
      qc.invalidateQueries({ queryKey: getAdminTutoringBookingsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal mengubah jadwal"),
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Ubah Jadwal</DialogTitle>
          <DialogDescription>{booking.student_name} · {booking.subject_name} — durasi tetap {dur} menit.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tanggal</Label>
            <Popover>
              <PopoverTrigger
                render={
                  <Button variant="outline" data-empty={!date} className="w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground" />
                }
              >
                <CalendarIcon />
                {date ? format(parseYMD(date), "EEE, dd MMM yyyy", { locale: localeId }) : <span>Pilih tanggal</span>}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  disabled={(d) => {
                    const today = new Date(); today.setHours(0, 0, 0, 0)
                    return d < today
                  }}
                  selected={date ? parseYMD(date) : undefined}
                  onSelect={(d) => setDate(d ? format(d, "yyyy-MM-dd") : "")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Jam Mulai</Label>
              <Select items={startOptions.map((t) => ({ label: t, value: t }))} value={start} onValueChange={(v) => setStart(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih jam" />
                </SelectTrigger>
                <SelectContent>
                  {startOptions.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Jam Selesai</Label>
              <p className="flex h-9 items-center rounded-md border border-input bg-muted/50 px-3 text-sm tabular-nums">{end || "—"}</p>
              <p className="text-xs text-muted-foreground">Otomatis (durasi tetap).</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            disabled={!date || !start || isPending}
            onClick={() => booking.id && reschedule({ path: { id: booking.id }, body: { date, start_time: start, end_time: end } })}
          >
            {isPending && <Spinner />} Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
