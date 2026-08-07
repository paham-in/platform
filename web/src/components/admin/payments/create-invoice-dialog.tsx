import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { postAdminInvoicesMutation, getAdminInvoicesQueryKey, getAdminProgramsOptions } from "@/lib/api/@tanstack/react-query.gen"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useQuery } from "@tanstack/react-query"
import type { UserAdminUserResponse } from "@/lib/api/types.gen"

interface CreateInvoiceDialogProps {
  user: UserAdminUserResponse
  onClose: () => void
}

export function CreateInvoiceDialog({ user, onClose }: CreateInvoiceDialogProps) {
  const qc = useQueryClient()
  const { data: programs = [] } = useQuery(getAdminProgramsOptions())
  const [amount, setAmount] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [classId, setClassId] = useState<number | undefined>()
  const [note, setNote] = useState("")
  const classOptions = programs.flatMap((p) =>
    (p.classes ?? []).map((c) => ({
      label: `${p.name ?? ""} — ${c.name ?? ""}`,
      value: String(c.id),
    }))
  )

  const { mutate: createInvoice, isPending: creating } = useMutation({
    ...postAdminInvoicesMutation(),
    onSuccess: () => {
      toast.success("Invoice berhasil dibuat")
      qc.invalidateQueries({ queryKey: getAdminInvoicesQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal membuat invoice"),
  })

  const handleCreate = () => {
    if (!amount || !startDate || !endDate) return
    createInvoice({
      body: {
        user_id: user.id!,
        amount: parseFloat(amount),
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        class_id: classId,
        note: note,
      },
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Invoice Baru</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label>User</Label>
            <p className="text-sm text-muted-foreground">{user.name} — {user.email}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Jumlah (Rp)</Label>
            <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Dari Tanggal</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      data-empty={!startDate}
                      className="w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                    />
                  }
                >
                  <CalendarIcon />
                  {startDate ? format(startDate, "dd MMM yyyy", { locale: id }) : <span>Pilih tanggal</span>}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Sampai Tanggal</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      data-empty={!endDate}
                      className="w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                    />
                  }
                >
                  <CalendarIcon />
                  {endDate ? format(endDate, "dd MMM yyyy", { locale: id }) : <span>Pilih tanggal</span>}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invoice-class-select">Kelas (untuk akses otomatis saat lunas)</Label>
            <Select
              items={classOptions}
              value={classId}
              onValueChange={(v) => setClassId(Number(v))}
            >
              <SelectTrigger id="invoice-class-select" className="w-full" size="sm">
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
          <div className="space-y-1.5">
            <Label>Catatan (opsional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Pembayaran..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleCreate} disabled={creating || !amount || !startDate || !endDate}>
            {creating ? "..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
