import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  getMaterialsOptions,
  getChaptersOptions,
  getSubjectsOptions,
  getClassesOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useParams } from "@tanstack/react-router"
import { Loader2, ArrowLeft, Eye, FileText } from "lucide-react"

function ChapterDetail() {
  const { id } = useParams({ from: "/_dashboard/materials/chapters/$id" })
  const { data: materials = [], isLoading } = useQuery(getMaterialsOptions())
  const { data: allChapters = [] } = useQuery(getChaptersOptions())
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const { data: classes = [] } = useQuery(getClassesOptions())
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const chapter = allChapters.find((c) => c.id === Number(id))
  const chapterMaterials = materials.filter((m) => m.chapter_id === Number(id))
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
        to="/materials"
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

      <div className="space-y-3">
        {chapterMaterials.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Belum ada materi di chapter ini
            </CardContent>
          </Card>
        )}
        {chapterMaterials.map((m) => (
          <Card key={m.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3
                      className="cursor-pointer font-medium hover:text-primary"
                      onClick={() => setExpandedId(expandedId === m.id ? null : m.id!)}
                    >
                      {m.title}
                    </h3>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {m.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
              </div>
              {expandedId === m.id && m.content && (
                <div
                  className="prose prose-sm mt-4 max-w-none rounded-lg bg-muted/50 p-4"
                  dangerouslySetInnerHTML={{ __html: m.content }}
                />
              )}
              {expandedId !== m.id && m.content && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-muted-foreground"
                  onClick={() => setExpandedId(m.id!)}
                >
                  <Eye className="mr-1 h-4 w-4" /> Lihat konten
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/materials/chapters/$id")({
  component: ChapterDetail,
})
