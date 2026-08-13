import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getQuestionPackageCollectionsOptions } from "@/lib/api/@tanstack/react-query.gen"
import { FolderOpen, Sparkles, Layers } from "lucide-react"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

function PackagesPage() {
  const { data: collections = [], isLoading, isError } = useQuery(getQuestionPackageCollectionsOptions())

  if (isLoading) {
    return (
      <main className="p-6">
        <Skeleton className="mb-1 h-8 w-32" />
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

  return (
    <main className="p-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Paket Soal</h1>
      <p className="mb-6 text-sm text-muted-foreground">Kumpulan paket soal per kelas untuk latihanmu.</p>

      {isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <p className="text-muted-foreground">Gagal memuat daftar paket soal.</p>
            <button onClick={() => window.location.reload()} className="text-sm font-medium text-primary hover:underline">
              Muat Ulang
            </button>
          </CardContent>
        </Card>
      ) : collections.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><FolderOpen /></EmptyMedia>
            <EmptyTitle>Belum ada paket soal</EmptyTitle>
            <EmptyDescription>
              Paket soal akan muncul di sini setelah admin membuat koleksi untuk kelasmu.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link key={collection.id} to="/student/packages/$collectionId" params={{ collectionId: String(collection.id!) }}>
              <Card className="group cursor-pointer overflow-hidden transition-colors hover:bg-muted/50">
                <CardContent>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <FolderOpen className="h-5 w-5 text-primary" />
                    </div>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      collection.is_free ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {collection.is_free ? "Gratis" : "Premium"}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold">{collection.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {collection.class_name}
                    </span>
                    {collection.package_count != null && (
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {collection.package_count} paket
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/packages/")({
  component: PackagesPage,
})
