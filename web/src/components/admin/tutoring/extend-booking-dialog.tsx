import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  getClassesOptions,
  getAdminTutoringBookingsByIdSessionsQueryKey,
  getAdminTutoringBookingsQueryKey,
  getAdminTutoringReportQueryKey,
  getTutoringBookingsQueryKey,
  getTutoringEarningsQueryKey,
  getTutoringSessionsQueryKey,
  postTutoringBookingsByIdExtendMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListBookingsResponse } from "@/lib/api/types.gen"

const SESSION_MINUTES = 90

function toMinutes(t?: string): number | null {
  if (!t) return null
  const [h, m] = t.split(":").map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

// sesi-per-minggu dari durasi blok; null kalau bukan kelipatan 90.
function perWeekFor(start?: string, end?: string): number | null {
  const s = toMinutes(start)
  const e = toMinutes(end)
  if (s == null || e == null) return null
  const dur = e - s
  if (dur <= 0 || dur % SESSION_MINUTES !== 0) return null
  return dur / SESSION_MINUTES
}

const extendSchema = (perWeek: number) =>
  z.object({
    additional_sessions: z.coerce
      .number()
      .min(1, "Minimal 1 sesi")
      .refine((v) => v % perWeek === 0, `Harus kelipatan ${perWeek} sesi/minggu`),
  })

export function ExtendBookingDialog({ booking, onClose }: { booking: TutoringListBookingsResponse; onClose: () => void }) {
  const qc = useQueryClient()
  const perWeek = perWeekFor(booking.start_time, booking.end_time) ?? 1
  const form = useForm<z.input<ReturnType<typeof extendSchema>>>({
    resolver: zodResolver(extendSchema(perWeek)),
    mode: "onTouched",
    defaultValues: { additional_sessions: perWeek },
  })
  const additional = Number(form.watch("additional_sessions")) || 0
  const { data: classes = [] } = useQuery(getClassesOptions())
  const myClass = classes.find((c) => c.id === booking.class_id)
  const pricePerSession = booking.mode === "group" ? (myClass?.group_price ?? 0) : (myClass?.price_per_session ?? 0)
  const current = booking.session_count ?? 0

  const { mutate: extend, isPending } = useMutation({
    // endpoint guru (/tutoring/...) juga melayani admin (isAdmin diteruskan),
    // jadi satu dialog untuk dua role.
    ...postTutoringBookingsByIdExtendMutation(),
    onSuccess: (data) => {
      toast.success(`${data.additional_sessions ?? additional} sesi ditambahkan (total ${data.session_count ?? current + additional} sesi)`)
      qc.invalidateQueries({ queryKey: getAdminTutoringBookingsQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminTutoringReportQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminTutoringBookingsByIdSessionsQueryKey({ path: { id: booking.id! } }) })
      qc.invalidateQueries({ queryKey: getTutoringBookingsQueryKey() })
      qc.invalidateQueries({ queryKey: getTutoringSessionsQueryKey() })
      qc.invalidateQueries({ queryKey: getTutoringEarningsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal menambah sesi"),
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader><DialogTitle>Tambah Sesi</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <p><span className="font-medium">{booking.student_name}</span>, {booking.subject_name || "Mapel?"} · {booking.date} {booking.start_time}–{booking.end_time}</p>
            <p className="text-xs text-muted-foreground">Saat ini {current} sesi → menjadi {current + additional} sesi</p>
          </div>
          <Controller
            name="additional_sessions"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="extend-count">Sesi Tambahan</FieldLabel>
                <FieldDescription>
                  Ditempel di minggu-minggu setelah sesi terakhir. Invoice pending ikut ditambah, invoice lunas dibuatkan invoice baru.
                </FieldDescription>
                <Input
                  id="extend-count"
                  type="number"
                  min={1}
                  step={perWeek}
                  value={typeof field.value === "number" && !Number.isNaN(field.value) ? field.value : ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <p className="text-sm">
            {pricePerSession > 0 ? (
              <>Biaya tambahan: <span className="font-bold">Rp {(pricePerSession * additional).toLocaleString("id-ID")}</span> <span className="text-muted-foreground">({additional} sesi × Rp {pricePerSession.toLocaleString("id-ID")})</span></>
            ) : (
              <span className="text-muted-foreground">Harga per sesi belum diisi di data kelas — tagihan tambahan Rp 0.</span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={form.handleSubmit((v) => extend({ path: { id: booking.id! }, body: { additional_sessions: Number(v.additional_sessions) } }))} disabled={isPending}>
              {isPending && <Spinner />} Tambah Sesi
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
