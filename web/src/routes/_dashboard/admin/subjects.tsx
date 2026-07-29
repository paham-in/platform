import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteAdminSubjectsByIdMutation,
  getAdminClassesOptions,
  getSubjectsOptions,
  getSubjectsQueryKey,
  patchAdminSubjectsByIdMutation,
  postAdminSubjectsMutation,
} from "@/lib/api/@tanstack/react-query.gen";
import type { SubjectSubjectResponse } from "@/lib/api/types.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

function AdminSubjects() {
  const qc = useQueryClient();
  const { data: subjects = [], isLoading } = useQuery(getSubjectsOptions());
  const { data: classes = [] } = useQuery(getAdminClassesOptions());
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectSubjectResponse | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<SubjectSubjectResponse | null>(null);
  const [form, setForm] = useState({ name: "", description: "", class_ids: [] as number[] });
  const perPage = 5;

  const { mutate: createSubject } = useMutation({
    ...postAdminSubjectsMutation(),
    onSuccess: () => {
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: getSubjectsQueryKey() });
    },
  });
  const { mutate: updateSubject } = useMutation({
    ...patchAdminSubjectsByIdMutation(),
    onSuccess: () => {
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: getSubjectsQueryKey() });
    },
  });
  const { mutate: deleteSubject } = useMutation({
    ...deleteAdminSubjectsByIdMutation(),
    onSuccess: () => qc.invalidateQueries({ queryKey: getSubjectsQueryKey() }),
  });

  const filtered = subjects.filter((s) => {
    const matchSearch = (s.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchClass =
      classFilter === "all" || (s.class_ids ?? []).includes(Number(classFilter));
    return matchSearch && matchClass;
  });
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleClass = (classId: number) => {
    setForm((prev) => ({
      ...prev,
      class_ids: prev.class_ids.includes(classId)
        ? prev.class_ids.filter((id) => id !== classId)
        : [...prev.class_ids, classId],
    }));
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", description: "", class_ids: [] });
    setDialogOpen(true);
  };
  const openEdit = (s: SubjectSubjectResponse) => {
    setEditing(s);
    setForm({
      name: s.name ?? "",
      description: s.description ?? "",
      class_ids: s.class_ids ?? [],
    });
    setDialogOpen(true);
  };
  const save = () => {
    if (editing) {
      updateSubject({
        path: { id: editing.id! },
        body: {
          name: form.name || undefined,
          description: form.description || undefined,
          class_ids: form.class_ids,
        },
      });
    } else {
      createSubject({
        body: {
          name: form.name,
          description: form.description,
          class_ids: form.class_ids,
        },
      });
    }
  };

  const classNames = (classIds: number[] | undefined) =>
    classIds
      ?.map((id) => classes.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join(", ") ?? "-";

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
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Mata Pelajaran</h1>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 flex-wrap items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari mata pelajaran..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={classFilter}
              onValueChange={(v) => { setClassFilter(v ?? "all"); setPage(1); }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button onClick={openAdd}>
              <Plus className="mr-1 h-4 w-4" /> Tambah
            </Button>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}
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
                    placeholder="Nama mata pelajaran"
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
                <div className="space-y-2">
                  <Label>Kelas</Label>
                  <div className="max-h-[200px] space-y-2 overflow-y-auto rounded-md border p-3">
                    {classes.map((c) => (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        <Checkbox
                          checked={form.class_ids.includes(c.id!)}
                          onChange={() => toggleClass(c.id!)}
                        />
                        {c.name}
                      </label>
                    ))}
                    {classes.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Belum ada kelas. Buat kelas dulu.
                      </p>
                    )}
                  </div>
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
                  <TableHead>Kelas</TableHead>
                  <TableHead>Jumlah Materi</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="pl-6 font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.slug}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {s.description}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {classNames(s.class_ids)}
                    </TableCell>
                    <TableCell>{s.material_count}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                            <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => openEdit(s)}>
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteConfirm(s)}>
                            <Trash2 className="h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="p-8 text-center text-muted-foreground"
                    >
                      Tidak ada mata pelajaran ditemukan
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

      {deleteConfirm && <AlertDialog open onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Mata Pelajaran</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah kamu yakin ingin menghapus <strong>{deleteConfirm.name}</strong>? Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => {
              deleteSubject({ path: { id: deleteConfirm.id! } })
              setDeleteConfirm(null)
            }}>Hapus</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </>
  );
}

export const Route = createFileRoute("/_dashboard/admin/subjects")({
  component: AdminSubjects,
});
