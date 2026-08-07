import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import {
  postAdminStudentProgramsMutation,
  getAdminStudentProgramsQueryKey,
  getAdminUsersOptions,
  getAdminProgramsOptions,
} from "@/lib/api/@tanstack/react-query.gen"

interface GrantProgramDialogProps {
  onClose: () => void
}

export function GrantProgramDialog({ onClose }: GrantProgramDialogProps) {
  const qc = useQueryClient()
  const { data: users = [] } = useQuery(getAdminUsersOptions())
  const { data: programs = [] } = useQuery(getAdminProgramsOptions())
  const [userId, setUserId] = useState<number | undefined>()
  const [programId, setProgramId] = useState<number | undefined>()
  const [expiry, setExpiry] = useState<Date>()

  const { mutate: grant, isPending } = useMutation({
    ...postAdminStudentProgramsMutation(),
    onSuccess: () => {
      toast.success("Akses berhasil diberikan")
      qc.invalidateQueries({ queryKey: getAdminStudentProgramsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal memberikan akses"),
  })

  const canSave = userId && programId && expiry
  const save = () => {
    if (!canSave) return
    grant({
      body: {
        user_id: userId,
        program_id: programId,
        expiry: format(expiry, "yyyy-MM-dd"),
      },
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Berikan Hak Akses</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="user-select">Murid</Label>
            <Select value={userId} onValueChange={(v) => setUserId(Number(v))}>
              <SelectTrigger id="user-select" className="w-full" size="sm">
                <SelectValue placeholder={users.length ? "Pilih murid..." : "Tidak ada murid"} />
              </SelectTrigger>
              <SelectContent>
                {users.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Tidak ada murid terdaftar</div>
                )}
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name} — {u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="program-select">Program</Label>
            <Select value={programId} onValueChange={(v) => setProgramId(Number(v))}>
              <SelectTrigger id="program-select" className="w-full" size="sm">
                <SelectValue placeholder={programs.length ? "Pilih program..." : "Tidak ada program"} />
              </SelectTrigger>
              <SelectContent>
                {programs.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Belum ada program</div>
                )}
                {programs.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kadaluarsa</Label>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    data-empty={!expiry}
                    className="w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                  />
                }
              >
                <CalendarIcon />
                {expiry ? format(expiry, "dd MMM yyyy") : <span>Pilih tanggal</span>}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={expiry} onSelect={setExpiry} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={save} disabled={isPending || !canSave}>
              {isPending && <Spinner />}
              Berikan Akses
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
