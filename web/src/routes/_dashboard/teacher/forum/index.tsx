import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  getQuestionsOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Search, ChevronLeft, ChevronRight, Loader2, Eye, MessageSquare } from "lucide-react"

function TeacherForum() {
  const [search, setSearch] = useState("")
  const [unansweredOnly, setUnansweredOnly] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 10

  const { data: questions = [], isLoading } = useQuery(
    getQuestionsOptions({ query: unansweredOnly ? { unanswered: true } : undefined })
  )

  const filtered = questions.filter((q) =>
    (q.plain_content ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (q.user_name ?? "").toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Tanya Jawab</h1>

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
        <Button
          variant={unansweredOnly ? "default" : "outline"}
          size="sm"
          onClick={() => { setUnansweredOnly(!unansweredOnly); setPage(1) }}
        >
          <MessageSquare className="h-4 w-4" /> Belum Terjawab
        </Button>
      </div>

      <Card className="pt-0 gap-0 pb-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6">Pertanyaan</TableHead>
                <TableHead>Penanya</TableHead>
                <TableHead>Subjek</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="pr-6 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="pl-6 font-medium max-w-[300px] truncate">{q.plain_content}</TableCell>
                  <TableCell className="text-muted-foreground">{q.user_name}</TableCell>
                  <TableCell className="text-muted-foreground">{q.subject_name || "-"}</TableCell>
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
                    <a href={`/teacher/forum/${q.id}`} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                    </a>
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="p-8 text-center text-muted-foreground">
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
  )
}

export const Route = createFileRoute("/_dashboard/teacher/forum/")({
  component: TeacherForum,
})
