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
import {
  getAdminQuestionsOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Search, MoreVertical, Trash2, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { DeleteQuestionDialog } from "@/components/admin/forum"

function AdminForum() {
  const { data: questions = [], isLoading } = useQuery(getAdminQuestionsOptions())
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; content: string } | null>(null)
  const perPage = 10

  const filtered = questions.filter((q) =>
    (q.plain_content ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (q.user_name ?? "").toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <>
      <main className="p-6">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Forum</h1>

        <div className="mb-4 flex flex-wrap gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari pertanyaan atau user..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>

        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Judul</TableHead>
                  <TableHead>Penanya</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="pl-6"><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paged.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="pl-6 font-medium">{q.plain_content?.slice(0, 80)}</TableCell>
                    <TableCell className="text-muted-foreground">{q.user_name}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        q.status === "open" ? "bg-green-100 text-green-700" :
                        q.status === "answered" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {q.status === "open" ? "Terbuka" : q.status === "answered" ? "Terjawab" : "Tertutup"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{q.created_at}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => window.open(`/admin/forum/${q.id}`, "_blank")}>
                            <Eye className="h-4 w-4" /> Lihat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteConfirm({ id: q.id!, content: q.plain_content! })}>
                            <Trash2 className="h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="p-8 text-center text-muted-foreground">
                      Tidak ada pertanyaan
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
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </main>

      {deleteConfirm && (
        <DeleteQuestionDialog question={deleteConfirm} onClose={() => setDeleteConfirm(null)} />
      )}
    </>
  )
}

export const Route = createFileRoute("/_dashboard/admin/forum/")({
  component: AdminForum,
})
