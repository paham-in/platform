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
import { Search, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"

type User = { id: number; name: string; email: string; role: "student" | "teacher" | "admin"; createdAt: string; materials?: number; questions?: number }

const mockUsers: User[] = [
  { id: 1, name: "Siti Aisyah", email: "siti@email.com", role: "student", createdAt: "2025-01-15", questions: 12 },
  { id: 2, name: "Bambang Supriyadi", email: "bambang@email.com", role: "teacher", createdAt: "2024-11-20", materials: 24 },
  { id: 3, name: "Rina Wijaya", email: "rina@email.com", role: "student", createdAt: "2025-02-03", questions: 5 },
  { id: 4, name: "Ahmad Fauzi", email: "ahmad@email.com", role: "teacher", createdAt: "2024-09-10", materials: 18 },
  { id: 5, name: "Dewi Sartika", email: "dewi@email.com", role: "student", createdAt: "2025-03-22", questions: 8 },
  { id: 6, name: "Hadi Prasetyo", email: "hadi@email.com", role: "admin", createdAt: "2024-06-01" },
  { id: 7, name: "Citra Lestari", email: "citra@email.com", role: "student", createdAt: "2025-04-11", questions: 3 },
  { id: 8, name: "Dodi Firmansyah", email: "dodi@email.com", role: "teacher", createdAt: "2024-08-05", materials: 31 },
]

function AdminUsers() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [editing, setEditing] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<User["role"]>("student")
  const [page, setPage] = useState(1)
  const perPage = 5

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === "all" || u.role === roleFilter
    return matchSearch && matchRole
  })
  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const openEdit = (u: User) => {
    setEditing(u)
    setNewRole(u.role)
  }
  const closeEdit = () => setEditing(null)
  const save = () => {
    if (editing) {
      setUsers(users.map((u) => (u.id === editing.id ? { ...u, role: newRole } : u)))
    }
    closeEdit()
  }
  const remove = (id: number) => {
    if (confirm("Yakin hapus user ini?")) setUsers(users.filter((u) => u.id !== id))
  }

  const RoleBadge = ({ role }: { role: string }) => {
    const styles = { student: "bg-green-100 text-green-700", teacher: "bg-blue-100 text-blue-700", admin: "bg-purple-100 text-purple-700" }
    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[role as keyof typeof styles] || ""}`}>{role}</span>
  }

  return (
    <>
      <header className="flex items-center justify-between border-b bg-card px-6 py-3"><h1 className="text-lg font-bold">Kelola User</h1></header>
      <main className="p-6">
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
                  <TableHead>Info</TableHead>
                  <TableHead>Tanggal Daftar</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="pl-6"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{u.name[0]}</div><span className="font-medium">{u.name}</span></div></TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell><RoleBadge role={u.role} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.role === "teacher" && `${u.materials} materi`}{u.role === "student" && `${u.questions} pertanyaan`}</TableCell>
                    <TableCell className="text-muted-foreground">{u.createdAt}</TableCell>
                    <TableCell className="pr-6 text-right"><div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => remove(u.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div></TableCell>
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
            <Select value={newRole} onValueChange={(v) => setNewRole(v as User["role"])}>
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
