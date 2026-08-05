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
import { deleteAdminQuestionsByIdMutation, getAdminQuestionsQueryKey } from "@/lib/api/@tanstack/react-query.gen"

interface DeleteQuestionDialogProps {
  question: { id: number; content: string }
  onClose: () => void
}

export function DeleteQuestionDialog({ question, onClose }: DeleteQuestionDialogProps) {
  const qc = useQueryClient()

  const { mutate: deleteQuestion, isPending } = useMutation({
    ...deleteAdminQuestionsByIdMutation(),
    onSuccess: () => {
      toast.success("Pertanyaan berhasil dihapus")
      qc.invalidateQueries({ queryKey: getAdminQuestionsQueryKey() })
      onClose()
    },
    onError: () => toast.error("Gagal menghapus pertanyaan"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Pertanyaan</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah kamu yakin ingin menghapus <strong>{question.content}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="destructive" onClick={() => deleteQuestion({ path: { id: question.id } })} disabled={isPending}>
            {isPending ? <Spinner /> : "Hapus"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
