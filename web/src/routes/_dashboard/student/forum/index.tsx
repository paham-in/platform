import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
  getQuestionsOptions,
  getSubjectsOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { Plus, Search, SearchX, Funnel, X, MessageSquare, Sparkles } from "lucide-react"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useCanPostForum } from "@/hooks/use-can-post-forum"

const forumSearchSchema = z.object({
  search: z.string().optional(),
  subject: z.string().optional(),
})

function Avatar({ url, name, size = "md" }: { url?: string; name?: string; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-6 w-6 text-[10px]" : "h-9 w-9 text-xs"
  if (url) return <img src={url} alt="" className={`${cls} shrink-0 rounded-full`} />
  return (
    <span className={`flex ${cls} shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary`}>
      {name?.[0]?.toUpperCase()}
    </span>
  )
}

function formatDate(iso?: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

function NewQuestionAction({ locked, size }: { locked: boolean; size?: "default" | "sm" }) {
  if (locked) {
    return (
      <Link to="/student/subscribe">
        <Button size={size}>
          <Sparkles className="mr-1 h-4 w-4" /> Berlangganan untuk Bertanya
        </Button>
      </Link>
    )
  }
  return (
    <Link to="/student/forum/new">
      <Button size={size}>
        <Plus className="mr-1 h-4 w-4" /> Pertanyaan Baru
      </Button>
    </Link>
  )
}

function ForumPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { search: searchParam, subject: subjectParam } = Route.useSearch()
  const canPost = useCanPostForum()
  const locked = canPost === false
  const { data: questions = [], isLoading } = useQuery(
    getQuestionsOptions({
      query: {
        subject_id: subjectParam && subjectParam !== "all" ? Number(subjectParam) : undefined,
        search: searchParam || undefined,
      },
    })
  )
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const [searchInput, setSearchInput] = useState(searchParam ?? "")
  const subjectFilter = subjectParam ?? "all"

  const subjectOptions = [
    { label: "Semua Subjek", value: "all" },
    ...subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) })),
  ]
  const activeFilterCount = subjectFilter !== "all" ? 1 : 0
  const hasActiveFilter = !!searchParam || subjectFilter !== "all"

  // sync URL → local search input
  useEffect(() => { setSearchInput(searchParam ?? "") }, [searchParam])

  // debounce search input → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, search: searchInput || undefined }), replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, navigate])

  const setSubjectFilter = (v: string) => {
    navigate({ search: (prev) => ({ ...prev, subject: v === "all" ? undefined : v }), replace: true })
  }

  const resetFilters = () => {
    setSearchInput("")
    navigate({ search: {}, replace: true })
  }

  if (isLoading) {
    return (
      <main className="p-4 md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-40" />
        </div>
        <Skeleton className="mb-6 h-9 w-full max-w-sm" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="mt-1 h-16 w-0.5" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex items-center gap-3 pt-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Forum</h1>
        <NewQuestionAction locked={locked} />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Cari pertanyaan"
            placeholder="Cari pertanyaan..."
            className="pl-9 pr-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          autoComplete="off"/>
          {searchInput && (
            <button
              type="button"
              aria-label="Bersihkan pencarian"
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" />}
            aria-label="Filter subjek"
          >
            <Funnel className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52">
            <DropdownMenuRadioGroup aria-label="Subjek" value={subjectFilter} onValueChange={(v) => { if (v) setSubjectFilter(v) }}>
              <DropdownMenuLabel>Subjek</DropdownMenuLabel>
              {subjectOptions.map((opt) => (
                <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Link to="/student/forum/mine">
          <Button variant="outline" size="sm">Pertanyaan Saya</Button>
        </Link>
      </div>

      {questions.length === 0 ? (
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">{hasActiveFilter ? <SearchX /> : <MessageSquare />}</EmptyMedia>
            <EmptyTitle>{hasActiveFilter ? "Tidak ada pertanyaan" : "Belum ada pertanyaan"}</EmptyTitle>
            {hasActiveFilter ? (
              <EmptyDescription>
                Tidak ada pertanyaan yang cocok dengan pencarian atau filter saat ini.
              </EmptyDescription>
            ) : (
              <EmptyDescription>
                Mulai diskusi pertamamu dengan mengajukan pertanyaan.
              </EmptyDescription>
            )}
          </EmptyHeader>
          <EmptyContent>
            {hasActiveFilter ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <X className="mr-1 h-4 w-4" /> Bersihkan filter
              </Button>
            ) : (
              <NewQuestionAction locked={locked} size="sm" />
            )}
          </EmptyContent>
        </Empty>
      ) : (
        <div className="columns-1 gap-4 md:columns-2">
          {questions.map((q) => (
            <Card key={q.id} className="mb-4 break-inside-avoid transition-colors hover:bg-muted/40">
              <Link
                to="/student/forum/$id"
                params={{ id: String(q.id!) }}
                className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <CardContent>
                  <div className="flex gap-3">
                    <Avatar url={q.user_avatar} name={q.user_name} />

                    <div className="min-w-0 flex-1">
                      {/* Pertanyaan */}
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {q.subject_name && (
                            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                              {q.subject_name}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 font-heading text-[15px] font-semibold leading-snug">{q.plain_content}</p>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{q.user_name}</span>
                          {formatDate(q.created_at) && <span>• {formatDate(q.created_at)}</span>}
                          {q.answer_count !== undefined && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {q.answer_count === 0 ? "Belum ada jawaban" : `${q.answer_count} jawaban`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Jawaban teratas — indent sejajar kolom konten pertanyaan */}
                  {q.top_answer && (
                    <div className="mt-3 flex items-start gap-3 pl-12">
                      <Avatar url={q.top_answer.user_avatar} name={q.top_answer.user_name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{q.top_answer.user_name}</span>
                          {formatDate(q.top_answer.created_at) && (
                            <span>• {formatDate(q.top_answer.created_at)}</span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{q.top_answer.plain_content}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/forum/")({
  component: ForumPage,
  validateSearch: forumSearchSchema,
})
