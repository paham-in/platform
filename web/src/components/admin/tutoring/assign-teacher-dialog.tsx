import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { Spinner } from "@/components/ui/spinner"
import {
  getAdminTutoringBookingsQueryKey,
  patchAdminTutoringBookingsByIdAssignMutation,
  getTutoringTeachersOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListBookingsResponse, TutoringListTeachersResponse } from "@/lib/api/types.gen"

export function AssignTeacherDialog({ booking, onClose }: { booking: TutoringListBookingsResponse; onClose: () => void }) {
  const qc = useQueryClient()
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
  const [teacher, setTeacher] = useState<TutoringListTeachersResponse | undefined>()

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
          <div className="space-y-2">
            <p className="text-sm font-medium">Pilih Guru</p>
            <p className="text-xs text-muted-foreground">
              Hanya guru yang free di {booking.date} {booking.start_time}–{booking.end_time} yang ditampilkan.
            </p>
            <p className="text-xs text-muted-foreground">Guru yang dipilih otomatis disetujui, tanpa perlu approve lagi.</p>
            <Combobox
              autoHighlight
              items={teachers}
              value={teacher}
              onValueChange={(v) => setTeacher(v ?? undefined)}
              itemToStringLabel={(t) => (t ? t.name ?? "" : "")}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={() => teacher && assign({ path: { id: booking.id! }, body: { teacher_id: teacher.id! } })} disabled={!teacher || isPending}>
              {isPending && <Spinner />} Assign
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
