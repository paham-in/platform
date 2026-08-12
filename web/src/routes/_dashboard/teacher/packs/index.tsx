import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { getAdminQuestionPackageGroupsOptions, getMeOptions } from "@/lib/api/@tanstack/react-query.gen";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { CreateGroupDialog, DeleteGroupDialog, EditGroupDialog } from "@/components/teacher/pack-groups";
import type { QuestionpackageGroupResponse } from "@/lib/api/types.gen";

const GROUP_TIER_LABEL = {
  free: "Gratis",
  premium: "Premium",
} as const;

function GroupsPage() {
  const { data: user } = useQuery(getMeOptions());
  const canManage = user?.roles?.includes("admin") || !!user?.can_manage_question_packages;
  const { data: groups = [], isLoading } = useQuery(getAdminQuestionPackageGroupsOptions());
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<QuestionpackageGroupResponse | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

  return (
    <>
      <main className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Paket Soal</h1>
          {canManage && (
            <Button onClick={() => setCreateOpen(true)}><Plus className="mr-1 h-4 w-4" /> Tambah Grup</Button>
          )}
        </div>

        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Nama Grup</TableHead>
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
                ) : groups.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="p-8 text-center text-muted-foreground">Belum ada grup paket soal</TableCell></TableRow>
                ) : groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="pl-6 font-medium">
                      <Link to="/teacher/packs/$groupId" params={{ groupId: String(group.id!) }} className="hover:underline">
                        {group.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{group.class_name || "-"}</TableCell>
                    <TableCell>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        group.is_free ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {group.is_free ? GROUP_TIER_LABEL.free : GROUP_TIER_LABEL.premium}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {group.package_count ?? 0} paket
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setEditTarget(group)}>
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteConfirm({ id: group.id!, name: group.name ?? "" })}
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
        <CreateGroupDialog onClose={() => setCreateOpen(false)} />
      )}

      {editTarget && (
        <EditGroupDialog group={editTarget} onClose={() => setEditTarget(null)} />
      )}

      {deleteConfirm && (
        <DeleteGroupDialog group={deleteConfirm} onClose={() => setDeleteConfirm(null)} />
      )}
    </>
  );
}

export const Route = createFileRoute("/_dashboard/teacher/packs/")({
  component: GroupsPage,
});
