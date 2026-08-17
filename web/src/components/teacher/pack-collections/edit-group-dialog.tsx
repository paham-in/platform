import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAdminClassesOptions, getAdminQuestionPackageCollectionsQueryKey, patchAdminQuestionPackageCollectionsByIdMutation } from "@/lib/api/@tanstack/react-query.gen"
import type { QuestionpackageCollectionResponse } from "@/lib/api/types.gen"

interface EditCollectionDialogProps {
  collection: QuestionpackageCollectionResponse
  onClose: () => void
}

export function EditCollectionDialog({ collection, onClose }: EditCollectionDialogProps) {
  const qc = useQueryClient()
  const { data: classes = [] } = useQuery(getAdminClassesOptions())
  const [name, setName] = useState(collection.name ?? "")
  const [description, setDescription] = useState(collection.description ?? "")
  const [classId, setClassId] = useState(collection.class_id ? String(collection.class_id) : "")
  const [isFree, setIsFree] = useState(collection.is_free ?? false)

  const classOptions = classes.map((c) => ({ label: c.name ?? "", value: String(c.id) }))

  const { mutate: updateCollection, isPending } = useMutation({
    ...patchAdminQuestionPackageCollectionsByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionPackageCollectionsQueryKey() })
      toast.success("Koleksi paket soal berhasil diubah")
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || "Gagal mengubah koleksi"),
  })

  const save = () => {
    if (!name.trim() || !classId) return
    updateCollection({
      path: { id: collection.id! },
      body: { name, description, class_id: Number(classId), is_free: isFree },
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Koleksi Paket Soal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Koleksi</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: UTS 1"
              autoFocus
            autoComplete="off"/>
          </div>

          <div className="space-y-2">
            <Label htmlFor="class">Kelas</Label>
            <Select items={classOptions} value={classId} onValueChange={(v) => setClassId(v ?? "")}>
              <SelectTrigger id="class" className="w-full">
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                {classOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Deskripsi (opsional)</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi koleksi..."
              className="min-h-[80px]"
            autoComplete="off"/>
          </div>

          <label className="flex items-center gap-3 rounded-lg border p-4">
            <Checkbox checked={isFree} onCheckedChange={(v) => setIsFree(v === true)} />
            <div>
              <p className="font-medium">Koleksi gratis</p>
              <p className="text-xs text-muted-foreground">
                {isFree ? "Bisa diakses semua user tanpa berlangganan" : "Hanya untuk murid yang berlangganan kelas ini"}
              </p>
            </div>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={save} disabled={!name.trim() || !classId || isPending}>
            {isPending && <Spinner />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
