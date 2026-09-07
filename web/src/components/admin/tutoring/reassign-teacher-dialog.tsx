import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { Spinner } from "@/components/ui/spinner"
import {
  getAdminTutoringBookingsByIdSessionsQueryKey,
  getAdminTutoringBookingsQueryKey,
  getAdminTutoringEvidenceQueryKey,
  getAdminTutoringReportQueryKey,
  patchAdminTutoringBookingsByIdReassignMutation,
  getTutoringTeachersOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListBookingsResponse, TutoringListTeachersResponse } from "@/lib/api/types.gen"

const reassignTeacherSchema = z.object({
  teacher_id: z.string().min(1, "Pilih guru pengganti dulu"),
})

export function ReassignTeacherDialog({ booking, onClose }: { booking: TutoringListBookingsResponse; onClose: () => void }) {
  const qc = useQueryClient()
  const form = useForm<{ teacher_id: string }>({
    resolver: zodResolver(reassignTeacherSchema),
    mode: "onTouched",
    defaultValues: { teacher_id: "" },
  })
  const { data: teachers = [] } = useQuery({
    ...getTutoringTeachersOptions({
      query: {
        subject_id: booking.subject_id,
        date: booking.date,
        start_time: booking.start_time,
        end_time: booking.end_time,
      },
    }),
    enabled: !!booking.subject_id && !!booking.date && !!booking.start_time && !!booking.end_time,
  })

  const { mutate: reassign, isPending } = useMutation({
    ...patchAdminTutoringBookingsByIdReassignMutation(),
    onSuccess: () => {
      toast.success("Booking dialihkan ke guru baru")
      qc.invalidateQueries({ queryKey: getAdminTutoringBookingsQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminTutoringEvidenceQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminTutoringReportQueryKey() })
      if (booking.id) {
        qc.invalidateQueries({ queryKey: getAdminTutoringBookingsByIdSessionsQueryKey({ path: { id: booking.id } }) })
      }
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal mengalihkan booking"),
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Alihkan Guru</DialogTitle>
          <DialogDescription>
            Sisa sesi terjadwal {booking.student_name} · {booking.subject_name} pindah ke guru baru. Sesi yang sudah selesai/tunggu validasi tetap milik {booking.teacher_name || "guru lama"}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Controller
            name="teacher_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Pilih Guru Pengganti</FieldLabel>
                <FieldDescription>
                  Hanya guru yang free di {booking.date} {booking.start_time}–{booking.end_time} yang ditampilkan. Murid dan kedua guru diberi tahu otomatis.
                </FieldDescription>
                <Combobox
                  autoHighlight
                  items={teachers.filter((t) => t.id !== booking.teacher_id)}
                  value={teachers.find((t) => String(t.id) === field.value)}
                  onValueChange={(v) => field.onChange(v?.id ? String(v.id) : "")}
                  itemToStringLabel={(t) => (t?.email ? `${t.name} (${t.email})` : t?.name ?? "")}
                >
                  <ComboboxInput placeholder={teachers.length ? "Cari guru..." : "Tidak ada guru"} />
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
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={form.handleSubmit((v) => reassign({ path: { id: booking.id! }, body: { teacher_id: Number(v.teacher_id) } }))} disabled={isPending}>
              {isPending && <Spinner />} Alihkan
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
