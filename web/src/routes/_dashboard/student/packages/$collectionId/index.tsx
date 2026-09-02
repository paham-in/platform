import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet, useNavigate, useParams } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getQuestionPackageCollectionsByIdOptions } from "@/lib/api/@tanstack/react-query.gen"
import { FileText, Layers, Sparkles, ChevronRight } from "lucide-react"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { usePageTitle } from "@/components/page-title"

function CollectionDetail() {
  const navigate = useNavigate()
  const { collectionId } = useParams({ from: "/_dashboard/student/packages/$collectionId/" })
  const { data: collection, isLoading, isError } = useQuery(
    getQuestionPackageCollectionsByIdOptions({ path: { id: collectionId } })
  )

  usePageTitle(collection?.name ?? "Paket Soal")

  if (isLoading) {
    return (
      <main className="p-4 md:p-6">
        <Skeleton className="mb-1 h-8 w-48" />
        <Skeleton className="mb-6 h-4 w-64" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-2 p-5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    )
  }

  if (isError || !collection) {
    return (
      <main className="p-4 md:p-6">
        <p className="text-muted-foreground">Koleksi paket soal tidak ditemukan.</p>
      </main>
    )
  }

  const totalQ = collection.packages?.reduce((sum, pkg) => sum + (pkg.questions?.length ?? 0), 0) ?? 0

  return (
    <main className="w-full max-w-5xl p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{collection.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {collection.class_name} • {collection.package_count ?? 0} paket • {totalQ} soal
          <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            collection.is_free ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          }`}>
            {collection.is_free ? "Gratis" : "Premium"}
          </span>
        </p>
        {collection.description ? <p className="mt-2 text-sm text-muted-foreground">{collection.description}</p> : null}
      </div>

      {collection.packages?.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Sparkles /></EmptyMedia>
            <EmptyTitle>Belum ada paket soal</EmptyTitle>
            <EmptyDescription>
              Paket soal di koleksi ini belum ditambahkan.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collection.packages?.map((pkg) => (
            <Card key={pkg.id} className="group cursor-pointer overflow-hidden transition-colors hover:bg-muted/50">
              <button
                type="button"
                onClick={() => navigate({ to: "/student/packages/$collectionId/$packageId", params: { collectionId, packageId: String(pkg.id!) } })}
                className="block w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <CardContent>
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{pkg.name}</h3>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Layers className="h-3 w-3" />
                        {pkg.subject_name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{pkg.questions?.length ?? 0} soal</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardContent>
              </button>
            </Card>
          ))}
        </div>
      )}
      <Outlet />
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/packages/$collectionId/")({
  component: CollectionDetail,
})
