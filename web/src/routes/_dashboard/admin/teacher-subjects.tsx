import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { z } from "zod"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, GraduationCap, UserX, Search, SearchX, X } from "lucide-react"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { getAdminUsersOptions } from "@/lib/api/@tanstack/react-query.gen"
import type { UserAdminListUsersResponse } from "@/lib/api/types.gen"
import { TeacherSubjectsDialog } from "@/components/admin/users"
import { usePageTitle } from "@/components/page-title"

const teacherSubjectsSearchSchema = z.object({
  search: z.string().optional(),
})

function AdminTeacherSubjects() {
  usePageTitle("Mata Pelajaran Guru")
  const navigate = useNavigate({ from: Route.fullPath })
  const { search: searchParam } = Route.useSearch()
  const [searchInput, setSearchInput] = useState(searchParam ?? "")
  const { data: teachers = [], isLoading } = useQuery(
    getAdminUsersOptions({ query: { role: "teacher", search: searchParam || undefined } })
  )
  const [editing, setEditing] = useState<UserAdminListUsersResponse | null>(null)
  const [page, setPage] = useState(1)
  const perPage = 5

  // sync URL → local search input (e.g. back/forward, manual URL edit)
  useEffect(() => { setSearchInput(searchParam ?? "") }, [searchParam])

  // debounce search input → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, search: searchInput || undefined }), replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, navigate])

  const totalPages = Math.ceil(teachers.length / perPage)
  const paged = teachers.slice((page - 1) * perPage, page * perPage)

  return (
    <>
      <main className="p-4 md:p-6">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Mata Pelajaran Guru</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Atur mata pelajaran yang diampu setiap guru. Guru tidak bisa mengubahnya sendiri.
        </p>

        <div className="mb-4 flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Cari nama atau email guru"
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
        </div>

        {/* Desktop table */}
        <Card className="hidden gap-0 pt-0 pb-0 md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mata Pelajaran</TableHead>
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
                      <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
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
                        {(u.subjects ?? []).length === 0 && <span className="text-muted-foreground">-</span>}
                        {(u.subjects ?? []).map((s) => (
                          <span key={s.id} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setEditing(u)}>
                            <GraduationCap className="h-4 w-4" /> Atur Mata Pelajaran
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Empty className="border-0 p-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">{searchParam ? <SearchX /> : <UserX />}</EmptyMedia>
                          <EmptyTitle>Tidak ada guru ditemukan</EmptyTitle>
                        </EmptyHeader>
                        {searchParam && (
                          <EmptyContent>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearchInput("")
                                navigate({ search: {}, replace: true })
                                setPage(1)
                              }}
                            >
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
              <p className="text-sm text-muted-foreground">
                Halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Sebelumnya
                </Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  Berikutnya
                </Button>
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
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paged.length === 0 ? (
              <Empty className="p-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">{searchParam ? <SearchX /> : <UserX />}</EmptyMedia>
                  <EmptyTitle>Tidak ada guru ditemukan</EmptyTitle>
                </EmptyHeader>
                {searchParam && (
                  <EmptyContent>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchInput("")
                        navigate({ search: {}, replace: true })
                        setPage(1)
                      }}
                    >
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
                      <p className="truncate font-medium">{u.name}</p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{u.email}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(u.subjects ?? []).map((s) => (
                          <span key={s.id} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            {s.name}
                          </span>
                        ))}
                        {(u.subjects ?? []).length === 0 && <span className="text-xs text-muted-foreground">-</span>}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="shrink-0" />}>
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setEditing(u)}>
                          <GraduationCap className="h-4 w-4" /> Atur Mata Pelajaran
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
              <p className="text-sm text-muted-foreground">
                Halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Sebelumnya
                </Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  Berikutnya
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </main>

      {editing && <TeacherSubjectsDialog user={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

export const Route = createFileRoute("/_dashboard/admin/teacher-subjects")({
  component: AdminTeacherSubjects,
  validateSearch: teacherSubjectsSearchSchema,
})
