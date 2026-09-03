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
  getAdminClassesOptions,
  getAdminProgramsOptions,
  getSubjectsOptions,
} from "@/lib/api/@tanstack/react-query.gen";
import type { SubjectListSubjectsResponse } from "@/lib/api/types.gen";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  ChevronLeft,
  ChevronRight,
  Funnel,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  SearchX,
  BookX,
} from "lucide-react";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useState, useEffect, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { SubjectFormDialog, DeleteSubjectDialog } from "@/components/admin/subjects";
import { usePageHeaderAction, usePageTitle } from "@/components/page-title";
import { useDialogBack } from "@/lib/hooks/use-dialog-back";
const subjectsSearchSchema = z.object({
  search: z.string().optional(),
  class: z.coerce.number().optional(),
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
        render={compact ? <Button variant="outline" size="icon-lg" className="relative" /> : <Button variant="outline" />}
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

function AdminSubjects() {
  usePageTitle("Mata Pelajaran");
  const navigate = useNavigate({ from: Route.fullPath });
  const { search: searchParam, class: classParam, modal } = Route.useSearch();
  const { openModal, closeModal } = useDialogBack();
  const { data: subjects = [], isLoading } = useQuery(
    getSubjectsOptions({
      query: {
        search: searchParam || undefined,
        class_id: classParam,
      },
    })
  );
  const { data: classes = [] } = useQuery(getAdminClassesOptions());
  const { data: programs = [] } = useQuery(getAdminProgramsOptions());
  const [searchInput, setSearchInput] = useState(searchParam ?? "");
  const classFilter = classParam; // number | undefined
  const [page, setPage] = useState(1);
  const activeFilterCount = classFilter === undefined ? 0 : 1;
  const hasActiveFilter = !!searchParam || classFilter !== undefined;
  const [formTarget, setFormTarget] = useState<{ editing: SubjectListSubjectsResponse | null }>({ editing: null });
  const [deleteConfirm, setDeleteConfirm] = useState<SubjectListSubjectsResponse | null>(null);

  useEffect(() => {
    if (modal !== "form") setFormTarget({ editing: null })
    if (modal !== "delete") setDeleteConfirm(null)
  }, [modal])
  const perPage = 5;

  const classOptions = useMemo(
    () => [
      { label: "Semua Kelas", value: "all" },
      ...classes.map((c) => ({ label: c.name ?? "", value: String(c.id) })),
    ],
    [classes]
  );

  const classFilterValue = classFilter === undefined ? "all" : String(classFilter);

  const setClassFilter = (v: string) => {
    navigate({
      search: (prev) => ({ ...prev, class: v === "all" ? undefined : Number(v) }),
      replace: true,
    });
    setPage(1);
  };

  const headerFilter = useMemo(
    () => (
      <ClassFilterMenu
        compact
        value={classFilterValue}
        onValueChange={setClassFilter}
        activeCount={activeFilterCount}
        options={classOptions}
      />
    ),
    [classFilterValue, activeFilterCount, classOptions]
  );
  usePageHeaderAction(headerFilter);

  const totalPages = Math.ceil(subjects.length / perPage);
  const paged = subjects.slice((page - 1) * perPage, page * perPage);

  const openAdd = () => { setFormTarget({ editing: null }); openModal("form") };
  const openEdit = (s: SubjectListSubjectsResponse) => { setFormTarget({ editing: s }); openModal("form") };

  const classNames = (classIds: number[] | undefined) =>
    classIds
      ?.map((id) => classes.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join(", ") ?? "-";

  const programName = (id: number | undefined) =>
    id === undefined ? "-" : programs.find((p) => p.id === id)?.name ?? "-";

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
      <main className="p-4 md:p-6">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Mata Pelajaran</h1>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Cari mata pelajaran"
                placeholder="Cari mata pelajaran..."
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
                  onClick={() => { setSearchInput(""); setPage(1); }}
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="hidden md:inline-flex">
              <ClassFilterMenu
                value={classFilterValue}
                onValueChange={setClassFilter}
                activeCount={activeFilterCount}
                options={classOptions}
              />
            </div>
          </div>
          <Button className="hidden md:inline-flex" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" /> Tambah
          </Button>
        </div>
        {/* Desktop table */}
        <Card className="hidden gap-0 pt-0 pb-0 md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Nama</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Program</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
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
                    <TableCell className="text-muted-foreground">
                      {programName(s.program_id)}
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
                          <DropdownMenuItem onClick={() => { setDeleteConfirm(s); openModal("delete") }}>
                            <Trash2 className="h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Empty className="border-0 p-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">{hasActiveFilter ? <SearchX /> : <BookX />}</EmptyMedia>
                          <EmptyTitle>
                            {hasActiveFilter ? "Tidak ada mata pelajaran yang cocok dengan filter" : "Tidak ada mata pelajaran ditemukan"}
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
          {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between border-t">
              <p className="text-sm text-muted-foreground">
                Halaman {page} dari {totalPages}
              </p>
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

        {/* Mobile card list */}
        <Card className="gap-0 py-0 md:hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={`skeleton-${i}`} className="flex items-start gap-3 p-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paged.length === 0 ? (
              <Empty className="p-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">{hasActiveFilter ? <SearchX /> : <BookX />}</EmptyMedia>
                  <EmptyTitle>
                    {hasActiveFilter ? "Tidak ada mata pelajaran yang cocok dengan filter" : "Tidak ada mata pelajaran ditemukan"}
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
                {paged.map((s) => (
                  <div key={s.id} className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{s.slug}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{programName(s.program_id)}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">{classNames(s.class_ids)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{s.material_count} materi</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="shrink-0" />}>
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => openEdit(s)}>
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setDeleteConfirm(s); openModal("delete") }}>
                          <Trash2 className="h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between border-t">
              <p className="text-sm text-muted-foreground">
                Halaman {page} dari {totalPages}
              </p>
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

      <Button
        onClick={openAdd}
        size="icon"
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:hidden"
        aria-label="Tambah mata pelajaran"
      >
        <Plus className="size-6" />
      </Button>

      {modal === "form" && (
        <SubjectFormDialog
          subject={formTarget.editing ?? undefined}
          onClose={closeModal}
        />
      )}

      {modal === "delete" && deleteConfirm && (
        <DeleteSubjectDialog subject={deleteConfirm} onClose={closeModal} />
      )}
    </>
  );
}

export const Route = createFileRoute("/_dashboard/admin/subjects")({
  component: AdminSubjects,
  validateSearch: subjectsSearchSchema,
});
