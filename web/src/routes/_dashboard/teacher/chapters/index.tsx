import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  getMeOptions,
  getSubjectsOptions,
  patchAdminChaptersByIdMutation,
  postAdminChaptersMutation,
} from "@/lib/api/@tanstack/react-query.gen";
import { postAdminChaptersByIdCover } from "@/lib/api/sdk.gen";
import type { ChapterChapterResponse } from "@/lib/api/types.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Funnel,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  SearchX,
  Trash2,
  X,
} from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { usePageHeaderAction, usePageTitle } from "@/components/page-title";
import { useDialogBack } from "@/lib/hooks/use-dialog-back";

const COVER_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const COVER_MAX = 5 * 1024 * 1024;
const perPage = 10;

const chaptersSearchSchema = z.object({
  search: z.string().optional(),
  classId: z.string().optional(),
  modal: z.string().optional(),
});

function ClassFilterMenu({
  compact,
  value,
  onValueChange,
  activeCount,
  options,
}: {
  compact?: boolean;
  value: string;
  onValueChange: (v: string) => void;
  activeCount: number;
  options: { label: string; value: string }[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={compact ? <Button variant="outline" size="icon" className="relative" /> : <Button variant="outline" />}
        aria-label="Filter kelas"
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
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => { if (v) onValueChange(v); }}>
          <DropdownMenuLabel>Kelas</DropdownMenuLabel>
          {options.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AdminChapters() {
  usePageTitle("BAB");
  const qc = useQueryClient();
  const navigate = useNavigate({ from: Route.fullPath });
  const { search, classId, modal } = Route.useSearch();
  const { openModal, closeModal } = useDialogBack();
  const { data: user } = useQuery(getMeOptions());
  const canManage = user?.roles?.includes("admin") || !!user?.can_manage_materials;
  const { data: chapters = [], isLoading, isError } = useQuery(
    getAdminChaptersOptions({
      query: {
        class_id: classId ? Number(classId) : undefined,
        search: search || undefined,
      },
    })
  );
  const { data: subjects = [] } = useQuery(getSubjectsOptions());
  const { data: classes = [] } = useQuery(getAdminClassesOptions());
  const [searchInput, setSearchInput] = useState(search ?? "");
  const [page, setPage] = useState(1);
  const activeFilterCount = classId ? 1 : 0;
  const hasActiveFilter = !!search || !!classId;
  const [editing, setEditing] = useState<ChapterChapterResponse | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ChapterChapterResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    order: 0,
    class_id: "",
    subject_id: "",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [coverError, setCoverError] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverView, setCoverView] = useState<ChapterChapterResponse | null>(null);

  const classOptions = useMemo(
    () => [
      { label: "Semua Kelas", value: "all" },
      ...classes.map((c) => ({ label: c.name ?? "", value: String(c.id) })),
    ],
    [classes]
  );
  const formClassOptions = classes.map((c) => ({ label: c.name ?? "", value: String(c.id) }));

  // sync URL → local search input
  useEffect(() => { setSearchInput(search ?? "") }, [search]);

  // debounce search input → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, search: searchInput || undefined }), replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, navigate]);

  const setClassFilter = (v: string) => {
    navigate({ search: (prev) => ({ ...prev, classId: v === "all" ? undefined : v }), replace: true });
    setPage(1);
  };

  const headerFilter = useMemo(
    () => (
      <ClassFilterMenu
        compact
        value={classId ?? "all"}
        onValueChange={setClassFilter}
        activeCount={activeFilterCount}
        options={classOptions}
      />
    ),
    [classId, activeFilterCount, classOptions]
  );
  usePageHeaderAction(headerFilter);

  const { mutateAsync: createChapter } = useMutation({
    ...postAdminChaptersMutation(),
    onSuccess: () => qc.invalidateQueries({ queryKey: getAdminChaptersQueryKey() }),
    onError: () => toast.error("Gagal menyimpan bab."),
  });
  const { mutateAsync: updateChapter } = useMutation({
    ...patchAdminChaptersByIdMutation(),
    onSuccess: () => qc.invalidateQueries({ queryKey: getAdminChaptersQueryKey() }),
    onError: () => toast.error("Gagal memperbarui bab."),
  });
  const { mutate: deleteChapter } = useMutation({
    ...deleteAdminChaptersByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminChaptersQueryKey() });
      toast.success("BAB berhasil dihapus.");
    },
    onError: () => toast.error("Gagal menghapus bab."),
  });

  // subjects filtered by form.class_id
  const availableSubjects = form.class_id
    ? subjects.filter((s) => (s.class_ids ?? []).includes(Number(form.class_id)))
    : [];
  const subjectOptions = availableSubjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }));

  useEffect(() => {
    if (modal !== "form") setEditing(null);
    if (modal !== "cover") setCoverView(null);
    if (modal !== "delete") setDeleteConfirm(null);
  }, [modal]);

  const totalPages = Math.max(1, Math.ceil(chapters.length / perPage));
  const paged = chapters.slice((page - 1) * perPage, page * perPage);

  // clamp page kalau data mengecil (mis. setelah hapus item terakhir di halaman)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", description: "", order: 0, class_id: "", subject_id: "" });
    setCoverFile(null);
    setCoverPreview("");
    setCoverError("");
    openModal("form");
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
    setCoverFile(null);
    setCoverPreview("");
    setCoverError("");
    openModal("form");
  };
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setCoverFile(null);
    setCoverPreview("");
    setCoverError("");
    if (!f) return;
    if (!COVER_TYPES.includes(f.type)) {
      setCoverError("Format tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.");
      return;
    }
    if (f.size > COVER_MAX) {
      setCoverError("Ukuran gambar maksimal 5MB.");
      return;
    }
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
  };
  const uploadCover = async (chapterId: number): Promise<boolean> => {
    if (!coverFile) return true;
    setUploadingCover(true);
    try {
      await postAdminChaptersByIdCover({
        path: { id: chapterId },
        body: { image: coverFile },
        throwOnError: true,
      });
      return true;
    } catch {
      return false;
    } finally {
      setUploadingCover(false);
    }
  };
  const save = async () => {
    if (coverError || !form.title || !form.class_id || !form.subject_id) return;
    setSaving(true);
    try {
      if (editing) {
        await updateChapter({
          path: { id: editing.id! },
          body: {
            title: form.title,
            description: form.description,
            order: form.order,
            class_id: Number(form.class_id),
            subject_id: Number(form.subject_id),
          },
        });
        if (coverFile && !(await uploadCover(editing.id!))) {
          toast.error("BAB tersimpan, tapi sampul gagal diunggah.");
          closeModal();
          return;
        }
        toast.success("BAB berhasil diperbarui.");
      } else {
        const data = await createChapter({
          body: {
            title: form.title,
            description: form.description,
            order: form.order,
            class_id: Number(form.class_id),
            subject_id: Number(form.subject_id),
          },
        });
        if (coverFile && data?.id && !(await uploadCover(data.id))) {
          toast.error("BAB ditambahkan, tapi sampul gagal diunggah.");
          closeModal();
          return;
        }
        toast.success("BAB berhasil ditambahkan.");
        setSearchInput("");
        navigate({ search: {}, replace: true });
        setPage(1);
      }
      closeModal();
    } catch {
      toast.error("Gagal menyimpan bab. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <main className="p-4 md:p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <p className="text-muted-foreground">Gagal memuat daftar bab.</p>
            <Button
              variant="outline"
              onClick={() => qc.invalidateQueries({ queryKey: getAdminChaptersQueryKey() })}
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
        <h1 className="text-2xl font-bold tracking-tight">BAB</h1>
        <div className="mb-4 mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 flex-wrap items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Cari bab"
                placeholder="Cari bab..."
                className="pl-9 pr-9"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
              autoComplete="off"/>
              {searchInput && (
                <button
                  type="button"
                  aria-label="Bersihkan pencarian"
                  onClick={() => {
                    setSearchInput("");
                    setPage(1);
                  }}
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="hidden md:inline-flex">
              <ClassFilterMenu
                value={classId ?? "all"}
                onValueChange={setClassFilter}
                activeCount={activeFilterCount}
                options={classOptions}
              />
            </div>
          </div>
          {canManage && modal === "form" && (
            <Dialog open onOpenChange={(o) => !o && closeModal()}>
              <Button className="hidden md:inline-flex" onClick={openAdd}>
                <Plus className="mr-1 h-4 w-4" /> Tambah
              </Button>
              <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editing ? "Ubah BAB" : "Tambah BAB"}</DialogTitle>
                <DialogDescription className="sr-only">
                  {editing ? "Ubah detail bab." : "Buat bab baru dalam hierarki kelas dan mata pelajaran."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Judul bab"
                  autoComplete="off"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cover">Sampul (opsional)</Label>
                  <div className="flex items-center gap-3">
                    {(coverPreview || editing?.cover_url) && (
                      <img
                        src={coverPreview || editing?.cover_url}
                        alt=""
                        className="h-16 w-24 shrink-0 rounded-lg border object-cover"
                      />
                    )}
                    <Input
                      id="cover"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      aria-invalid={!!coverError}
                      onChange={handleCoverChange} autoComplete="off"
                    />
                  </div>
                  {coverError ? (
                    <p className="text-xs text-destructive" role="alert">
                      {coverError}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP. Maks 5MB.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Kelas</Label>
                  <Select
                    id="class"
                    items={formClassOptions}
                    value={form.class_id}
                    onValueChange={(v) => setForm({ ...form, class_id: v ?? "", subject_id: "" })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih kelas">
                        {classes.find((c) => String(c.id) === form.class_id)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {formClassOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Mata Pelajaran</Label>
                  <Select
                    key={`subject-${form.class_id}`}
                    id="subject"
                    items={subjectOptions}
                    value={form.subject_id}
                    onValueChange={(v) => setForm({ ...form, subject_id: v ?? "" })}
                    disabled={!form.class_id}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={form.class_id ? "Pilih mata pelajaran" : "Pilih kelas dulu"}>
                        {availableSubjects.find((s) => String(s.id) === form.subject_id)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {subjectOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Deskripsi</Label>
                  <Textarea
                    id="desc"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Deskripsi singkat"
                    rows={2}
                  autoComplete="off"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order">Urutan</Label>
                  <Input
                    id="order"
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                  autoComplete="off"/>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={closeModal} disabled={saving}>
                    Batal
                  </Button>
                  <Button
                    onClick={save}
                    disabled={!form.title || !form.class_id || !form.subject_id || saving || !!coverError}
                  >
                    {saving
                      ? uploadingCover
                        ? "Mengunggah..."
                        : "Menyimpan..."
                      : editing
                        ? "Simpan"
                        : "Tambah"}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
            </Dialog>
          )}
        </div>
        {/* Desktop table */}
        <Card className="hidden gap-0 pt-0 md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Sampul</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Mata Pelajaran</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Urutan</TableHead>
                  <TableHead>Jumlah Materi</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="pl-6">
                      {c.cover_url ? (
                        <button
                          type="button"
                          aria-label={`Lihat sampul ${c.title}`}
                          onClick={() => { setCoverView(c); openModal("cover") }}
                          className="block cursor-pointer"
                        >
                          <img
                            src={c.cover_url}
                            alt={`Sampul ${c.title}`}
                            className="h-10 w-14 shrink-0 rounded-md border object-cover transition-transform hover:scale-105"
                          />
                        </button>
                      ) : (
                        <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <BookOpen className="h-4 w-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/teacher/chapters/$chapterId/materials", params: { chapterId: String(c.id!) } })}
                        className="font-medium hover:underline"
                      >
                        {c.title}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.class_name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.subject_name}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{c.description}</TableCell>
                    <TableCell className="text-muted-foreground">{c.order}</TableCell>
                    <TableCell>{c.material_count}</TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="outline" size="icon" aria-label={`Menu aksi untuk ${c.title}`} />
                            }
                          >
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => navigate({ to: "/teacher/chapters/$chapterId/materials", params: { chapterId: String(c.id!) } })}>
                              <BookOpen className="h-4 w-4" /> Materi
                            </DropdownMenuItem>
                            {canManage && (
                              <>
                                <DropdownMenuItem onClick={() => openEdit(c)}>
                                  <Pencil className="h-4 w-4" /> Ubah
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" onClick={() => { setDeleteConfirm(c); openModal("delete") }}>
                                  <Trash2 className="h-4 w-4" /> Hapus
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Empty className="border-0 p-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">{hasActiveFilter ? <SearchX /> : <BookOpen />}</EmptyMedia>
                          <EmptyTitle>
                            {hasActiveFilter ? "Tidak ada bab yang cocok dengan filter" : "Belum ada bab"}
                          </EmptyTitle>
                        </EmptyHeader>
                        {hasActiveFilter && (
                          <EmptyContent>
                            <Button variant="outline" size="sm" onClick={() => {
                              setSearchInput("");
                              navigate({ search: {}, replace: true });
                              setPage(1);
                            }}>
                              <X className="mr-1 h-4 w-4" /> Bersihkan filter
                            </Button>
                          </EmptyContent>
                        )}
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t">
            <p className="text-sm text-muted-foreground">
              {chapters.length === 0
                ? "Belum ada data"
                : `Menampilkan ${(page - 1) * perPage + 1}–${Math.min(page * perPage, chapters.length)} dari ${chapters.length} bab`}
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

        {/* Mobile card list */}
        <Card className="gap-0 py-0 md:hidden">
          <CardContent className="p-0">
            {paged.length === 0 ? (
              <Empty className="p-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">{hasActiveFilter ? <SearchX /> : <BookOpen />}</EmptyMedia>
                  <EmptyTitle>
                    {hasActiveFilter ? "Tidak ada bab yang cocok dengan filter" : "Belum ada bab"}
                  </EmptyTitle>
                </EmptyHeader>
                {hasActiveFilter && (
                  <EmptyContent>
                    <Button variant="outline" size="sm" onClick={() => {
                      setSearchInput("");
                      navigate({ search: {}, replace: true });
                      setPage(1);
                    }}>
                      <X className="mr-1 h-4 w-4" /> Bersihkan filter
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            ) : (
              <div className="divide-y">
                {paged.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 p-4">
                    {c.cover_url ? (
                      <button
                        type="button"
                        aria-label={`Lihat sampul ${c.title}`}
                        onClick={() => { setCoverView(c); openModal("cover") }}
                        className="shrink-0 cursor-pointer"
                      >
                        <img
                          src={c.cover_url}
                          alt={`Sampul ${c.title}`}
                          className="h-12 w-16 shrink-0 rounded-md border object-cover"
                        />
                      </button>
                    ) : (
                      <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/teacher/chapters/$chapterId/materials", params: { chapterId: String(c.id!) } })}
                        className="truncate font-medium hover:underline"
                      >
                        {c.title}
                      </button>
                      <p className="mt-0.5 text-sm text-muted-foreground">{c.class_name} · {c.subject_name}</p>
                      {c.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">Urutan {c.order} · {c.material_count} materi</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label={`Menu aksi untuk ${c.title}`} className="shrink-0" />}>
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => navigate({ to: "/teacher/chapters/$chapterId/materials", params: { chapterId: String(c.id!) } })}>
                          <BookOpen className="h-4 w-4" /> Materi
                        </DropdownMenuItem>
                        {canManage && (
                          <>
                            <DropdownMenuItem onClick={() => openEdit(c)}>
                              <Pencil className="h-4 w-4" /> Ubah
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => { setDeleteConfirm(c); openModal("delete") }}>
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
          <CardFooter className="flex items-center justify-between border-t">
            <p className="text-sm text-muted-foreground">
              {chapters.length === 0
                ? "Belum ada data"
                : `Menampilkan ${(page - 1) * perPage + 1}–${Math.min(page * perPage, chapters.length)} dari ${chapters.length} bab`}
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

        {canManage && (
          <Button
            onClick={openAdd}
            size="icon"
            className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:hidden"
            aria-label="Tambah BAB"
          >
            <Plus className="size-6" />
          </Button>
        )}
      </main>

      {modal === "cover" && coverView && (
        <Dialog open onOpenChange={(o) => !o && closeModal()}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Sampul, {coverView.title}</DialogTitle>
              <DialogDescription className="sr-only">
                Pratinjau sampul bab {coverView.title}.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-hidden rounded-lg border">
              <img src={coverView.cover_url} alt={`Sampul ${coverView.title}`} className="w-full" />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {modal === "delete" && deleteConfirm && (
        <AlertDialog open onOpenChange={(open) => !open && closeModal()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus BAB</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah kamu yakin ingin menghapus <strong>{deleteConfirm.title}</strong>? Aksi ini tidak dapat
                dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  deleteChapter({ path: { id: deleteConfirm.id! } });
                  closeModal();
                }}
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

export const Route = createFileRoute("/_dashboard/teacher/chapters/")({
  component: AdminChapters,
  validateSearch: chaptersSearchSchema,
});
