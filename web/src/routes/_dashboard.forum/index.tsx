import { useState } from "react"
import { Button } from "@/components/ui/button"
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
  getQuestionsOptions,
  getQuestionsQueryKey,
  deleteQuestionsByIdMutation,
  getSubjectsOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { toast } from "sonner"
import {
  Loader2,
  Plus,
  Search,
  MessageSquare,
  Trash2,
} from "lucide-react"

function ForumPage() {
  const qc = useQueryClient()
  const { data: questions = [], isLoading } = useQuery(getQuestionsOptions())
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const [search, setSearch] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [mineOnly, setMineOnly] = useState(false)

  const { mutate: deleteQuestion } = useMutation({
    ...deleteQuestionsByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getQuestionsQueryKey() })
      toast.success("Pertanyaan berhasil dihapus")
    },
    onError: (err: any) => {
      toast.error(err?.error || err?.message || "Gagal menghapus pertanyaan")
    },
  })

  const filtered = questions.filter((q) => {
    const matchSearch = (q.title ?? "").toLowerCase().includes(search.toLowerCase())
    const matchSubject = subjectFilter === "all" || String(q.subject_id) === subjectFilter
    return matchSearch && matchSubject
  })

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      open: "bg-green-100 text-green-700",
      answered: "bg-blue-100 text-blue-700",
      closed: "bg-gray-100 text-gray-700",
    }
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.open}`}>
        {status === "open" ? "Terbuka" : status === "answered" ? "Terjawab" : "Tertutup"}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <main className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Forum Tanya Jawab</h1>
        <Link to="/forum/new">
          <Button>
            <Plus className="mr-1 h-4 w-4" /> Pertanyaan Baru
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari pertanyaan..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={subjectFilter} onValueChange={(v) => setSubjectFilter(v ?? "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Subjek" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Subjek</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant={mineOnly ? "default" : "outline"} size="sm" onClick={() => setMineOnly(!mineOnly)}>
          {mineOnly ? "Punya Saya" : "Semua"}
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Belum ada pertanyaan
            </CardContent>
          </Card>
        )}
        {filtered.map((q) => (
          <Link key={q.id} to="/forum/$id" params={{ id: String(q.id!) }}>
            <Card className="overflow-hidden transition-colors hover:bg-muted/50">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge status={q.status ?? "open"} />
                    {q.subject_name && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {q.subject_name}
                      </span>
                    )}
                  </div>
                  {q.is_owner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-0.5 h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault()
                        deleteQuestion({ path: { id: q.id! } })
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <h3 className="mt-3 font-semibold leading-snug">{q.title}</h3>

                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  {q.user_avatar ? (
                    <img src={q.user_avatar} alt="" className="h-4 w-4 rounded-full" />
                  ) : (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {q.user_name?.[0]}
                    </div>
                  )}
                  <span className="truncate">{q.user_name}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <MessageSquare className="h-3 w-3" />
                    {q.upvotes}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/forum/")({
  component: ForumPage,
})
