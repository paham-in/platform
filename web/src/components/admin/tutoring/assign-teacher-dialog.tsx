import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { Spinner } from "@/components/ui/spinner"
import {
  getAdminTutoringBookingsQueryKey,
  patchAdminTutoringBookingsByIdAssignMutation,
  getTutoringTeachersOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListBookingsResponse, TutoringListTeachersResponse } from "@/lib/api/types.gen"

const assignTeacherSchema = z.object({
  teacher_id: z.string().min(1, "Pilih guru dulu"),
})

export function AssignTeacherDialog({ booking, onClose }: { booking: TutoringListBookingsResponse; onClose: () => void }) {
  const qc = useQueryClient()
  const form = useForm<{ teacher_id: string }>({
    resolver: zodResolver(assignTeacherSchema),
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

  const { mutate: assign, isPending } = useMutation({
    ...patchAdminTutoringBookingsByIdAssignMutation(),
    onSuccess: () => {
      toast.success("Guru ditetapkan, booking otomatis disetujui")
      qc.invalidateQueries({ queryKey: getAdminTutoringBookingsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal menetapkan guru"),
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader><DialogTitle>Assign Guru</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <p><span className="font-medium">{booking.student_name}</span>, {booking.subject_name || "Mapel?"} · {booking.date} {booking.start_time}–{booking.end_time}</p>
            <p className="text-xs text-muted-foreground">{booking.note || "-"}</p>
          </div>
          <Controller
            name="teacher_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Pilih Guru</FieldLabel>
                <FieldDescription>
                  Hanya guru yang free di {booking.date} {booking.start_time}–{booking.end_time} yang ditampilkan.
                </FieldDescription>
                <FieldDescription>Guru yang dipilih otomatis disetujui, tanpa perlu approve lagi.</FieldDescription>
                <Combobox
                  autoHighlight
                  items={teachers}
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
            <Button onClick={form.handleSubmit((v) => assign({ path: { id: booking.id! }, body: { teacher_id: Number(v.teacher_id) } }))} disabled={isPending}>
              {isPending && <Spinner />} Assign
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
