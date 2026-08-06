import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  getAdminMaterialsOptions,
  getAdminMaterialsQueryKey,
  patchAdminMaterialsByIdMutation,
} from "@/lib/api/@tanstack/react-query.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
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
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const perPage = 10;

const typeStyles: Record<string, string> = {
  video: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  text: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
};

const statusStyles: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  draft: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

const statusLabels: Record<string, string> = {
  published: "Tayang",
  draft: "Draf",
};

function ChapterMaterials() {
  const { chapterId } = useParams({ from: "/_dashboard/teacher/chapters/$chapterId/materials/" });
  const qc = useQueryClient();
  const { data: materials = [], isLoading, isError } = useQuery(
    getAdminMaterialsOptions({ query: { chapter_id: Number(chapterId) } })
  );
  const { data: chapters = [] } = useQuery(getAdminChaptersOptions());
  const chapter = chapters.find((c) => c.id === Number(chapterId));
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<{ id: number; status: string; name: string } | null>(null);
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
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: getAdminMaterialsQueryKey() });
      toast.success(
        variables.body?.status === "published"
          ? "Materi berhasil dipublikasikan."
          : "Materi disimpan sebagai draft."
      );
    },
    onError: (err: any) => {
      toast.error(err?.error || err?.message || "Gagal mengubah status");
    },
  });

  const filtered = materials.filter((m) =>
    (m.title ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // clamp page kalau data mengecil (mis. setelah hapus item terakhir di halaman)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <main className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <p className="text-muted-foreground">Gagal memuat daftar materi.</p>
            <Button
              variant="outline"
              onClick={() => qc.invalidateQueries({ queryKey: getAdminMaterialsQueryKey() })}
            >
              Muat Ulang
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <>
      <main className="p-6">
        <div className="mb-2 flex items-center gap-2">
          <Link to="/teacher/chapters" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Chapter
          </Link>
          {chapter && (
            <>
              <span className="text-sm text-muted-foreground">/</span>
              <span className="text-sm font-medium">{chapter.title}</span>
            </>
          )}
        </div>
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Materi</h1>
        {chapter && (
          <p className="mb-5 text-sm text-muted-foreground">
            {chapter.class_name} • {chapter.subject_name}
          </p>
        )}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari materi..."
              className="pl-9 pr-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button
                type="button"
                aria-label="Bersihkan pencarian"
                onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Link to="/teacher/chapters/$chapterId/materials/new" params={{ chapterId }}>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> Tambah Materi
            </Button>
          </Link>
        </div>
        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Judul</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="max-w-xs truncate pl-6 font-medium">{m.title}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeStyles[m.type ?? "text"]}`}>
                        {m.type === "video" ? "Video" : "Teks"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[m.status === "published" ? "published" : "draft"]}`}>
                        {statusLabels[m.status === "published" ? "published" : "draft"]}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="outline" size="icon" aria-label={`Menu aksi untuk ${m.title}`} />
                          }
                        >
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => {
                            setPendingStatus({ id: m.id!, status: m.status === "published" ? "draft" : "published", name: m.title! });
                            setConfirmOpen(true);
                          }}>
                            {m.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {m.status === "published" ? "Jadikan Draft" : "Publikasikan"}
                          </DropdownMenuItem>
                          <Link to="/teacher/chapters/$chapterId/materials/$materialId/edit" params={{ chapterId, materialId: String(m.id!) }}>
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
                ))}
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="p-8 text-center">
                      {search ? (
                        <p className="text-muted-foreground">
                          Tidak ada materi yang cocok dengan &ldquo;{search}&rdquo;.
                        </p>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <p className="text-muted-foreground">Belum ada materi di chapter ini.</p>
                          <Link to="/teacher/chapters/$chapterId/materials/new" params={{ chapterId }}>
                            <Button size="sm" variant="outline">
                              <Plus className="mr-1 h-4 w-4" /> Tambah materi pertama
                            </Button>
                          </Link>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t">
            <p className="text-sm text-muted-foreground">
              {filtered.length === 0
                ? "Belum ada data"
                : `Menampilkan ${(page - 1) * perPage + 1}–${Math.min(page * perPage, filtered.length)} dari ${filtered.length} materi`}
            </p>
            {totalPages > 1 && (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Halaman sebelumnya"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Halaman berikutnya"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardFooter>
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
                ? `Publikasikan materi "${pendingStatus?.name}" agar bisa dilihat oleh murid?`
                : `Ubah materi "${pendingStatus?.name}" menjadi draft (tidak tampil di murid)?`}
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
              {pendingStatus?.status === "published" ? "Publikasikan" : "Jadikan Draft"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const Route = createFileRoute("/_dashboard/teacher/chapters/$chapterId/materials/")({
  component: ChapterMaterials,
});
