import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { getTutoringTeachersOptions } from "@/lib/api/@tanstack/react-query.gen"
import { Search, SearchX, UserX, X, ChevronRight } from "lucide-react"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

const scheduleSearchSchema = z.object({
  search: z.string().optional(),
})

function AdminTeacherSchedules() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { search } = Route.useSearch()
  const [searchInput, setSearchInput] = useState(search ?? "")

  useEffect(() => { setSearchInput(search ?? "") }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, search: searchInput || undefined }), replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data: teachers = [], isLoading } = useQuery(getTutoringTeachersOptions())

  const q = (search ?? "").toLowerCase()
  const filtered = teachers.filter((t) => {
    if (!q) return true
    return (
      t.name?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      (t.subjects ?? []).some((s) => s.name?.toLowerCase().includes(q))
    )
  })

  const openSchedule = (id?: number) => {
    if (id == null) return
    navigate({ to: "/admin/teacher-schedules/$teacherId", params: { teacherId: String(id) } })
  }

  const emptyState = (
    <Empty className="border-0 p-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">{search ? <SearchX /> : <UserX />}</EmptyMedia>
        <EmptyTitle>
          {search ? "Tidak ada guru yang cocok dengan pencarian" : "Belum ada guru terdaftar"}
        </EmptyTitle>
      </EmptyHeader>
      {search && (
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={() => {
            setSearchInput("")
            navigate({ search: {}, replace: true })
          }}>
            <X className="mr-1 h-4 w-4" /> Bersihkan pencarian
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )

  return (
    <main className="p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jadwal Guru</h1>
          <p className="text-sm text-muted-foreground">Pilih guru untuk melihat jadwal mengajarnya</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Cari guru"
            placeholder="Cari nama, email, atau mapel..."
            className="pl-9 pr-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoComplete="off" />
          {searchInput && (
            <button
              type="button"
              aria-label="Bersihkan pencarian"
              onClick={() => setSearchInput("")}
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
                <TableHead className="pl-6">Guru</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead className="pr-6" />
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
                    <TableCell><Skeleton className="h-5 w-32 rounded-full" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-4 w-4 rounded ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.map((t) => (
                <TableRow key={t.id} className="cursor-pointer" onClick={() => openSchedule(t.id)}>
                  <TableCell className="pl-6"><div className="flex items-center gap-3">
                    {t.avatar_url ? (
                      <img src={t.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{t.name?.[0]}</div>
                    )}
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.email}</p>
                    </div>
                  </div></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      {(t.subjects ?? []).length === 0 && <span className="text-muted-foreground">-</span>}
                      {(t.subjects ?? []).map((s) => <Badge key={s.id} variant="secondary">{s.name}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell className="pr-6 text-right text-muted-foreground">
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>{emptyState}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile card list */}
      <Card className="gap-0 py-0 md:hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="flex items-center gap-3 p-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8">{emptyState}</div>
          ) : (
            <div className="divide-y">
              {filtered.map((t) => (
                <button key={t.id} type="button" onClick={() => openSchedule(t.id)} className="flex w-full items-center gap-3 p-4 text-left">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{t.name?.[0]}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.name}</p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{t.email}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {(t.subjects ?? []).map((s) => <Badge key={s.id} variant="secondary">{s.name}</Badge>)}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/teacher-schedules/")({
  component: AdminTeacherSchedules,
  validateSearch: scheduleSearchSchema,
})
