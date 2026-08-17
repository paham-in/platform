import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminQuestionPackageCollectionsOptions, getAdminQuestionPackageCollectionsQueryKey, getAdminQuestionPackagesOptions, getAdminQuestionPackagesQueryKey, getMeOptions, patchAdminQuestionPackagesByIdMutation } from "@/lib/api/@tanstack/react-query.gen";
import { CreatePackageDialog, DeletePackageDialog, EditPackageDialog } from "@/components/teacher/packs";
import type { QuestionpackagePackageResponse, QuestionpackageCollectionResponse } from "@/lib/api/types.gen";
import { Eye, EyeOff, ListChecks, MoreVertical, Pencil, Plus, Trash2, FolderOpen } from "lucide-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { toast } from "sonner";

const PACKS_PER_PAGE = 20;

const statusStyles: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  draft: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

const statusLabels: Record<string, string> = {
  published: "Tayang",
  draft: "Draf",
};

function CollectionPackages() {
  const { collectionId } = useParams({ from: "/_dashboard/teacher/packs/$collectionId/" });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: user } = useQuery(getMeOptions());
  const canManage = user?.roles?.includes("admin") || !!user?.can_manage_question_packages;
  // paket bisa dikelola kalau punya izin DAN (admin, paket sendiri, atau paket tanpa pemilik)
  const canEdit = (p: { author_id?: number }) => user?.roles?.includes("admin") || p.author_id === user?.id || !p.author_id;
  const { data: collections = [] } = useQuery(getAdminQuestionPackageCollectionsOptions());
  const { data: allPackages = [], isLoading } = useQuery(getAdminQuestionPackagesOptions());
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<QuestionpackagePackageResponse | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<{ id: number; status: string; name: string } | null>(null);

  const { mutate: toggleStatus } = useMutation({
    ...patchAdminQuestionPackagesByIdMutation(),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: getAdminQuestionPackagesQueryKey() });
      qc.invalidateQueries({ queryKey: getAdminQuestionPackageCollectionsQueryKey() });
      toast.success(
        variables.body?.status === "published"
          ? "Paket soal berhasil dipublikasikan."
          : "Paket soal disimpan sebagai draft."
      );
    },
    onError: (err: any) => toast.error(err?.error || "Gagal mengubah status"),
  });

  const cid = Number(collectionId);
  const collection = collections.find((g) => g.id === cid) as QuestionpackageCollectionResponse | undefined;
  const packages = (allPackages ?? []).filter((p) => p.collection_id === cid).slice(0, PACKS_PER_PAGE);

  return (
    <>
      <main className="p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{collection?.name ?? "Paket Soal"}</h1>
            {collection && (
              <p className="text-sm text-muted-foreground">{collection.class_name || "Kelas tidak diketahui"}</p>
            )}
          </div>
          {canManage && (
            <Button onClick={() => setCreateOpen(true)}><Plus className="mr-1 h-4 w-4" /> Tambah Paket</Button>
          )}
        </div>

        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Nama Paket</TableHead>
                  <TableHead>Mata Pelajaran</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Jumlah Soal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : packages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Empty className="border-0 p-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><FolderOpen /></EmptyMedia>
                          <EmptyTitle>Belum ada paket soal di koleksi ini</EmptyTitle>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="pl-6 font-medium">
                      <button type="button" onClick={() => navigate({ to: "/teacher/packs/$collectionId/$packageId", params: { collectionId, packageId: String(pkg.id!) } })} className="hover:underline">
                        {pkg.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{pkg.subject_name || "-"}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground">{pkg.description || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{pkg.questions?.length ?? 0}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[pkg.status === "published" ? "published" : "draft"]}`}>
                        {statusLabels[pkg.status === "published" ? "published" : "draft"]}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{pkg.created_at}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => navigate({ to: "/teacher/packs/$collectionId/$packageId", params: { collectionId, packageId: String(pkg.id!) } })}>
                            <ListChecks className="h-4 w-4" /> Soal
                          </DropdownMenuItem>
                          {canManage && canEdit(pkg) && (
                            <>
                              <DropdownMenuItem onClick={() => {
                                setPendingStatus({ id: pkg.id!, status: pkg.status === "published" ? "draft" : "published", name: pkg.name ?? "" });
                                setConfirmOpen(true);
                              }}>
                                {pkg.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {pkg.status === "published" ? "Jadikan Draft" : "Publikasikan"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditTarget(pkg)}>
                                <Pencil className="h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteConfirm({ id: pkg.id!, name: pkg.name ?? "" })}
                              >
                                <Trash2 className="h-4 w-4" /> Hapus
                              </DropdownMenuItem>
                            </>
                          )}
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

      {createOpen && (
        <CreatePackageDialog collectionId={cid} collectionName={collection?.name ?? ""} onClose={() => setCreateOpen(false)} />
      )}

      {editTarget && (
        <EditPackageDialog pkg={editTarget} onClose={() => setEditTarget(null)} />
      )}

      {deleteConfirm && (
        <DeletePackageDialog pkg={deleteConfirm} onClose={() => setDeleteConfirm(null)} />
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Status</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus?.status === "published"
                ? `Publikasikan paket soal "${pendingStatus?.name}" agar bisa dikerjakan murid?`
                : `Ubah paket soal "${pendingStatus?.name}" menjadi draft (tidak tampil di murid)?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingStatus) {
                toggleStatus({ path: { id: pendingStatus.id }, body: { status: pendingStatus.status } });
              }
              setConfirmOpen(false);
            }}>
              {pendingStatus?.status === "published" ? "Publikasikan" : "Jadikan Draft"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const Route = createFileRoute("/_dashboard/teacher/packs/$collectionId/")({
  component: CollectionPackages,
});
