import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getAdminUsersOptions } from "@/lib/api/@tanstack/react-query.gen"
import { Search, Loader2 } from "lucide-react"

function PaymentsIndex() {
  const { data: users = [], isLoading } = useQuery(getAdminUsersOptions())
  const [search, setSearch] = useState("")

  const students = users.filter((u) => (u.roles ?? []).includes("student"))
  const filtered = students.filter((u) =>
    (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Pembayaran</h1>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari nama atau email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card className="pt-0 gap-0 pb-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6">Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
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
                  <TableCell className="pr-6">
                    <Link to="/admin/payments/$userId" params={{ userId: String(u.id!) }}>
                      <Button variant="outline" size="sm">Lihat Invoice</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="p-8 text-center text-muted-foreground">
                    Tidak ada murid ditemukan
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

export const Route = createFileRoute("/_dashboard/admin/payments/")({
  component: PaymentsIndex,
})
