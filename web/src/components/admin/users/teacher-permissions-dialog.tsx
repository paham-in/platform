import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  patchAdminUsersByIdPermissionsMutation,
  getAdminUsersQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { UserAdminUserResponse } from "@/lib/api/types.gen"

interface TeacherPermissionsDialogProps {
  user: UserAdminUserResponse
  onClose: () => void
}

export function TeacherPermissionsDialog({ user, onClose }: TeacherPermissionsDialogProps) {
  const qc = useQueryClient()
  const [canManageMaterials, setCanManageMaterials] = useState(!!user.can_manage_materials)
  const [canManageQuestionPackages, setCanManageQuestionPackages] = useState(!!user.can_manage_question_packages)

  const { mutate: savePermissions, isPending } = useMutation({
    ...patchAdminUsersByIdPermissionsMutation(),
    onSuccess: () => {
      toast.success("Hak akses guru berhasil diubah")
      qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal mengubah hak akses"),
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Hak Akses Guru</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {user.name} — {user.email}
          </p>
        </div>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/50">
            <Checkbox
              checked={canManageMaterials}
              onCheckedChange={() => setCanManageMaterials((v) => !v)}
              aria-label="Kelola materi"
            />
            <span className="text-sm">
              <span className="font-medium">Kelola Materi</span>
              <span className="block text-xs text-muted-foreground">
                Boleh membuat, mengubah, dan menghapus materi & chapter.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/50">
            <Checkbox
              checked={canManageQuestionPackages}
              onCheckedChange={() => setCanManageQuestionPackages((v) => !v)}
              aria-label="Kelola paket soal"
            />
            <span className="text-sm">
              <span className="font-medium">Kelola Paket Soal</span>
              <span className="block text-xs text-muted-foreground">
                Boleh membuat, mengubah, dan menghapus paket soal & soal di dalamnya.
              </span>
            </span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            onClick={() =>
              savePermissions({
                path: { id: user.id! },
                body: { can_manage_materials: canManageMaterials, can_manage_question_packages: canManageQuestionPackages },
              })
            }
            disabled={isPending}
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
