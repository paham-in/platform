import { createRoute, Link } from "@tanstack/react-router"
import { Route as RootRoute } from "@/routes/__root"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState } from "react"
import {
  Search, Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight,
  LayoutDashboard, Users, BookMarked, FileText, LogOut, ChevronDown
} from "lucide-react"

type User = {
  id: number
  name: string
  email: string
  role: "student" | "teacher" | "admin"
  createdAt: string
  materials?: number
  questions?: number
}

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

const sidebarLinks = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Kelola User", href: "/admin/users" },
  { icon: BookMarked, label: "Mata Pelajaran", href: "#" },
]

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/admin/users",
  component: function AdminUsers() {
    const [users, setUsers] = useState<User[]>(mockUsers)
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState<User | null>(null)
    const [page, setPage] = useState(1)
    const perPage = 5

    const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" as User["role"] })

    const filtered = users.filter((u) => {
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
      const matchRole = roleFilter === "all" || u.role === roleFilter
      return matchSearch && matchRole
    })

    const totalPages = Math.ceil(filtered.length / perPage)
    const paged = filtered.slice((page - 1) * perPage, page * perPage)

    const openAdd = () => {
      setEditing(null)
      setForm({ name: "", email: "", password: "", role: "student" })
      setShowModal(true)
    }

    const openEdit = (u: User) => {
      setEditing(u)
      setForm({ name: u.name, email: u.email, password: "", role: u.role })
      setShowModal(true)
    }

    const save = () => {
      if (editing) {
        setUsers(users.map((u) => (u.id === editing.id ? { ...u, name: form.name, email: form.email, role: form.role } : u)))
      } else {
        setUsers([...users, { id: Date.now(), ...form, createdAt: new Date().toISOString().slice(0, 10) }])
      }
      setShowModal(false)
    }

    const remove = (id: number) => {
      if (confirm("Yakin hapus user ini?")) setUsers(users.filter((u) => u.id !== id))
    }

    const RoleBadge = ({ role }: { role: string }) => {
      const styles = { student: "bg-green-100 text-green-700", teacher: "bg-blue-100 text-blue-700", admin: "bg-purple-100 text-purple-700" }
      return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[role as keyof typeof styles] || ""}`}>{role}</span>
    }

    return (
      <div className="flex min-h-screen bg-muted/20">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r bg-card p-4 md:flex">
          <Link to="/" className="mb-8 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">B</div>
            <span className="text-lg font-bold">Bimbel</span>
          </Link>
          <nav className="flex-1 space-y-1">
            {sidebarLinks.map((s) => (
              <Link key={s.label} to={s.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <s.icon className="h-4 w-4" /> {s.label}
              </Link>
            ))}
          </nav>
          <div className="border-t pt-4">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground" asChild>
              <a href="/login"><LogOut className="h-4 w-4" /> Keluar</a>
            </Button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          <header className="flex items-center justify-between border-b bg-card px-6 py-3">
            <h1 className="text-lg font-bold">Kelola User</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
              <ChevronDown className="h-3 w-3 -rotate-90" />
              <span>Kelola User</span>
            </div>
          </header>

          <main className="p-6">
            <div className="rounded-xl border bg-card">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b p-4">
                <div className="flex flex-1 items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Cari nama atau email..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
                  </div>
                  <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filter Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Role</SelectItem>
                      <SelectItem value="student">Murid</SelectItem>
                      <SelectItem value="teacher">Guru</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={openAdd}><Plus className="mr-1 h-4 w-4" /> Tambah User</Button>
              </div>

              {/* Table */}
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
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{u.name[0]}</div>
                          <span className="font-medium">{u.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell><RoleBadge role={u.role} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.role === "teacher" && `${u.materials} materi`}
                        {u.role === "student" && `${u.questions} pertanyaan`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.createdAt}</TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => remove(u.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paged.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="p-8 text-center text-muted-foreground">Tidak ada user ditemukan</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t p-4">
                  <p className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold">{editing ? "Edit User" : "Tambah User"}</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" />
                </div>
                {!editing && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as User["role"] })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Murid</SelectItem>
                      <SelectItem value="teacher">Guru</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
                  <Button onClick={save}>{editing ? "Simpan" : "Tambah"}</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  },
})
