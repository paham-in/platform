import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  getAdminProgramsOptions,
  getAdminClassesOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import type { ProgramProgramResponse, ClassClassResponse } from "@/lib/api/types.gen"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import {
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  FolderOpen,
  Unplug,
  Layers,
} from "lucide-react"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  ProgramFormDialog,
  DeleteProgramDialog,
  AssignOrphanDialog,
} from "@/components/admin/programs"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"

const programsSearchSchema = z.object({
  modal: z.string().optional(),
})

function AdminPrograms() {
  const navigate = useNavigate()
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()
  const { data: programs = [], isLoading } = useQuery(getAdminProgramsOptions())
  const { data: classes = [] } = useQuery(getAdminClassesOptions())
  const [formTarget, setFormTarget] = useState<{ editing: ProgramProgramResponse | null }>({ editing: null })
  const [deleteConfirm, setDeleteConfirm] = useState<ProgramProgramResponse | null>(null)
  const [orphanTarget, setOrphanTarget] = useState<ClassClassResponse | null>(null)

  useEffect(() => {
    if (modal !== "form") setFormTarget({ editing: null })
    if (modal !== "delete") setDeleteConfirm(null)
    if (modal !== "orphan") setOrphanTarget(null)
  }, [modal])

  const goDetail = (id?: number) => {
    if (id) navigate({ to: "/admin/programs/$programId", params: { programId: String(id) } })
  }

  const assignedIds = new Set(programs.flatMap((p) => (p.classes ?? []).map((c) => c.id!)))
  const orphanClasses = classes.filter((c) => !assignedIds.has(c.id!))

  return (
    <>
      <main className="p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Program</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola program dan kelas di dalamnya.
            </p>
          </div>
          <Button className="hidden md:inline-flex" onClick={() => { setFormTarget({ editing: null }); openModal("form") }}>
            <Plus className="mr-1 h-4 w-4" /> Tambah Program
          </Button>
        </div>

        <Card className="hidden gap-0 pt-0 pb-0 md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Nama</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-4">
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : programs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Empty className="border-0 p-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><FolderOpen /></EmptyMedia>
                          <EmptyTitle>Belum ada program</EmptyTitle>
                          <EmptyDescription>Buat program pertama kamu.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : programs.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => goDetail(p.id)}>
                    <TableCell className="pl-6 font-medium">{p.name}</TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">{p.description || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{(p.classes ?? []).length} kelas</Badge>
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Aksi program" />}>
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => { setFormTarget({ editing: p }); openModal("form") }}>
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => { setDeleteConfirm(p); openModal("delete") }}>
                              <Trash2 className="h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-3 md:hidden">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={`skeleton-${i}`}>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
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
            programs.map((p) => (
              <Card key={p.id} className="cursor-pointer" onClick={() => goDetail(p.id)}>
                <CardContent>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.name}</span>
                        <Badge variant="secondary" className="shrink-0">
                          {(p.classes ?? []).length} kelas
                        </Badge>
                      </div>
                      {p.description && (
                        <div className="truncate text-sm text-muted-foreground">{p.description}</div>
                      )}
                    </div>
                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Aksi program" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => { setFormTarget({ editing: p }); openModal("form") }}>
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => { setDeleteConfirm(p); openModal("delete") }}>
                            <Trash2 className="h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
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
                    <p className="min-w-0 truncate text-sm font-medium">{c.name}</p>
                    <Button size="sm" variant="outline" onClick={() => { setOrphanTarget(c); openModal("orphan") }}>
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
        onClick={() => { setFormTarget({ editing: null }); openModal("form") }}
        size="icon"
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:hidden"
        aria-label="Tambah Program"
      >
        <Plus className="size-6" />
      </Button>

      {modal === "form" && (
        <ProgramFormDialog program={formTarget.editing ?? undefined} onClose={closeModal} />
      )}

      {modal === "delete" && deleteConfirm && (
        <DeleteProgramDialog program={deleteConfirm} onClose={closeModal} />
      )}

      {modal === "orphan" && orphanTarget && (
        <AssignOrphanDialog
          classItem={orphanTarget}
          programs={programs}
          onClose={closeModal}
        />
      )}
    </>
  )
}

export const Route = createFileRoute("/_dashboard/admin/programs/")({
  component: AdminPrograms,
  validateSearch: programsSearchSchema,
})
