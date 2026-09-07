import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  getAdminProgramsOptions,
  getAdminProgramsQueryKey,
  getAdminClassesOptions,
  getAdminClassesQueryKey,
  deleteAdminProgramsClassesByClassIdMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import type { ClassClassResponse } from "@/lib/api/types.gen"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import {
  Layers,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Unplug,
} from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { ClassFormDialog, DeleteClassDialog } from "@/components/admin/classes"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"

const programDetailSearchSchema = z.object({
  modal: z.string().optional(),
})

const fmtRp = (n?: number) => (n ? `Rp ${n.toLocaleString("id-ID")}` : "—")

function AdminProgramDetail() {
  const navigate = useNavigate()
  const { programId } = Route.useParams()
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()
  const { data: programs = [], isLoading } = useQuery(getAdminProgramsOptions())
  const { data: classes = [] } = useQuery(getAdminClassesOptions())
  const [creating, setCreating] = useState(false)
  const [editClassTarget, setEditClassTarget] = useState<ClassClassResponse | null>(null)
  const [deleteClassTarget, setDeleteClassTarget] = useState<ClassClassResponse | null>(null)
  const [unassignTarget, setUnassignTarget] = useState<ClassClassResponse | null>(null)

  useEffect(() => {
    if (modal !== "create-class") setCreating(false)
    if (modal !== "edit-class") setEditClassTarget(null)
    if (modal !== "delete-class") setDeleteClassTarget(null)
    if (modal !== "unassign") setUnassignTarget(null)
  }, [modal])

  const qc = useQueryClient()
  const unassignMut = useMutation({
    ...deleteAdminProgramsClassesByClassIdMutation(),
    onSuccess: () => {
      toast.success("Kelas dilepas dari program")
      qc.invalidateQueries({ queryKey: getAdminProgramsQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminClassesQueryKey() })
      closeModal()
    },
    onError: (err: any) => toast.error(err.error || "Gagal melepas kelas"),
  })

  const program = programs.find((p) => p.id === Number(programId))
  const classById = new Map(classes.map((c) => [c.id!, c]))
  // harga lengkap dari daftar kelas; program.classes hanya info minimal.
  const programClasses: ClassClassResponse[] = (program?.classes ?? [])
    .map((c) => classById.get(c.id!))
    .filter((c): c is ClassClassResponse => c !== undefined)

  if (!isLoading && !program) {
    return (
      <main className="p-4 md:p-6">
        <Empty className="p-8">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Layers /></EmptyMedia>
            <EmptyTitle>Program tidak ditemukan</EmptyTitle>
          </EmptyHeader>
          <Button variant="outline" onClick={() => navigate({ to: "/admin/programs" })}>Kembali ke daftar</Button>
        </Empty>
      </main>
    )
  }

  const actionMenu = (c: ClassClassResponse) => (
    <DropdownMenuContent>
      <DropdownMenuItem onClick={() => { setEditClassTarget(c); openModal("edit-class") }}>
        <Pencil className="h-4 w-4" /> Edit
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => { setUnassignTarget(c); openModal("unassign") }}>
        <Unplug className="h-4 w-4" /> Lepas
      </DropdownMenuItem>
      <DropdownMenuItem variant="destructive" onClick={() => { setDeleteClassTarget(c); openModal("delete-class") }}>
        <Trash2 className="h-4 w-4" /> Hapus
      </DropdownMenuItem>
    </DropdownMenuContent>
  )

  return (
    <>
      <main className="p-4 md:p-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : program && (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{program.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {program.description || `${programClasses.length} kelas dalam program ini.`}
                </p>
              </div>
              <Button className="hidden md:inline-flex" onClick={() => { setCreating(true); openModal("create-class") }}>
                <Plus className="mr-1 h-4 w-4" /> Buat Kelas
              </Button>
            </div>

            <Card className="hidden gap-0 pt-0 pb-0 md:block">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="pl-6">Nama</TableHead>
                      <TableHead>Private</TableHead>
                      <TableHead>Kelompok</TableHead>
                      <TableHead>Konten</TableHead>
                      <TableHead>Les</TableHead>
                      <TableHead className="pr-6 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programClasses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Empty className="border-0 p-8">
                            <EmptyHeader>
                              <EmptyMedia variant="icon"><Layers /></EmptyMedia>
                              <EmptyTitle>Belum ada kelas dalam program ini</EmptyTitle>
                            </EmptyHeader>
                          </Empty>
                        </TableCell>
                      </TableRow>
                    ) : programClasses.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="pl-6 font-medium">{c.name}</TableCell>
                        <TableCell className="tabular-nums">{fmtRp(c.price_per_session)} / pertemuan</TableCell>
                        <TableCell className="tabular-nums">{fmtRp(c.group_price)} / pertemuan</TableCell>
                        <TableCell className="tabular-nums">{fmtRp(c.content_price)}</TableCell>
                        <TableCell>
                          <Switch checked={c.allow_tutoring !== false} disabled aria-label={`Les ${c.name}`} />
                        </TableCell>
                        <TableCell className="pr-6">
                          <div className="flex items-center justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label={`Aksi kelas ${c.name}`} />}>
                                <MoreVertical className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              {actionMenu(c)}
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
              {programClasses.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Layers /></EmptyMedia>
                    <EmptyTitle>Belum ada kelas dalam program ini</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              ) : programClasses.map((c) => (
                <Card key={c.id}>
                  <CardContent>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                          Private {fmtRp(c.price_per_session)} · Kelompok {fmtRp(c.group_price)}
                        </p>
                        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                          Konten {fmtRp(c.content_price)}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label={`Aksi kelas ${c.name}`} className="shrink-0" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        {actionMenu(c)}
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      <Button
        onClick={() => { setCreating(true); openModal("create-class") }}
        size="icon"
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:hidden"
        aria-label="Buat Kelas"
      >
        <Plus className="size-6" />
      </Button>

      {modal === "create-class" && creating && program?.id && (
        <ClassFormDialog programId={program.id} onClose={closeModal} />
      )}

      {modal === "edit-class" && editClassTarget && (
        <ClassFormDialog class={editClassTarget} onClose={closeModal} />
      )}

      {modal === "delete-class" && deleteClassTarget && (
        <DeleteClassDialog class={deleteClassTarget} onClose={closeModal} />
      )}

      {modal === "unassign" && unassignTarget && (
        <AlertDialog open onOpenChange={(open) => !open && closeModal()}>
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
                onClick={() => unassignTarget.id && unassignMut.mutate({ path: { class_id: unassignTarget.id } })}
              >
                {unassignMut.isPending && <Spinner />}
                Lepas
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

export const Route = createFileRoute("/_dashboard/admin/programs/$programId")({
  component: AdminProgramDetail,
  validateSearch: programDetailSearchSchema,
})
