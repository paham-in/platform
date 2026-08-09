import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { patchAdminUsersByIdEmailMutation, getAdminUsersQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import type { UserAdminUserResponse } from "@/lib/api/types.gen"

interface EditEmailDialogProps {
  user: UserAdminUserResponse
  onClose: () => void
}

export function EditEmailDialog({ user, onClose }: EditEmailDialogProps) {
  const qc = useQueryClient()
  const [email, setEmail] = useState(user.email ?? "")

  const { mutate: updateEmail, isPending } = useMutation({
    ...patchAdminUsersByIdEmailMutation(),
    onSuccess: () => {
      toast.success("Email berhasil diubah")
      qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal mengubah email"),
  })

  const save = () => {
    if (email.trim() && email !== user.email) {
      updateEmail({ path: { id: user.id! }, body: { email: email.trim() } })
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Ubah Email User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">Email lama: {user.email}</p>
          </div>
          <div className="space-y-2">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" />
          </div>
          <p className="text-xs text-muted-foreground">
            Gunakan ini utk menghubungkan akun dummy dengan email asli murid — login Google murid akan ter-link ke akun ini.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={save} disabled={!email.trim() || email === user.email || isPending}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
