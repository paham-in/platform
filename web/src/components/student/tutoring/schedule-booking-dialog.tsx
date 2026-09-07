import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  patchTutoringBookingsByIdScheduleMutation,
  getTutoringBookingsQueryKey,
  getTutoringSessionsQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListBookingsResponse } from "@/lib/api/types.gen"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

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

interface ScheduleBookingDialogProps {
  booking: TutoringListBookingsResponse
  onClose: () => void
}

export function ScheduleBookingDialog({ booking, onClose }: ScheduleBookingDialogProps) {
  const qc = useQueryClient()
  const dur = toMinutes(booking.end_time!) - toMinutes(booking.start_time!)
  const form = useForm<{ date: string; start_time: string }>({
    resolver: zodResolver(z.object({
      date: z.string().min(1, "Pilih tanggal dulu"),
      start_time: z.string().min(1, "Pilih jam mulai dulu"),
    })),
    mode: "onTouched",
    defaultValues: { date: booking.date ?? "", start_time: booking.start_time ?? "" },
  })
  const start = form.watch("start_time")
  const end = start ? minutesToHHMM(toMinutes(start) + dur) : ""
  const startOptions = TIME_OPTIONS.filter((t) => TIME_OPTIONS.includes(minutesToHHMM(toMinutes(t) + dur)))

  const { mutate: reschedule, isPending } = useMutation({
    ...patchTutoringBookingsByIdScheduleMutation(),
    onSuccess: () => {
      toast.success("Jadwal booking diubah")
      qc.invalidateQueries({ queryKey: getTutoringBookingsQueryKey() })
      qc.invalidateQueries({ queryKey: getTutoringSessionsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal mengubah jadwal"),
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Ubah Jadwal</DialogTitle>
          <DialogDescription>{booking.subject_name} — durasi tetap {dur} menit, status tetap menunggu guru.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Controller
            name="date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Tanggal</FieldLabel>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button variant="outline" data-empty={!field.value} aria-invalid={fieldState.invalid} className="w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground" />
                    }
                  >
                    <CalendarIcon />
                    {field.value ? format(parseYMD(field.value), "EEE, dd MMM yyyy", { locale: id }) : <span>Pilih tanggal</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      disabled={(d) => {
                        const today = new Date(); today.setHours(0, 0, 0, 0)
                        return d < today
                      }}
                      selected={field.value ? parseYMD(field.value) : undefined}
                      onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}
                    />
                  </PopoverContent>
                </Popover>
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
                  <FieldLabel>Jam Mulai</FieldLabel>
                  <Select items={startOptions.map((t) => ({ label: t, value: t }))} value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Pilih jam" />
                    </SelectTrigger>
                    <SelectContent>
                      {startOptions.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <div className="space-y-1.5">
              <FieldLabel>Jam Selesai</FieldLabel>
              <p className="flex h-9 items-center rounded-md border border-input bg-muted/50 px-3 text-sm tabular-nums">{end || "—"}</p>
              <FieldDescription>Otomatis (durasi tetap).</FieldDescription>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            disabled={isPending}
            onClick={form.handleSubmit((v) => booking.id && reschedule({ path: { id: booking.id }, body: { date: v.date, start_time: v.start_time, end_time: minutesToHHMM(toMinutes(v.start_time) + dur) } }))}
          >
            {isPending && <Spinner />} Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
