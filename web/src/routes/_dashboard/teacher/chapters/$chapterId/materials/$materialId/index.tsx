import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { MoreVertical, Pencil } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RichContent } from "@/components/ui/rich-content";
import { usePageHeaderAction } from "@/components/page-title";
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

  const goEdit = () => navigate({ to: "/teacher/chapters/$chapterId/materials/$materialId/edit", params: { chapterId, materialId } });
  const headerAction = useMemo(
    () => (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-lg" aria-label="Aksi materi" />}>
          <MoreVertical className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={goEdit}>
            <Pencil className="h-4 w-4" /> Edit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chapterId, materialId]
  );
  usePageHeaderAction(headerAction);


  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
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
    <main className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">{material.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {chapter?.class_name ?? "-"} • {chapter?.subject_name ?? "-"} • {chapter?.title ?? "-"}
          </p>
        </div>
        <Button variant="outline" size="icon" aria-label="Edit materi" onClick={goEdit} className="hidden shrink-0 md:inline-flex">
          <Pencil className="h-4 w-4" />
        </Button>
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
