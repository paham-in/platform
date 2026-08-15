import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminStudentClassesOptions,
  getAdminStudentClassesQueryKey,
  deleteAdminStudentClassesByIdMutation,
  getAdminProgramsOptions,
  getClassesOptions,
} from "@/lib/api/@tanstack/react-query.gen";
import type { StudentclassStudentClassResponse } from "@/lib/api/types.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Plus, Trash2, KeyRound, MoreVertical, Search, SearchX, X, Funnel } from "lucide-react";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GrantClassDialog } from "@/components/admin/student-classes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const studentClassesSearchSchema = z.object({
  search: z.string().optional(),
  class: z.coerce.number().optional(),
  program: z.coerce.number().optional(),
});

function AdminStudentClasses() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { search: searchParam, class: classFilter, program: programFilter } = Route.useSearch()
  const [searchInput, setSearchInput] = useState(searchParam ?? "")
  const { data: classes = [] } = useQuery(getClassesOptions())
  const { data: programs = [] } = useQuery(getAdminProgramsOptions())
  const { data: items = [], isLoading } = useQuery(
    getAdminStudentClassesOptions({
      query: {
        search: searchParam || undefined,
        class_id: classFilter,
        program_id: programFilter,
      },
    })
  );
  const [page, setPage] = useState(1);
  const [grantOpen, setGrantOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<StudentclassStudentClassResponse | null>(null);
  const perPage = 8;

  // sync URL → local search input (e.g. back/forward, manual URL edit)
  useEffect(() => { setSearchInput(searchParam ?? "") }, [searchParam])

  // debounce search input → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, search: searchInput || undefined }), replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, navigate])

  const classOptions = [
    { label: "Semua Kelas", value: "all" },
    ...classes.map((c) => ({ label: c.name ?? "—", value: String(c.id) })),
  ]
  const programOptions = [
    { label: "Semua Program", value: "all" },
    ...programs.map((p) => ({ label: p.name ?? "—", value: String(p.id) })),
  ]

  const setClassFilter = (v: string) => {
    navigate({ search: (prev) => ({ ...prev, class: v === "all" ? undefined : Number(v) }), replace: true })
    setPage(1)
  }
  const setProgramFilter = (v: string) => {
    navigate({ search: (prev) => ({ ...prev, program: v === "all" ? undefined : Number(v) }), replace: true })
    setPage(1)
  }

  const activeFilterCount = (classFilter ? 1 : 0) + (programFilter ? 1 : 0)
  const hasActiveFilter = !!searchParam || !!classFilter || !!programFilter

  const totalPages = Math.ceil(items.length / perPage);
  const paged = items.slice((page - 1) * perPage, page * perPage);

  return (
    <>
      <main className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hak Akses Murid</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola kelas yang diakses setiap murid dan masa berlakunya.
            </p>
          </div>
          <Button onClick={() => setGrantOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Berikan Akses
          </Button>
        </div>
        <div className="mb-4 flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Cari murid, kelas, atau program"
              placeholder="Cari murid, kelas, atau program..."
              className="pl-9 pr-9"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1) }}
            />
            {searchInput && (
              <button
                type="button"
                aria-label="Bersihkan pencarian"
                onClick={() => { setSearchInput(""); setPage(1) }}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" />}
              aria-label="Filter kelas dan program"
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
              <DropdownMenuRadioGroup value={classFilter ? String(classFilter) : "all"} onValueChange={(v) => { if (v) setClassFilter(v) }}>
                <DropdownMenuLabel>Kelas</DropdownMenuLabel>
                {classOptions.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={programFilter ? String(programFilter) : "all"} onValueChange={(v) => { if (v) setProgramFilter(v) }}>
                <DropdownMenuLabel>Program</DropdownMenuLabel>
                {programOptions.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Murid</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Kadaluarsa</TableHead>
                  <TableHead className="pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="pr-6"><Skeleton className="h-8 w-16 rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paged.map((sp) => (
                  <TableRow key={sp.id}>
                    <TableCell className="pl-6 font-medium">{sp.user?.name ?? "—"}</TableCell>
                    <TableCell>{sp.class?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{sp.class?.program_name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{sp.expiry}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem className="text-destructive" onClick={() => setRevokeTarget(sp)}>
                            <Trash2 className="h-4 w-4" /> Cabut Akses
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Empty className="border-0 p-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">{hasActiveFilter ? <SearchX /> : <KeyRound />}</EmptyMedia>
                          <EmptyTitle>{hasActiveFilter ? "Tidak ada murid yang cocok" : "Belum ada hak akses"}</EmptyTitle>
                        </EmptyHeader>
                        {hasActiveFilter && (
                          <EmptyContent>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearchInput("")
                                navigate({ search: {}, replace: true })
                                setPage(1)
                              }}
                            >
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
      </main>

      {grantOpen && (
        <GrantClassDialog onClose={() => setGrantOpen(false)} />
      )}

      {revokeTarget && (
        <RevokeDialog access={revokeTarget} onClose={() => setRevokeTarget(null)} />
      )}
    </>
  );
}

function RevokeDialog({ access, onClose }: {
  access: StudentclassStudentClassResponse
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { mutate: revoke, isPending } = useMutation({
    ...deleteAdminStudentClassesByIdMutation(),
    onSuccess: () => {
      toast.success("Akses berhasil dicabut")
      qc.invalidateQueries({ queryKey: getAdminStudentClassesQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal mencabut akses"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cabut Hak Akses</AlertDialogTitle>
          <AlertDialogDescription>
            Hapus akses <strong>{access.class?.name}</strong> untuk{" "}
            <strong>{access.user?.name}</strong>? Murid tidak lagi bisa mengakses konten kelas ini.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="destructive" onClick={() => revoke({ path: { id: access.id! } })} disabled={isPending}>
            {isPending && <Spinner className="h-3 w-3" />}
            Cabut
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const Route = createFileRoute("/_dashboard/admin/student-classes")({
  component: AdminStudentClasses,
  validateSearch: studentClassesSearchSchema,
});
