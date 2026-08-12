import { createFileRoute, Link, useParams } from "@tanstack/react-router"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { getAdminQuestionPackageCollectionsOptions, getAdminQuestionPackagesOptions, getMeOptions } from "@/lib/api/@tanstack/react-query.gen";
import { CreatePackageDialog, DeletePackageDialog, EditPackageDialog } from "@/components/teacher/packs";
import type { QuestionpackagePackageResponse, QuestionpackageCollectionResponse } from "@/lib/api/types.gen";
import { ArrowLeft, ListChecks, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";

const PACKS_PER_PAGE = 20;

function CollectionPackages() {
  const { collectionId } = useParams({ from: "/_dashboard/teacher/packs/$collectionId/" });
  const { data: user } = useQuery(getMeOptions());
  const canManage = user?.roles?.includes("admin") || !!user?.can_manage_question_packages;
  const { data: collections = [] } = useQuery(getAdminQuestionPackageCollectionsOptions());
  const { data: allPackages = [], isLoading } = useQuery(getAdminQuestionPackagesOptions());
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<QuestionpackagePackageResponse | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

  const cid = Number(collectionId);
  const collection = collections.find((g) => g.id === cid) as QuestionpackageCollectionResponse | undefined;
  const packages = (allPackages ?? []).filter((p) => p.collection_id === cid).slice(0, PACKS_PER_PAGE);

  return (
    <>
      <main className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Link to="/teacher/packs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 h-4" /> Paket Soal
          </Link>
          {collection && (
            <>
              <span className="text-sm text-muted-foreground">/</span>
              <span className="text-sm font-medium">{collection.name}</span>
            </>
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Paket Soal</h1>
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
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : packages.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="p-8 text-center text-muted-foreground">Belum ada paket soal di koleksi ini</TableCell></TableRow>
                ) : packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="pl-6 font-medium">
                      <Link to="/teacher/packs/$collectionId/$packageId" params={{ collectionId, packageId: String(pkg.id!) }} className="hover:underline">
                        {pkg.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{pkg.subject_name || "-"}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground">{pkg.description || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{pkg.questions?.length ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground">{pkg.created_at}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <Link to="/teacher/packs/$collectionId/$packageId" params={{ collectionId, packageId: String(pkg.id!) }}>
                            <DropdownMenuItem>
                              <ListChecks className="h-4 w-4" /> Soal
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem onClick={() => setEditTarget(pkg)}>
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
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

      {createOpen && (
        <CreatePackageDialog collectionId={cid} collectionName={collection?.name ?? ""} onClose={() => setCreateOpen(false)} />
      )}

      {editTarget && (
        <EditPackageDialog pkg={editTarget} onClose={() => setEditTarget(null)} />
      )}

      {deleteConfirm && (
        <DeletePackageDialog pkg={deleteConfirm} onClose={() => setDeleteConfirm(null)} />
      )}
    </>
  );
}

export const Route = createFileRoute("/_dashboard/teacher/packs/$collectionId/")({
  component: CollectionPackages,
});
