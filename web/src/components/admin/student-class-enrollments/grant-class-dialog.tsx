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
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import type { UserAdminListUsersResponse } from "@/lib/api/types.gen"
import {
  postAdminStudentClassEnrollmentsMutation,
  getAdminStudentClassEnrollmentsQueryKey,
  getAdminStudentsOptions,
  getAdminProgramsOptions,
} from "@/lib/api/@tanstack/react-query.gen"

interface GrantClassDialogProps {
  onClose: () => void
}

export function GrantClassDialog({ onClose }: GrantClassDialogProps) {
  const qc = useQueryClient()
  const { data: users = [] } = useQuery(getAdminStudentsOptions())
  const { data: programs = [] } = useQuery(getAdminProgramsOptions())
  const [user, setUser] = useState<UserAdminListUsersResponse>()
  const [classId, setClassId] = useState<number | undefined>()
  const [expiry, setExpiry] = useState<Date>()
  const classOptions = programs.flatMap((p) =>
    (p.classes ?? []).map((c) => ({
      label: `${p.name ?? ""} — ${c.name ?? ""}`,
      value: String(c.id),
    }))
  )

  const { mutate: grant, isPending } = useMutation({
    ...postAdminStudentClassEnrollmentsMutation(),
    onSuccess: () => {
      toast.success("Akses berhasil diberikan")
      qc.invalidateQueries({ queryKey: getAdminStudentClassEnrollmentsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal memberikan akses"),
  })

  const canSave = user && classId && expiry
  const save = () => {
    if (!canSave) return
    grant({
      body: {
        user_id: user.id!,
        class_id: classId,
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
            <Label>Murid</Label>
            <Combobox
              autoHighlight
              items={users}
              value={user}
              onValueChange={(v) => setUser(v ?? undefined)}
              itemToStringLabel={(u) => (u ? `${u.name} — ${u.email}` : "")}
            >
              <ComboboxInput placeholder={users.length ? "Pilih murid..." : "Tidak ada murid"} />
              <ComboboxContent>
                <ComboboxEmpty>Tidak ada murid ditemukan</ComboboxEmpty>
                <ComboboxList>
                  {(u: UserAdminListUsersResponse) => (
                    <ComboboxItem key={u.id} value={u}>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{u.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{u.email}</span>
                      </span>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-select">Kelas</Label>
            <Select
              items={classOptions}
              value={classId}
              onValueChange={(v) => setClassId(Number(v))}
            >
              <SelectTrigger id="class-select" className="w-full">
                <SelectValue placeholder={classOptions.length ? "Pilih kelas..." : "Tidak ada kelas"} />
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
