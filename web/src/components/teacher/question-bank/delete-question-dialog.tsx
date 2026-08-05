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
import { deleteAdminQuestionsBankByIdMutation, getAdminQuestionsBankQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import type { QuestionbankQuestionResponse } from "@/lib/api/types.gen"

interface DeleteQuestionDialogProps {
  question: QuestionbankQuestionResponse
  onClose: () => void
}

export function DeleteQuestionDialog({ question, onClose }: DeleteQuestionDialogProps) {
  const qc = useQueryClient()

  const { mutate: deleteQuestion, isPending } = useMutation({
    ...deleteAdminQuestionsBankByIdMutation(),
    onSuccess: () => {
      toast.success("Soal berhasil dihapus")
      qc.invalidateQueries({ queryKey: getAdminQuestionsBankQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menghapus soal"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Soal</AlertDialogTitle>
          <AlertDialogDescription>Yakin ingin menghapus soal ini?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="destructive" onClick={() => deleteQuestion({ path: { id: question.id! } })} disabled={isPending}>
            {isPending ? <Spinner /> : "Hapus"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
