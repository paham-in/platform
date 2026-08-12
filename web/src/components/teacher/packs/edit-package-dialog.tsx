import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAdminQuestionPackageCollectionsOptions, getAdminQuestionPackagesQueryKey, getSubjectsOptions, patchAdminQuestionPackagesByIdMutation } from "@/lib/api/@tanstack/react-query.gen"
import type { QuestionpackagePackageResponse } from "@/lib/api/types.gen"

interface EditPackageDialogProps {
  pkg: QuestionpackagePackageResponse
  onClose: () => void
}

export function EditPackageDialog({ pkg, onClose }: EditPackageDialogProps) {
  const qc = useQueryClient()
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const { data: collections = [] } = useQuery(getAdminQuestionPackageCollectionsOptions())
  const [name, setName] = useState(pkg.name ?? "")
  const [description, setDescription] = useState(pkg.description ?? "")
  const [subjectId, setSubjectId] = useState(pkg.subject_id ? String(pkg.subject_id) : "")
  const [collectionId, setCollectionId] = useState(pkg.collection_id ? String(pkg.collection_id) : "")

  const subjectOptions = subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }))
  const collectionOptions = collections.map((g) => ({
    label: `${g.name ?? ""} — ${g.class_name ?? "?"}`,
    value: String(g.id),
  }))

  const { mutate: updatePackage, isPending } = useMutation({
    ...patchAdminQuestionPackagesByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionPackagesQueryKey() })
      toast.success("Paket soal berhasil diubah")
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || "Gagal mengubah paket"),
  })

  const save = () => {
    if (!name.trim() || !subjectId || !collectionId) return
    updatePackage({
      path: { id: pkg.id! },
      body: { name, description, subject_id: Number(subjectId), collection_id: Number(collectionId) },
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Paket Soal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Paket</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama paket soal"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection">Koleksi Paket Soal</Label>
            <Select items={collectionOptions} value={collectionId} onValueChange={(v) => setCollectionId(v ?? "")}>
              <SelectTrigger id="collection" className="w-full">
                <SelectValue placeholder="Pilih koleksi (kelas)" />
              </SelectTrigger>
              <SelectContent>
                {collectionOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Mata Pelajaran</Label>
            <Select items={subjectOptions} value={subjectId} onValueChange={(v) => setSubjectId(v ?? "")}>
              <SelectTrigger id="subject" className="w-full">
                <SelectValue placeholder="Pilih mata pelajaran" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((opt) => (
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
              placeholder="Deskripsi paket..."
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={save} disabled={!name.trim() || !subjectId || !collectionId || isPending}>
            {isPending && <Spinner />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
