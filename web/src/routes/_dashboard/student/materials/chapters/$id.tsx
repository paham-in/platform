import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getMaterialsOptions,
  getChaptersOptions,
  getSubjectsOptions,
  getClassesOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router"
import { FileText } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

function ChapterDetail() {
  const navigate = useNavigate()
  const { id } = useParams({ from: "/_dashboard/student/materials/chapters/$id" })
  const { data: materials = [], isLoading } = useQuery(getMaterialsOptions())
  const { data: allChapters = [] } = useQuery(getChaptersOptions())
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const { data: classes = [] } = useQuery(getClassesOptions())

  const chapter = allChapters.find((c) => c.id === Number(id))
  const chapterMaterials = materials.filter((m) => m.chapter_id === Number(id) && m.status === "published")
  const sub = subjects.find((s) => s.id === chapter?.subject_id)
  const cls = classes.find((c) => c.id === chapter?.class_id)

  return (
    <main className="p-4 md:p-6">
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-1 h-4 w-40" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">{chapter?.title ?? "BAB"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {cls?.name ?? "-"} • {sub?.name ?? "-"}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {chapterMaterials.length === 0 && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><FileText /></EmptyMedia>
                  <EmptyTitle>Belum ada materi di bab ini</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}
            {chapterMaterials.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => navigate({ to: "/student/materials/chapters/$chapterId/$materialId", params: { chapterId: id, materialId: String(m.id!) } })}
                className="block w-full text-left"
              >
                <Card className="overflow-hidden transition-colors hover:bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{m.title}</h3>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {m.status === "published" ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </>
      )}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/materials/chapters/$id")({
  component: ChapterDetail,
})
