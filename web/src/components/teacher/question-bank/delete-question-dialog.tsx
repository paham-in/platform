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
import { deleteAdminQuestionsBankMutation, getAdminQuestionsBankQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import type { QuestionbankQuestionResponse } from "@/lib/api/types.gen"

interface DeleteQuestionDialogProps {
  questions: QuestionbankQuestionResponse[]
  onClose: () => void
}

export function DeleteQuestionDialog({ questions, onClose }: DeleteQuestionDialogProps) {
  const qc = useQueryClient()
  const count = questions.length
  const ids = questions.map((q) => q.id!).filter((id) => id !== undefined)

  const { mutate: bulkDelete, isPending } = useMutation({
    ...deleteAdminQuestionsBankMutation(),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: getAdminQuestionsBankQueryKey() })
      const deleted = data?.deleted?.length ?? 0
      const failed = data?.failed ?? []
      if (failed.length === 0) {
        toast.success(`${deleted} soal berhasil dihapus`)
      } else if (deleted > 0) {
        toast.error(`${deleted} soal berhasil dihapus, ${failed.length} gagal: ${failed.map((f) => f.error).join("; ")}`)
      } else {
        toast.error(failed.map((f) => f.error).join("; ") || "Gagal menghapus soal")
      }
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menghapus soal"),
  })

  const description =
    count === 1
      ? "Yakin ingin menghapus soal ini?"
      : `Yakin ingin menghapus ${count} soal ini?`

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Soal</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="destructive" onClick={() => bulkDelete({ body: { ids } })} disabled={isPending}>
            <span className="inline-flex items-center gap-2">
              {isPending && <Spinner />}
              Hapus
            </span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
