import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ProgramFormDialog,
  DeleteProgramDialog,
  AssignClassesDialog,
  AssignOrphanDialog,
} from "@/components/admin/programs";

function AdminPrograms() {
  const { data: programs = [], isLoading } = useQuery(getAdminProgramsOptions());
  const { data: classes = [] } = useQuery(getAdminClassesOptions());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [formTarget, setFormTarget] = useState<{ open: boolean; editing: ProgramProgramResponse | null }>({ open: false, editing: null });
  const [deleteConfirm, setDeleteConfirm] = useState<ProgramProgramResponse | null>(null);
  const [assignTarget, setAssignTarget] = useState<ProgramProgramResponse | null>(null);
  const [orphanTarget, setOrphanTarget] = useState<ClassClassResponse | null>(null);

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

  return (
    <>
      <main className="p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Program</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola program dan kelas di dalamnya.
            </p>
          </div>
          <Button onClick={() => setFormTarget({ open: true, editing: null })}>
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
            <Card>
              <CardContent className="flex flex-col items-center gap-2 text-center">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">Belum ada program. Buat program pertama kamu.</p>
              </CardContent>
            </Card>
          ) : (
            programs.map((p) => {
              const isOpen = expanded.has(p.id!)
              const classCount = (p.classes ?? []).length
              return (
                <Card key={p.id}>
                  <CardContent>
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
                            <DropdownMenuItem onClick={() => setAssignTarget(p)}>
                              <Layers className="h-4 w-4" /> Atur Kelas
                            </DropdownMenuItem>
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

                    {isOpen && (
                      <div className="mt-3 border-t pt-3">
                        {(p.classes ?? []).length === 0 ? (
                          <div className="flex items-center justify-between gap-3 py-1">
                            <p className="text-sm text-muted-foreground">Belum ada kelas dalam program ini.</p>
                            <Button size="sm" variant="outline" onClick={() => setAssignTarget(p)}>
                              <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Kelas
                            </Button>
                          </div>
                        ) : (
                          <ul className="divide-y">
                            {(p.classes ?? []).map((c) => (
                              <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                                <span className="text-sm">{c.name}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() => c.id && unassignMut.mutate({ path: { class_id: c.id } })}
                                  disabled={unassignMut.isPending}
                                >
                                  <Unplug className="mr-1 h-3.5 w-3.5" /> Lepas
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </CardContent>
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
                    <span className="text-sm">{c.name}</span>
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

      {formTarget.open && (
        <ProgramFormDialog program={formTarget.editing ?? undefined} onClose={() => setFormTarget({ open: false, editing: null })} />
      )}

      {deleteConfirm && (
        <DeleteProgramDialog program={deleteConfirm} onClose={() => setDeleteConfirm(null)} />
      )}

      {assignTarget && (
        <AssignClassesDialog program={assignTarget} classes={classes as ClassClassResponse[]} onClose={() => setAssignTarget(null)} />
      )}

      {orphanTarget && (
        <AssignOrphanDialog
          classItem={orphanTarget}
          programs={programs}
          onClose={() => setOrphanTarget(null)}
        />
      )}
    </>
  );
}

export const Route = createFileRoute("/_dashboard/admin/programs")({
  component: AdminPrograms,
});
