import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { getAdminQuestionPackagesOptions } from "@/lib/api/@tanstack/react-query.gen";
import { ListChecks, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { CreatePackageDialog, DeletePackageDialog, EditPackageDialog } from "@/components/teacher/packs";
import type { QuestionpackagePackageResponse } from "@/lib/api/types.gen";

function TeacherQuestionPackages() {
  const { data: packages = [], isLoading } = useQuery(getAdminQuestionPackagesOptions());
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<QuestionpackagePackageResponse | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

  return (
    <>
      <main className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Paket Soal</h1>
          <Button onClick={() => setCreateOpen(true)}><Plus className="mr-1 h-4 w-4" /> Tambah Paket</Button>
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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : packages.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="p-8 text-center text-muted-foreground">Belum ada paket soal</TableCell></TableRow>
                ) : packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="pl-6 font-medium">
                      <Link to="/teacher/packs/$packageId" params={{ packageId: String(pkg.id!) }} className="hover:underline">
                        {pkg.name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground">{pkg.description || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{pkg.questions?.length ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground">{pkg.created_at}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <Link to="/teacher/packs/$packageId" params={{ packageId: String(pkg.id!) }}>
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
        <CreatePackageDialog onClose={() => setCreateOpen(false)} />
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

export const Route = createFileRoute("/_dashboard/teacher/packs/")({
  component: TeacherQuestionPackages,
});
