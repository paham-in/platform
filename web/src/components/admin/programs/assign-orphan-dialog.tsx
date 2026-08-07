import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { postAdminProgramsByIdClassesMutation, getAdminProgramsQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import type { ProgramProgramResponse, ClassClassResponse } from "@/lib/api/types.gen"

interface AssignOrphanDialogProps {
  classItem: ClassClassResponse
  programs: ProgramProgramResponse[]
  onClose: () => void
}

export function AssignOrphanDialog({ classItem, programs, onClose }: AssignOrphanDialogProps) {
  const qc = useQueryClient()
  const programOptions = programs.map((p) => ({ label: p.name ?? "", value: String(p.id) }))
  const [programId, setProgramId] = useState<number | undefined>()
  const { mutate: assign, isPending } = useMutation({
    ...postAdminProgramsByIdClassesMutation(),
    onSuccess: () => {
      toast.success(`${classItem.name} dimasukkan ke program`)
      qc.invalidateQueries({ queryKey: getAdminProgramsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal memasukkan kelas"),
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Masukkan {classItem.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="orphan-program">Program tujuan</Label>
            <Select items={programOptions} value={programId} onValueChange={(v) => setProgramId(Number(v))}>
              <SelectTrigger id="orphan-program" className="w-full" size="sm">
                <SelectValue placeholder="Pilih program..." />
              </SelectTrigger>
              <SelectContent>
                {programOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button
              onClick={() => programId && assign({ path: { id: programId }, body: { class_id: classItem.id! } })}
              disabled={isPending || !programId}
            >
              {isPending && <Spinner />}
              Masukkan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
