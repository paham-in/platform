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
  deleteAdminChaptersByIdMutation,
  getAdminChaptersOptions,
  getAdminChaptersQueryKey,
  getAdminClassesOptions,
  getSubjectsOptions,
  patchAdminChaptersByIdMutation,
  postAdminChaptersMutation,
} from "@/lib/api/@tanstack/react-query.gen";
import type { ChapterChapterResponse } from "@/lib/api/types.gen";
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

function AdminChapters() {
  const qc = useQueryClient();
  const { data: chapters = [], isLoading } = useQuery(getAdminChaptersOptions());
  const { data: subjects = [] } = useQuery(getSubjectsOptions());
  const { data: classes = [] } = useQuery(getAdminClassesOptions());
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ChapterChapterResponse | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    order: 0,
    class_id: "",
    subject_id: "",
  });
  const perPage = 5;

  const { mutate: createChapter } = useMutation({
    ...postAdminChaptersMutation(),
    onSuccess: () => {
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: getAdminChaptersQueryKey() });
    },
  });
  const { mutate: updateChapter } = useMutation({
    ...patchAdminChaptersByIdMutation(),
    onSuccess: () => {
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: getAdminChaptersQueryKey() });
    },
  });
  const { mutate: deleteChapter } = useMutation({
    ...deleteAdminChaptersByIdMutation(),
    onSuccess: () => qc.invalidateQueries({ queryKey: getAdminChaptersQueryKey() }),
  });

  // subjects filtered by form.class_id
  const availableSubjects = form.class_id
    ? subjects.filter((s) => (s.class_ids ?? []).includes(Number(form.class_id)))
    : [];

  const filtered = chapters.filter((c) => {
    const matchSearch = (c.title ?? "").toLowerCase().includes(search.toLowerCase());
    const matchClass = classFilter === "all" || String(c.class_id) === classFilter;
    return matchSearch && matchClass;
  });
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", description: "", order: 0, class_id: "", subject_id: "" });
    setDialogOpen(true);
  };
  const openEdit = (c: ChapterChapterResponse) => {
    setEditing(c);
    setForm({
      title: c.title ?? "",
      description: c.description ?? "",
      order: c.order ?? 0,
      class_id: String(c.class_id ?? ""),
      subject_id: String(c.subject_id ?? ""),
    });
    setDialogOpen(true);
  };
  const save = () => {
    if (editing) {
      updateChapter({
        path: { id: editing.id! },
        body: {
          title: form.title || undefined,
          description: form.description || undefined,
          order: form.order,
        },
      });
    } else {
      createChapter({
        body: {
          title: form.title,
          description: form.description,
          order: form.order,
          class_id: Number(form.class_id),
          subject_id: Number(form.subject_id),
        },
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
      <header className="flex items-center justify-between border-b bg-card px-6 py-3">
        <h1 className="text-lg font-bold">Chapter</h1>
      </header>
      <main className="p-6">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4 px-(--card-spacing) py-3">
            <div className="flex flex-1 flex-wrap items-center gap-4">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari chapter..."
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
                onValueChange={(v) => {
                  setClassFilter(v ?? "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
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
                    {editing ? "Edit Chapter" : "Tambah Chapter"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      placeholder="Judul chapter"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kelas</Label>
                    <Select
                      value={form.class_id}
                      onValueChange={(v) =>
                        setForm({ ...form, class_id: v ?? "", subject_id: "" })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih kelas">
                          {classes.find((c) => String(c.id) === form.class_id)?.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subjek</Label>
                    <Select
                      key={`subject-${form.class_id}`}
                      value={form.subject_id}
                      onValueChange={(v) =>
                        setForm({ ...form, subject_id: v ?? "" })
                      }
                      disabled={!form.class_id}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={form.class_id ? "Pilih subjek" : "Pilih kelas dulu"}>
                          {availableSubjects.find((s) => String(s.id) === form.subject_id)?.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubjects.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Label htmlFor="order">Urutan</Label>
                    <Input
                      id="order"
                      type="number"
                      value={form.order}
                      onChange={(e) =>
                        setForm({ ...form, order: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button onClick={save} disabled={!form.title || !form.class_id || !form.subject_id}>
                      {editing ? "Simpan" : "Tambah"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Judul</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Subjek</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Urutan</TableHead>
                  <TableHead>Jumlah Materi</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="pl-6 font-medium">{c.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.class_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.subject_name}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {c.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.order}
                    </TableCell>
                    <TableCell>{c.material_count}</TableCell>
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
                          onClick={() => deleteChapter({ path: { id: c.id! } })}
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
                      colSpan={7}
                      className="p-8 text-center text-muted-foreground"
                    >
                      Tidak ada chapter ditemukan
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

export const Route = createFileRoute("/_dashboard/admin/chapters")({
  component: AdminChapters,
});
