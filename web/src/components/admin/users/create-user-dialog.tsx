import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { postAdminUsersMutation, getAdminUsersQueryKey } from "@/lib/api/@tanstack/react-query.gen"

interface CreateUserDialogProps {
  onClose: () => void
}

export function CreateUserDialog({ onClose }: CreateUserDialogProps) {
  const qc = useQueryClient()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  const { mutate: createUser, isPending } = useMutation({
    ...postAdminUsersMutation(),
    onSuccess: () => {
      toast.success("User berhasil dibuat")
      qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal membuat user"),
  })

  const canSave = name.trim() !== "" && email.trim() !== "" && !isPending

  const save = () => {
    if (!canSave) return
    createUser({ body: { name: name.trim(), email: email.trim() } })
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
            <Input id="new-user-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" autoComplete="off"/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-user-email">Email</Label>
            <Input id="new-user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" autoComplete="off"/>
          </div>
          <p className="text-xs text-muted-foreground">
            Akses kelas diberikan terpisah, otomatis setelah invoice langganan/les lunas, atau manual lewat halaman Hak Akses Murid.
          </p>
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
