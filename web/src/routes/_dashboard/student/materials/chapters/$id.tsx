import { Card, CardContent } from "@/components/ui/card"
import {
  getMaterialsOptions,
  getChaptersOptions,
  getSubjectsOptions,
  getClassesOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useParams } from "@tanstack/react-router"
import { Loader2, ArrowLeft, FileText } from "lucide-react"

function ChapterDetail() {
  const { id } = useParams({ from: "/_dashboard/student/materials/chapters/$id" })
  const { data: materials = [], isLoading } = useQuery(getMaterialsOptions())
  const { data: allChapters = [] } = useQuery(getChaptersOptions())
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const { data: classes = [] } = useQuery(getClassesOptions())

  const chapter = allChapters.find((c) => c.id === Number(id))
  const chapterMaterials = materials.filter((m) => m.chapter_id === Number(id) && m.status === "published")
  const sub = subjects.find((s) => s.id === chapter?.subject_id)
  const cls = classes.find((c) => c.id === chapter?.class_id)

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <main className="p-6">
      <Link
        to="/student/materials"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{chapter?.title ?? "Chapter"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {cls?.name ?? "-"} • {sub?.name ?? "-"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {chapterMaterials.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Belum ada materi di chapter ini
            </CardContent>
          </Card>
        )}
        {chapterMaterials.map((m) => (
          <Link key={m.id} to="/student/materials/chapters/$chapterId/$materialId" params={{ chapterId: id, materialId: String(m.id!) }}>
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
          </Link>
        ))}
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/materials/chapters/$id")({
  component: ChapterDetail,
})
