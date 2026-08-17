import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"
import { getMeOptions, getStudentClassesOptions } from "@/lib/api/@tanstack/react-query.gen"
import { BookMarked, BookOpen, TrendingUp, Clock, CheckCircle2, BadgeCheck, Calendar, ChevronRight, CreditCard, GraduationCap, ListChecks, MessageSquare, Zap } from "lucide-react"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { format } from "date-fns"

function StudentDashboard() {
  const navigate = useNavigate()
  const { data: user } = useQuery(getMeOptions())
  const { data: classes = [], isLoading: programsLoading } = useQuery(getStudentClassesOptions())
  const today = format(new Date(), "yyyy-MM-dd")

  const stats = [
    { icon: BookOpen, label: "Materi Diakses", value: "12", color: "text-blue-600 bg-blue-100" },
    { icon: TrendingUp, label: "Progress Belajar", value: "65%", color: "text-green-600 bg-green-100" },
    { icon: Clock, label: "Sesi Terakhir", value: "2 jam", color: "text-orange-600 bg-orange-100" },
    { icon: CheckCircle2, label: "Materi Selesai", value: "8", color: "text-purple-600 bg-purple-100" },
  ]

  return (
    <main className="p-4 md:p-6">
      <div className="space-y-4 md:space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Murid</h2>
        <p className="text-muted-foreground">Selamat datang kembali, {user?.name}! Lanjutkan belajarmu.</p>
        <div className="hidden gap-4 md:gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}><CardContent className="flex flex-col gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div><div className="text-2xl font-bold">{s.value}</div><div className="text-sm text-muted-foreground">{s.label}</div></div>
            </CardContent></Card>
          ))}
        </div>
        <Card className="sm:hidden">
          <CardContent className="divide-y">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.color}`}><s.icon className="h-5 w-5" /></div>
                <div>
                  <div className="text-xl font-bold">{s.value}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" /> Pintasan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: BookMarked, label: "Materi", desc: "Jelajahi materi pelajaran", to: "/student/materials" as const },
                { icon: ListChecks, label: "Paket Soal", desc: "Latihan soal per kelas", to: "/student/packages" as const },
                { icon: GraduationCap, label: "Les Privat", desc: "Booking & jadwal les", to: "/student/tutoring" as const },
                { icon: MessageSquare, label: "Forum", desc: "Bertanya di forum", to: "/student/forum" as const },
                { icon: Calendar, label: "Kalender", desc: "Lihat jadwal belajarmu", to: "/student/calendar" as const },
                { icon: CreditCard, label: "Pembayaran", desc: "Langganan & invoice", to: "/student/payments" as const },
              ].map((a) => (
                <button key={a.label} type="button" onClick={() => navigate({ to: a.to })} className="flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><a.icon className="h-5 w-5" /></div>
                  <div className="flex-1"><p className="text-sm font-medium">{a.label}</p><p className="text-xs text-muted-foreground">{a.desc}</p></div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Langganan & Akses</CardTitle>
            </CardHeader>
            <CardContent>
              {programsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : classes.length === 0 ? (
                <Empty className="border-0 px-0 py-2">
                  <EmptyHeader className="gap-1">
                    <EmptyMedia variant="icon"><BadgeCheck /></EmptyMedia>
                    <EmptyTitle className="text-sm">Belum ada langganan</EmptyTitle>
                    <EmptyDescription>
                      Berlangganan dulu untuk akses materi premium.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <button type="button" onClick={() => navigate({ to: "/student/payments" })} className="text-sm font-medium text-primary hover:underline">
                      Lihat halaman pembayaran →
                    </button>
                  </EmptyContent>
                </Empty>
              ) : (
                <div className="divide-y">
                  {classes.map((sp) => {
                    const expired = (sp.expiry ?? "") < today
                    return (
                      <div key={sp.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                            {(sp.class?.name ?? "?")[0]}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{sp.class?.name ?? "—"}</div>
                            <div className="text-xs text-muted-foreground">Kadaluarsa {sp.expiry ?? "—"}</div>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            expired ? "bg-muted text-muted-foreground" : "bg-green-100 text-green-700"
                          }`}
                        >
                          {expired ? "Kadaluarsa" : "Aktif"}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
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
