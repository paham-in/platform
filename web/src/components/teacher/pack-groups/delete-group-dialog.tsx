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
import { deleteAdminQuestionPackageGroupsByIdMutation, getAdminQuestionPackageGroupsQueryKey, getAdminQuestionPackagesQueryKey } from "@/lib/api/@tanstack/react-query.gen"

interface DeleteGroupDialogProps {
  group: { id: number; name: string }
  onClose: () => void
}

export function DeleteGroupDialog({ group, onClose }: DeleteGroupDialogProps) {
  const qc = useQueryClient()

  const { mutate: deleteGroup, isPending } = useMutation({
    ...deleteAdminQuestionPackageGroupsByIdMutation(),
    onSuccess: () => {
      toast.success("Grup paket soal berhasil dihapus")
      qc.invalidateQueries({ queryKey: getAdminQuestionPackageGroupsQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminQuestionPackagesQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menghapus grup"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Grup Paket Soal</AlertDialogTitle>
          <AlertDialogDescription>
            Yakin ingin menghapus grup "{group.name}"? Paket soal di dalamnya tidak ikut terhapus,
            tapi akan lepas dari grup dan tidak terlihat oleh murid sampai di-assign ke grup lain.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="destructive" onClick={() => deleteGroup({ path: { id: group.id } })} disabled={isPending}>
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
