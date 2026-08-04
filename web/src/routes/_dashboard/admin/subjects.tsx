import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
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
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { ClassClassResponse } from "@/lib/api/types.gen";

type ClassOption = Pick<ClassClassResponse, "id" | "name">;

const subjectsSearchSchema = z.object({
  search: z.string().optional(),
  class: z.coerce.number().optional(),
});

function AdminSubjects() {
  const qc = useQueryClient();
  const navigate = useNavigate({ from: Route.fullPath });
  const { search: searchParam, class: classParam } = Route.useSearch();
  const { data: subjects = [], isLoading } = useQuery(getSubjectsOptions());
  const { data: classes = [] } = useQuery(getAdminClassesOptions());
  const comboboxAnchor = useComboboxAnchor();
  const [searchInput, setSearchInput] = useState(searchParam ?? "");
  const classFilter = classParam; // number | undefined
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectSubjectResponse | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<SubjectSubjectResponse | null>(null);
  const [form, setForm] = useState<{ name: string; classes: ClassOption[] }>({ name: "", classes: [] });
  const perPage = 5;

  const classOptions = [
    { label: "Semua Kelas", value: "all" },
    ...classes.map((c) => ({ label: c.name ?? "", value: String(c.id) })),
  ];

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
    const matchSearch = !searchParam || (s.name ?? "").toLowerCase().includes(searchParam.toLowerCase());
    const matchClass = classFilter === undefined || (s.class_ids ?? []).includes(classFilter);
    return matchSearch && matchClass;
  });
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", classes: [] });
    setDialogOpen(true);
  };
  const openEdit = (s: SubjectSubjectResponse) => {
    setEditing(s);
    setForm({
      name: s.name ?? "",
      classes: (s.class_ids ?? [])
        .map((id) => classes.find((c) => c.id === id))
        .filter((c): c is ClassOption => Boolean(c?.id && c?.name)),
    });
    setDialogOpen(true);
  };
  const save = () => {
    const classIds = form.classes.map((c) => c.id!).filter((id) => id !== undefined);
    if (editing) {
      updateSubject({
        path: { id: editing.id! },
        body: {
          name: form.name || undefined,
          class_ids: classIds,
        },
      });
    } else {
      createSubject({
        body: {
          name: form.name,
          class_ids: classIds,
        },
      });
    }
  };

  const classNames = (classIds: number[] | undefined) =>
    classIds
      ?.map((id) => classes.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join(", ") ?? "-";

  // Sync URL → local state when search changes externally
  useEffect(() => { setSearchInput(searchParam ?? "") }, [searchParam]);

  // Debounce search → navigate to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({
        search: (prev) => ({ ...prev, search: searchInput || undefined }),
        replace: true,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

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
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              items={classOptions}
              value={classFilter === undefined ? "all" : String(classFilter)}
              onValueChange={(v) => {
                if (v) {
                  navigate({
                    search: (prev) => ({ ...prev, class: v === "all" ? undefined : Number(v) }),
                    replace: true,
                  });
                  setPage(1);
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Kelas" />
              </SelectTrigger>
              <SelectContent>
                {classOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
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
                  <Label>Kelas</Label>
                  <Combobox
                    multiple
                    autoHighlight
                    items={classes as ClassOption[]}
                    value={form.classes}
                    onValueChange={(next) => setForm((prev) => ({ ...prev, classes: next ?? [] }))}
                    itemToStringLabel={(c: ClassOption) => c.name ?? ""}
                  >
                    <ComboboxChips ref={comboboxAnchor} className="w-full">
                      <ComboboxValue>
                        {(values: ClassOption[]) => (
                          <>
                            {values.map((c) => (
                              <ComboboxChip key={c.id}>{c.name}</ComboboxChip>
                            ))}
                            <ComboboxChipsInput placeholder="Pilih kelas..." />
                          </>
                        )}
                      </ComboboxValue>
                    </ComboboxChips>
                    <ComboboxContent anchor={comboboxAnchor}>
                      <ComboboxEmpty>Kelas tidak ditemukan</ComboboxEmpty>
                      <ComboboxList>
                        {(c: ClassOption) => (
                          <ComboboxItem key={c.id} value={c}>
                            {c.name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
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
                  <TableHead>Kelas</TableHead>
                  <TableHead>Jumlah Materi</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="pl-6"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="max-w-[200px]"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paged.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="pl-6 font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.slug}
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
                {!isLoading && paged.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
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
  validateSearch: subjectsSearchSchema,
});
