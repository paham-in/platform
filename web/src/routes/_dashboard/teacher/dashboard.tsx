import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { getMeOptions, getQuestionsOptions } from "@/lib/api/@tanstack/react-query.gen"
import { FileText, MessageSquare, HelpCircle, Users, Plus, BookOpen, ChevronRight } from "lucide-react"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

function TeacherDashboard() {
  const { data: user } = useQuery(getMeOptions())
  const { data: unansweredQuestions = [], isLoading: isLoadingQuestions } = useQuery(
    getQuestionsOptions({ query: { unanswered: true } })
  )

  return (
    <main className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h2 className="text-2xl font-bold tracking-tight">Dashboard Guru</h2><p className="text-muted-foreground">Kelola materi dan jawab pertanyaan siswa, {user?.name}.</p></div>
          <Button onClick={() => {}}><Plus className="mr-1 h-4 w-4" /> Buat Materi</Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: FileText, label: "Materi Dibuat", value: "24", color: "text-blue-600 bg-blue-100" },
            { icon: MessageSquare, label: "Pertanyaan Terjawab", value: "43", color: "text-green-600 bg-green-100" },
            { icon: HelpCircle, label: "Belum Terjawab", value: String(unansweredQuestions.length), color: "text-orange-600 bg-orange-100" },
            { icon: Users, label: "Total Siswa", value: "128", color: "text-purple-600 bg-purple-100" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="flex flex-col gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div><div className="text-2xl font-bold">{s.value}</div><div className="text-sm text-muted-foreground">{s.label}</div></div>
            </CardContent></Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Mata Pelajaran Saya
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(user?.subjects ?? []).length === 0 ? (
              <Empty className="border-0 px-0 py-2">
                <EmptyHeader className="gap-1">
                  <EmptyMedia variant="icon"><BookOpen /></EmptyMedia>
                  <EmptyTitle className="text-sm">Belum ada mata pelajaran yang diatur</EmptyTitle>
                  <EmptyDescription>
                    Hubungi admin untuk menetapkan mata pelajaran yang Anda ampu.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(user?.subjects ?? []).map((s) => (
                  <span key={s.id} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    {s.name}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Mata pelajaran diatur oleh admin.
            </p>
          </CardContent>
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Materi Terbaru</CardTitle></CardHeader><CardContent>
            {[{ title: "Trigonometri Dasar", subject: "Matematika", status: "Published" }, { title: "Hukum Newton", subject: "Fisika", status: "Draft" }].map((m, i) => (
              <div key={i} className="flex items-center justify-between border-b py-3 last:border-0">
                <div><p className="text-sm font-medium">{m.title}</p><p className="text-xs text-muted-foreground">{m.subject}</p></div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${m.status === "Published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{m.status}</span>
              </div>
            ))}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Pertanyaan Perlu Dijawab</CardTitle></CardHeader><CardContent>
            {isLoadingQuestions ? (
              <div className="space-y-3 py-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                ))}
              </div>
            ) : unansweredQuestions.length === 0 ? (
              <Empty className="border-0 px-0 py-2">
                <EmptyHeader className="gap-1">
                  <EmptyMedia variant="icon"><HelpCircle /></EmptyMedia>
                  <EmptyTitle className="text-sm">Tidak ada pertanyaan menunggu jawaban</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              <>
                {unansweredQuestions.slice(0, 4).map((q) => (
                  <div key={q.id} className="flex items-start gap-3 border-b py-3 last:border-0">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1"><p className="text-sm">{q.plain_content}</p><p className="text-xs text-muted-foreground">{q.user_name} · {q.subject_name ?? "-"}</p></div>
                    <a href={`/teacher/forum/${q.id}`}>
                      <Button variant="ghost" size="sm">Jawab</Button>
                    </a>
                  </div>
                ))}
                {unansweredQuestions.length > 4 && (
                  <a href="/teacher/forum?unanswered=true" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    Lihat semua ({unansweredQuestions.length}) <ChevronRight className="h-4 w-4" />
                  </a>
                )}
              </>
            )}
          </CardContent></Card>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/dashboard")({
  component: TeacherDashboard,
})
