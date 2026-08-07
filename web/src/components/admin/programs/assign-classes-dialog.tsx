import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { X } from "lucide-react"
import {
  postAdminProgramsByIdClassesMutation,
  deleteAdminProgramsClassesByClassIdMutation,
  getAdminProgramsQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { ProgramProgramResponse } from "@/lib/api/types.gen"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import type { ClassClassResponse } from "@/lib/api/types.gen"

interface AssignClassesDialogProps {
  program: ProgramProgramResponse
  classes: ClassClassResponse[]
  onClose: () => void
}

export function AssignClassesDialog({ program, classes, onClose }: AssignClassesDialogProps) {
  const qc = useQueryClient()
  const assignedIds = (program.classes ?? []).map((c) => c.id!)
  const available = classes.filter((c) => !assignedIds.includes(c.id!))
  const [selected, setSelected] = useState<number | undefined>()

  const { mutate: assign, isPending: assigning } = useMutation({
    ...postAdminProgramsByIdClassesMutation(),
    onSuccess: () => {
      toast.success("Kelas ditambahkan ke program")
      qc.invalidateQueries({ queryKey: getAdminProgramsQueryKey() })
      setSelected(undefined)
    },
    onError: (err: any) => toast.error(err.error || "Gagal menambahkan kelas"),
  })

  const { mutate: unassign, isPending: removing } = useMutation({
    ...deleteAdminProgramsClassesByClassIdMutation(),
    onSuccess: () => {
      toast.success("Kelas dilepas dari program")
      qc.invalidateQueries({ queryKey: getAdminProgramsQueryKey() })
    },
    onError: (err: any) => toast.error(err.error || "Gagal melepas kelas"),
  })

  const isPending = assigning || removing

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Kelas — {program.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Kelas dalam program</Label>
            {(program.classes ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada kelas. Tambahkan kelas di bawah.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(program.classes ?? []).map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium"
                  >
                    {c.name}
                    <button
                      type="button"
                      aria-label={`Lepas kelas ${c.name}`}
                      onClick={() => c.id && unassign({ path: { class_id: c.id } })}
                      disabled={isPending}
                      className="rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="class-select">Tambah kelas</Label>
              <Select value={selected} onValueChange={(v) => setSelected(Number(v))}>
                <SelectTrigger id="class-select" className="w-full" size="sm">
                  <SelectValue placeholder={available.length ? "Pilih kelas..." : "Semua kelas sudah masuk"} />
                </SelectTrigger>
                <SelectContent>
                  {available.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Semua kelas sudah ada di program</div>
                  ) : (
                    available.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => selected && program.id && assign({ path: { id: program.id }, body: { class_id: selected } })}
              disabled={!selected || assigning}
            >
              {assigning ? <Spinner /> : "Tambah"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
