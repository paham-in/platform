import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
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
  getAdminStudentProgramsOptions,
  getAdminStudentProgramsQueryKey,
  postAdminStudentProgramsMutation,
  deleteAdminStudentProgramsByIdMutation,
  getAdminUsersOptions,
  getAdminProgramsOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import type { StudentprogramStudentProgramResponse } from "@/lib/api/types.gen"

type SP = StudentprogramStudentProgramResponse

function AdminStudentPrograms() {
  const qc = useQueryClient()
  const { data: items = [], isLoading } = useQuery(getAdminStudentProgramsOptions())

  const deleteMut = useMutation({
    ...deleteAdminStudentProgramsByIdMutation(),
    onSuccess: () => {
      toast.success("Akses dicabut")
      qc.invalidateQueries({ queryKey: getAdminStudentProgramsQueryKey() })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal"),
  })

  const [open, setOpen] = useState(false)

  if (isLoading) return <p className="text-muted-foreground">Memuat…</p>

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Hak Akses Murid</h1>
        <Button onClick={() => setOpen(true)}>Berikan Akses</Button>
      </div>

      <Card className="pt-0 gap-0 pb-0">
        <CardContent className="pt-4">
          {items.length === 0 ? (
            <p className="text-muted-foreground">Belum ada hak akses.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2">Murid</th>
                  <th className="pb-2">Program</th>
                  <th className="pb-2">Kadaluarsa</th>
                  <th className="pb-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((sp) => (
                  <tr key={sp.id} className="border-b">
                    <td>{sp.user?.name}</td>
                    <td>{sp.program?.name}</td>
                    <td>{sp.expiry}</td>
                    <td className="text-right">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMut.mutate({ path: { id: sp.id! } })}
                        disabled={deleteMut.isPending}
                      >
                        Cabut
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <GrantDialog open={open} onClose={() => setOpen(false)} />
    </main>
  )
}

function GrantDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [userId, setUserId] = useState("")
  const [programId, setProgramId] = useState("")
  const [expiry, setExpiry] = useState<Date>()
  const mut = useMutation({
    ...postAdminStudentProgramsMutation(),
    onSuccess: () => {
      toast.success("Akses diberikan")
      qc.invalidateQueries({ queryKey: getAdminStudentProgramsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || "Gagal"),
  })
  const save = () => {
    if (!userId || !programId || !expiry) return
    mut.mutate({
      body: {
        user_id: Number(userId),
        program_id: Number(programId),
        expiry: format(expiry, "yyyy-MM-dd"),
      },
    })
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Berikan Hak Akses</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Murid (User ID)</Label>
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user id" />
          </div>
          <div>
            <Label>Program (Program ID)</Label>
            <Input value={programId} onChange={(e) => setProgramId(e.target.value)} placeholder="program id" />
          </div>
          <div>
            <Label>Kadaluarsa</Label>
            <Popover>
              <PopoverTrigger render={
                <Button
                  variant="outline"
                  data-empty={!expiry}
                  className="w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                />
              }>
                <CalendarIcon />
                {expiry ? format(expiry, "dd MMM yyyy") : <span>Pilih tanggal</span>}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={expiry} onSelect={setExpiry} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={save} disabled={mut.isPending || !userId || !programId || !expiry}>
            {mut.isPending ? "Menyimpan…" : "Berikan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const Route = createFileRoute("/_dashboard/admin/student-programs")({
  component: AdminStudentPrograms,
})
