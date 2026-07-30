import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { getMeOptions } from "@/lib/api/@tanstack/react-query.gen"
import { BookOpen, TrendingUp, Clock, CheckCircle2 } from "lucide-react"

function StudentDashboard() {
  const { data: user } = useQuery(getMeOptions())

  return (
    <main className="p-6">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Murid</h2>
        <p className="text-muted-foreground">Selamat datang kembali, {user?.name}! Lanjutkan belajarmu.</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BookOpen, label: "Materi Diakses", value: "12", color: "text-blue-600 bg-blue-100" },
            { icon: TrendingUp, label: "Progress Belajar", value: "65%", color: "text-green-600 bg-green-100" },
            { icon: Clock, label: "Sesi Terakhir", value: "2 jam", color: "text-orange-600 bg-orange-100" },
            { icon: CheckCircle2, label: "Materi Selesai", value: "8", color: "text-purple-600 bg-purple-100" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="flex flex-col gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div><div className="text-2xl font-bold">{s.value}</div><div className="text-sm text-muted-foreground">{s.label}</div></div>
            </CardContent></Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Mata Pelajaran</CardTitle></CardHeader><CardContent>
            {["Matematika", "Fisika", "Bahasa Inggris", "Biologi"].map((s) => (
              <div key={s} className="flex items-center justify-between border-b py-3 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{s[0]}</div>
                  <span className="text-sm font-medium">{s}</span>
                </div>
                <span className="text-xs text-muted-foreground">3 materi baru</span>
              </div>
            ))}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Aktivitas Terbaru</CardTitle></CardHeader><CardContent>
            {[{ text: "Menyelesaikan materi Trigonometri", time: "2 jam lalu" }, { text: "Bertanya di forum Matematika", time: "5 jam lalu" }].map((a, i) => (
              <div key={i} className="flex items-start gap-3 border-b py-3 last:border-0">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1"><p className="text-sm">{a.text}</p><p className="text-xs text-muted-foreground">{a.time}</p></div>
              </div>
            ))}
          </CardContent></Card>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/dashboard")({
  component: StudentDashboard,
})
