import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { patchAdminUsersByIdRoleMutation, getAdminUsersQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import type { UserAdminUserResponse } from "@/lib/api/types.gen"
import { RoleBadge, ROLE_LABELS } from "./role-badge"

const ROLE_OPTIONS = ["student", "teacher", "admin", "user"]

interface EditRoleDialogProps {
  user: UserAdminUserResponse
  onClose: () => void
}

export function EditRoleDialog({ user, onClose }: EditRoleDialogProps) {
  const qc = useQueryClient()
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles ?? [])

  const { mutate: updateRole, isPending } = useMutation({
    ...patchAdminUsersByIdRoleMutation(),
    onSuccess: () => {
      toast.success("Role berhasil diubah")
      qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal mengubah role"),
  })

  // role "student" & "user" tidak bisa digabung dengan role lain (hanya teacher/admin yang multi-role)
  const singleRoles = ["student", "user"]

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => {
      // uncheck
      if (prev.includes(role)) return prev.filter((r) => r !== role)

      // klik role single-role (student/user): replace semua role → cuma role ini.
      // ini biar user bisa pindah user→student tanpa diblokir kombinasi.
      if (singleRoles.includes(role)) return [role]

      // klik teacher/admin: gabung boleh, asal tidak ada student/user tercentang
      if (prev.some((r) => singleRoles.includes(r))) return prev
      return [...prev, role]
    })
  }

  const save = () => {
    if (selectedRoles.length > 0) {
      updateRole({ path: { id: user.id! }, body: { roles: selectedRoles } })
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit Role User</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {user.name} — {user.email}
          </p>
        </div>
        <div className="space-y-3 pt-2">
          <p className="text-sm font-medium">Role (centang semua yang sesuai)</p>
          {ROLE_OPTIONS.map((role) => (
            <label key={role} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
              <Checkbox
                checked={selectedRoles.includes(role)}
                onCheckedChange={() => toggleRole(role)}
              />
              <RoleBadge role={role} />
              <span className="ml-auto text-sm text-muted-foreground">{ROLE_LABELS[role]}</span>
            </label>
          ))}
          {selectedRoles.length === 0 && (
            <p className="text-xs text-destructive">Minimal 1 role harus dipilih</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={save} disabled={selectedRoles.length === 0 || isPending}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
