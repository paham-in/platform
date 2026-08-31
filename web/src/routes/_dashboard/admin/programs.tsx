import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  getAdminProgramsOptions,
  getAdminProgramsQueryKey,
  getAdminClassesOptions,
  deleteAdminProgramsClassesByClassIdMutation,
} from "@/lib/api/@tanstack/react-query.gen";
import type { ProgramProgramResponse, ClassClassResponse } from "@/lib/api/types.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronRight,
  Layers,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  FolderOpen,
  Unplug,
} from "lucide-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
import { Spinner } from "@/components/ui/spinner";
import {
  ProgramFormDialog,
  DeleteProgramDialog,
  AssignOrphanDialog,
} from "@/components/admin/programs";
import { ClassFormDialog, DeleteClassDialog } from "@/components/admin/classes";
import { usePageTitle } from "@/components/page-title";

function AdminPrograms() {
  usePageTitle("Program");
  const { data: programs = [], isLoading } = useQuery(getAdminProgramsOptions());
  const { data: classes = [] } = useQuery(getAdminClassesOptions());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [formTarget, setFormTarget] = useState<{ open: boolean; editing: ProgramProgramResponse | null }>({ open: false, editing: null });
  const [deleteConfirm, setDeleteConfirm] = useState<ProgramProgramResponse | null>(null);
  const [orphanTarget, setOrphanTarget] = useState<ClassClassResponse | null>(null);
  const [createClassTarget, setCreateClassTarget] = useState<ProgramProgramResponse | null>(null);
  const [unassignTarget, setUnassignTarget] = useState<ClassClassResponse | null>(null);
  const [editClassTarget, setEditClassTarget] = useState<ClassClassResponse | null>(null);
  const [deleteClassTarget, setDeleteClassTarget] = useState<ClassClassResponse | null>(null);

  const qc = useQueryClient()
  const unassignMut = useMutation({
    ...deleteAdminProgramsClassesByClassIdMutation(),
    onSuccess: () => {
      toast.success("Kelas dilepas dari program")
      qc.invalidateQueries({ queryKey: getAdminProgramsQueryKey() })
    },
    onError: (err: any) => toast.error(err.error || "Gagal melepas kelas"),
  })

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const assignedIds = new Set(programs.flatMap((p) => (p.classes ?? []).map((c) => c.id!)))
  const orphanClasses = classes.filter((c) => !assignedIds.has(c.id!))
  const classById = new Map(classes.map((c) => [c.id!, c]))

  const priceLabel = (cls?: ClassClassResponse) => {
    if (!cls) return ""
    const parts: string[] = []
    if (cls.price_per_session) parts.push(`Rp ${cls.price_per_session.toLocaleString("id-ID")} / pertemuan`)
    if (cls.group_price) parts.push(`kelompok: Rp ${cls.group_price.toLocaleString("id-ID")} / pertemuan`)
    return parts.join(" · ")
  }

  return (
    <>
      <main className="p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="hidden md:block text-2xl font-bold tracking-tight">Program</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola program dan kelas di dalamnya.
            </p>
          </div>
          <Button className="hidden md:inline-flex" onClick={() => setFormTarget({ open: true, editing: null })}>
            <Plus className="mr-1 h-4 w-4" /> Tambah Program
          </Button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={`skeleton-${i}`}>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : programs.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><FolderOpen /></EmptyMedia>
                <EmptyTitle>Belum ada program</EmptyTitle>
                <EmptyDescription>Buat program pertama kamu.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            programs.map((p) => {
              const isOpen = expanded.has(p.id!)
              const classCount = (p.classes ?? []).length
              return (
                <Card key={p.id}>
                  <CardHeader>
                    <div
                      className="flex cursor-pointer items-center justify-between gap-3"
                      onClick={() => p.id && toggle(p.id)}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{p.name}</span>
                            <Badge variant="secondary" className="shrink-0">
                              {classCount} kelas
                            </Badge>
                          </div>
                          {p.description && (
                            <div className="truncate text-sm text-muted-foreground">{p.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setFormTarget({ open: true, editing: p })}>
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteConfirm(p)}>
                              <Trash2 className="h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>

                  {isOpen && (
                    <CardContent>
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium">Kelas</p>
                        {(p.classes ?? []).length === 0 ? (
                          <Empty className="border-0 px-0 py-4">
                            <EmptyHeader className="gap-1">
                              <EmptyMedia variant="icon"><Layers /></EmptyMedia>
                              <EmptyTitle className="text-sm">Belum ada kelas dalam program ini</EmptyTitle>
                            </EmptyHeader>
                          </Empty>
                        ) : (
                          <ul className="divide-y">
                            {(p.classes ?? []).map((c) => (
                              <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium">{c.name}</p>
                                  {priceLabel(classById.get(c.id!)) && (
                                    <p className="truncate text-xs text-muted-foreground">
                                      {priceLabel(classById.get(c.id!))}
                                    </p>
                                  )}
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={<Button variant="outline" size="icon" />}
                                    aria-label={`Menu aksi untuk ${c.name}`}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => c.id && setEditClassTarget(c)}>
                                      <Pencil className="h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => c.id && setUnassignTarget(c)}>
                                      <Unplug className="h-4 w-4" /> Lepas
                                    </DropdownMenuItem>
                                    <DropdownMenuItem variant="destructive" onClick={() => c.id && setDeleteClassTarget(c)}>
                                      <Trash2 className="h-4 w-4" /> Hapus
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="pt-2">
                          <Button size="sm" variant="outline" onClick={() => setCreateClassTarget(p)}>
                            <Plus className="mr-1 h-3.5 w-3.5" /> Buat Kelas
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })
          )}
        </div>

        {orphanClasses.length > 0 && (
          <Card className="mt-6">
            <CardContent>
              <h2 className="flex items-center gap-2 font-medium">
                <Unplug className="h-4 w-4 text-muted-foreground" />
                Kelas Tanpa Program
                <Badge variant="secondary">{orphanClasses.length}</Badge>
              </h2>
              <ul className="mt-3 divide-y">
                {orphanClasses.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{c.name}</p>
                      {priceLabel(c) && (
                        <p className="truncate text-xs text-muted-foreground">{priceLabel(c)}</p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setOrphanTarget(c)}>
                      <Layers className="mr-1 h-3.5 w-3.5" /> Masukkan ke Program
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </main>

      <Button
        onClick={() => setFormTarget({ open: true, editing: null })}
        size="icon"
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:hidden"
        aria-label="Tambah Program"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {formTarget.open && (
        <ProgramFormDialog program={formTarget.editing ?? undefined} onClose={() => setFormTarget({ open: false, editing: null })} />
      )}

      {deleteConfirm && (
        <DeleteProgramDialog program={deleteConfirm} onClose={() => setDeleteConfirm(null)} />
      )}

      {orphanTarget && (
        <AssignOrphanDialog
          classItem={orphanTarget}
          programs={programs}
          onClose={() => setOrphanTarget(null)}
        />
      )}

      {createClassTarget && (
        <ClassFormDialog
          programId={createClassTarget.id}
          onClose={() => setCreateClassTarget(null)}
        />
      )}

      {editClassTarget && (
        <ClassFormDialog
          class={editClassTarget}
          onClose={() => setEditClassTarget(null)}
        />
      )}

      {deleteClassTarget && (
        <DeleteClassDialog
          class={deleteClassTarget}
          onClose={() => setDeleteClassTarget(null)}
        />
      )}

      {unassignTarget && (
        <AlertDialog open onOpenChange={(open) => !open && setUnassignTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Lepas Kelas dari Program</AlertDialogTitle>
              <AlertDialogDescription>
                Kelas <strong>{unassignTarget.name}</strong> akan dilepas dari program ini.
                Kelas tetap ada, tapi tidak lagi masuk program tersebut.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={unassignMut.isPending}
                onClick={() => {
                  unassignMut.mutate({ path: { class_id: unassignTarget.id! } })
                  setUnassignTarget(null)
                }}
              >
                {unassignMut.isPending && <Spinner />}
                Lepas
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

export const Route = createFileRoute("/_dashboard/admin/programs")({
  component: AdminPrograms,
});
