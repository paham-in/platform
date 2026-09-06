import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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

export function ReassignTeacherDialog({ booking, onClose }: { booking: TutoringListBookingsResponse; onClose: () => void }) {
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
          <div className="space-y-2">
            <p className="text-sm font-medium">Pilih Guru Pengganti</p>
            <p className="text-xs text-muted-foreground">
              Hanya guru yang free di {booking.date} {booking.start_time}–{booking.end_time} yang ditampilkan. Murid dan kedua guru diberi tahu otomatis.
            </p>
            <Combobox
              autoHighlight
              items={teachers.filter((t) => t.id !== booking.teacher_id)}
              value={teacher}
              onValueChange={(v) => setTeacher(v ?? undefined)}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={() => teacher && reassign({ path: { id: booking.id! }, body: { teacher_id: teacher.id! } })} disabled={!teacher || isPending}>
              {isPending && <Spinner />} Alihkan
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
