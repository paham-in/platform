import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
  getAdminStudentClassesOptions,
  getAdminStudentClassesQueryKey,
  deleteAdminStudentClassesByIdMutation,
} from "@/lib/api/@tanstack/react-query.gen";
import type { StudentclassStudentClassResponse } from "@/lib/api/types.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Plus, Trash2, KeyRound } from "lucide-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useState } from "react";
import { toast } from "sonner";
import { GrantClassDialog } from "@/components/admin/student-classes";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const studentClassesSearchSchema = z.object({});

function AdminStudentClasses() {
  const { data: items = [], isLoading } = useQuery(getAdminStudentClassesOptions());
  const [page, setPage] = useState(1);
  const [grantOpen, setGrantOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<StudentclassStudentClassResponse | null>(null);
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
              Kelola kelas yang diakses setiap murid dan masa berlakunya.
            </p>
          </div>
          <Button onClick={() => setGrantOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Berikan Akses
          </Button>
        </div>
        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Murid</TableHead>
                  <TableHead>Kelas</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="pr-6"><Skeleton className="h-8 w-16 rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paged.map((sp) => (
                  <TableRow key={sp.id}>
                    <TableCell className="pl-6 font-medium">{sp.user?.name ?? "—"}</TableCell>
                    <TableCell>{sp.class?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{sp.class?.program_name ?? "—"}</TableCell>
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
                    <TableCell colSpan={5}>
                      <Empty className="border-0 p-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><KeyRound /></EmptyMedia>
                          <EmptyTitle>Belum ada hak akses</EmptyTitle>
                        </EmptyHeader>
                      </Empty>
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
        <GrantClassDialog onClose={() => setGrantOpen(false)} />
      )}

      {revokeTarget && (
        <RevokeDialog access={revokeTarget} onClose={() => setRevokeTarget(null)} />
      )}
    </>
  );
}

function RevokeDialog({ access, onClose }: {
  access: StudentclassStudentClassResponse
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { mutate: revoke, isPending } = useMutation({
    ...deleteAdminStudentClassesByIdMutation(),
    onSuccess: () => {
      toast.success("Akses berhasil dicabut")
      qc.invalidateQueries({ queryKey: getAdminStudentClassesQueryKey() })
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
            Hapus akses <strong>{access.class?.name}</strong> untuk{" "}
            <strong>{access.user?.name}</strong>? Murid tidak lagi bisa mengakses konten kelas ini.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="destructive" onClick={() => revoke({ path: { id: access.id! } })} disabled={isPending}>
            {isPending && <Spinner className="h-3 w-3" />}
            Cabut
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const Route = createFileRoute("/_dashboard/admin/student-classes")({
  component: AdminStudentClasses,
  validateSearch: studentClassesSearchSchema,
});
