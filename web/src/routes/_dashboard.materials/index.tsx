import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getChaptersOptions,
  getClassesOptions,
  getMeOptions,
  getSubjectsOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Loader2, Search, BookOpen, ChevronRight } from "lucide-react"

function MaterialsPage() {
  const { data: chapters = [], isLoading } = useQuery(getChaptersOptions())
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const { data: classes = [] } = useQuery(getClassesOptions())
  const { data: user } = useQuery(getMeOptions())
  const [search, setSearch] = useState("")
  const [classFilter, setClassFilter] = useState("all")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [filterInited, setFilterInited] = useState(false)

  useEffect(() => {
    if (filterInited) return
    const cid = (user as any)?.class_id
    if (cid) {
      setClassFilter(String(cid))
      setFilterInited(true)
    }
  }, [user, filterInited])

  const filtered = chapters.filter((c) => {
    const matchSearch = (c.title ?? "").toLowerCase().includes(search.toLowerCase())
    const matchClass = classFilter === "all" || String(c.class_id) === classFilter
    const matchSubject = subjectFilter === "all" || String(c.subject_id) === subjectFilter
    return matchSearch && matchClass && matchSubject
  })

  const subjectName = (id: number | undefined) => subjects.find((s) => s.id === id)?.name ?? "-"
  const className = (id: number | undefined) => classes.find((c) => c.id === id)?.name ?? "-"

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <main className="p-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Materi</h1>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari chapter..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={classFilter} onValueChange={(v) => { setClassFilter(v ?? "all"); setSubjectFilter("all") }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={subjectFilter} onValueChange={(v) => setSubjectFilter(v ?? "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Subjek" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Subjek</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Tidak ada chapter ditemukan
            </CardContent>
          </Card>
        )}
        {filtered.map((c) => (
          <Link key={c.id} to="/materials/chapters/$id" params={{ id: String(c.id!) }}>
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{c.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {className(c.class_id)} • {subjectName(c.subject_id)}
                      {c.material_count ? ` • ${c.material_count} materi` : ""}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/materials/")({
  component: MaterialsPage,
})
