import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getAdminUsersOptions, getAdminUsersQueryKey, deleteAdminUsersByIdMutation, patchAdminUsersByIdRoleMutation } from "@/lib/api/@tanstack/react-query.gen"
import type { UserAdminUserResponse } from "@/lib/api/types.gen"
import { Search, MoreVertical, Shield, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

const ROLE_LABELS: Record<string, string> = { student: "Murid", teacher: "Guru", admin: "Admin" }
const ROLE_STYLES: Record<string, string> = {
  student: "bg-green-100 text-green-700",
  teacher: "bg-blue-100 text-blue-700",
  admin: "bg-purple-100 text-purple-700",
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[role] || ""}`}>
      {ROLE_LABELS[role] || role}
    </span>
  )
}

const usersSearchSchema = z.object({
  role: z.enum(["student", "teacher", "admin"]).optional(),
  search: z.string().optional(),
})

function AdminUsers() {
  const qc = useQueryClient()
  const navigate = useNavigate({ from: Route.fullPath })
  const { role: roleFilter, search } = Route.useSearch()
  const [searchInput, setSearchInput] = useState(search ?? "")

  // Sync URL → local state when search changes externally
  useEffect(() => { setSearchInput(search ?? "") }, [search])

  // Debounce search → navigate to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, search: searchInput || undefined }), replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data: users = [], isLoading } = useQuery(getAdminUsersOptions({
    query: { search, role: roleFilter },
  }))

  const roleOptions = [
    { label: "Semua Role", value: "all" },
    { label: "Murid", value: "student" },
    { label: "Guru", value: "teacher" },
    { label: "Admin", value: "admin" },
  ]
  const [editing, setEditing] = useState<UserAdminUserResponse | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const perPage = 5
  const [deleteConfirm, setDeleteConfirm] = useState<UserAdminUserResponse | null>(null)

  const { mutate: deleteUser } = useMutation({
    ...deleteAdminUsersByIdMutation(),
    onSuccess: () => { toast.success("User berhasil dihapus"); qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() }) },
    onError: (err: any) => toast.error(err.error || "Gagal menghapus user"),
  })

  const { mutate: updateRole } = useMutation({
    ...patchAdminUsersByIdRoleMutation(),
    onSuccess: () => { closeEdit(); toast.success("Role berhasil diubah"); qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() }) },
    onError: (err: any) => toast.error(err.error || "Gagal mengubah role"),
  })

  const totalPages = Math.ceil(users.length / perPage)
  const paged = users.slice((page - 1) * perPage, page * perPage)

  const openEdit = (u: UserAdminUserResponse) => {
    setEditing(u)
    setSelectedRoles(u.roles ?? [])
  }
  const closeEdit = () => setEditing(null)

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  const save = () => {
    if (editing && selectedRoles.length > 0) {
      updateRole({ path: { id: editing.id! }, body: { roles: selectedRoles } })
    }
  }

  return (
    <>
      <main className="p-6">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Kelola User</h1>

        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari nama atau email..." className="pl-9" value={searchInput} onChange={(e) => { setSearchInput(e.target.value); setPage(1) }} />
          </div>
          <Select items={roleOptions} value={roleFilter ?? "all"} onValueChange={(v) => { if (v) { navigate({ search: (prev) => ({ ...prev, role: v === "all" ? undefined : v as "student" | "teacher" | "admin" }), replace: true }); setPage(1) } }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Filter Role" /></SelectTrigger>
            <SelectContent>
              {roleOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tanggal Daftar</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="pl-6"><div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paged.map((u) => (
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
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(u.roles ?? []).length === 0 && <span className="text-muted-foreground">-</span>}
                        {(u.roles ?? []).map((r) => <RoleBadge key={r} role={r} />)}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.created_at}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                            <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
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
                {!isLoading && paged.length === 0 && (<TableRow><TableCell colSpan={5} className="p-8 text-center text-muted-foreground">Tidak ada user ditemukan</TableCell></TableRow>)}
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
          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium">Role (centang semua yang sesuai)</p>
            {["student", "teacher", "admin"].map((role) => (
              <label key={role} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                <Checkbox
                  checked={selectedRoles.includes(role)}
                  onCheckedChange={() => toggleRole(role)}
                />
                <RoleBadge role={role} />
                <span className="ml-auto text-sm text-muted-foreground">{ROLE_LABELS[role]}</span>
              </label>
            ))}
            {selectedRoles.length === 0 && (
              <p className="text-xs text-destructive">Minimal 1 role harus dipilih</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>Batal</Button>
            <Button onClick={save} disabled={selectedRoles.length === 0}>Simpan</Button>
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
  validateSearch: usersSearchSchema,
})
