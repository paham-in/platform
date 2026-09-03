import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { getMeOptions } from "@/lib/api/@tanstack/react-query.gen"
import { homeForRoles } from "@/lib/role"
import { Button } from "@/components/ui/button"
import { Compass } from "lucide-react"

export function NotFound() {
  const navigate = useNavigate()
  const token = typeof window !== "undefined" && localStorage.getItem("token")
  const { data: user } = useQuery({ ...getMeOptions(), enabled: !!token })
  const roles = (user?.roles as string[] | undefined) ?? []
  const hasAccessRole = ["student", "teacher", "admin"].some((r) => roles.includes(r))
  const to = token && hasAccessRole ? homeForRoles(roles) : "/login"

  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-8 bg-background px-4 text-center">
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10">
          <Compass className="h-12 w-12 text-primary" />
        </div>
        <span className="absolute -right-3 -top-3 flex h-9 min-w-9 items-center justify-center rounded-full bg-primary px-2 text-sm font-bold text-primary-foreground shadow-lg">
          404
        </span>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Halaman tidak ditemukan</h1>
        <p className="mx-auto max-w-md text-balance text-sm text-muted-foreground">
          Halaman yang kamu cari tidak ada, sudah dipindah, atau URL-nya salah. Periksa kembali alamatnya,
          atau kembali ke dashboard untuk melanjutkan.
        </p>
      </div>

      <Button size="lg" onClick={() => navigate({ to: to as never })}>
        Kembali ke Dashboard
      </Button>
    </main>
  )
}
