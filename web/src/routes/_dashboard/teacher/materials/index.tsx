import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  deleteAdminMaterialsByIdMutation,
  getAdminChaptersOptions,
  getAdminClassesOptions,
  getAdminMaterialsOptions,
  getAdminMaterialsQueryKey,
  getSubjectsOptions,
  patchAdminMaterialsByIdMutation,
} from "@/lib/api/@tanstack/react-query.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
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

function AdminMaterials() {
  const qc = useQueryClient();
  const { data: materials = [], isLoading } = useQuery(getAdminMaterialsOptions());
  const { data: subjects = [] } = useQuery(getSubjectsOptions());
  const { data: allChapters = [] } = useQuery(getAdminChaptersOptions());
  const { data: classes = [] } = useQuery(getAdminClassesOptions());
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<{ id: number; status: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

  const { mutate: deleteMaterial } = useMutation({
    ...deleteAdminMaterialsByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminMaterialsQueryKey() });
      toast.success("Materi berhasil dihapus");
    },
    onError: (err: any) => {
      toast.error(err?.error || err?.message || "Gagal menghapus materi");
    },
  });

  const { mutate: toggleStatus } = useMutation({
    ...patchAdminMaterialsByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminMaterialsQueryKey() });
    },
    onError: (err: any) => {
      toast.error(err?.error || err?.message || "Gagal mengubah status");
    },
  });

  const filtered = materials.filter((m) => {
    const matchSearch = (m.title ?? "").toLowerCase().includes(search.toLowerCase());
    const ch = allChapters.find((c) => c.id === m.chapter_id);
    const matchClass = classFilter === "all" || String(ch?.class_id) === classFilter;
    return matchSearch && matchClass;
  });
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

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
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Materi</h1>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 flex-wrap items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari materi..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
          <Link to="/teacher/materials/new">
            <Button>
              <Plus className="mr-1 h-4 w-4" /> Tambah
            </Button>
          </Link>
        </div>
        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Judul</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Subjek</TableHead>
                  <TableHead>Chapter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((m) => {
                  const ch = allChapters.find((c) => c.id === m.chapter_id);
                  const sub = subjects.find((s) => s.id === ch?.subject_id);
                  const cl = classes.find((c) => c.id === ch?.class_id);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="pl-6 font-medium">{m.title}</TableCell>
                      <TableCell className="text-muted-foreground">{cl?.name ?? "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{sub?.name ?? "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{m.chapter_name}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          m.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {m.status === "published" ? "Published" : "Draft"}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                              <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {
                              setPendingStatus({ id: m.id!, status: m.status === "published" ? "draft" : "published" });
                              setConfirmOpen(true);
                            }}>
                              {m.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {m.status === "published" ? "Draft" : "Publikasikan"}
                            </DropdownMenuItem>
                            <Link to="/teacher/materials/$id/edit" params={{ id: String(m.id!) }}>
                              <DropdownMenuItem>
                                <Pencil className="h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem onClick={() => setDeleteConfirm({ id: m.id!, name: m.title! })}>
                              <Trash2 className="h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="p-8 text-center text-muted-foreground">
                      Tidak ada materi ditemukan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between border-t">
              <p className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</p>
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

      {deleteConfirm && <AlertDialog open onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Materi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah kamu yakin ingin menghapus <strong>{deleteConfirm.name}</strong>? Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => {
              deleteMaterial({ path: { id: deleteConfirm.id } })
              setDeleteConfirm(null)
            }}>Hapus</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Status</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus?.status === "published"
                ? "Publikasikan materi ini agar bisa dilihat oleh murid?"
                : "Ubah materi menjadi draft (tidak tampil di murid)?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Batal</Button>
            <Button onClick={() => {
              if (pendingStatus) {
                toggleStatus({ path: { id: pendingStatus.id }, body: { status: pendingStatus.status } });
              }
              setConfirmOpen(false);
            }}>
              {pendingStatus?.status === "published" ? "Publikasikan" : "Draft"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const Route = createFileRoute("/_dashboard/teacher/materials/")({
  component: AdminMaterials,
});
