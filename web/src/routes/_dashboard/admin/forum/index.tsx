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
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { useState, useEffect } from "react"
import { Search, SearchX, MoreVertical, Trash2, ChevronLeft, ChevronRight, Eye, X, MessageSquare } from "lucide-react"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { DeleteQuestionDialog } from "@/components/admin/forum"
import { usePageTitle } from "@/components/page-title"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"

const adminForumSearchSchema = z.object({
  search: z.string().optional(),
  modal: z.string().optional(),
})

function AdminForum() {
  usePageTitle("Forum")
  const navigate = useNavigate({ from: Route.fullPath })
  const { search: searchParam, modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()
  const { data: questions = [], isLoading } = useQuery(
    getAdminQuestionsOptions({ query: { search: searchParam || undefined } })
  )
  const [searchInput, setSearchInput] = useState(searchParam ?? "")
  const [page, setPage] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; content: string } | null>(null)
  const perPage = 10

  useEffect(() => {
    if (modal !== "delete") setDeleteConfirm(null)
  }, [modal])

  // sync URL → local search input
  useEffect(() => { setSearchInput(searchParam ?? "") }, [searchParam])

  // debounce search input → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, search: searchInput || undefined }), replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, navigate])

  const totalPages = Math.ceil(questions.length / perPage)
  const paged = questions.slice((page - 1) * perPage, page * perPage)

  return (
    <>
      <main className="p-4 md:p-6">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Forum</h1>

        <div className="mb-4 flex flex-wrap gap-4">
          <div className="relative w-full max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Cari pertanyaan"
              placeholder="Cari pertanyaan atau user..."
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
                        (q.answer_count ?? 0) > 0 ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                      }`}>
                        {(q.answer_count ?? 0) > 0 ? "Terjawab" : "Terbuka"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{q.created_at}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => window.open(`/admin/forum/${q.public_id}`, "_blank")}>
                            <Eye className="h-4 w-4" /> Lihat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setDeleteConfirm({ id: q.id!, content: q.plain_content! }); openModal("delete") }}>
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
                          <EmptyMedia variant="icon">{searchParam ? <SearchX /> : <MessageSquare />}</EmptyMedia>
                          <EmptyTitle>
                            {searchParam ? "Tidak ada pertanyaan yang cocok" : "Tidak ada pertanyaan"}
                          </EmptyTitle>
                        </EmptyHeader>
                        {searchParam && (
                          <EmptyContent>
                            <Button variant="outline" size="sm" onClick={() => { setSearchInput(""); setPage(1) }}>
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

        {/* Mobile card list */}
        <Card className="gap-0 py-0 md:hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={`skeleton-${i}`} className="flex items-start gap-3 p-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paged.map((q) => (
              <div key={q.id} className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{q.plain_content?.slice(0, 80)}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{q.user_name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      (q.answer_count ?? 0) > 0 ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                    }`}>
                      {(q.answer_count ?? 0) > 0 ? "Terjawab" : "Terbuka"}
                    </span>
                    <span className="text-xs text-muted-foreground">{q.created_at}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="shrink-0" />}>
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => window.open(`/admin/forum/${q.public_id}`, "_blank")}>
                      <Eye className="h-4 w-4" /> Lihat
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setDeleteConfirm({ id: q.id!, content: q.plain_content! }); openModal("delete") }}>
                      <Trash2 className="h-4 w-4" /> Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            {!isLoading && paged.length === 0 && (
              <Empty className="p-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">{searchParam ? <SearchX /> : <MessageSquare />}</EmptyMedia>
                  <EmptyTitle>
                    {searchParam ? "Tidak ada pertanyaan yang cocok" : "Tidak ada pertanyaan"}
                  </EmptyTitle>
                </EmptyHeader>
                {searchParam && (
                  <EmptyContent>
                    <Button variant="outline" size="sm" onClick={() => { setSearchInput(""); setPage(1) }}>
                      <X className="mr-1 h-4 w-4" /> Bersihkan pencarian
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            )}
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

      {modal === "delete" && deleteConfirm && (
        <DeleteQuestionDialog question={deleteConfirm} onClose={closeModal} />
      )}
    </>
  )
}

export const Route = createFileRoute("/_dashboard/admin/forum/")({
  component: AdminForum,
  validateSearch: adminForumSearchSchema,
})
