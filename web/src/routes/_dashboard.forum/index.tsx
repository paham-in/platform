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
  postQuestionsMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { toast } from "sonner"
import {
  Loader2,
  Plus,
  Search,
  MessageSquare,
  ChevronDown,
  Trash2,
} from "lucide-react"

function ForumPage() {
  const qc = useQueryClient()
  const { data: questions = [], isLoading } = useQuery(getQuestionsOptions())
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const [search, setSearch] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<number | null>(null)

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
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Belum ada pertanyaan
            </CardContent>
          </Card>
        )}
        {filtered.map((q) => (
          <Card key={q.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <StatusBadge status={q.status ?? "open"} />
                    {q.subject_name && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {q.subject_name}
                      </span>
                    )}
                  </div>
                  <h3
                    className="cursor-pointer text-lg font-semibold hover:text-primary"
                    onClick={() => setExpandedId(expandedId === q.id ? null : q.id!)}
                  >
                    {q.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                    {q.user_avatar ? (
                      <img src={q.user_avatar} alt="" className="h-5 w-5 rounded-full" />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {q.user_name?.[0]}
                      </div>
                    )}
                    <span>{q.user_name}</span>
                    <span>•</span>
                    <span>{q.created_at}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {q.upvotes}
                    </span>
                  </div>
                  {expandedId === q.id && (
                    <div className="mt-4 rounded-lg bg-muted/50 p-4 text-sm">
                      {q.content}
                    </div>
                  )}
                </div>
                {q.is_owner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={() => deleteQuestion({ path: { id: q.id! } })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {expandedId !== q.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-muted-foreground"
                  onClick={() => setExpandedId(q.id!)}
                >
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Tampilkan jawaban
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/forum/")({
  component: ForumPage,
})
