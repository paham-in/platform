import { createRoute, Link } from "@tanstack/react-router"
import { Route as RootRoute } from "./__root"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useState } from "react"
import {
  LayoutDashboard, BookOpen, MessageSquare, Users, GraduationCap,
  BarChart3, ChevronRight, LogOut, BookMarked, HelpCircle,
  TrendingUp, Clock, CheckCircle2, FileText, Plus
} from "lucide-react"

type Role = "student" | "teacher" | "admin"

const sidebar = [
  { role: ["student", "teacher", "admin"], icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { role: ["student", "teacher"], icon: BookOpen, label: "Mata Pelajaran", href: "#" },
  { role: ["student"], icon: HelpCircle, label: "Pertanyaan Saya", href: "#" },
  { role: ["teacher"], icon: FileText, label: "Materi Saya", href: "#" },
  { role: ["teacher"], icon: MessageSquare, label: "Tanya Jawab", href: "#" },
  { role: ["admin"], icon: Users, label: "Kelola User", href: "/admin/users" },
  { role: ["admin"], icon: BookMarked, label: "Mata Pelajaran", href: "/admin/subjects" },
]

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/dashboard",
  component: function DashboardPage() {
    const [role, setRole] = useState<Role>("student")

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
      admin: [
        { icon: Users, label: "Total Murid", value: "450", color: "text-blue-600 bg-blue-100" },
        { icon: GraduationCap, label: "Total Guru", value: "32", color: "text-green-600 bg-green-100" },
        { icon: BookOpen, label: "Mata Pelajaran", value: "15", color: "text-orange-600 bg-orange-100" },
        { icon: FileText, label: "Total Materi", value: "120", color: "text-purple-600 bg-purple-100" },
      ],
    }

    const StudentContent = () => (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Murid</h2>
        <p className="text-muted-foreground">Selamat datang kembali! Lanjutkan belajarmu.</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.student.map((s) => (
            <Card key={s.label} size="sm">
              <CardContent className="flex flex-col gap-3 p-(--card-spacing)">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Mata Pelajaran</CardTitle>
            </CardHeader>
            <CardContent>
              {["Matematika", "Fisika", "Bahasa Inggris", "Biologi"].map((s) => (
                <div key={s} className="flex items-center justify-between border-b py-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{s[0]}</div>
                    <span className="text-sm font-medium">{s}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">3 materi baru</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aktivitas Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              {[
                { text: "Menyelesaikan materi Trigonometri", time: "2 jam lalu" },
                { text: "Bertanya di forum Matematika", time: "5 jam lalu" },
                { text: "Menonton video Fisika Dasar", time: "1 hari lalu" },
                { text: "Membaca materi Aljabar Linear", time: "2 hari lalu" },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-3 border-b py-3 last:border-0">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm">{a.text}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )

    const TeacherContent = () => (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard Guru</h2>
            <p className="text-muted-foreground">Kelola materi dan jawab pertanyaan siswa.</p>
          </div>
          <Button asChild><Link to="#"><Plus className="mr-1 h-4 w-4" /> Buat Materi</Link></Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.teacher.map((s) => (
            <Card key={s.label} size="sm">
              <CardContent className="flex flex-col gap-3 p-(--card-spacing)">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Materi Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              {[
                { title: "Trigonometri Dasar", subject: "Matematika", status: "Published" },
                { title: "Hukum Newton", subject: "Fisika", status: "Draft" },
                { title: "Tenses Bahasa Inggris", subject: "Bahasa Inggris", status: "Published" },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between border-b py-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{m.subject}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    m.status === "Published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>{m.status}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pertanyaan Perlu Dijawab</CardTitle>
            </CardHeader>
            <CardContent>
              {[
                { q: "Bagaimana cara menghitung integral?", by: "Siswa A", subject: "Matematika" },
                { q: "Apa itu hukum kekekalan energi?", by: "Siswa B", subject: "Fisika" },
                { q: "Perbedaan Past Tense dan Present Perfect?", by: "Siswa C", subject: "Bahasa Inggris" },
              ].map((q, i) => (
                <div key={i} className="flex items-start gap-3 border-b py-3 last:border-0">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm">{q.q}</p>
                    <p className="text-xs text-muted-foreground">{q.by} · {q.subject}</p>
                  </div>
                  <Button variant="ghost" size="sm">Jawab</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )

    const AdminContent = () => (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Admin</h2>
        <p className="text-muted-foreground">Kelola seluruh pengguna dan konten platform.</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.admin.map((s) => (
            <Card key={s.label} size="sm">
              <CardContent className="flex flex-col gap-3 p-(--card-spacing)">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pengguna Terdaftar</CardTitle>
            </CardHeader>
            <CardContent>
              {[
                { name: "Siti Aisyah", role: "Murid", email: "siti@email.com" },
                { name: "Bambang Supriyadi", role: "Guru", email: "bambang@email.com" },
                { name: "Rina Wijaya", role: "Murid", email: "rina@email.com" },
                { name: "Ahmad Fauzi", role: "Guru", email: "ahmad@email.com" },
              ].map((u, i) => (
                <div key={i} className="flex items-center justify-between border-b py-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{u.name[0]}</div>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    u.role === "Guru" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                  }`}>{u.role}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {[
                  { icon: Users, label: "Tambah User", desc: "Tambah murid atau guru baru" },
                  { icon: BookMarked, label: "Tambah Mata Pelajaran", desc: "Buka mata pelajaran baru" },
                  { icon: FileText, label: "Moderasi Konten", desc: "Tinjau materi & forum" },
                ].map((a, i) => (
                  <div key={i} className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <a.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{a.label}</p>
                      <p className="text-xs text-muted-foreground">{a.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )

    return (
      <div className="flex min-h-screen bg-muted/20">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r bg-card p-4 md:flex">
          <Link to="/" className="mb-8 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">B</div>
            <span className="text-lg font-bold">Bimbel</span>
          </Link>

          <nav className="flex-1 space-y-1">
            {sidebar.filter((s) => s.role.includes(role)).map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <s.icon className="h-4 w-4" />
                {s.label}
              </a>
            ))}
          </nav>

          <div className="mt-auto border-t pt-4">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground" asChild>
              <a href="/login"><LogOut className="h-4 w-4" /> Keluar</a>
            </Button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          {/* Top bar */}
          <header className="flex items-center justify-between border-b bg-card px-6 py-3">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-1">
              {(["student", "teacher", "admin"] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    role === r ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r === "student" ? "Murid" : r === "teacher" ? "Guru" : "Admin"}
                </button>
              ))}
            </div>
          </header>

          <main className="p-6">
            {role === "student" && <StudentContent />}
            {role === "teacher" && <TeacherContent />}
            {role === "admin" && <AdminContent />}
          </main>
        </div>
      </div>
    )
  },
})
