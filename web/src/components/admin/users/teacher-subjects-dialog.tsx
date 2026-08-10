import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  getSubjectsOptions,
  patchAdminUsersByIdSubjectsMutation,
  getAdminUsersQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { UserAdminUserResponse } from "@/lib/api/types.gen"

interface TeacherSubjectsDialogProps {
  user: UserAdminUserResponse
  onClose: () => void
}

export function TeacherSubjectsDialog({ user, onClose }: TeacherSubjectsDialogProps) {
  const qc = useQueryClient()
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>(
    (user.subjects ?? []).map((s) => s.id!).filter((id) => id !== undefined)
  )

  const { mutate: saveSubjects, isPending } = useMutation({
    ...patchAdminUsersByIdSubjectsMutation(),
    onSuccess: () => {
      toast.success("Mata pelajaran berhasil diubah")
      qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal mengubah mata pelajaran"),
  })

  const toggleSubject = (subjectId: number) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Atur Mata Pelajaran</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {user.name} — {user.email}
          </p>
        </div>
        <div className="max-h-[300px] space-y-1 overflow-y-auto rounded-md border p-3">
          {subjects.map((s) => (
            <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
              <Checkbox
                checked={selectedSubjectIds.includes(s.id!)}
                onCheckedChange={() => toggleSubject(s.id!)}
              />
              {s.name}
            </label>
          ))}
          {subjects.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada mata pelajaran.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={() => saveSubjects({ path: { id: user.id! }, body: { subject_ids: selectedSubjectIds } })} disabled={isPending}>
            {isPending && <Spinner />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
