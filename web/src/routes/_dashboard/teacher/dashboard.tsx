import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { getMeOptions } from "@/lib/api/@tanstack/react-query.gen"
import { FileText, MessageSquare, HelpCircle, Users, Plus, BookOpen } from "lucide-react"

function TeacherDashboard() {
  const { data: user } = useQuery(getMeOptions())

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
            { icon: HelpCircle, label: "Belum Terjawab", value: "5", color: "text-orange-600 bg-orange-100" },
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
              <p className="text-sm text-muted-foreground">
                Belum ada mata pelajaran yang diatur. Hubungi admin untuk menetapkan mata pelajaran yang Anda ampu.
              </p>
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
            {[{ q: "Bagaimana cara menghitung integral?", by: "Siswa A", subject: "Matematika" }].map((q, i) => (
              <div key={i} className="flex items-start gap-3 border-b py-3 last:border-0">
                <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1"><p className="text-sm">{q.q}</p><p className="text-xs text-muted-foreground">{q.by} · {q.subject}</p></div>
                <Button variant="ghost" size="sm">Jawab</Button>
              </div>
            ))}
          </CardContent></Card>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/dashboard")({
  component: TeacherDashboard,
})
