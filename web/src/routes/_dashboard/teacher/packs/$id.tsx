import { createFileRoute, Link, Outlet, useRouter } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { getAdminQuestionPackagesByIdOptions } from "@/lib/api/@tanstack/react-query.gen"
import { ChevronLeft, Loader2, Pencil } from "lucide-react"

function PackageDetail() {
  const router = useRouter()
  const isEdit = router.state.matches.some(
    (m) => m.routeId === "/_dashboard/teacher/packs/$id/edit"
  )
  if (isEdit) return <Outlet />

  const { id } = Route.useParams()
  const { data: pkg, isLoading } = useQuery(
    getAdminQuestionPackagesByIdOptions({ path: { id: Number(id) } })
  )

  if (isLoading)
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    )

  if (!pkg)
    return (
      <main className="p-6">
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-muted-foreground">Paket tidak ditemukan</p>
          <Link to="/teacher/packs">
            <Button variant="outline">Kembali</Button>
          </Link>
        </div>
      </main>
    )

  const questions = pkg.questions ?? []

  return (
    <main className="p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/teacher/packs">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{pkg.name}</h1>
            <p className="text-sm text-muted-foreground">
              {pkg.description || "Tidak ada deskripsi"} · {questions.length} soal
            </p>
          </div>
          <Link to="/teacher/packs/$id/edit" params={{ id }}>
            <Button variant="outline">
              <Pencil className="mr-1 h-4 w-4" /> Edit
            </Button>
          </Link>
        </div>

        {questions.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">Belum ada soal dalam paket ini</p>
        ) : (
          <div className="space-y-4">
            {questions.map((q, i) => (
              <Card key={q.id ?? i} className="pt-0 gap-0 pb-0">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-muted-foreground">Soal {i + 1}</p>
                  <div
                    className="mt-1 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: q.question ?? "" }}
                  />
                  <div className="mt-3 space-y-1">
                    {(q.options ?? []).map((opt, oi) => (
                      <p key={oi} className="text-sm text-muted-foreground">
                        {String.fromCharCode(65 + oi)}. {opt}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/packs/$id")({
  component: PackageDetail,
})
