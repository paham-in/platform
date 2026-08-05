import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminClassesOptions } from "@/lib/api/@tanstack/react-query.gen";
import type { ClassClassResponse } from "@/lib/api/types.gen";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ClassFormDialog, DeleteClassDialog } from "@/components/admin/classes";

const classesSearchSchema = z.object({
  search: z.string().optional(),
});

function AdminClasses() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { search: searchParam } = Route.useSearch();
  const { data: classes = [], isLoading } = useQuery(getAdminClassesOptions());
  const [searchInput, setSearchInput] = useState(searchParam ?? "");
  const [page, setPage] = useState(1);
  const [formTarget, setFormTarget] = useState<{ open: boolean; editing: ClassClassResponse | null }>({ open: false, editing: null });
  const [deleteConfirm, setDeleteConfirm] = useState<ClassClassResponse | null>(null);
  const perPage = 5;

  const filtered = classes.filter((c) =>
    !searchParam || (c.name ?? "").toLowerCase().includes(searchParam.toLowerCase()),
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const openAdd = () => setFormTarget({ open: true, editing: null });
  const openEdit = (c: ClassClassResponse) => setFormTarget({ open: true, editing: c });

  // Sync URL → local state when search changes externally
  useEffect(() => { setSearchInput(searchParam ?? "") }, [searchParam]);

  // Debounce search → navigate to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({
        search: (prev) => ({ ...prev, search: searchInput || undefined }),
        replace: true,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <>
      <main className="p-6">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Kelas</h1>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari kelas..."
              className="pl-9"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" /> Tambah
          </Button>
        </div>
        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Nama</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="pl-6"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paged.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="pl-6 font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.slug}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                            <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteConfirm(c)}>
                            <Trash2 className="h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && paged.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="p-8 text-center text-muted-foreground"
                    >
                      Tidak ada kelas ditemukan
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
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </main>

      {formTarget.open && (
        <ClassFormDialog class={formTarget.editing ?? undefined} onClose={() => setFormTarget({ open: false, editing: null })} />
      )}

      {deleteConfirm && (
        <DeleteClassDialog class={deleteConfirm} onClose={() => setDeleteConfirm(null)} />
      )}
    </>
  );
}

export const Route = createFileRoute("/_dashboard/admin/classes")({
  component: AdminClasses,
  validateSearch: classesSearchSchema,
});
