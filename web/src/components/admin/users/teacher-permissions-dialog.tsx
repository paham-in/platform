import { Controller, useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  patchAdminUsersByIdPermissionsMutation,
  getAdminUsersQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { UserAdminListUsersResponse } from "@/lib/api/types.gen"

interface TeacherPermissionsDialogProps {
  user: UserAdminListUsersResponse
  onClose: () => void
}

export function TeacherPermissionsDialog({ user, onClose }: TeacherPermissionsDialogProps) {
  const qc = useQueryClient()
  const form = useForm<{ can_manage_materials: boolean; can_manage_question_packages: boolean }>({
    defaultValues: {
      can_manage_materials: !!user.can_manage_materials,
      can_manage_question_packages: !!user.can_manage_question_packages,
    },
  })

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
            {user.name}, {user.email}
          </p>
        </div>
        <div className="space-y-3">
          <Controller
            name="can_manage_materials"
            control={form.control}
            render={({ field }) => (
              <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/50">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Kelola materi"
                />
                <span className="text-sm">
                  <span className="font-medium">Kelola Materi</span>
                  <span className="block text-xs text-muted-foreground">
                    Boleh membuat, mengubah, dan menghapus materi & bab.
                  </span>
                </span>
              </label>
            )}
          />
          <Controller
            name="can_manage_question_packages"
            control={form.control}
            render={({ field }) => (
              <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/50">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Kelola paket soal"
                />
                <span className="text-sm">
                  <span className="font-medium">Kelola Paket Soal</span>
                  <span className="block text-xs text-muted-foreground">
                    Boleh membuat, mengubah, dan menghapus paket soal & soal di dalamnya.
                  </span>
                </span>
              </label>
            )}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            onClick={form.handleSubmit((v) =>
              savePermissions({
                path: { id: user.id! },
                body: { can_manage_materials: v.can_manage_materials, can_manage_question_packages: v.can_manage_question_packages },
              })
            )}
            disabled={isPending}
          >
            {isPending && <Spinner />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
