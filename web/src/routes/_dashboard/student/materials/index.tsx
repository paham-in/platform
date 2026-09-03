import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
  getChaptersOptions,
  getClassesOptions,
  getSubjectsOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { Search, SearchX, BookOpen, ChevronRight, GraduationCap, Layers, Funnel, X } from "lucide-react"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { usePageHeaderAction, usePageTitle } from "@/components/page-title"

const materialsSearchSchema = z.object({
  search: z.string().optional(),
  subject: z.string().optional(),
})

function SubjectFilterMenu({
  compact,
  value,
  onValueChange,
  activeCount,
  options,
}: {
  compact?: boolean;
  value: string;
  onValueChange: (v: string) => void;
  activeCount: number;
  options: { label: string; value: string }[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={compact ? <Button variant="outline" size="icon-lg" className="relative" /> : <Button variant="outline" />}
        aria-label="Filter materi"
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
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => { if (v) onValueChange(v) }}>
          <DropdownMenuLabel>Subjek</DropdownMenuLabel>
          {options.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MaterialsPage() {
  usePageTitle("Materi")
  const navigate = useNavigate({ from: Route.fullPath })
  const { search: searchParam, subject: subjectParam } = Route.useSearch()
  const { data: chapters = [], isLoading, isError } = useQuery(
    getChaptersOptions({
      query: {
        subject_id: subjectParam && subjectParam !== "all" ? Number(subjectParam) : undefined,
        search: searchParam || undefined,
      },
    })
  )
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const { data: classes = [] } = useQuery(getClassesOptions())
  const [searchInput, setSearchInput] = useState(searchParam ?? "")
  const subjectFilter = subjectParam ?? "all"

  // sync URL → local search input
  useEffect(() => { setSearchInput(searchParam ?? "") }, [searchParam])

  // debounce search input → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, search: searchInput || undefined }), replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, navigate])

  const subjectOptions = useMemo(
    () => [
      { label: "Semua Subjek", value: "all" },
      ...subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) })),
    ],
    [subjects]
  )
  const activeFilterCount = subjectFilter !== "all" ? 1 : 0
  const hasActiveFilter = !!searchParam || subjectFilter !== "all"

  const setSubjectFilter = (v: string) => {
    navigate({ search: (prev) => ({ ...prev, subject: v === "all" ? undefined : v }), replace: true })
  }

  const headerFilter = useMemo(
    () => (
      <SubjectFilterMenu
        compact
        value={subjectFilter}
        onValueChange={setSubjectFilter}
        activeCount={activeFilterCount}
        options={subjectOptions}
      />
    ),
    [subjectFilter, activeFilterCount, subjectOptions]
  )
  usePageHeaderAction(headerFilter)

  const subjectName = (id: number | undefined) => subjects.find((s) => s.id === id)?.name ?? "-"
  const className = (id: number | undefined) => classes.find((c) => c.id === id)?.name ?? "-"

  if (isLoading) {
    return (
      <main className="p-4 md:p-6">
        <Skeleton className="mb-1 h-8 w-32" />
        <Skeleton className="mb-6 h-4 w-64" />
        <Skeleton className="mb-6 h-9 w-full max-w-sm" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full rounded-none" />
              <CardContent className="space-y-2 p-5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="p-4 md:p-6">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">Materi</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <p className="text-muted-foreground">Gagal memuat daftar materi.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Muat Ulang</Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Materi</h1>
      <p className="mb-6 text-sm text-muted-foreground">Jelajahi materi dari semua bab.</p>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Cari bab"
            placeholder="Cari bab..."
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
        <div className="hidden md:inline-flex">
          <SubjectFilterMenu
            value={subjectFilter}
            onValueChange={setSubjectFilter}
            activeCount={activeFilterCount}
            options={subjectOptions}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {chapters.length === 0 ? (
          <Empty className="sm:col-span-2 lg:col-span-3">
            <EmptyHeader>
              <EmptyMedia variant="icon">{hasActiveFilter ? <SearchX /> : <BookOpen />}</EmptyMedia>
              <EmptyTitle>{hasActiveFilter ? "Tidak ada bab" : "Belum ada materi"}</EmptyTitle>
              {hasActiveFilter ? (
                <EmptyDescription>
                  Tidak ada bab yang cocok dengan pencarian atau filter saat ini.
                </EmptyDescription>
              ) : (
                <EmptyDescription>
                  Materi akan muncul di sini setelah guru menambahkan bab.
                </EmptyDescription>
              )}
            </EmptyHeader>
            {hasActiveFilter && (
              <EmptyContent>
                <Button variant="outline" size="sm" onClick={() => {
                  setSearchInput("")
                  navigate({ search: {}, replace: true })
                }}>
                  <X className="mr-1 h-4 w-4" /> Bersihkan filter
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          chapters.map((c) => (
            <button
            key={c.id}
            type="button"
            onClick={() => navigate({ to: "/student/materials/chapters/$id", params: { id: String(c.id!) } })}
            className="block w-full text-left"
          >
            <Card className="group cursor-pointer overflow-hidden transition-colors hover:bg-muted/50">
              {c.cover_url ? (
                <img src={c.cover_url} alt="" className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-muted/30">
                  <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}
              <CardContent>
                <h3 className="font-semibold">{c.title}</h3>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" />
                    {className(c.class_id)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {subjectName(c.subject_id)}
                  </span>
                  {c.material_count ? <span>{c.material_count} materi</span> : null}
                </div>
                <span className="mt-2 inline-flex items-center text-xs font-medium text-primary">
                  Lihat <ChevronRight className="ml-0.5 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </CardContent>
            </Card>
          </button>
          ))
        )}
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/materials/")({
  component: MaterialsPage,
  validateSearch: materialsSearchSchema,
})
