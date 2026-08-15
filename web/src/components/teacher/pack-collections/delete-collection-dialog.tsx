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
import { deleteAdminQuestionPackageCollectionsByIdMutation, getAdminQuestionPackageCollectionsQueryKey, getAdminQuestionPackagesQueryKey } from "@/lib/api/@tanstack/react-query.gen"

interface DeleteCollectionDialogProps {
  collection: { id: number; name: string }
  onClose: () => void
}

export function DeleteCollectionDialog({ collection, onClose }: DeleteCollectionDialogProps) {
  const qc = useQueryClient()

  const { mutate: deleteCollection, isPending } = useMutation({
    ...deleteAdminQuestionPackageCollectionsByIdMutation(),
    onSuccess: () => {
      toast.success("Koleksi paket soal berhasil dihapus")
      qc.invalidateQueries({ queryKey: getAdminQuestionPackageCollectionsQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminQuestionPackagesQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menghapus koleksi"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Koleksi Paket Soal</AlertDialogTitle>
          <AlertDialogDescription>
            Yakin ingin menghapus koleksi "{collection.name}"? Paket soal di dalamnya tidak ikut terhapus,
            tapi akan lepas dari koleksi dan tidak terlihat oleh murid sampai di-assign ke koleksi lain.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={() => deleteCollection({ path: { id: collection.id } })}
          >
            {isPending && <Spinner />}
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
