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
import { deleteAdminSubjectsByIdMutation, getSubjectsQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import type { SubjectSubjectResponse } from "@/lib/api/types.gen"

interface DeleteSubjectDialogProps {
  subject: SubjectSubjectResponse
  onClose: () => void
}

export function DeleteSubjectDialog({ subject, onClose }: DeleteSubjectDialogProps) {
  const qc = useQueryClient()

  const { mutate: deleteSubject, isPending } = useMutation({
    ...deleteAdminSubjectsByIdMutation(),
    onSuccess: () => {
      toast.success("Mata pelajaran berhasil dihapus")
      qc.invalidateQueries({ queryKey: getSubjectsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal menghapus mata pelajaran"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Mata Pelajaran</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah kamu yakin ingin menghapus <strong>{subject.name}</strong>? Aksi ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="destructive" onClick={() => deleteSubject({ path: { id: subject.id! } })} disabled={isPending}>
            {isPending ? <Spinner /> : "Hapus"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
