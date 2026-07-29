import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useState } from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAdminUsersOptions, getAdminInvoicesOptions, getAdminInvoicesQueryKey, postAdminInvoicesMutation, patchAdminInvoicesByIdToggleMutation, deleteAdminInvoicesByIdMutation } from "@/lib/api/@tanstack/react-query.gen"
import type { InvoiceInvoiceResponse } from "@/lib/api/types.gen"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, ChevronLeft, Loader2, Plus, MoreVertical, Trash2, CheckCircle2, XCircle, Search } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

function PaymentsDetail() {
  const { userId } = Route.useParams()
  const qc = useQueryClient()
  const { data: users = [], isLoading: usersLoading } = useQuery(getAdminUsersOptions())
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery(getAdminInvoicesOptions({ query: { user_id: Number(userId) } }))
  const [createOpen, setCreateOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [note, setNote] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<InvoiceInvoiceResponse | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const user = users.find((u) => u.id === Number(userId))
  const userInvoices = invoices.filter((inv) => {
    const matchStatus = statusFilter === "all" || inv.status === statusFilter
    const matchSearch = !search
      || (inv.note ?? "").toLowerCase().includes(search.toLowerCase())
      || (inv.start_date ?? "").includes(search)
      || (inv.end_date ?? "").includes(search)
    return matchStatus && matchSearch
  })

  const allSelected = userInvoices.length > 0 && selectedIds.size === userInvoices.length
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(userInvoices.map((inv) => inv.id!)))
  }
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const { mutate: createInvoice, isPending: creating } = useMutation({
    ...postAdminInvoicesMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminInvoicesQueryKey() })
      setCreateOpen(false)
      setAmount("")
      setStartDate(undefined)
      setEndDate(undefined)
      setNote("")
    },
  })

  const { mutate: toggleInvoice } = useMutation({
    ...patchAdminInvoicesByIdToggleMutation(),
    onSuccess: () => qc.invalidateQueries({ queryKey: getAdminInvoicesQueryKey() }),
  })

  const { mutate: deleteInvoice } = useMutation({
    ...deleteAdminInvoicesByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminInvoicesQueryKey() })
      setDeleteTarget(null)
    },
  })

  const handleCreate = () => {
    if (!user || !amount || !startDate || !endDate) return
    createInvoice({
      body: {
        user_id: user.id!,
        amount: parseFloat(amount),
        start_date: format(startDate, "yyyy-MM"),
        end_date: format(endDate, "yyyy-MM"),
        note: note,
      },
    })
  }

  if (usersLoading || invoicesLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <main className="p-6">
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-muted-foreground">User tidak ditemukan</p>
          <Link to="/admin/payments">
            <Button variant="outline">Kembali</Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <Link to="/admin/payments">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Buat Invoice
        </Button>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari periode atau catatan..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { if (v) { setStatusFilter(v); setSelectedIds(new Set()) } }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Filter Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="paid">Lunas</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedIds.size} dipilih</span>
            <Button size="sm" onClick={() => { selectedIds.forEach((id) => { const inv = userInvoices.find(i => i.id === id); if (inv?.status === "pending") toggleInvoice({ path: { id } }) }); setSelectedIds(new Set()) }}>
              Lunas
            </Button>
            <Button size="sm" variant="outline" onClick={() => { selectedIds.forEach((id) => { const inv = userInvoices.find(i => i.id === id); if (inv?.status === "paid") toggleInvoice({ path: { id } }) }); setSelectedIds(new Set()) }}>
              Pending
            </Button>
          </div>
        )}
      </div>

      <Card className="pt-0 gap-0 pb-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-10 pl-4">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="pl-0">Periode</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead>Tgl Buat</TableHead>
                <TableHead className="pr-6 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-8 text-center text-muted-foreground">
                    Belum ada invoice
                  </TableCell>
                </TableRow>
              ) : (
                userInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="w-10 pl-4">
                      <Checkbox checked={selectedIds.has(inv.id!)} onCheckedChange={() => toggleSelect(inv.id!)} />
                    </TableCell>
                    <TableCell className="pl-0 font-medium">
                      {inv.start_date} — {inv.end_date}
                    </TableCell>
                    <TableCell>Rp {inv.amount?.toLocaleString("id-ID")}</TableCell>
                    <TableCell>
                      {inv.status === "paid" ? (
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          Lunas
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                          Pending
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {inv.note || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{inv.created_at}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => toggleInvoice({ path: { id: inv.id! } })}>
                            {inv.status === "paid" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            {inv.status === "paid" ? "Pending" : "Lunas"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(inv)}>
                            <Trash2 className="h-4 w-4 text-destructive" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) { setCreateOpen(false) } }}>
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
                <Label>Dari Bulan</Label>
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
                    {startDate ? format(startDate, "MMMM yyyy", { locale: id }) : <span>Pilih bulan</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>Sampai Bulan</Label>
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
                    {endDate ? format(endDate, "MMMM yyyy", { locale: id }) : <span>Pilih bulan</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Catatan (opsional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Pembayaran bulan..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={creating || !amount || !startDate || !endDate}>
              {creating ? "..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deleteTarget && (
        <AlertDialog open onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Invoice</AlertDialogTitle>
              <AlertDialogDescription>
                Yakin hapus invoice {deleteTarget.start_date} — {deleteTarget.end_date}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
              <Button variant="destructive" onClick={() => deleteInvoice({ path: { id: deleteTarget.id! } })}>
                Hapus
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/payments/$userId")({
  component: PaymentsDetail,
})
