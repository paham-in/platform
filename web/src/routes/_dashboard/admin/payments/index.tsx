import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { getAdminUsersOptions } from "@/lib/api/@tanstack/react-query.gen"
import { Search, SearchX, X, UserX, MoreVertical, Eye, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { usePageTitle } from "@/components/page-title"

const paymentsSearchSchema = z.object({
  search: z.string().optional(),
})

function PaymentsIndex() {
  usePageTitle("Pembayaran")
  const navigate = useNavigate({ from: Route.fullPath })
  const { search: searchParam } = Route.useSearch()
  const { data: users = [], isLoading } = useQuery(
    getAdminUsersOptions({
      query: {
        role: "student",
        search: searchParam || undefined,
      },
    })
  )
  const [searchInput, setSearchInput] = useState(searchParam ?? "")

  // sync URL → local search input
  useEffect(() => { setSearchInput(searchParam ?? "") }, [searchParam])

  // debounce search input → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, search: searchInput || undefined }), replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, navigate])

  const students = users

  return (
    <main className="p-4 md:p-6">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Pembayaran</h1>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="relative w-full max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Cari nama atau email"
            placeholder="Cari nama atau email..."
            className="pl-9 pr-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          autoComplete="off"/>
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
                <TableHead className="pl-6">Nama</TableHead>
                <TableHead>Email</TableHead>
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
                    <TableCell className="pr-6"><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : students.map((u) => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate({ to: "/admin/payments/$userId", params: { userId: String(u.id!) } })}
                >
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{u.name?.[0]}</div>
                      )}
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="pr-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="outline" size="icon" />}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => navigate({ to: "/admin/payments/$userId", params: { userId: String(u.id!) } })}>
                          <Eye className="h-4 w-4" /> Lihat Invoice
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Empty className="border-0 p-8">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">{searchParam ? <SearchX /> : <UserX />}</EmptyMedia>
                        <EmptyTitle>
                          {searchParam ? "Tidak ada murid yang cocok" : "Tidak ada murid ditemukan"}
                        </EmptyTitle>
                      </EmptyHeader>
                      {searchParam && (
                        <EmptyContent>
                          <Button variant="outline" size="sm" onClick={() => setSearchInput("")}>
                            <X className="mr-1 h-4 w-4" /> Bersihkan pencarian
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
                  </div>
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <Empty className="p-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">{searchParam ? <SearchX /> : <UserX />}</EmptyMedia>
                <EmptyTitle>
                  {searchParam ? "Tidak ada murid yang cocok" : "Tidak ada murid ditemukan"}
                </EmptyTitle>
              </EmptyHeader>
              {searchParam && (
                <EmptyContent>
                  <Button variant="outline" size="sm" onClick={() => setSearchInput("")}>
                    <X className="mr-1 h-4 w-4" /> Bersihkan pencarian
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="divide-y">
              {students.map((u) => (
                <div
                  key={u.id}
                  className="flex cursor-pointer items-center gap-3 p-4 transition-colors active:bg-muted/50"
                  onClick={() => navigate({ to: "/admin/payments/$userId", params: { userId: String(u.id!) } })}
                >
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{u.name?.[0]}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{u.name}</p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{u.email}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/payments/")({
  component: PaymentsIndex,
  validateSearch: paymentsSearchSchema,
})
