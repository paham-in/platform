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
import { deleteAdminQuestionPackagesByIdQuestionsByQidMutation, getAdminQuestionPackagesQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import type { QuestionbankQuestionResponse } from "@/lib/api/types.gen"

interface DeleteQuestionDialogProps {
  question: QuestionbankQuestionResponse
  onClose: () => void
}

export function DeleteQuestionDialog({ question, onClose }: DeleteQuestionDialogProps) {
  const qc = useQueryClient()
  const packageId = question.package_id

  const { mutate: deleteQuestion, isPending } = useMutation({
    ...deleteAdminQuestionPackagesByIdQuestionsByQidMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionPackagesQueryKey() })
      toast.success("Soal berhasil dihapus")
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
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={() => deleteQuestion({ path: { id: packageId!, qid: question.id! } })}
          >
            {isPending && <Spinner />}
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
