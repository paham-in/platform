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
import { Spinner } from "@/components/ui/spinner"
import { deleteAdminClassesByIdMutation, getAdminClassesQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import type { ClassClassResponse } from "@/lib/api/types.gen"

interface DeleteClassDialogProps {
  class: ClassClassResponse
  onClose: () => void
}

export function DeleteClassDialog({ class: cls, onClose }: DeleteClassDialogProps) {
  const qc = useQueryClient()

  const { mutate: deleteClass, isPending } = useMutation({
    ...deleteAdminClassesByIdMutation(),
    onSuccess: () => {
      toast.success("Kelas berhasil dihapus")
      qc.invalidateQueries({ queryKey: getAdminClassesQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal menghapus kelas"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Kelas</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah kamu yakin ingin menghapus <strong>{cls.name}</strong>? Aksi ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="destructive" onClick={() => deleteClass({ path: { id: cls.id! } })} disabled={isPending}>
            {isPending ? <Spinner /> : "Hapus"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
