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
import {
  deleteQuestionsByQuestionIdAnswersByIdMutation,
  getQuestionsByQuestionIdAnswersQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { AnswerAnswerResponse } from "@/lib/api/types.gen"

interface DeleteAnswerDialogProps {
  answer: AnswerAnswerResponse
  questionId: number
  onClose: () => void
}

export function DeleteAnswerDialog({ answer, questionId, onClose }: DeleteAnswerDialogProps) {
  const qc = useQueryClient()

  const { mutate: deleteAnswer, isPending } = useMutation({
    ...deleteQuestionsByQuestionIdAnswersByIdMutation(),
    onSuccess: () => {
      toast.success("Jawaban berhasil dihapus")
      qc.invalidateQueries({
        queryKey: getQuestionsByQuestionIdAnswersQueryKey({ path: { question_id: questionId } }),
      })
      onClose()
    },
    onError: (err: any) => {
      toast.error(err?.error || err?.message || "Gagal menghapus jawaban")
    },
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Jawaban</AlertDialogTitle>
          <AlertDialogDescription>
            Yakin ingin menghapus jawaban ini? Tindakan ini tidak bisa dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={() => deleteAnswer({ path: { question_id: questionId, id: answer.id! } })}
          >
            {isPending && <Spinner className="h-3 w-3" />}
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
