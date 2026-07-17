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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteAdminMaterialsByIdMutation,
  getAdminMaterialsOptions,
  getAdminMaterialsQueryKey,
  getSubjectsOptions,
  patchAdminMaterialsByIdMutation,
  postAdminMaterialsMutation,
} from "@/lib/api/@tanstack/react-query.gen";
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

type MaterialItem = {
  id?: number;
  title?: string;
  slug?: string;
  description?: string;
  content?: string;
  status?: string;
  order?: number;
  subject_id?: number;
  subject_name?: string;
};

function AdminMaterials() {
  const qc = useQueryClient();
  const { data: materials = [], isLoading } = useQuery(getAdminMaterialsOptions());
  const { data: subjects = [] } = useQuery(getSubjectsOptions());
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialItem | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    status: "draft",
    order: 0,
    subject_id: "",
  });
  const perPage = 5;

  const { mutate: createMaterial } = useMutation({
    ...postAdminMaterialsMutation(),
    onSuccess: () => {
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: getAdminMaterialsQueryKey() });
    },
  });
  const { mutate: updateMaterial } = useMutation({
    ...patchAdminMaterialsByIdMutation(),
    onSuccess: () => {
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: getAdminMaterialsQueryKey() });
    },
  });
  const { mutate: deleteMaterial } = useMutation({
    ...deleteAdminMaterialsByIdMutation(),
    onSuccess: () => qc.invalidateQueries({ queryKey: getAdminMaterialsQueryKey() }),
  });

  const filtered = materials.filter((m) => {
    const matchSearch = (m.title ?? "").toLowerCase().includes(search.toLowerCase());
    const matchSubject =
      subjectFilter === "all" || String(m.subject_id) === subjectFilter;
    return matchSearch && matchSubject;
  });
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", description: "", content: "", status: "draft", order: 0, subject_id: "" });
    setDialogOpen(true);
  };
  const openEdit = (m: MaterialItem) => {
    setEditing(m);
    setForm({
      title: m.title ?? "",
      description: m.description ?? "",
      content: m.content ?? "",
      status: m.status ?? "draft",
      order: m.order ?? 0,
      subject_id: String(m.subject_id ?? ""),
    });
    setDialogOpen(true);
  };
  const save = () => {
    if (editing) {
      updateMaterial({
        path: { id: editing.id! },
        body: {
          title: form.title || undefined,
          description: form.description || undefined,
          content: form.content || undefined,
          status: form.status || undefined,
          order: form.order,
        },
      });
    } else {
      createMaterial({
        body: {
          title: form.title,
          description: form.description,
          content: form.content,
          status: form.status,
          order: form.order,
          subject_id: Number(form.subject_id),
        },
      });
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      draft: "bg-yellow-100 text-yellow-700",
      published: "bg-green-100 text-green-700",
    };
    return (
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}
      >
        {status === "draft" ? "Draft" : "Published"}
      </span>
    );
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
        <h1 className="text-lg font-bold">Materi</h1>
      </header>
      <main className="p-6">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4 px-(--card-spacing) py-3">
            <div className="flex flex-1 flex-wrap items-center gap-4">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari materi..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Select
                value={subjectFilter}
                onValueChange={(v) => {
                  setSubjectFilter(v ?? "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter Subjek" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Subjek</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
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
                    {editing ? "Edit Materi" : "Tambah Materi"}
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
                      placeholder="Judul materi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subjek</Label>
                    <Select
                      key={`subject-${editing?.id ?? "new"}`}
                      value={form.subject_id}
                      onValueChange={(v) =>
                        setForm({ ...form, subject_id: v ?? "" })
                      }
                    >
                      <SelectTrigger id="subject" className="w-full">
                        <SelectValue placeholder="Pilih subjek">
                          {subjects.find((s) => String(s.id) === form.subject_id)?.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
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
                    <Label htmlFor="content">Konten</Label>
                    <Textarea
                      id="content"
                      value={form.content}
                      onChange={(e) =>
                        setForm({ ...form, content: e.target.value })
                      }
                      placeholder="Konten materi"
                      rows={6}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        key={`status-${editing?.id ?? "new"}`}
                        value={form.status}
                        onValueChange={(v) =>
                          setForm({ ...form, status: v ?? "draft" })
                        }
                      >
                        <SelectTrigger id="status" className="w-full">
                          <SelectValue>
                            {form.status === "draft" ? "Draft" : "Published"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
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
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button onClick={save} disabled={!form.title || !form.subject_id}>
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
                  <TableHead>Subjek</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Urutan</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="pl-6 font-medium">
                      {m.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.subject_name}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={m.status ?? ""} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.order}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(m)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            deleteMaterial({ path: { id: m.id! } })
                          }
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
                      colSpan={5}
                      className="p-8 text-center text-muted-foreground"
                    >
                      Tidak ada materi ditemukan
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

export const Route = createFileRoute("/_dashboard/admin/materials")({
  component: AdminMaterials,
});
