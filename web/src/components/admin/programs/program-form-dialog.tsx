import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  postAdminProgramsMutation,
  patchAdminProgramsByIdMutation,
  getAdminProgramsQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { ProgramProgramResponse } from "@/lib/api/types.gen"

interface ProgramFormDialogProps {
  program?: ProgramProgramResponse
  onClose: () => void
}

export function ProgramFormDialog({ program, onClose }: ProgramFormDialogProps) {
  const qc = useQueryClient()
  const [name, setName] = useState(program?.name ?? "")
  const [desc, setDesc] = useState(program?.description ?? "")
  const isEditing = Boolean(program)

  const { mutate: createProgram, isPending: creating } = useMutation({
    ...postAdminProgramsMutation(),
    onSuccess: () => {
      toast.success("Program berhasil ditambahkan")
      qc.invalidateQueries({ queryKey: getAdminProgramsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal menambahkan program"),
  })

  const { mutate: updateProgram, isPending: updating } = useMutation({
    ...patchAdminProgramsByIdMutation(),
    onSuccess: () => {
      toast.success("Program berhasil diubah")
      qc.invalidateQueries({ queryKey: getAdminProgramsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal mengubah program"),
  })

  const isPending = creating || updating

  const save = () => {
    if (!name.trim()) return
    if (isEditing && program) {
      updateProgram({
        path: { id: program.id! },
        body: { name: name.trim(), description: desc.trim() || undefined },
      })
    } else {
      createProgram({ body: { name: name.trim(), description: desc.trim() || undefined } })
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Program" : "Tambah Program"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama program (cth: Sekolah, UTBK, Kedinasan)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Deskripsi</Label>
            <Input
              id="desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Deskripsi singkat (opsional)"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={save} disabled={isPending || !name.trim()}>
              {isPending && <Spinner />}
              {isEditing ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
