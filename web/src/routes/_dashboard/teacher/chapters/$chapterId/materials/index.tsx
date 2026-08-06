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
} from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

function ChapterMaterials() {
  const { chapterId } = useParams({ from: "/_dashboard/teacher/chapters/$chapterId/materials/" });
  const qc = useQueryClient();
  const { data: materials = [], isLoading } = useQuery(
    getAdminMaterialsOptions({ query: { chapter_id: Number(chapterId) } })
  );
  const { data: chapters = [] } = useQuery(getAdminChaptersOptions());
  const chapter = chapters.find((c) => c.id === Number(chapterId));
  const [search, setSearch] = useState("");
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

  const filtered = materials.filter((m) =>
    (m.title ?? "").toLowerCase().includes(search.toLowerCase())
  );
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
        <div className="mb-4 flex items-center gap-2">
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
        <h1 className="mb-1 text-2xl font-bold tracking-tight">
          Materi {chapter ? `— ${chapter.title}` : ""}
        </h1>
        {chapter && (
          <p className="mb-4 text-sm text-muted-foreground">
            {chapter.class_name} • {chapter.subject_name}
          </p>
        )}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari materi..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
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
                    <TableCell className="pl-6 font-medium">{m.title}</TableCell>
                    <TableCell>
                      {m.type === "video" ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Video</span>
                      ) : (
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">Teks</span>
                      )}
                    </TableCell>
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
                    <TableCell colSpan={4} className="p-8 text-center text-muted-foreground">
                      Belum ada materi di chapter ini
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

export const Route = createFileRoute("/_dashboard/teacher/chapters/$chapterId/materials/")({
  component: ChapterMaterials,
});
