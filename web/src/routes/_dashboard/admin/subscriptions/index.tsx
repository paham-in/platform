import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"
import { getAdminStudentClassEnrollmentsOptions, getAdminUsersOptions } from "@/lib/api/@tanstack/react-query.gen"
import { Search, X, KeyRound } from "lucide-react"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useState, useEffect } from "react"
import { usePageTitle } from "@/components/page-title"

const subscriptionsSearchSchema = z.object({
  search: z.string().optional(),
})

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function AdminSubscriptions() {
  usePageTitle("Langganan Konten")
  const navigate = useNavigate({ from: Route.fullPath })
  const { search: searchParam } = Route.useSearch()
  const { data: items = [], isLoading: itemsLoading } = useQuery(getAdminStudentClassEnrollmentsOptions({}))
  const { data: users = [], isLoading: usersLoading } = useQuery(getAdminUsersOptions({ query: { role: "student" } }))
  const isLoading = itemsLoading || usersLoading
  const [searchInput, setSearchInput] = useState(searchParam ?? "")

  useEffect(() => { setSearchInput(searchParam ?? "") }, [searchParam])

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, search: searchInput || undefined }), replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, navigate])

  const today = todayStr()
  const agg = new Map<number, { name: string; active: number; total: number }>()
  for (const sp of items) {
    const uid = sp.user_id ?? sp.user?.id
    if (uid == null) continue
    const cur = agg.get(uid) ?? { name: sp.user?.name ?? "—", active: 0, total: 0 }
    cur.total++
    if (sp.user?.name) cur.name = sp.user.name
    if (sp.expiry && sp.expiry >= today) cur.active++
    agg.set(uid, cur)
  }

  const q = (searchParam ?? "").toLowerCase()
  const rows = users
    .map((u) => {
      const mine = agg.get(u.id!)
      return {
        id: u.id!,
        name: u.name ?? "—",
        email: u.email ?? "",
        avatar: u.avatar_url,
        active: mine?.active ?? 0,
        total: mine?.total ?? 0,
      }
    })
    .filter((r) => q === "" || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
    .sort((a, b) => b.active - a.active || a.name.localeCompare(b.name, "id"))

  const hasActiveFilter = !!searchParam

  return (
    <main className="p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Langganan Konten</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Klik murid untuk melihat langganan dan membuat invoice baru.
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
                <TableHead>Aktif</TableHead>
                <TableHead className="pr-6">Total Langganan</TableHead>
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
                        <EmptyMedia variant="icon"><KeyRound /></EmptyMedia>
                        <EmptyTitle>{hasActiveFilter ? "Tidak ada murid yang cocok" : "Belum ada langganan"}</EmptyTitle>
                      </EmptyHeader>
                      {hasActiveFilter && (
                        <EmptyContent>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearchInput("")
                              navigate({ search: {}, replace: true })
                            }}
                          >
                            <X className="mr-1 h-4 w-4" /> Bersihkan filter
                          </Button>
                        </EmptyContent>
                      )}
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : rows.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/admin/subscriptions/$userId", params: { userId: String(r.id) } })}
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
                    {r.active > 0
                      ? <span className="font-medium text-green-600">{r.active} aktif</span>
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
                <EmptyMedia variant="icon"><KeyRound /></EmptyMedia>
                <EmptyTitle>{hasActiveFilter ? "Tidak ada murid yang cocok" : "Belum ada langganan"}</EmptyTitle>
              </EmptyHeader>
              {hasActiveFilter && (
                <EmptyContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchInput("")
                      navigate({ search: {}, replace: true })
                    }}
                  >
                    <X className="mr-1 h-4 w-4" /> Bersihkan filter
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="divide-y">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="cursor-pointer p-4"
                  onClick={() => navigate({ to: "/admin/subscriptions/$userId", params: { userId: String(r.id) } })}
                >
                  <p className="truncate font-medium">{r.name}</p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{r.email || "—"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.active > 0
                      ? <span className="font-medium text-green-600">{r.active} aktif</span>
                      : "Tidak ada yang aktif"}
                    {" · "}{r.total} langganan
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/subscriptions/")({
  component: AdminSubscriptions,
  validateSearch: subscriptionsSearchSchema,
})
