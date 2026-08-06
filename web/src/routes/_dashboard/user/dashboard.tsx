import { createFileRoute, Link } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { getMeOptions } from "@/lib/api/@tanstack/react-query.gen"
import { BookOpen, CreditCard, Sparkles } from "lucide-react"

function UserDashboard() {
  const { data: user } = useQuery(getMeOptions())

  return (
    <main className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Halo, {user?.name}!</h2>
          <p className="mt-1 text-muted-foreground">
            Akun kamu belum berlangganan. Berlangganan untuk akses semua materi & paket soal.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Akun Gratis</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Kamu bisa mengakses materi & paket soal gratis. Upgrade untuk membuka semua konten.
                </p>
              </div>
              <Link to="/user/subscribe">
                <Button className="w-full sm:w-auto">
                  <CreditCard className="mr-1 h-4 w-4" /> Berlangganan
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Materi Gratis</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Jelajahi materi gratis yang tersedia sekarang.
                </p>
              </div>
              <Link to="/user/materials">
                <Button variant="outline" className="w-full sm:w-auto">Lihat Materi</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/user/dashboard")({
  component: UserDashboard,
})
