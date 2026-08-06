import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import {
  getAdminProgramsOptions,
  getAdminProgramsQueryKey,
  postAdminProgramsMutation,
  patchAdminProgramsByIdMutation,
  deleteAdminProgramsByIdMutation,
  postAdminProgramsByIdClassesMutation,
  deleteAdminProgramsClassesByClassIdMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import {
  getAdminClassesOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import type { ProgramProgramResponse } from "@/lib/api/types.gen"

type Program = ProgramProgramResponse

function AdminPrograms() {
  return (
    <>
      <main className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Program</h1>
          <CreateProgramButton />
        </div>
        <ProgramList />
        <CreateProgramDialog />
      </main>
    </>
  )
}

// ---- list ----
function ProgramList() {
  const qc = useQueryClient()
  const { data: programs = [], isLoading } = useQuery(getAdminProgramsOptions())
  const { data: classes = [] } = useQuery(getAdminClassesOptions())

  const deleteMut = useMutation({
    ...deleteAdminProgramsByIdMutation(),
    onSuccess: () => {
      toast.success("Program dihapus")
      qc.invalidateQueries({ queryKey: getAdminProgramsQueryKey() })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal hapus"),
  })

  const unassignMut = useMutation({
    ...deleteAdminProgramsClassesByClassIdMutation(),
    onSuccess: () => {
      toast.success("Kelas dilepas")
      qc.invalidateQueries({ queryKey: getAdminProgramsQueryKey() })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal"),
  })

  const [editing, setEditing] = useState<Program | null>(null)
  const [deleting, setDeleting] = useState<Program | null>(null)

  if (isLoading) return <p className="text-muted-foreground">Memuat…</p>
  if (!programs.length) return <p className="text-muted-foreground">Belum ada program.</p>

  return (
    <div className="space-y-3">
      {programs.map((p) => (
        <Card key={p.id}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-muted-foreground">{p.description || p.slug}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleting(p)}>Hapus</Button>
              </div>
            </div>
            {p.classes && p.classes.length > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                Kelas: {p.classes.map((c) => c.name).join(", ")}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      <EditProgramDialog
        open={!!editing}
        program={editing}
        classes={classes}
        onClose={() => setEditing(null)}
      />
      <DeleteProgramDialog
        open={!!deleting}
        program={deleting}
        onConfirm={() => deleting && deleteMut.mutate({ path: { id: deleting.id! } })}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}

// ---- create / edit dialog ----
function CreateProgramButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Buat Program</Button>
      <CreateProgramDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function CreateProgramDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const mut = useMutation({
    ...postAdminProgramsMutation(),
    onSuccess: () => {
      toast.success("Program dibuat")
      qc.invalidateQueries({ queryKey: getAdminProgramsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || "Gagal"),
  })
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Program</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Nama</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Deskripsi</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={() => mut.mutate({ body: { name, description: desc } })} disabled={mut.isPending || !name}>
            {mut.isPending ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditProgramDialog({ open, program, classes, onClose }: {
  open: boolean
  program: Program | null
  classes: any[]
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [name, setName] = useState(program?.name || "")
  const [desc, setDesc] = useState(program?.description || "")
  const assignMut = useMutation({
    ...postAdminProgramsByIdClassesMutation(),
    onSuccess: () => {
      toast.success("Kelas dikaitkan")
      qc.invalidateQueries({ queryKey: getAdminProgramsQueryKey() })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal"),
  })
  // sync saat program berubah
  if (program && name !== program.name) setName(program.name)
  if (program && desc !== program.description) setDesc(program.description || "")
  const save = () => {
    if (!program) return
    // update basic (name/desc) — paketkan ke PATCH via put, tapi SDK belum ada per-update-field dialog. pakai patch mutation
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Edit Program</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Nama</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Deskripsi</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <Button size="sm" variant="outline" onClick={() => {
            const cid = prompt("Class ID")
            if (cid) assignMut.mutate({ path: { id: program!.id!, classId: Number(cid) }, body: { class_id: Number(cid) } } as any)
          }}>Assign Kelas</Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteProgramDialog({ open, program, onConfirm, onClose }: {
  open: boolean
  program: Program | null
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Program?</AlertDialogTitle>
          <AlertDialogDescription>
            Program <strong>{program?.name}</strong> akan dihapus. Kelas yang terkait akan dilepas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="destructive" onClick={onConfirm}>Hapus</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const Route = createFileRoute("/_dashboard/admin/programs")({
  component: AdminPrograms,
})
