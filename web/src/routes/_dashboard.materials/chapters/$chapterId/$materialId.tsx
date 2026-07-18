import { useQuery } from "@tanstack/react-query"
import {
  getMaterialsByIdOptions,
  getChaptersOptions,
  getSubjectsOptions,
  getClassesOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { createFileRoute, Link, useParams } from "@tanstack/react-router"
import { Loader2, ArrowLeft } from "lucide-react"

function MaterialDetail() {
  const { chapterId, materialId } = useParams({ from: "/_dashboard/materials/chapters/$chapterId/$materialId" })
  const { data: material, isLoading } = useQuery(getMaterialsByIdOptions({ path: { id: Number(materialId) } }))
  const { data: allChapters = [] } = useQuery(getChaptersOptions())
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const { data: classes = [] } = useQuery(getClassesOptions())

  const chapter = allChapters.find((c) => c.id === Number(chapterId))
  const sub = subjects.find((s) => s.id === chapter?.subject_id)
  const cls = classes.find((c) => c.id === chapter?.class_id)

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!material) {
    return (
      <main className="p-6">
        <p className="text-muted-foreground">Materi tidak ditemukan</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link
        to="/materials/chapters/$id"
        params={{ id: chapterId }}
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{material.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {cls?.name ?? "-"} • {sub?.name ?? "-"}
          <span className="ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
            {material.status === "published" ? "Published" : "Draft"}
          </span>
        </p>
      </div>

      {material.content && (
        <article
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: material.content }}
        />
      )}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/materials/chapters/$chapterId/$materialId")({
  component: MaterialDetail,
})
