import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Search, SearchX, X, ClipboardCheck } from "lucide-react"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useState, useEffect } from "react"
import { getAdminTutoringEvidenceOptions, getAdminUsersOptions } from "@/lib/api/@tanstack/react-query.gen"

const attendanceIndexSearchSchema = z.object({
  status: z.enum(["review", "done"]).optional(),
  search: z.string().optional(),
})

const statusFilters = [
  { key: "review", label: "Menunggu Validasi" },
  { key: "done", label: "Selesai" },
] as const

const fmtRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

function AttendanceIndex() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { status, search: searchParam } = Route.useSearch()
  const { data: sessions = [], isLoading } = useQuery(getAdminTutoringEvidenceOptions({ query: { status } }))
  const { data: users = [] } = useQuery(getAdminUsersOptions())
  const [searchInput, setSearchInput] = useState(searchParam ?? "")

  useEffect(() => { setSearchInput(searchParam ?? "") }, [searchParam])

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, search: searchInput || undefined }), replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, navigate])

  // agregasi sesi per murid
  const studentAgg = new Map<number, { count: number; feeUnpaid: number }>()
  for (const s of sessions) {
    const id = s.student_id
    if (id == null) continue
    const agg = studentAgg.get(id) ?? { count: 0, feeUnpaid: 0 }
    agg.count++
    if (s.status === "done" && s.invoice_paid && !s.fee_paid) agg.feeUnpaid += s.fee_amount ?? 0
    studentAgg.set(id, agg)
  }

  const rows = [...studentAgg.entries()].map(([id, agg]) => {
    const u = users.find((x) => x.id === id)
    const name = u?.name ?? sessions.find((s) => s.student_id === id)?.student_name ?? "—"
    const email = u?.email ?? ""
    return { id, name, email, avatar: u?.avatar_url, ...agg }
  }).filter((r) =>
    !searchParam ||
    r.name.toLowerCase().includes(searchParam.toLowerCase()) ||
    r.email.toLowerCase().includes(searchParam.toLowerCase())
  )

  const setFilter = (s: "review" | "done" | undefined) => {
    navigate({ search: (prev) => ({ ...prev, status: s }), replace: true })
  }

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    )
  }

  return (
    <main className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Validasi & Fee Guru</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih murid untuk menyetujui bukti kehadiran guru dan mencatat pembayaran fee per pertemuan.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="relative w-full max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Cari nama atau email"
            placeholder="Cari nama atau email..."
            className="pl-9 pr-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
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
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={!status ? "default" : "outline"} onClick={() => setFilter(undefined)}>
            Semua
          </Button>
          {statusFilters.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={status === f.key ? "default" : "outline"}
              onClick={() => setFilter(status === f.key ? undefined : f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <Card className="pt-0 gap-0 pb-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6">Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Sesi</TableHead>
                <TableHead>Fee Belum Dibayar</TableHead>
                <TableHead className="pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
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
                  <TableCell className="tabular-nums">{r.count}</TableCell>
                  <TableCell className="tabular-nums font-medium">{r.feeUnpaid > 0 ? fmtRp(r.feeUnpaid) : "—"}</TableCell>
                  <TableCell className="pr-6">
                    <Link to="/admin/attendance/$userId" params={{ userId: String(r.id) }} search={{ status }}>
                      <Button variant="outline" size="sm">Lihat Sesi</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Empty className="border-0 p-8">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">{searchParam ? <SearchX /> : <ClipboardCheck />}</EmptyMedia>
                        <EmptyTitle>
                          {searchParam ? "Tidak ada murid yang cocok" : "Tidak ada murid dengan bukti kehadiran"}
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
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/attendance/")({
  component: AttendanceIndex,
  validateSearch: attendanceIndexSearchSchema,
})
