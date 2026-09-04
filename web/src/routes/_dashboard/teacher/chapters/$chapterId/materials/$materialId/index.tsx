import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Loader2, ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichContent } from "@/components/ui/rich-content";
import { usePageTitle } from "@/components/page-title";
import {
  getAdminMaterialsByIdOptions,
  getAdminChaptersOptions,
} from "@/lib/api/@tanstack/react-query.gen";

function extractYoutubeId(url: string): string {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m?.[1] || url
}

function MaterialDetail() {
  const { chapterId, materialId } = useParams({ from: "/_dashboard/teacher/chapters/$chapterId/materials/$materialId/" });
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: material, isLoading } = useQuery(getAdminMaterialsByIdOptions({ path: { id: Number(materialId) } }));
  const { data: chapters = [] } = useQuery(getAdminChaptersOptions());
  const chapter = chapters.find((c) => c.id === Number(chapterId));

  usePageTitle(material?.title ?? "Detail Materi");

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

  const back = () => navigate({ to: "/teacher/chapters/$chapterId/materials", params: { chapterId }, replace: true });

  return (
    <main className="w-full max-w-3xl p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={back}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/teacher/chapters/$chapterId/materials/$materialId/edit", params: { chapterId, materialId } })}>
          <Pencil className="mr-1 h-4 w-4" /> Edit
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{material.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {chapter?.class_name ?? "-"} • {chapter?.subject_name ?? "-"} • {chapter?.title ?? "-"}
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

export const Route = createFileRoute("/_dashboard/teacher/chapters/$chapterId/materials/$materialId/")({
  component: MaterialDetail,
})
