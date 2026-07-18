import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAdminUsersOptions, getAdminUsersQueryKey, deleteAdminUsersByIdMutation, patchAdminUsersByIdRoleMutation, patchAdminUsersByIdPaymentMutation } from "@/lib/api/@tanstack/react-query.gen"
import type { UserAdminUserResponse } from "@/lib/api/types.gen"
import { Search, MoreVertical, CreditCard, Shield, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

function AdminUsers() {
  const qc = useQueryClient()
  const { data: users = [], isLoading } = useQuery(getAdminUsersOptions())
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [editing, setEditing] = useState<UserAdminUserResponse | null>(null)
  const [newRole, setNewRole] = useState("student")
  const [page, setPage] = useState(1)
  const perPage = 5
  const [paymentDialog, setPaymentDialog] = useState<UserAdminUserResponse | null>(null)
  const [paymentStatus, setPaymentStatus] = useState("pending")
  const [deleteConfirm, setDeleteConfirm] = useState<UserAdminUserResponse | null>(null)

  const { mutate: deleteUser } = useMutation({
    ...deleteAdminUsersByIdMutation(),
    onSuccess: () => qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() }),
  })

  const { mutate: updateRole } = useMutation({
    ...patchAdminUsersByIdRoleMutation(),
    onSuccess: () => { closeEdit(); qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() }) },
  })

  const { mutate: updatePayment } = useMutation({
    ...patchAdminUsersByIdPaymentMutation(),
    onSuccess: () => {
      setPaymentDialog(null)
      qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() })
    },
  })

  const filtered = users.filter((u) => {
    const matchSearch = (u.name ?? "").toLowerCase().includes(search.toLowerCase()) || (u.email ?? "").toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === "all" || u.role === roleFilter
    return matchSearch && matchRole
  })
  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const openEdit = (u: UserAdminUserResponse) => {
    setEditing(u)
    setNewRole(u.role ?? "student")
  }
  const closeEdit = () => setEditing(null)
  const save = () => {
    if (editing) {
      updateRole({ path: { id: editing.id! }, body: { role: newRole } })
    }
  }

  const openPayment = (u: UserAdminUserResponse) => {
    setPaymentDialog(u)
    setPaymentStatus(u.payment_status ?? "pending")
  }

  const RoleBadge = ({ role }: { role: string }) => {
    const styles: Record<string, string> = { student: "bg-green-100 text-green-700", teacher: "bg-blue-100 text-blue-700", admin: "bg-purple-100 text-purple-700" }
    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[role as keyof typeof styles] || ""}`}>{role}</span>
  }

  const PaymentBadge = ({ status, role }: { status: string | undefined; role: string | undefined }) => {
    if (role !== "student") return <span className="text-muted-foreground">-</span>
    if (status === "paid") {
      return <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Lunas</span>
    }
    return <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">Pending</span>
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <main className="p-6">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Kelola User</h1>
        <Card>
          <div className="flex flex-wrap items-center gap-4 px-(--card-spacing) py-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cari nama atau email..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { if (v) { setRoleFilter(v); setPage(1) } }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Filter Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="student">Murid</SelectItem>
                <SelectItem value="teacher">Guru</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Pembayaran</TableHead>
                  <TableHead>Tanggal Daftar</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="pl-6"><div className="flex items-center gap-3">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{u.name?.[0]}</div>
                      )}
                      <span className="font-medium">{u.name}</span>
                    </div></TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell><RoleBadge role={u.role ?? ""} /></TableCell>
                    <TableCell><PaymentBadge status={u.payment_status} role={u.role} /></TableCell>
                    <TableCell className="text-muted-foreground">{u.created_at}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                            <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {u.role === "student" && (
                            <DropdownMenuItem onClick={() => openPayment(u)}>
                              <CreditCard className="h-4 w-4" /> {u.payment_status === "paid" ? "Pending" : "Lunas"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => openEdit(u)}>
                            <Shield className="h-4 w-4" /> Ganti Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteConfirm(u)}>
                            <Trash2 className="h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && (<TableRow><TableCell colSpan={6} className="p-8 text-center text-muted-foreground">Tidak ada user ditemukan</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
          {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between border-t">
              <p className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </main>

      {paymentDialog && <Dialog open onOpenChange={(open) => !open && setPaymentDialog(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Ubah Status Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {paymentDialog.name} — {paymentDialog.email}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={paymentStatus} onValueChange={(v) => v && setPaymentStatus(v)}>
              <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(null)}>Batal</Button>
            <Button onClick={() => {
              updatePayment({ path: { id: paymentDialog.id! }, body: { status: paymentStatus } })
            }}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}

      {editing && <Dialog open onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Role User</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {editing.name} — {editing.email}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={newRole} onValueChange={(v) => v && setNewRole(v)}>
              <SelectTrigger><SelectValue placeholder="Pilih role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Murid</SelectItem>
                <SelectItem value="teacher">Guru</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>Batal</Button>
            <Button onClick={save}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}

      {deleteConfirm && <AlertDialog open onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus User</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah kamu yakin ingin menghapus <strong>{deleteConfirm.name}</strong>? Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => {
              deleteUser({ path: { id: deleteConfirm.id! } })
              setDeleteConfirm(null)
            }}>Hapus</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </>
  )
}

export const Route = createFileRoute("/_dashboard/admin/users")({
  component: AdminUsers,
})
