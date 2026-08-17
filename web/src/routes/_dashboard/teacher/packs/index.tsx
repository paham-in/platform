import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { getAdminQuestionPackageCollectionsOptions, getMeOptions } from "@/lib/api/@tanstack/react-query.gen";
import { MoreVertical, Pencil, Plus, Trash2, FolderOpen } from "lucide-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { CreateCollectionDialog, DeleteCollectionDialog, EditCollectionDialog } from "@/components/teacher/pack-collections";
import type { QuestionpackageCollectionResponse } from "@/lib/api/types.gen";

const TIER_LABEL = {
  free: "Gratis",
  premium: "Premium",
} as const;

function CollectionsPage() {
  const { data: user } = useQuery(getMeOptions());
  const canManage = user?.roles?.includes("admin") || !!user?.can_manage_question_packages;
  // koleksi bisa dikelola kalau punya izin DAN (admin, koleksi sendiri, atau koleksi tanpa pemilik)
  const canEdit = (c: { author_id?: number }) => user?.roles?.includes("admin") || c.author_id === user?.id || !c.author_id;
  const { data: collections = [], isLoading } = useQuery(getAdminQuestionPackageCollectionsOptions());
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<QuestionpackageCollectionResponse | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

  return (
    <>
      <main className="p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Koleksi Paket Soal</h1>
          {canManage && (
            <Button onClick={() => setCreateOpen(true)}><Plus className="mr-1 h-4 w-4" /> Tambah Koleksi</Button>
          )}
        </div>

        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Nama Koleksi</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Jumlah Paket</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : collections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Empty className="border-0 p-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><FolderOpen /></EmptyMedia>
                          <EmptyTitle>Belum ada koleksi paket soal</EmptyTitle>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : collections.map((collection) => (
                  <TableRow key={collection.id}>
                    <TableCell className="pl-6 font-medium">
                      <Link to="/teacher/packs/$collectionId" params={{ collectionId: String(collection.id!) }} className="hover:underline">
                        {collection.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{collection.class_name || "-"}</TableCell>
                    <TableCell>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        collection.is_free ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {collection.is_free ? TIER_LABEL.free : TIER_LABEL.premium}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {collection.package_count ?? 0} paket
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {canManage && canEdit(collection) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setEditTarget(collection)}>
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteConfirm({ id: collection.id!, name: collection.name ?? "" })}
                            >
                              <Trash2 className="h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {createOpen && (
        <CreateCollectionDialog onClose={() => setCreateOpen(false)} />
      )}

      {editTarget && (
        <EditCollectionDialog collection={editTarget} onClose={() => setEditTarget(null)} />
      )}

      {deleteConfirm && (
        <DeleteCollectionDialog collection={deleteConfirm} onClose={() => setDeleteConfirm(null)} />
      )}
    </>
  );
}

export const Route = createFileRoute("/_dashboard/teacher/packs/")({
  component: CollectionsPage,
});
