import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { getMeOptions, getAdminUsersOptions, getAdminMaterialsOptions, getSubjectsOptions } from "@/lib/api/@tanstack/react-query.gen"
import {
  BookOpen, MessageSquare, Users, GraduationCap,
  ChevronRight, HelpCircle,
  TrendingUp, Clock, CheckCircle2, FileText, Plus,
  BookMarked, CreditCard,
} from "lucide-react"

function DashboardPage() {
  const { data: user } = useQuery(getMeOptions())
  const role = user?.roles?.[0] ?? "student"

  // real data for admin dashboard
  const { data: allUsers = [] } = useQuery({
    ...getAdminUsersOptions(),
    enabled: role === "admin",
  })
  const { data: subjects = [] } = useQuery({
    ...getSubjectsOptions(),
    enabled: role === "admin",
  })
  const { data: allMaterials = [] } = useQuery({
    ...getAdminMaterialsOptions(),
    enabled: role === "admin",
  })

  const adminStats = role === "admin"
    ? [
        { icon: Users, label: "Total Murid", value: String(allUsers.filter((u) => (u.roles ?? []).includes("student")).length), color: "text-blue-600 bg-blue-100" },
        { icon: GraduationCap, label: "Total Guru", value: String(allUsers.filter((u) => (u.roles ?? []).includes("teacher")).length), color: "text-green-600 bg-green-100" },
        { icon: BookOpen, label: "Mata Pelajaran", value: String(subjects.length), color: "text-orange-600 bg-orange-100" },
        { icon: FileText, label: "Total Materi", value: String(allMaterials.length), color: "text-purple-600 bg-purple-100" },
      ]
    : []

  const statCards = {
    student: [
      { icon: BookOpen, label: "Materi Diakses", value: "12", color: "text-blue-600 bg-blue-100" },
      { icon: TrendingUp, label: "Progress Belajar", value: "65%", color: "text-green-600 bg-green-100" },
      { icon: Clock, label: "Sesi Terakhir", value: "2 jam", color: "text-orange-600 bg-orange-100" },
      { icon: CheckCircle2, label: "Materi Selesai", value: "8", color: "text-purple-600 bg-purple-100" },
    ],
    teacher: [
      { icon: FileText, label: "Materi Dibuat", value: "24", color: "text-blue-600 bg-blue-100" },
      { icon: MessageSquare, label: "Pertanyaan Terjawab", value: "43", color: "text-green-600 bg-green-100" },
      { icon: HelpCircle, label: "Belum Terjawab", value: "5", color: "text-orange-600 bg-orange-100" },
      { icon: Users, label: "Total Siswa", value: "128", color: "text-purple-600 bg-purple-100" },
    ],
  }

  return (
    <>
      <main className="p-6">
        {role === "student" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Dashboard Murid</h2>
            <p className="text-muted-foreground">Selamat datang kembali! Lanjutkan belajarmu.</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.student.map((s) => (
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
                {[{ text: "Menyelesaikan materi Trigonometri", time: "2 jam lalu" }, { text: "Bertanya di forum Matematika", time: "5 jam lalu" }, { text: "Menonton video Fisika Dasar", time: "1 hari lalu" }, { text: "Membaca materi Aljabar Linear", time: "2 hari lalu" }].map((a, i) => (
                  <div key={i} className="flex items-start gap-3 border-b py-3 last:border-0">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1"><p className="text-sm">{a.text}</p><p className="text-xs text-muted-foreground">{a.time}</p></div>
                  </div>
                ))}
              </CardContent></Card>
            </div>
          </div>
        )}
        {role === "teacher" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div><h2 className="text-2xl font-bold tracking-tight">Dashboard Guru</h2><p className="text-muted-foreground">Kelola materi dan jawab pertanyaan siswa.</p></div>
              <Button onClick={() => {}}><Plus className="mr-1 h-4 w-4" /> Buat Materi</Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.teacher.map((s) => (
                <Card key={s.label}><CardContent className="flex flex-col gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}><s.icon className="h-5 w-5" /></div>
                  <div><div className="text-2xl font-bold">{s.value}</div><div className="text-sm text-muted-foreground">{s.label}</div></div>
                </CardContent></Card>
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card><CardHeader><CardTitle>Materi Terbaru</CardTitle></CardHeader><CardContent>
                {[{ title: "Trigonometri Dasar", subject: "Matematika", status: "Published" }, { title: "Hukum Newton", subject: "Fisika", status: "Draft" }, { title: "Tenses Bahasa Inggris", subject: "Bahasa Inggris", status: "Published" }].map((m, i) => (
                  <div key={i} className="flex items-center justify-between border-b py-3 last:border-0">
                    <div><p className="text-sm font-medium">{m.title}</p><p className="text-xs text-muted-foreground">{m.subject}</p></div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${m.status === "Published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{m.status}</span>
                  </div>
                ))}
              </CardContent></Card>
              <Card><CardHeader><CardTitle>Pertanyaan Perlu Dijawab</CardTitle></CardHeader><CardContent>
                {[{ q: "Bagaimana cara menghitung integral?", by: "Siswa A", subject: "Matematika" }, { q: "Apa itu hukum kekekalan energi?", by: "Siswa B", subject: "Fisika" }, { q: "Perbedaan Past Tense dan Present Perfect?", by: "Siswa C", subject: "Bahasa Inggris" }].map((q, i) => (
                  <div key={i} className="flex items-start gap-3 border-b py-3 last:border-0">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1"><p className="text-sm">{q.q}</p><p className="text-xs text-muted-foreground">{q.by} · {q.subject}</p></div>
                    <Button variant="ghost" size="sm">Jawab</Button>
                  </div>
                ))}
              </CardContent></Card>
            </div>
          </div>
        )}
        {role === "admin" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Dashboard Admin</h2>
            <p className="text-muted-foreground">Kelola seluruh pengguna dan konten platform.</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {adminStats.map((s) => (
                <Card key={s.label}><CardContent className="flex flex-col gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}><s.icon className="h-5 w-5" /></div>
                  <div><div className="text-2xl font-bold">{s.value}</div><div className="text-sm text-muted-foreground">{s.label}</div></div>
                </CardContent></Card>
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card><CardHeader><CardTitle>Pengguna Terdaftar</CardTitle></CardHeader><CardContent>
                {allUsers.slice(0, 5).map((u) => (
                  <div key={u.id} className="flex items-center justify-between border-b py-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{u.name?.[0]}</div>
                      <div><p className="text-sm font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${(u.roles ?? []).includes("teacher") ? "bg-blue-100 text-blue-700" : (u.roles ?? []).includes("admin") ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>{(u.roles ?? []).includes("teacher") ? "Guru" : (u.roles ?? []).includes("admin") ? "Admin" : "Murid"}</span>
                  </div>
                ))}
                {allUsers.length > 5 && (
                  <p className="pt-2 text-center text-xs text-muted-foreground">...dan {allUsers.length - 5} lainnya</p>
                )}
              </CardContent></Card>
              <Card><CardHeader><CardTitle>Aksi Cepat</CardTitle></CardHeader><CardContent>
                <div className="grid gap-3">
                  {[
                    { icon: Users, label: "Kelola User", desc: "Tambah/edit murid & guru", to: "/admin/users" as const },
                    { icon: BookMarked, label: "Mata Pelajaran", desc: "Atur mata pelajaran", to: "/admin/subjects" as const },
                    { icon: CreditCard, label: "Pembayaran", desc: "Kelola invoice & status", to: "/admin/payments" as const },
                  ].map((a) => (
                    <Link key={a.label} to={a.to} className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><a.icon className="h-5 w-5" /></div>
                      <div className="flex-1"><p className="text-sm font-medium">{a.label}</p><p className="text-xs text-muted-foreground">{a.desc}</p></div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </CardContent></Card>
            </div>
          </div>
        )}
      </main>
    </>
  )
}

export const Route = createFileRoute("/_dashboard/dashboard")({
  component: DashboardPage,
})
