import { useQuery } from "@tanstack/react-query"
import {
  getMaterialsByIdOptions,
  getChaptersOptions,
  getSubjectsOptions,
  getClassesOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { createFileRoute, useParams } from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import { RichContent } from "@/components/ui/rich-content"

function extractYoutubeId(url: string): string {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m?.[1] || url
}

function UserMaterialDetail() {
  const { materialId } = useParams({ from: "/_dashboard/user/materials/$materialId" })
  const { data: material, isLoading } = useQuery(getMaterialsByIdOptions({ path: { id: Number(materialId) } }))
  const { data: allChapters = [] } = useQuery(getChaptersOptions())
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const { data: classes = [] } = useQuery(getClassesOptions())

  const chapter = allChapters.find((c) => c.id === material?.chapter_id)
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
      <main className="p-4 md:p-6">
        <p className="text-muted-foreground">Materi tidak ditemukan</p>
      </main>
    )
  }

  return (
    <main className="w-full max-w-3xl p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{material.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {cls?.name ?? "-"} • {sub?.name ?? "-"}
        </p>
      </div>

      {material.type === "video" && material.video_url ? (
        <div className="overflow-hidden rounded-xl border">
          <iframe
            className="aspect-video w-full"
            src={`https://www.youtube.com/embed/${extractYoutubeId(material.video_url)}?rel=0&modestbranding=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : material.content ? (
        <RichContent html={material.content} className="prose-sm" />
      ) : null}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/user/materials/$materialId")({
  component: UserMaterialDetail,
})
