import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { getAdminUsersOptions } from "@/lib/api/@tanstack/react-query.gen"
import type { UserAdminListUsersResponse } from "@/lib/api/types.gen"
import { Search, SearchX, MoreVertical, Shield, Plus, Trash2, ChevronLeft, ChevronRight, Funnel, X, Link2, UserX } from "lucide-react"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { RoleBadge, CreateUserDialog, EditRoleDialog, DeleteUserDialog, ConnectGoogleDialog } from "@/components/admin/users"
import { usePageHeaderAction, usePageTitle } from "@/components/page-title"

const usersSearchSchema = z.object({
  role: z.enum(["student", "teacher", "admin"]).optional(),
  search: z.string().optional(),
  modal: z.enum(["create", "role", "delete", "connect"]).optional(),
})

const roleOptions = [
  { label: "Semua Role", value: "all" },
  { label: "Murid", value: "student" },
  { label: "Guru", value: "teacher" },
  { label: "Admin", value: "admin" },
]

function RoleFilterMenu({
  compact,
  value,
  onValueChange,
  activeCount,
}: {
  compact?: boolean;
  value: string;
  onValueChange: (v: string) => void;
  activeCount: number;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={compact ? <Button variant="outline" size="icon" className="relative" /> : <Button variant="outline" />}
        aria-label="Filter role"
      >
        <Funnel className="h-4 w-4" />
        {compact ? (
          activeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )
        ) : (
          <>
            Filter
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => { if (v) onValueChange(v); }}>
          <DropdownMenuLabel>Role</DropdownMenuLabel>
          {roleOptions.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AdminUsers() {
  usePageTitle("Kelola User")
  const navigate = useNavigate({ from: Route.fullPath })
  const router = useRouter()
  const { role: roleFilter, search, modal } = Route.useSearch()
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

  const activeFilterCount = roleFilter ? 1 : 0
  const hasActiveFilter = !!search || !!roleFilter
  const [editing, setEditing] = useState<UserAdminListUsersResponse | null>(null)
  const [page, setPage] = useState(1)
  const perPage = 5
  const [deleteConfirm, setDeleteConfirm] = useState<UserAdminListUsersResponse | null>(null)
  const [connectGoogle, setConnectGoogle] = useState<UserAdminListUsersResponse | null>(null)

  const openModal = (name: NonNullable<typeof modal>) =>
    navigate({ search: (prev) => ({ ...prev, modal: name }) })

  // Tutup dialog = pop satu entry history (buka = push modal ke URL),
  // jadi back berikutnya benar-benar keluar halaman, bukan kembali ke dialog.
  const closeModal = () => router.history.back()

  // Kalau modal hilang (dari back / close), bersihkan payload user biar tidak nyangkut.
  useEffect(() => {
    if (modal !== "role") setEditing(null)
    if (modal !== "delete") setDeleteConfirm(null)
    if (modal !== "connect") setConnectGoogle(null)
  }, [modal])

  const setRole = (v: string) => {
    navigate({ search: (prev) => ({ ...prev, role: v === "all" ? undefined : (v as "student" | "teacher" | "admin") }), replace: true })
    setPage(1)
  }

  const roleFilterValue = roleFilter ?? "all"
  const headerFilter = useMemo(
    () => (
      <RoleFilterMenu
        compact
        value={roleFilterValue}
        onValueChange={setRole}
        activeCount={activeFilterCount}
      />
    ),
    [roleFilterValue, activeFilterCount]
  )
  usePageHeaderAction(headerFilter)

  const totalPages = Math.ceil(users.length / perPage)
  const paged = users.slice((page - 1) * perPage, page * perPage)

  return (
    <>
      <main className="p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Kelola User</h1>
          <Button className="hidden md:inline-flex" onClick={() => openModal("create")}>
            <Plus className="mr-1 h-4 w-4" /> Tambah User
          </Button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Cari nama atau email"
              placeholder="Cari nama atau email..."
              className="pl-9 pr-9"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1) }}
            autoComplete="off"/>
            {searchInput && (
              <button
                type="button"
                aria-label="Bersihkan pencarian"
                onClick={() => { setSearchInput(""); setPage(1) }}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="hidden md:inline-flex">
            <RoleFilterMenu
              value={roleFilterValue}
              onValueChange={setRole}
              activeCount={activeFilterCount}
            />
          </div>
        </div>

        {/* Desktop table */}
        <Card className="hidden gap-0 pt-0 pb-0 md:block">
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
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium">{u.name}</span>
                        {u.has_google ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Google</span>
                        ) : u.has_password ? (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Password</span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Dummy</span>
                        )}
                      </span>
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
                          <DropdownMenuItem onClick={() => { setEditing(u); openModal("role") }}>
                            <Shield className="h-4 w-4" /> Ganti Role
                          </DropdownMenuItem>
                          {!u.has_google && !u.has_password && (u.roles ?? []).includes("student") && (
                            <DropdownMenuItem onClick={() => { setConnectGoogle(u); openModal("connect") }}>
                              <Link2 className="h-4 w-4" /> Hubungkan ke Akun Google
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => { setDeleteConfirm(u); openModal("delete") }}>
                            <Trash2 className="h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Empty className="border-0 p-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">{hasActiveFilter ? <SearchX /> : <UserX />}</EmptyMedia>
                          <EmptyTitle>
                            {hasActiveFilter ? "Tidak ada user yang cocok dengan filter" : "Tidak ada user ditemukan"}
                          </EmptyTitle>
                        </EmptyHeader>
                        {hasActiveFilter && (
                          <EmptyContent>
                            <Button variant="outline" size="sm" onClick={() => {
                              setSearchInput("")
                              navigate({ search: {}, replace: true })
                              setPage(1)
                            }}>
                              <X className="mr-1 h-4 w-4" /> Bersihkan filter
                            </Button>
                          </EmptyContent>
                        )}
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
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

        {/* Mobile card list */}
        <Card className="gap-0 py-0 md:hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={`skeleton-${i}`} className="flex items-start gap-3 p-4">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paged.length === 0 ? (
              <Empty className="p-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">{hasActiveFilter ? <SearchX /> : <UserX />}</EmptyMedia>
                  <EmptyTitle>
                    {hasActiveFilter ? "Tidak ada user yang cocok dengan filter" : "Tidak ada user ditemukan"}
                  </EmptyTitle>
                </EmptyHeader>
                {hasActiveFilter && (
                  <EmptyContent>
                    <Button variant="outline" size="sm" onClick={() => {
                      setSearchInput("")
                      navigate({ search: {}, replace: true })
                      setPage(1)
                    }}>
                      <X className="mr-1 h-4 w-4" /> Bersihkan filter
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            ) : (
              <div className="divide-y">
                {paged.map((u) => (
                  <div key={u.id} className="flex items-start gap-3 p-4">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{u.name?.[0]}</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-medium">{u.name}</p>
                        {u.has_google ? (
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Google</span>
                        ) : u.has_password ? (
                          <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Password</span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Dummy</span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{u.email}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(u.roles ?? []).map((r) => <RoleBadge key={r} role={r} />)}
                        {(u.roles ?? []).length === 0 && <span className="text-xs text-muted-foreground">-</span>}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="shrink-0" />}>
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => { setEditing(u); openModal("role") }}>
                          <Shield className="h-4 w-4" /> Ganti Role
                        </DropdownMenuItem>
                        {!u.has_google && !u.has_password && (u.roles ?? []).includes("student") && (
                          <DropdownMenuItem onClick={() => { setConnectGoogle(u); openModal("connect") }}>
                            <Link2 className="h-4 w-4" /> Hubungkan ke Akun Google
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => { setDeleteConfirm(u); openModal("delete") }}>
                          <Trash2 className="h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
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

      <Button
        onClick={() => openModal("create")}
        size="icon"
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:hidden"
        aria-label="Tambah User"
      >
        <Plus className="size-6" />
      </Button>

      {modal === "create" && <CreateUserDialog onClose={closeModal} />}
      {modal === "role" && editing && <EditRoleDialog user={editing} onClose={closeModal} />}
      {modal === "delete" && deleteConfirm && <DeleteUserDialog user={deleteConfirm} onClose={closeModal} />}
      {modal === "connect" && connectGoogle && <ConnectGoogleDialog user={connectGoogle} onClose={closeModal} />}
    </>
  )
}

export const Route = createFileRoute("/_dashboard/admin/users")({
  component: AdminUsers,
  validateSearch: usersSearchSchema,
})
