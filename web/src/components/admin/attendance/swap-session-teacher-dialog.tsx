import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { Spinner } from "@/components/ui/spinner"
import {
  getAdminTutoringBookingsByIdSessionsQueryKey,
  getAdminTutoringEvidenceQueryKey,
  getAdminTutoringReportQueryKey,
  getTutoringTeachersOptions,
  patchAdminTutoringSessionsByIdTeacherMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListSessionsResponse, TutoringListTeachersResponse } from "@/lib/api/types.gen"

interface SwapSessionTeacherDialogProps {
  session: TutoringListSessionsResponse
  onClose: () => void
}

export function SwapSessionTeacherDialog({ session, onClose }: SwapSessionTeacherDialogProps) {
  const qc = useQueryClient()
  const { data: teachers = [] } = useQuery(getTutoringTeachersOptions())
  const [teacher, setTeacher] = useState<TutoringListTeachersResponse | undefined>()

  const { mutate: swap, isPending } = useMutation({
    ...patchAdminTutoringSessionsByIdTeacherMutation(),
    onSuccess: () => {
      toast.success("Guru sesi diganti")
      qc.invalidateQueries({ queryKey: getAdminTutoringEvidenceQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminTutoringReportQueryKey() })
      if (session.booking_id) {
        qc.invalidateQueries({ queryKey: getAdminTutoringBookingsByIdSessionsQueryKey({ path: { id: session.booking_id } }) })
      }
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal mengganti guru"),
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Ganti Guru 1 Sesi</DialogTitle>
          <DialogDescription>
            Sesi {session.date} {session.start_time}–{session.end_time} ({session.student_name ?? "—"}) hanya sesi ini yang pindah guru, booking tidak berubah. Guru harus mengajar mapelnya dan free di jam ini (dicek otomatis).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Pilih Guru Pengganti</p>
            <Combobox
              autoHighlight
              items={teachers}
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
            <Button onClick={() => teacher && swap({ path: { id: session.id! }, body: { teacher_id: teacher.id! } })} disabled={!teacher || isPending}>
              {isPending && <Spinner />} Ganti
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
