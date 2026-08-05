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
            Yakin ingin menghapus paket "{pkg.name}"? Soal tidak akan terhapus.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="destructive" onClick={() => deletePackage({ path: { id: pkg.id } })} disabled={isPending}>
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
