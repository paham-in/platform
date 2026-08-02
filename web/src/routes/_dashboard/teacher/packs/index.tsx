import { createFileRoute } from '@tanstack/react-router'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminQuestionPackagesOptions,
  getAdminQuestionPackagesQueryKey,
  deleteAdminQuestionPackagesByIdMutation,
} from "@/lib/api/@tanstack/react-query.gen";
import { Link } from "@tanstack/react-router";
import { Eye, Loader2, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

function TeacherQuestionPackages() {
  const qc = useQueryClient();
  const { data: packages = [], isLoading } = useQuery(getAdminQuestionPackagesOptions());
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

  const { mutate: deletePackage, isPending: isDeleting } = useMutation({
    ...deleteAdminQuestionPackagesByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionPackagesQueryKey() });
      setDeleteConfirm(null);
      toast.success("Paket soal berhasil dihapus");
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menghapus paket"),
  });

  if (isLoading)
    return <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <>
      <main className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Paket Soal</h1>
          <Link to="/teacher/packs/new">
            <Button><Plus className="mr-1 h-4 w-4" /> Tambah Paket</Button>
          </Link>
        </div>

        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Nama Paket</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Jumlah Soal</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="p-8 text-center text-muted-foreground">Belum ada paket soal</TableCell></TableRow>
                ) : packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="pl-6 font-medium">{pkg.name}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground">{pkg.description || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{pkg.questions?.length ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground">{pkg.created_at}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <Link to="/teacher/packs/$id" params={{ id: String(pkg.id!) }}>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4" /> Lihat
                            </DropdownMenuItem>
                          </Link>
                          <Link to="/teacher/packs/$id/edit" params={{ id: String(pkg.id!) }}>
                            <DropdownMenuItem>
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteConfirm({ id: pkg.id!, name: pkg.name ?? "" })}
                          >
                            <Trash2 className="h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {deleteConfirm && (
        <AlertDialog open onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Paket Soal</AlertDialogTitle>
              <AlertDialogDescription>
                Yakin ingin menghapus paket "{deleteConfirm.name}"? Soal tidak akan terhapus.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Batal</Button>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={() => deletePackage({ path: { id: deleteConfirm.id } })}
              >
                Hapus
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

export const Route = createFileRoute("/_dashboard/teacher/packs/")({
  component: TeacherQuestionPackages,
});
