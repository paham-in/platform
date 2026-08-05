import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
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
  postAdminSubjectsMutation,
  patchAdminSubjectsByIdMutation,
  getSubjectsQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { SubjectSubjectResponse, ClassClassResponse } from "@/lib/api/types.gen"

type ClassOption = Pick<ClassClassResponse, "id" | "name">

interface SubjectFormDialogProps {
  subject?: SubjectSubjectResponse
  classes: ClassOption[]
  onClose: () => void
}

export function SubjectFormDialog({ subject, classes, onClose }: SubjectFormDialogProps) {
  const qc = useQueryClient()
  const comboboxAnchor = useComboboxAnchor()
  const isEditing = Boolean(subject)
  const [name, setName] = useState(subject?.name ?? "")
  const [selected, setSelected] = useState<ClassOption[]>(
    (subject?.class_ids ?? [])
      .map((id) => classes.find((c) => c.id === id))
      .filter((c): c is ClassOption => Boolean(c?.id && c?.name)),
  )

  const { mutate: createSubject, isPending: creating } = useMutation({
    ...postAdminSubjectsMutation(),
    onSuccess: () => {
      toast.success("Mata pelajaran berhasil ditambahkan")
      qc.invalidateQueries({ queryKey: getSubjectsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal menambahkan mata pelajaran"),
  })

  const { mutate: updateSubject, isPending: updating } = useMutation({
    ...patchAdminSubjectsByIdMutation(),
    onSuccess: () => {
      toast.success("Mata pelajaran berhasil diubah")
      qc.invalidateQueries({ queryKey: getSubjectsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal mengubah mata pelajaran"),
  })

  const isPending = creating || updating

  const save = () => {
    const classIds = selected.map((c) => c.id!).filter((id) => id !== undefined)
    if (isEditing && subject) {
      updateSubject({
        path: { id: subject.id! },
        body: { name: name || undefined, class_ids: classIds },
      })
    } else {
      createSubject({ body: { name: name.trim() || undefined, class_ids: classIds } })
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama mata pelajaran"
            />
          </div>
          <div className="space-y-2">
            <Label>Kelas</Label>
            <Combobox
              multiple
              autoHighlight
              items={classes}
              value={selected}
              onValueChange={(next) => setSelected(next ?? [])}
              itemToStringLabel={(c: ClassOption) => c.name ?? ""}
            >
              <ComboboxChips ref={comboboxAnchor} className="w-full">
                <ComboboxValue>
                  {(values: ClassOption[]) => (
                    <>
                      {values.map((c) => (
                        <ComboboxChip key={c.id}>{c.name}</ComboboxChip>
                      ))}
                      <ComboboxChipsInput placeholder="Pilih kelas..." />
                    </>
                  )}
                </ComboboxValue>
              </ComboboxChips>
              <ComboboxContent anchor={comboboxAnchor}>
                <ComboboxEmpty>Kelas tidak ditemukan</ComboboxEmpty>
                <ComboboxList>
                  {(c: ClassOption) => (
                    <ComboboxItem key={c.id} value={c}>
                      {c.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={save} disabled={isPending || !name.trim()}>
              {isPending ? <Spinner /> : (isEditing ? "Simpan" : "Tambah")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
