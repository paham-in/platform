import { useQuery } from "@tanstack/react-query"
import {
  getMaterialsByIdOptions,
  getChaptersOptions,
  getSubjectsOptions,
  getClassesOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { createFileRoute, useParams } from "@tanstack/react-router"
import { Skeleton } from "@/components/ui/skeleton"
import { RichContent } from "@/components/ui/rich-content"
import { usePageTitle } from "@/components/page-title"

function extractYoutubeId(url: string): string {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m?.[1] || url
}

function MaterialDetail() {
  const { chapterId, materialId } = useParams({ from: "/_dashboard/student/materials/chapters/$chapterId/$materialId" })
  const { data: material, isLoading } = useQuery(getMaterialsByIdOptions({ path: { id: Number(materialId) } }))
  const { data: allChapters = [] } = useQuery(getChaptersOptions())
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const { data: classes = [] } = useQuery(getClassesOptions())

  usePageTitle(material?.title ?? "Materi")

  const chapter = allChapters.find((c) => c.id === Number(chapterId))
  const sub = subjects.find((s) => s.id === chapter?.subject_id)
  const cls = classes.find((c) => c.id === chapter?.class_id)

  if (isLoading) {
    return (
      <main className="w-full max-w-3xl p-4 md:p-6">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="mt-3 h-4 w-40" />
        <Skeleton className="mt-8 aspect-video w-full rounded-xl" />
        <div className="mt-8 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </main>
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
        <h1 className="hidden md:block text-3xl font-bold tracking-tight">{material.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {cls?.name ?? "-"} • {sub?.name ?? "-"}
          <span className="ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
            {material.status === "published" ? "Published" : "Draft"}
          </span>
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

export const Route = createFileRoute("/_dashboard/student/materials/chapters/$chapterId/$materialId")({
  component: MaterialDetail,
})
