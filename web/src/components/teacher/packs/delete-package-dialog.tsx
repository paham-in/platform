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
import { deleteAdminQuestionPackagesByIdMutation, getAdminQuestionPackagesQueryKey } from "@/lib/api/@tanstack/react-query.gen"

interface DeletePackageDialogProps {
  pkg: { id: number; name: string }
  onClose: () => void
}

export function DeletePackageDialog({ pkg, onClose }: DeletePackageDialogProps) {
  const qc = useQueryClient()

  const { mutate: deletePackage, isPending } = useMutation({
    ...deleteAdminQuestionPackagesByIdMutation(),
    onSuccess: () => {
      toast.success("Paket soal berhasil dihapus")
      qc.invalidateQueries({ queryKey: getAdminQuestionPackagesQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menghapus paket"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Paket Soal</AlertDialogTitle>
          <AlertDialogDescription>
            Yakin ingin menghapus paket "{pkg.name}"? Semua soal di dalamnya juga akan terhapus.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={() => deletePackage({ path: { id: pkg.id } })}
          >
            {isPending && <Spinner />}
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
