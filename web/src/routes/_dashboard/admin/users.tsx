import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { getAdminUsersOptions } from "@/lib/api/@tanstack/react-query.gen"
import type { UserAdminUserResponse } from "@/lib/api/types.gen"
import { Search, MoreVertical, Shield, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { RoleBadge, EditRoleDialog, DeleteUserDialog } from "@/components/admin/users"

const usersSearchSchema = z.object({
  role: z.enum(["student", "teacher", "admin", "user"]).optional(),
  search: z.string().optional(),
})

function AdminUsers() {
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
    { label: "User", value: "user" },
    { label: "Murid", value: "student" },
    { label: "Guru", value: "teacher" },
    { label: "Admin", value: "admin" },
  ]
  const [editing, setEditing] = useState<UserAdminUserResponse | null>(null)
  const [page, setPage] = useState(1)
  const perPage = 5
  const [deleteConfirm, setDeleteConfirm] = useState<UserAdminUserResponse | null>(null)

  const totalPages = Math.ceil(users.length / perPage)
  const paged = users.slice((page - 1) * perPage, page * perPage)

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
                          <DropdownMenuItem onClick={() => setEditing(u)}>
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

      {editing && <EditRoleDialog user={editing} onClose={() => setEditing(null)} />}
      {deleteConfirm && <DeleteUserDialog user={deleteConfirm} onClose={() => setDeleteConfirm(null)} />}
    </>
  )
}

export const Route = createFileRoute("/_dashboard/admin/users")({
  component: AdminUsers,
  validateSearch: usersSearchSchema,
})
