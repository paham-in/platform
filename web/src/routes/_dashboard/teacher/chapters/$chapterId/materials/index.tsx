import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
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
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import {
  BookOpen,
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
import { useEffect, useMemo, useState } from "react";
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
import { usePageHeaderAction, usePageTitle } from "@/components/page-title";
import { useDialogBack } from "@/lib/hooks/use-dialog-back";

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
  modal: z.string().optional(),
});

function MaterialsFilterMenu({
  compact,
  access,
  type,
  status,
  onAccessChange,
  onTypeChange,
  onStatusChange,
  activeCount,
}: {
  compact?: boolean;
  access: string;
  type: string;
  status: string;
  onAccessChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  activeCount: number;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={compact ? <Button variant="outline" size="icon-lg" className="relative" /> : <Button variant="outline" />}
        aria-label="Filter materi"
      >
        <Funnel className="h-4 w-4" />
        {compact ? (
          activeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )
        ) : (
          <>
            Filter
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52">
        <DropdownMenuRadioGroup value={access} onValueChange={(v) => { if (v) onAccessChange(v); }}>
          <DropdownMenuLabel>Akses</DropdownMenuLabel>
          {freeOptions.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={type} onValueChange={(v) => { if (v) onTypeChange(v); }}>
          <DropdownMenuLabel>Tipe</DropdownMenuLabel>
          {typeOptions.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={status} onValueChange={(v) => { if (v) onStatusChange(v); }}>
          <DropdownMenuLabel>Status</DropdownMenuLabel>
          {statusOptions.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ChapterMaterials() {
  usePageTitle("Materi");
  const { chapterId } = useParams({ from: "/_dashboard/teacher/chapters/$chapterId/materials/" });
  const qc = useQueryClient();
  const navigate = useNavigate({ from: Route.fullPath });
  const { search, access, type, status, modal } = Route.useSearch();
  const { openModal, closeModal } = useDialogBack();
  const [searchInput, setSearchInput] = useState(search ?? "");
  const { data: user } = useQuery(getMeOptions());
  const canManage = user?.roles?.includes("admin") || !!user?.can_manage_materials;
  // materi bisa dikelola kalau punya izin kelola DAN (admin, materi sendiri, atau materi tanpa pemilik)
  const canEdit = (m: { author_id?: number }) => user?.roles?.includes("admin") || m.author_id === user?.id || !m.author_id;
  const { data: materials = [], isLoading, isError } = useQuery(
    getAdminMaterialsOptions({
      query: {
        chapter_id: Number(chapterId),
        search: search || undefined,
        access: access || undefined,
        type: type || undefined,
        status: status || undefined,
      },
    })
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

  const activeFilterCount = [access, type, status].filter((f) => !!f).length;
  const hasActiveFilter = !!search || !!access || !!type || !!status;
  const setAccess = (v: string) => {
    navigate({ search: (prev) => ({ ...prev, access: v === "all" ? undefined : (v as "free" | "paid") }), replace: true });
  };
  const setTypeFilter = (v: string) => {
    navigate({ search: (prev) => ({ ...prev, type: v === "all" ? undefined : (v as "text" | "video") }), replace: true });
  };
  const setStatusFilter = (v: string) => {
    navigate({ search: (prev) => ({ ...prev, status: v === "all" ? undefined : (v as "published" | "draft") }), replace: true });
  };
  const headerFilter = useMemo(
    () => (
      <MaterialsFilterMenu
        compact
        access={access ?? "all"}
        type={type ?? "all"}
        status={status ?? "all"}
        onAccessChange={setAccess}
        onTypeChange={setTypeFilter}
        onStatusChange={setStatusFilter}
        activeCount={activeFilterCount}
      />
    ),
    [access, type, status, activeFilterCount]
  );
  usePageHeaderAction(headerFilter);
  const [pendingStatus, setPendingStatus] = useState<{ id: number; status: string; name: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

  const { mutate: deleteMaterial, isPending: deletingMaterial } = useMutation({
    ...deleteAdminMaterialsByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminMaterialsQueryKey() });
      toast.success("Materi berhasil dihapus");
      closeModal();
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

  useEffect(() => {
    if (modal !== "delete") setDeleteConfirm(null);
    if (modal !== "status") setPendingStatus(null);
  }, [modal]);

  if (isLoading) {
    return (
      <main className="p-4 md:p-6">
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="mb-1 h-8 w-48" />
        <Skeleton className="mb-5 h-4 w-64" />
        <div className="mb-4 flex items-center justify-between gap-4">
          <Skeleton className="h-9 w-full max-w-sm" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Card className="hidden gap-0 pt-0 pb-0 md:block">
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
        <Card className="gap-0 py-0 md:hidden">
          <CardContent className="p-0">
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={`skeleton-mobile-${i}`} className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-1">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 shrink-0 rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="p-4 md:p-6">
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
      <main className="p-4 md:p-6">
        {chapter && (
          <p className="mb-1 text-sm text-muted-foreground">{chapter.title}</p>
        )}
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
                onChange={(e) => { setSearchInput(e.target.value); }}
              autoComplete="off"/>
              {searchInput && (
                <button
                  type="button"
                  aria-label="Bersihkan pencarian"
                  onClick={() => { setSearchInput(""); }}
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="hidden md:inline-flex">
              <MaterialsFilterMenu
                access={access ?? "all"}
                type={type ?? "all"}
                status={status ?? "all"}
                onAccessChange={setAccess}
                onTypeChange={setTypeFilter}
                onStatusChange={setStatusFilter}
                activeCount={activeFilterCount}
              />
            </div>
          </div>
          {canManage && (
            <Button className="hidden md:inline-flex" onClick={() => navigate({ to: "/teacher/chapters/$chapterId/materials/new", params: { chapterId } })}>
              <Plus className="mr-1 h-4 w-4" /> Tambah Materi
            </Button>
          )}
        </div>
        <Card className="hidden gap-0 pt-0 pb-0 md:block">
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
                {materials.map((m) => (
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
                          <DropdownMenuItem onClick={() => navigate({ to: "/user/materials/$materialId", params: { materialId: String(m.id!) } })}>
                            <Eye className="h-4 w-4" /> Lihat
                          </DropdownMenuItem>
                          {canManage && canEdit(m) && (
                            <>
                              <DropdownMenuItem onClick={() => {
                                setPendingStatus({ id: m.id!, status: m.status === "published" ? "draft" : "published", name: m.title! });
                                openModal("status");
                              }}>
                                {m.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {m.status === "published" ? "Jadikan Draft" : "Publikasikan"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate({ to: "/teacher/chapters/$chapterId/materials/$materialId/edit", params: { chapterId, materialId: String(m.id!) } })}>
                                <Pencil className="h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setDeleteConfirm({ id: m.id!, name: m.title! }); openModal("delete") }}>
                                <Trash2 className="h-4 w-4" /> Hapus
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {materials.length === 0 && (
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
                            }}>
                              <X className="mr-1 h-4 w-4" /> Bersihkan filter
                            </Button>
                          ) : canManage ? (
                            <Button size="sm" onClick={() => navigate({ to: "/teacher/chapters/$chapterId/materials/new", params: { chapterId } })}>
                              <Plus className="mr-1 h-4 w-4" /> Tambah materi pertama
                            </Button>
                          ) : null}
                        </EmptyContent>
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mobile card list */}
        <Card className="gap-0 py-0 md:hidden">
          <CardContent className="p-0">
            {materials.length === 0 ? (
              <Empty className="px-6 py-14">
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
                    }}>
                      <X className="mr-1 h-4 w-4" /> Bersihkan filter
                    </Button>
                  ) : canManage ? (
                    <Button size="sm" onClick={() => navigate({ to: "/teacher/chapters/$chapterId/materials/new", params: { chapterId } })}>
                      <Plus className="mr-1 h-4 w-4" /> Tambah materi pertama
                    </Button>
                  ) : null}
                </EmptyContent>
              </Empty>
            ) : (
              <div className="divide-y">
                {materials.map((m) => (
                  <div key={m.id} className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium" title={m.title}>{m.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeStyles[m.type ?? "text"]}`}>
                          {m.type === "video" ? "Video" : "Teks"}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${accessStyles[m.is_free ? "free" : "paid"]}`}>
                          {m.is_free ? <Gift className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                          {m.is_free ? "Gratis" : "Berbayar"}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[m.status === "published" ? "published" : "draft"]}`}>
                          {statusLabels[m.status === "published" ? "published" : "draft"]}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="outline" size="icon" className="shrink-0" aria-label={`Menu aksi untuk ${m.title}`} />}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => navigate({ to: "/user/materials/$materialId", params: { materialId: String(m.id!) } })}>
                          <Eye className="h-4 w-4" /> Lihat
                        </DropdownMenuItem>
                        {canManage && canEdit(m) && (
                          <>
                            <DropdownMenuItem onClick={() => {
                              setPendingStatus({ id: m.id!, status: m.status === "published" ? "draft" : "published", name: m.title! });
                              openModal("status");
                            }}>
                              {m.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {m.status === "published" ? "Jadikan Draft" : "Publikasikan"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate({ to: "/teacher/chapters/$chapterId/materials/$materialId/edit", params: { chapterId, materialId: String(m.id!) } })}>
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setDeleteConfirm({ id: m.id!, name: m.title! }); openModal("delete") }}>
                              <Trash2 className="h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {canManage && (
          <Button
            onClick={() => navigate({ to: "/teacher/chapters/$chapterId/materials/new", params: { chapterId } })}
            size="icon"
            className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:hidden"
            aria-label="Tambah Materi"
          >
            <Plus className="size-6" />
          </Button>
        )}
      </main>

      {modal === "delete" && deleteConfirm && <AlertDialog open onOpenChange={(open) => !open && closeModal()}>
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

      <AlertDialog open={modal === "status" && !!pendingStatus} onOpenChange={(o) => !o && closeModal()}>
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
              closeModal();
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
