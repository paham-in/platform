import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminStudentProgramsOptions,
  getAdminStudentProgramsQueryKey,
  deleteAdminStudentProgramsByIdMutation,
  getAdminUsersOptions,
  getAdminProgramsOptions,
} from "@/lib/api/@tanstack/react-query.gen";
import type { StudentprogramStudentProgramResponse } from "@/lib/api/types.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Plus, SearchX, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { GrantProgramDialog } from "@/components/admin/student-programs";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const studentProgramsSearchSchema = z.object({});

function AdminStudentPrograms() {
  const { data: items = [], isLoading } = useQuery(getAdminStudentProgramsOptions());
  const { data: users = [] } = useQuery(getAdminUsersOptions());
  const { data: programs = [] } = useQuery(getAdminProgramsOptions());
  const [page, setPage] = useState(1);
  const [grantOpen, setGrantOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<StudentprogramStudentProgramResponse | null>(null);
  const perPage = 8;

  const totalPages = Math.ceil(items.length / perPage);
  const paged = items.slice((page - 1) * perPage, page * perPage);

  return (
    <>
      <main className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hak Akses Murid</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola program yang diakses setiap murid dan masa berlakunya.
            </p>
          </div>
          <Button onClick={() => setGrantOpen(true)} disabled={users.length === 0 || programs.length === 0}>
            <Plus className="mr-1 h-4 w-4" /> Berikan Akses
          </Button>
        </div>
        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Murid</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Kadaluarsa</TableHead>
                  <TableHead className="pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="pr-6"><Skeleton className="h-8 w-16 rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paged.map((sp) => (
                  <TableRow key={sp.id}>
                    <TableCell className="pl-6 font-medium">{sp.user?.name ?? "—"}</TableCell>
                    <TableCell>{sp.program?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{sp.expiry}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRevokeTarget(sp)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Cabut
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="p-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <SearchX className="h-6 w-6 text-muted-foreground" />
                        <p className="text-muted-foreground">Belum ada hak akses. Berikan akses pertama ke murid.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between border-t">
              <p className="text-sm text-muted-foreground">
                Halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </main>

      {grantOpen && (
        <GrantProgramDialog
          users={users}
          programs={programs}
          onClose={() => setGrantOpen(false)}
        />
      )}

      {revokeTarget && (
        <RevokeDialog access={revokeTarget} onClose={() => setRevokeTarget(null)} />
      )}
    </>
  );
}

function RevokeDialog({ access, onClose }: {
  access: StudentprogramStudentProgramResponse
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { mutate: revoke, isPending } = useMutation({
    ...deleteAdminStudentProgramsByIdMutation(),
    onSuccess: () => {
      toast.success("Akses berhasil dicabut")
      qc.invalidateQueries({ queryKey: getAdminStudentProgramsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal mencabut akses"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cabut Hak Akses</AlertDialogTitle>
          <AlertDialogDescription>
            Hapus akses <strong>{access.program?.name}</strong> untuk{" "}
            <strong>{access.user?.name}</strong>? Murid tidak lagi bisa mengakses konten program ini.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="destructive" onClick={() => revoke({ path: { id: access.id! } })} disabled={isPending}>
            {isPending ? "Mencabut..." : "Cabut"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const Route = createFileRoute("/_dashboard/admin/student-programs")({
  component: AdminStudentPrograms,
  validateSearch: studentProgramsSearchSchema,
});
