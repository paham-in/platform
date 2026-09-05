import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"
import { getAdminTutoringBookingsOptions, getAdminUsersOptions } from "@/lib/api/@tanstack/react-query.gen"
import { CalendarX2, Search, X } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useState, useEffect } from "react"
import { usePageTitle } from "@/components/page-title"

const adminTutoringSearchSchema = z.object({
  search: z.string().optional(),
})

type StudentRow = {
  id: number
  name: string
  email: string
  avatar?: string
  pending: number
  oldestPendingAt: string
  oldestPendingId: number
  total: number
}

function AdminTutoring() {
  usePageTitle("Les Privat")
  const navigate = useNavigate({ from: Route.fullPath })
  const { search: searchParam } = Route.useSearch()
  const { data: bookings = [], isLoading } = useQuery(getAdminTutoringBookingsOptions())
  const { data: users = [] } = useQuery(getAdminUsersOptions())
  const [searchInput, setSearchInput] = useState(searchParam ?? "")

  useEffect(() => { setSearchInput(searchParam ?? "") }, [searchParam])

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, search: searchInput || undefined }), replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, navigate])

  // agregasi booking per murid ala antrean: yang ada menunggu di atas,
  // diurutkan dari pengajuan pending terlama (created_at, id).
  const agg = new Map<number, { name: string; pending: number; oldestAt: string; oldestId: number; total: number }>()
  for (const b of bookings) {
    if (b.student_id == null) continue
    const cur = agg.get(b.student_id) ?? {
      name: b.student_name ?? "—",
      pending: 0,
      oldestAt: "",
      oldestId: Number.MAX_SAFE_INTEGER,
      total: 0,
    }
    cur.total++
    if (b.student_name) cur.name = b.student_name
    if (b.status === "pending") {
      cur.pending++
      const created = b.created_at ?? ""
      if (cur.oldestAt === "" || created < cur.oldestAt || (created === cur.oldestAt && (b.id ?? 0) < cur.oldestId)) {
        cur.oldestAt = created
        cur.oldestId = b.id ?? Number.MAX_SAFE_INTEGER
      }
    }
    agg.set(b.student_id, cur)
  }

  const q = (searchParam ?? "").toLowerCase()
  const rows: StudentRow[] = [...agg.entries()]
    .map(([id, a]) => {
      const u = users.find((x) => x.id === id)
      return {
        id,
        name: u?.name ?? a.name,
        email: u?.email ?? "",
        avatar: u?.avatar_url,
        pending: a.pending,
        oldestPendingAt: a.oldestAt,
        oldestPendingId: a.oldestId,
        total: a.total,
      }
    })
    .filter((r) => q === "" || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
    .sort((a, b) => {
      const aWait = a.pending > 0 ? 0 : 1
      const bWait = b.pending > 0 ? 0 : 1
      if (aWait !== bWait) return aWait - bWait
      if (aWait === 0) {
        if (a.oldestPendingAt !== b.oldestPendingAt) return a.oldestPendingAt < b.oldestPendingAt ? -1 : 1
        if (a.oldestPendingId !== b.oldestPendingId) return a.oldestPendingId - b.oldestPendingId
      }
      return a.name.localeCompare(b.name, "id")
    })

  const hasActiveFilter = !!searchParam

  return (
    <main className="p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Les Privat</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Antrean booking les privat per murid, yang menunggu paling lama di atas.
          </p>
        </div>
      </div>

      <div className="mb-4 flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Cari nama atau email"
            placeholder="Cari nama atau email..."
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

      <Card className="hidden gap-0 pt-0 pb-0 md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6">Murid</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Menunggu</TableHead>
                <TableHead className="pr-6">Total Booking</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Empty className="border-0 p-8">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><CalendarX2 /></EmptyMedia>
                        <EmptyTitle>{hasActiveFilter ? "Tidak ada murid yang cocok" : "Belum ada booking les privat"}</EmptyTitle>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : rows.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/admin/tutoring/$userId", params: { userId: String(r.id) } })}
                >
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      {r.avatar ? (
                        <img src={r.avatar} alt="" className="h-8 w-8 rounded-full" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{r.name[0]}</div>
                      )}
                      <span className="font-medium">{r.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.email || "—"}</TableCell>
                  <TableCell className="tabular-nums">
                    {r.pending > 0
                      ? <span className="font-medium text-amber-600">{r.pending} menunggu</span>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="pr-6 tabular-nums">{r.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0 md:hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <Empty className="p-8">
              <EmptyHeader>
                <EmptyMedia variant="icon"><CalendarX2 /></EmptyMedia>
                <EmptyTitle>{hasActiveFilter ? "Tidak ada murid yang cocok" : "Belum ada booking les privat"}</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="divide-y">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="cursor-pointer p-4"
                  onClick={() => navigate({ to: "/admin/tutoring/$userId", params: { userId: String(r.id) } })}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.name}</p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{r.email || "—"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.pending > 0
                        ? <span className="font-medium text-amber-600">{r.pending} menunggu</span>
                        : "Tidak ada antrean"}
                      {" · "}{r.total} booking
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/tutoring/")({
  component: AdminTutoring,
  validateSearch: adminTutoringSearchSchema,
})
