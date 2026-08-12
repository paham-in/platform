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
import { getAdminQuestionPackageGroupsOptions, getAdminQuestionPackagesQueryKey, getSubjectsOptions, postAdminQuestionPackagesMutation } from "@/lib/api/@tanstack/react-query.gen"

interface CreatePackageDialogProps {
  onClose: () => void
  defaultGroupId?: number
}

export function CreatePackageDialog({ onClose, defaultGroupId }: CreatePackageDialogProps) {
  const qc = useQueryClient()
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const { data: groups = [] } = useQuery(getAdminQuestionPackageGroupsOptions())
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [groupId, setGroupId] = useState(defaultGroupId ? String(defaultGroupId) : "")

  const subjectOptions = subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }))
  const groupOptions = groups.map((g) => ({
    label: `${g.name ?? ""} — ${g.class_name ?? "?"}`,
    value: String(g.id),
  }))

  const { mutate: createPackage, isPending } = useMutation({
    ...postAdminQuestionPackagesMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionPackagesQueryKey() })
      toast.success("Paket soal berhasil ditambahkan")
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menambah paket"),
  })

  const save = () => {
    if (!name.trim() || !subjectId || !groupId) return
    createPackage({ body: { name, description, subject_id: Number(subjectId), group_id: Number(groupId) } })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tambah Paket Soal</DialogTitle>
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
            <Label htmlFor="group">Grup Paket Soal</Label>
            <Select items={groupOptions} value={groupId} onValueChange={(v) => setGroupId(v ?? "")}>
              <SelectTrigger id="group" className="w-full">
                <SelectValue placeholder="Pilih grup (kelas)" />
              </SelectTrigger>
              <SelectContent>
                {groupOptions.map((opt) => (
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
          <Button onClick={save} disabled={!name.trim() || !subjectId || !groupId || isPending}>
            {isPending && <Spinner />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
