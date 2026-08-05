import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  postAdminClassesMutation,
  patchAdminClassesByIdMutation,
  getAdminClassesQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { ClassClassResponse } from "@/lib/api/types.gen"

interface ClassFormDialogProps {
  class?: ClassClassResponse
  onClose: () => void
}

export function ClassFormDialog({ class: cls, onClose }: ClassFormDialogProps) {
  const qc = useQueryClient()
  const [name, setName] = useState(cls?.name ?? "")
  const isEditing = Boolean(cls)

  const { mutate: createClass, isPending: creating } = useMutation({
    ...postAdminClassesMutation(),
    onSuccess: () => {
      toast.success("Kelas berhasil ditambahkan")
      qc.invalidateQueries({ queryKey: getAdminClassesQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal menambahkan kelas"),
  })

  const { mutate: updateClass, isPending: updating } = useMutation({
    ...patchAdminClassesByIdMutation(),
    onSuccess: () => {
      toast.success("Kelas berhasil diubah")
      qc.invalidateQueries({ queryKey: getAdminClassesQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal mengubah kelas"),
  })

  const isPending = creating || updating

  const save = () => {
    if (!name.trim()) return
    if (isEditing && cls) {
      updateClass({ path: { id: cls.id! }, body: { name: name.trim() } })
    } else {
      createClass({ body: { name: name.trim() } })
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Kelas" : "Tambah Kelas"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kelas (cth: Kelas 10 IPA)"
            />
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
