import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { X } from "lucide-react"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import {
  postAdminProgramsByIdClassesMutation,
  deleteAdminProgramsClassesByClassIdMutation,
  getAdminProgramsQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { ProgramProgramResponse, ClassClassResponse } from "@/lib/api/types.gen"

interface AssignClassesDialogProps {
  program: ProgramProgramResponse
  classes: ClassClassResponse[]
  onClose: () => void
}

export function AssignClassesDialog({ program, classes, onClose }: AssignClassesDialogProps) {
  const qc = useQueryClient()
  const comboboxAnchor = useComboboxAnchor()
  const assignedIds = (program.classes ?? []).map((c) => c.id!)
  const available = classes.filter((c) => !assignedIds.includes(c.id!))
  const [selected, setSelected] = useState<ClassClassResponse[]>([])

  const { mutate: assign, isPending: assigning } = useMutation({
    ...postAdminProgramsByIdClassesMutation(),
    onSuccess: () => {
      toast.success("Kelas ditambahkan ke program")
      qc.invalidateQueries({ queryKey: getAdminProgramsQueryKey() })
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

  const addAll = () => {
    if (!program.id) return
    selected.forEach((c) => {
      if (c.id) assign({ path: { id: program.id! }, body: { class_id: c.id } })
    })
    setSelected([])
  }

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

          <div className="space-y-2">
            <Label>Tambah kelas</Label>
            <Combobox
              multiple
              autoHighlight
              items={available}
              value={selected}
              onValueChange={setSelected}
              itemToStringLabel={(c: ClassClassResponse) => c.name ?? ""}
            >
              <ComboboxChips ref={comboboxAnchor} className="w-full">
                <ComboboxValue>
                  {(values: ClassClassResponse[]) => (
                    <>
                      {values.map((c) => (
                        <ComboboxChip key={c.id}>{c.name}</ComboboxChip>
                      ))}
                      <ComboboxChipsInput
                        placeholder={available.length ? "Pilih kelas..." : "Semua kelas sudah masuk"}
                      />
                    </>
                  )}
                </ComboboxValue>
              </ComboboxChips>
              <ComboboxContent anchor={comboboxAnchor}>
                <ComboboxEmpty>Kelas tidak ditemukan</ComboboxEmpty>
                <ComboboxList>
                  {(c: ClassClassResponse) => (
                    <ComboboxItem key={c.id} value={c}>
                      {c.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Tutup</Button>
            <Button onClick={addAll} disabled={assigning || selected.length === 0}>
              {assigning && <Spinner />}
              Tambah{selected.length > 0 ? ` (${selected.length})` : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
