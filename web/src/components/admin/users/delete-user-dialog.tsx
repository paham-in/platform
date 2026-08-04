import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteAdminUsersByIdMutation, getAdminUsersQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import type { UserAdminUserResponse } from "@/lib/api/types.gen"

interface DeleteUserDialogProps {
  user: UserAdminUserResponse
  onClose: () => void
}

export function DeleteUserDialog({ user, onClose }: DeleteUserDialogProps) {
  const qc = useQueryClient()

  const { mutate: deleteUser, isPending } = useMutation({
    ...deleteAdminUsersByIdMutation(),
    onSuccess: () => {
      toast.success("User berhasil dihapus")
      qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal menghapus user"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus User</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah kamu yakin ingin menghapus <strong>{user.name}</strong>? Aksi ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="destructive" onClick={() => deleteUser({ path: { id: user.id! } })} disabled={isPending}>
            Hapus
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
