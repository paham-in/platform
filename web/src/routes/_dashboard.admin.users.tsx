import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { getAdminUsersOptions, getAdminUsersQueryKey, deleteAdminUsersByIdMutation, patchAdminUsersByIdRoleMutation } from "@/lib/api/@tanstack/react-query.gen"
import type { UserAdminUserResponse } from "@/lib/api/types.gen"
import { Search, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

function AdminUsers() {
  const qc = useQueryClient()
  const { data: users = [], isLoading } = useQuery(getAdminUsersOptions())
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [editing, setEditing] = useState<UserAdminUserResponse | null>(null)
  const [newRole, setNewRole] = useState("student")
  const [page, setPage] = useState(1)
  const perPage = 5

  const { mutate: deleteUser } = useMutation({
    ...deleteAdminUsersByIdMutation(),
    onSuccess: () => qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() }),
  })

  const { mutate: updateRole } = useMutation({
    ...patchAdminUsersByIdRoleMutation(),
    onSuccess: () => { closeEdit(); qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() }) },
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

  const RoleBadge = ({ role }: { role: string }) => {
    const styles = { student: "bg-green-100 text-green-700", teacher: "bg-blue-100 text-blue-700", admin: "bg-purple-100 text-purple-700" }
    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[role as keyof typeof styles] || ""}`}>{role}</span>
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
                    <TableCell className="text-muted-foreground">{u.created_at}</TableCell>
                    <TableCell className="pr-6 text-right"><div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteUser({ path: { id: u.id! } })}><Trash2 className="h-4 w-4" /></Button>
                    </div></TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && (<TableRow><TableCell colSpan={5} className="p-8 text-center text-muted-foreground">Tidak ada user ditemukan</TableCell></TableRow>)}
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

      <Dialog open={!!editing} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Role User</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {editing && (
              <p className="text-sm text-muted-foreground">
                {editing.name} — {editing.email}
              </p>
            )}
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
      </Dialog>
    </>
  )
}

export const Route = createFileRoute("/_dashboard/admin/users")({
  component: AdminUsers,
})
