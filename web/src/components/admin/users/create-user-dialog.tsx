import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { postAdminUsersMutation, getAdminUsersQueryKey, getAdminClassesOptions } from "@/lib/api/@tanstack/react-query.gen"

interface CreateUserDialogProps {
  onClose: () => void
}

export function CreateUserDialog({ onClose }: CreateUserDialogProps) {
  const qc = useQueryClient()
  const { data: classes = [] } = useQuery(getAdminClassesOptions())
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [classId, setClassId] = useState("")

  const { mutate: createUser, isPending } = useMutation({
    ...postAdminUsersMutation(),
    onSuccess: () => {
      toast.success("User berhasil dibuat")
      qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal membuat user"),
  })

  const canSave = name.trim() !== "" && email.trim() !== "" && classId !== "" && !isPending

  const save = () => {
    if (!canSave) return
    createUser({ body: { name: name.trim(), email: email.trim(), class_id: Number(classId) } })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Tambah User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="new-user-name">Nama</Label>
            <Input id="new-user-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-user-email">Email</Label>
            <Input id="new-user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-user-class">Kelas</Label>
            <Select
              items={classes.map((c) => ({ label: c.name ?? "-", value: String(c.id) }))}
              value={classId}
              onValueChange={(v) => setClassId(v ?? "")}
            >
              <SelectTrigger id="new-user-class" className="w-full" size="sm">
                <SelectValue placeholder={classes.length ? "Pilih kelas" : "Tidak ada kelas"} />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Properti kelas murid — bukan akses kelas. Akses diberikan saat invoice les lunas.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={save} disabled={!canSave}>
            {isPending && <Spinner />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
