import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { deleteAdminProgramsByIdMutation, getAdminProgramsQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import type { ProgramProgramResponse } from "@/lib/api/types.gen"

interface DeleteProgramDialogProps {
  program: ProgramProgramResponse
  onClose: () => void
}

export function DeleteProgramDialog({ program, onClose }: DeleteProgramDialogProps) {
  const qc = useQueryClient()

  const { mutate: deleteProgram, isPending } = useMutation({
    ...deleteAdminProgramsByIdMutation(),
    onSuccess: () => {
      toast.success("Program berhasil dihapus")
      qc.invalidateQueries({ queryKey: getAdminProgramsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal menghapus program"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Program</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah kamu yakin ingin menghapus <strong>{program.name}</strong>? Kelas yang terkait akan dilepas. Aksi ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={() => deleteProgram({ path: { id: program.id! } })}
          >
            {isPending && <Spinner />}
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
