import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useParams } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RichContent } from "@/components/ui/rich-content"
import { getQuestionPackagesByIdOptions } from "@/lib/api/@tanstack/react-query.gen"
import { ArrowLeft, FileQuestion, Layers } from "lucide-react"

function PackageDetail() {
  const { groupId, packageId } = useParams({ from: "/_dashboard/student/packages/$groupId/$packageId" })
  const { data: pkg, isLoading, isError } = useQuery(
    getQuestionPackagesByIdOptions({ path: { id: Number(packageId) } })
  )

  if (isLoading) {
    return (
      <main className="p-6">
        <Skeleton className="mb-1 h-8 w-64" />
        <Skeleton className="mb-6 h-4 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5"><Skeleton className="h-4 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </main>
    )
  }

  if (isError || !pkg) {
    return (
      <main className="p-6">
        <p className="text-muted-foreground">Paket soal tidak ditemukan.</p>
      </main>
    )
  }

  return (
    <main className="w-full max-w-3xl p-6">
      <Link
        to="/student/packages/$groupId"
        params={{ groupId }}
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {pkg.group_name || "Kembali"}
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{pkg.name}</h1>
        <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <Layers className="h-3 w-3" />
          {pkg.subject_name} • {pkg.questions?.length ?? 0} soal
        </p>
        {pkg.description ? <p className="mt-2 text-sm text-muted-foreground">{pkg.description}</p> : null}
      </div>

      {pkg.questions?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <FileQuestion className="h-8 w-8 text-muted-foreground/40" />
            <p className="font-medium">Belum ada soal</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Soal di paket ini belum ditambahkan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pkg.questions?.map((q, i) => (
            <Card key={q.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    {q.question ? (
                      <RichContent html={q.question} className="prose-sm" />
                    ) : (
                      <span className="text-muted-foreground">(kosong)</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/packages/$groupId/$packageId")({
  component: PackageDetail,
})
