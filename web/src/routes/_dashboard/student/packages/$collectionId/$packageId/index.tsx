import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useParams } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RichContent } from "@/components/ui/rich-content"
import { getQuestionPackagesByIdOptions, getQuestionPackagesByIdWorkProgressOptions } from "@/lib/api/@tanstack/react-query.gen"
import { FileQuestion, Layers, PlayCircle } from "lucide-react"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

function PackageDetail() {
  const { collectionId, packageId } = useParams({ from: "/_dashboard/student/packages/$collectionId/$packageId/" })
  const { data: pkg, isLoading, isError } = useQuery(
    getQuestionPackagesByIdOptions({ path: { id: Number(packageId) } })
  )
  const { data: progress } = useQuery(
    getQuestionPackagesByIdWorkProgressOptions({ path: { id: Number(packageId) } })
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

  const total = pkg.questions?.length ?? 0
  const completed = progress?.completed_count ?? 0

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{pkg.name}</h1>
        <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <Layers className="h-3 w-3" />
          {pkg.subject_name} • {total} soal
        </p>
        {pkg.description ? <p className="mt-2 text-sm text-muted-foreground">{pkg.description}</p> : null}
        {total > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link to="/student/packages/$collectionId/$packageId/work" params={{ collectionId, packageId }}>
              <Button>
                <PlayCircle className="mr-1 h-4 w-4" />
                {completed > 0 ? `Lanjutkan (${completed}/${total})` : "Kerjakan Soal"}
              </Button>
            </Link>
            {completed > 0 && (
              <span className="text-sm text-muted-foreground">
                {completed} dari {total} soal sudah dikerjakan
              </span>
            )}
          </div>
        )}
      </div>

      {total === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><FileQuestion /></EmptyMedia>
            <EmptyTitle>Belum ada soal</EmptyTitle>
            <EmptyDescription>
              Soal di paket ini belum ditambahkan.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
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

export const Route = createFileRoute("/_dashboard/student/packages/$collectionId/$packageId/")({
  component: PackageDetail,
})
