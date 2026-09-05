import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { addDays, format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  getAdminInvoicesQueryKey,
  getAdminStudentClassEnrollmentsQueryKey,
  getClassesOptions,
  postAdminInvoicesMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import type { UserAdminListUsersResponse } from "@/lib/api/types.gen"

const fmtRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `${i + 1} bulan`,
  value: String(i + 1),
}))

export function AddSubscriptionDialog({ user, onClose }: { user: UserAdminListUsersResponse; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: classes = [] } = useQuery(getClassesOptions())
  const [classId, setClassId] = useState("")
  const [months, setMonths] = useState("1")
  const [note, setNote] = useState("")

  const selectedClass = classes.find((c) => String(c.id) === classId)
  const monthCount = Number(months) || 1
  const pricePerMonth = selectedClass?.content_price ?? 0
  const total = pricePerMonth * monthCount
  const today = new Date()
  const startDate = format(today, "yyyy-MM-dd")
  const endDate = format(addDays(today, 30 * monthCount), "yyyy-MM-dd")
  const defaultNote = selectedClass ? `Langganan ${selectedClass.name} ${monthCount} bulan` : ""

  const { mutate: create, isPending } = useMutation({
    ...postAdminInvoicesMutation(),
    onSuccess: () => {
      toast.success("Invoice langganan dibuat, lunasi untuk mengaktifkan akses")
      qc.invalidateQueries({ queryKey: getAdminInvoicesQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminStudentClassEnrollmentsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal membuat invoice"),
  })

  const canSubmit = !!user.id && !!classId && !isPending

  const handleSave = () => {
    if (!canSubmit) return
    create({
      body: {
        user_id: user.id!,
        amount: total,
        start_date: startDate,
        end_date: endDate,
        class_id: Number(classId),
        note: note.trim() || defaultNote,
      },
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Tambah Langganan</DialogTitle>
          <DialogDescription>{user.name} · akses aktif otomatis setelah invoice lunas.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Kelas</Label>
            <Select
              items={classes.map((c) => ({ label: c.name ?? "", value: String(c.id) }))}
              value={classId}
              onValueChange={(v) => setClassId(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={classes.length ? "Pilih kelas" : "Tidak ada kelas"} />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Durasi</Label>
            <Select items={monthOptions} value={months} onValueChange={(v) => setMonths(v ?? "1")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih durasi" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Catatan</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={defaultNote || "Catatan invoice..."}
              autoComplete="off" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg bg-muted/50 px-4 py-3">
            <div className="text-sm">
              <p className="font-medium">{fmtRp(pricePerMonth)} / bulan × {monthCount} bulan</p>
              <p className="text-xs text-muted-foreground">
                {format(today, "d MMM yyyy", { locale: localeId })} – {format(addDays(today, 30 * monthCount), "d MMM yyyy", { locale: localeId })}
              </p>
            </div>
            <p className="text-lg font-bold tabular-nums">{fmtRp(total)}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave} disabled={!canSubmit}>
            {isPending && <Spinner />}
            Buat Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
