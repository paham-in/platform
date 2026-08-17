import { createFileRoute, Link } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { getAdminUsersOptions, getAdminMaterialsOptions, getSubjectsOptions } from "@/lib/api/@tanstack/react-query.gen"
import { Users, GraduationCap, BookOpen, FileText, BookMarked, ChevronRight, CreditCard } from "lucide-react"

function AdminDashboard() {
  const { data: allUsers = [] } = useQuery(getAdminUsersOptions())
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const { data: allMaterials = [] } = useQuery(getAdminMaterialsOptions())

  const stats = [
    { icon: Users, label: "Total Murid", value: String(allUsers.filter((u) => (u.roles ?? []).includes("student")).length), color: "text-blue-600 bg-blue-100" },
    { icon: GraduationCap, label: "Total Guru", value: String(allUsers.filter((u) => (u.roles ?? []).includes("teacher")).length), color: "text-green-600 bg-green-100" },
    { icon: BookOpen, label: "Mata Pelajaran", value: String(subjects.length), color: "text-orange-600 bg-orange-100" },
    { icon: FileText, label: "Total Materi", value: String(allMaterials.length), color: "text-purple-600 bg-purple-100" },
  ]

  return (
    <main className="p-4 md:p-6">
      <div className="space-y-4 md:space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Admin</h2>
        <p className="text-muted-foreground">Kelola seluruh pengguna dan konten platform.</p>
        <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}><CardContent className="flex flex-col gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div><div className="text-2xl font-bold">{s.value}</div><div className="text-sm text-muted-foreground">{s.label}</div></div>
            </CardContent></Card>
          ))}
        </div>
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
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
            {allUsers.length > 5 && <p className="pt-2 text-center text-xs text-muted-foreground">...dan {allUsers.length - 5} lainnya</p>}
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
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/dashboard")({
  component: AdminDashboard,
})
