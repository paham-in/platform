import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteAdminClassesByIdMutation,
  getAdminClassesOptions,
  getAdminClassesQueryKey,
  patchAdminClassesByIdMutation,
  postAdminClassesMutation,
} from "@/lib/api/@tanstack/react-query.gen";
import type { ClassClassResponse } from "@/lib/api/types.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";

function AdminClasses() {
  const qc = useQueryClient();
  const { data: classes = [], isLoading } = useQuery(getAdminClassesOptions());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClassClassResponse | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const perPage = 5;

  const { mutate: createClass } = useMutation({
    ...postAdminClassesMutation(),
    onSuccess: () => {
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: getAdminClassesQueryKey() });
    },
  });
  const { mutate: updateClass } = useMutation({
    ...patchAdminClassesByIdMutation(),
    onSuccess: () => {
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: getAdminClassesQueryKey() });
    },
  });
  const { mutate: deleteClass } = useMutation({
    ...deleteAdminClassesByIdMutation(),
    onSuccess: () => qc.invalidateQueries({ queryKey: getAdminClassesQueryKey() }),
  });

  const filtered = classes.filter((c) =>
    (c.name ?? "").toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setDialogOpen(true);
  };
  const openEdit = (c: ClassClassResponse) => {
    setEditing(c);
    setForm({ name: c.name ?? "", description: c.description ?? "" });
    setDialogOpen(true);
  };
  const save = () => {
    if (editing) {
      updateClass({
        path: { id: editing.id! },
        body: { name: form.name, description: form.description },
      });
    } else {
      createClass({
        body: { name: form.name, description: form.description },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button onClick={openAdd}>
              <Plus className="mr-1 h-4 w-4" /> Tambah
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit Kelas" : "Tambah Kelas"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="Nama kelas (cth: Kelas 10 IPA)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Deskripsi</Label>
                  <Input
                    id="desc"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Deskripsi singkat"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button onClick={save}>
                    {editing ? "Simpan" : "Tambah"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Nama</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="pl-6 font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.slug}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {c.description}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteClass({ path: { id: c.id! } })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
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
    </>
  );
}

export const Route = createFileRoute("/_dashboard/admin/classes")({
  component: AdminClasses,
});
