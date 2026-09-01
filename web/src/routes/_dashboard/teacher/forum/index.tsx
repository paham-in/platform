import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getQuestionsOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { useState, useEffect, useMemo } from "react"
import { Search, SearchX, ChevronLeft, ChevronRight, Eye, Funnel, X, MessageSquare, MoreVertical } from "lucide-react"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { usePageHeaderAction, usePageTitle } from "@/components/page-title"

const forumSearchSchema = z.object({
  search: z.string().optional(),
  unanswered: z.coerce.boolean().optional(),
})

const statusOptions = [
  { label: "Semua", value: "all" },
  { label: "Belum Terjawab", value: "unanswered" },
]

function StatusFilterMenu({
  compact,
  value,
  onValueChange,
  activeCount,
}: {
  compact?: boolean;
  value: string;
  onValueChange: (v: string) => void;
  activeCount: number;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={compact ? <Button variant="outline" size="icon" className="relative" /> : <Button variant="outline" />}
        aria-label="Filter status"
      >
        <Funnel className="h-4 w-4" />
        {compact ? (
          activeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )
        ) : (
          <>
            Filter
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => { if (v) onValueChange(v) }}
        >
          <DropdownMenuLabel>Status</DropdownMenuLabel>
          {statusOptions.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function TeacherForum() {
  usePageTitle("Forum")
  const navigate = useNavigate({ from: Route.fullPath })
  const { search: searchParam, unanswered: unansweredParam } = Route.useSearch()
  const [searchInput, setSearchInput] = useState(searchParam ?? "")
  const unansweredOnly = unansweredParam ?? false
  const activeFilterCount = unansweredOnly ? 1 : 0
  const hasActiveFilter = !!searchParam || unansweredOnly
  const [page, setPage] = useState(1)
  const perPage = 10

  const setStatusFilter = (v: string) => {
    navigate({
      search: (prev) => ({ ...prev, unanswered: v === "all" ? undefined : "true" }),
      replace: true,
    })
    setPage(1)
  }

  const statusFilterValue = unansweredOnly ? "unanswered" : "all"
  const headerFilter = useMemo(
    () => (
      <StatusFilterMenu
        compact
        value={statusFilterValue}
        onValueChange={setStatusFilter}
        activeCount={activeFilterCount}
      />
    ),
    [statusFilterValue, activeFilterCount]
  )
  usePageHeaderAction(headerFilter)

  const { data: questions = [], isLoading } = useQuery(
    getQuestionsOptions({
      query: {
        unanswered: unansweredOnly ? true : undefined,
        search: searchParam || undefined,
      },
    })
  )

  const totalPages = Math.ceil(questions.length / perPage)
  const paged = questions.slice((page - 1) * perPage, page * perPage)

  // Sync URL → local state when search changes externally
  useEffect(() => { setSearchInput(searchParam ?? "") }, [searchParam])

  // Debounce search → navigate to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({
        search: (prev) => ({ ...prev, search: searchInput || undefined }),
        replace: true,
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  return (
    <main className="p-4 md:p-6">
      <h1 className="hidden md:block mb-4 text-2xl font-bold tracking-tight">Forum</h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
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
        <div className="hidden md:inline-flex">
          <StatusFilterMenu
            value={unansweredOnly ? "unanswered" : "all"}
            onValueChange={setStatusFilter}
            activeCount={activeFilterCount}
          />
        </div>
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
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paged.map((q) => (
                <TableRow
                  key={q.id}
                  className="cursor-pointer hover:bg-muted/50"
onClick={() => navigate({ to: "/teacher/forum/$id", params: { id: String(q.public_id!) } })}
                >
                  <TableCell className="pl-6 font-medium max-w-[300px] truncate">{q.plain_content}</TableCell>
                  <TableCell className="text-muted-foreground">{q.user_name}</TableCell>
                  <TableCell className="text-muted-foreground">{q.subject_name || "-"}</TableCell>
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
                      <DropdownMenuTrigger
                        render={<Button variant="outline" size="icon" />}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => navigate({ to: "/teacher/forum/$id", params: { id: String(q.public_id!) } })}>
                          <Eye className="h-4 w-4" /> Lihat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && paged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Empty className="border-0 p-8">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">{hasActiveFilter ? <SearchX /> : <MessageSquare />}</EmptyMedia>
                        <EmptyTitle>
                          {hasActiveFilter ? "Tidak ada pertanyaan yang cocok" : "Tidak ada pertanyaan"}
                        </EmptyTitle>
                      </EmptyHeader>
                      {hasActiveFilter && (
                        <EmptyContent>
                          <Button variant="outline" size="sm" onClick={() => {
                            setSearchInput("")
                            navigate({ search: {}, replace: true })
                            setPage(1)
                          }}>
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
  validateSearch: forumSearchSchema,
})
