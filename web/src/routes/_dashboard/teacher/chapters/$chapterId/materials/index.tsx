import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
  getMeOptions,
  patchAdminMaterialsByIdMutation,
} from "@/lib/api/@tanstack/react-query.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Gift,
  Lock,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  SearchX,
  Funnel,
  Trash2,
  X,
} from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

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

const accessStyles: Record<string, string> = {
  free: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
  paid: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
};

const freeOptions = [
  { label: "Semua Akses", value: "all" },
  { label: "Gratis", value: "free" },
  { label: "Berbayar", value: "paid" },
];

const typeOptions = [
  { label: "Semua Tipe", value: "all" },
  { label: "Teks", value: "text" },
  { label: "Video", value: "video" },
];

const statusOptions = [
  { label: "Semua Status", value: "all" },
  { label: "Tayang", value: "published" },
  { label: "Draf", value: "draft" },
];

const materialsSearchSchema = z.object({
  search: z.string().optional(),
  access: z.enum(["free", "paid"]).optional(),
  type: z.enum(["text", "video"]).optional(),
  status: z.enum(["published", "draft"]).optional(),
});

function ChapterMaterials() {
  const { chapterId } = useParams({ from: "/_dashboard/teacher/chapters/$chapterId/materials/" });
  const qc = useQueryClient();
  const navigate = useNavigate({ from: Route.fullPath });
  const { search, access, type, status } = Route.useSearch();
  const [searchInput, setSearchInput] = useState(search ?? "");
  const { data: user } = useQuery(getMeOptions());
  const canManage = user?.roles?.includes("admin") || !!user?.can_manage_materials;
  // materi bisa dikelola kalau punya izin kelola DAN (admin, materi sendiri, atau materi tanpa pemilik)
  const canEdit = (m: { author_id?: number }) => user?.roles?.includes("admin") || m.author_id === user?.id || !m.author_id;
  const { data: materials = [], isLoading, isError } = useQuery(
    getAdminMaterialsOptions({ query: { chapter_id: Number(chapterId) } })
  );
  const { data: chapters = [] } = useQuery(getAdminChaptersOptions());
  const chapter = chapters.find((c) => c.id === Number(chapterId));

  // sync URL → local search input (e.g. back/forward, manual URL edit)
  useEffect(() => { setSearchInput(search ?? "") }, [search]);

  // debounce search input → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, search: searchInput || undefined }), replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, navigate]);

  const [page, setPage] = useState(1);
  const activeFilterCount = [access, type, status].filter((f) => !!f).length;
  const hasActiveFilter = !!search || !!access || !!type || !!status;
  const setAccess = (v: string) => {
    navigate({ search: (prev) => ({ ...prev, access: v === "all" ? undefined : (v as "free" | "paid") }), replace: true });
    setPage(1);
  };
  const setTypeFilter = (v: string) => {
    navigate({ search: (prev) => ({ ...prev, type: v === "all" ? undefined : (v as "text" | "video") }), replace: true });
    setPage(1);
  };
  const setStatusFilter = (v: string) => {
    navigate({ search: (prev) => ({ ...prev, status: v === "all" ? undefined : (v as "published" | "draft") }), replace: true });
    setPage(1);
  };
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<{ id: number; status: string; name: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

  const { mutate: deleteMaterial, isPending: deletingMaterial } = useMutation({
    ...deleteAdminMaterialsByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminMaterialsQueryKey() });
      toast.success("Materi berhasil dihapus");
      setDeleteConfirm(null);
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

  const filtered = materials.filter((m) => {
    const matchSearch = !search || (m.title ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFree = !access || (access === "free" ? m.is_free : !m.is_free);
    const matchType = !type || m.type === type;
    const matchStatus = !status || (m.status ?? "draft") === status;
    return matchSearch && matchFree && matchType && matchStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // clamp page kalau data mengecil (mis. setelah hapus item terakhir di halaman)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (isLoading) {
    return (
      <main className="p-6">
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="mb-1 h-8 w-48" />
        <Skeleton className="mb-5 h-4 w-64" />
        <div className="mb-4 flex items-center justify-between gap-4">
          <Skeleton className="h-9 w-full max-w-sm" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Judul</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Akses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell className="pr-6 text-right"><Skeleton className="ml-auto h-8 w-8 rounded" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
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
            <ArrowLeft className="h-4 w-4" /> BAB
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
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Cari materi"
                placeholder="Cari materi..."
                className="pl-9 pr-9"
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
              />
              {searchInput && (
                <button
                  type="button"
                  aria-label="Bersihkan pencarian"
                  onClick={() => { setSearchInput(""); setPage(1); }}
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" />}
                aria-label="Filter materi"
              >
                <Funnel className="h-4 w-4" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52">
                <DropdownMenuRadioGroup value={access ?? "all"} onValueChange={(v) => { if (v) setAccess(v); }}>
                  <DropdownMenuLabel>Akses</DropdownMenuLabel>
                  {freeOptions.map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={type ?? "all"} onValueChange={(v) => { if (v) setTypeFilter(v); }}>
                  <DropdownMenuLabel>Tipe</DropdownMenuLabel>
                  {typeOptions.map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={status ?? "all"} onValueChange={(v) => { if (v) setStatusFilter(v); }}>
                  <DropdownMenuLabel>Status</DropdownMenuLabel>
                  {statusOptions.map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {canManage && (
            <Link to="/teacher/chapters/$chapterId/materials/new" params={{ chapterId }}>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> Tambah Materi
              </Button>
            </Link>
          )}
        </div>
        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Judul</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Akses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="max-w-xs truncate pl-6 font-medium" title={m.title}>{m.title}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeStyles[m.type ?? "text"]}`}>
                        {m.type === "video" ? "Video" : "Teks"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${accessStyles[m.is_free ? "free" : "paid"]}`}>
                        {m.is_free ? <Gift className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                        {m.is_free ? "Gratis" : "Berbayar"}
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
                          <Link to="/user/materials/$materialId" params={{ materialId: String(m.id!) }}>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4" /> Lihat
                            </DropdownMenuItem>
                          </Link>
                          {canManage && canEdit(m) && (
                            <>
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
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Empty className="border-0 px-6 py-14">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">{hasActiveFilter ? <SearchX /> : <BookOpen />}</EmptyMedia>
                          <EmptyTitle>
                            {hasActiveFilter ? "Tidak ada hasil" : "Belum ada materi"}
                          </EmptyTitle>
                          {hasActiveFilter ? (
                            <EmptyDescription>
                              Tidak ada materi yang cocok dengan pencarian atau filter saat ini.
                            </EmptyDescription>
                          ) : canManage ? (
                            <EmptyDescription>
                              Buat materi pertama untuk bab ini agar murid bisa mulai belajar.
                            </EmptyDescription>
                          ) : null}
                        </EmptyHeader>
                        <EmptyContent>
                          {hasActiveFilter ? (
                            <Button variant="outline" size="sm" onClick={() => {
                              setSearchInput("");
                              navigate({ search: {}, replace: true });
                              setPage(1);
                            }}>
                              <X className="mr-1 h-4 w-4" /> Bersihkan filter
                            </Button>
                          ) : canManage ? (
                            <Link to="/teacher/chapters/$chapterId/materials/new" params={{ chapterId }}>
                              <Button size="sm">
                                <Plus className="mr-1 h-4 w-4" /> Tambah materi pertama
                              </Button>
                            </Link>
                          ) : null}
                        </EmptyContent>
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          {filtered.length > 0 && (
            <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t">
              <p className="text-sm text-muted-foreground">
                Menampilkan {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} dari {filtered.length} materi
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
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleteMaterial({ path: { id: deleteConfirm.id } })} disabled={deletingMaterial}>
              {deletingMaterial && <Spinner />}
              Hapus
            </AlertDialogAction>
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
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingStatus) {
                toggleStatus({ path: { id: pendingStatus.id }, body: { status: pendingStatus.status } });
              }
              setConfirmOpen(false);
            }}>
              {pendingStatus?.status === "published" ? "Publikasikan" : "Jadikan Draft"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const Route = createFileRoute("/_dashboard/teacher/chapters/$chapterId/materials/")({
  component: ChapterMaterials,
  validateSearch: materialsSearchSchema,
});
