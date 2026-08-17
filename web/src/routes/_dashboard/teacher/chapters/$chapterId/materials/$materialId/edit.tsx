import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { DocxImportDialog } from "@/components/ui/docx-import-dialog";
import {
  getAdminMaterialsByIdOptions,
  getAdminMaterialsQueryKey,
  patchAdminMaterialsByIdMutation,
} from "@/lib/api/@tanstack/react-query.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { FileText, Type, Video } from "lucide-react";
import { toast } from "sonner";
import { useDraft } from "@/lib/use-draft";
import { extractYoutubeId, isValidYoutubeUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";

const typeOptions = [
  {
    value: "text",
    label: "Teks",
    description: "Tulis materi dengan editor teks",
    icon: Type,
  },
  {
    value: "video",
    label: "Video",
    description: "Tautkan video YouTube",
    icon: Video,
  },
] as const;

function EditMaterial() {
  const { chapterId, materialId } = useParams({ from: "/_dashboard/teacher/chapters/$chapterId/materials/$materialId/edit" });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: material, isLoading, isError } = useQuery(getAdminMaterialsByIdOptions({ path: { id: Number(materialId) } }));

  const { draft, hasDraft, restored, debouncedSave, clear, restore, discard } = useDraft(materialId);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("text");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(hasDraft && !restored);
  const [editorUploading, setEditorUploading] = useState(false);

  // init from server data — only if no draft restore
  useEffect(() => {
    if (!material || initialLoad || restored) return;
    setTitle(material.title ?? "");
    setType(material.type ?? "text");
    setContent(material.content ?? "");
    setVideoUrl(material.video_url ?? "");
    setIsFree(material.is_free ?? true);
    setLoaded(true);
    setInitialLoad(true);
  }, [material, initialLoad, restored]);

  // autosave on change (skip during initial load)
  useEffect(() => {
    if (!title && !content && !videoUrl) return;
    debouncedSave({ title, content, classId: "", subjectId: "", chapterId, type, videoUrl, isFree });
  }, [title, content, type, videoUrl, chapterId, debouncedSave, isFree]);

  // warn on tab close
  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      if (title || content || videoUrl) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [title, content, videoUrl]);

  const { mutate: update, isPending } = useMutation({
    ...patchAdminMaterialsByIdMutation(),
    onSuccess: () => {
      clear();
      qc.invalidateQueries({ queryKey: getAdminMaterialsQueryKey() });
      toast.success("Materi berhasil disimpan");
      navigate({ to: "/teacher/chapters/$chapterId/materials", params: { chapterId } });
    },
    onError: (err: any) => {
      toast.error(err?.error || err?.message || "Gagal menyimpan materi");
    },
  });

  const save = () => {
    const body: Record<string, unknown> = {};
    if (title) body.title = title;
    body.type = type;
    if (type === "text") {
      if (content) body.content = content;
      body.video_url = "";
    } else {
      body.content = "";
      if (videoUrl) body.video_url = videoUrl;
    }
    body.is_free = isFree;
    update({ path: { id: Number(materialId) }, body });
  };

  const restoreDraft = () => {
    restore();
    if (draft) {
      setTitle(draft.title);
      setContent(draft.content);
      setType(draft.type || "text");
      setVideoUrl(draft.videoUrl || "");
      setIsFree(draft.isFree ?? true);
      setLoaded(true);
    }
    setShowDraftDialog(false);
  };

  if (isLoading && !loaded) {
    return (
      <main className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-4 md:space-y-6">
          <div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="mt-2 mb-1 h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Card>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Skeleton className="h-[76px] w-full rounded-2xl" />
                  <Skeleton className="h-[76px] w-full rounded-2xl" />
                </div>
              </div>
              <Skeleton className="h-[300px] w-full rounded-md" />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="p-4 md:p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <p className="text-muted-foreground">Materi tidak ditemukan atau kamu tidak punya akses ke materi ini.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <>
      <main className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-4 md:space-y-6">
          <div>
            <h1 className="mb-1 text-2xl font-bold tracking-tight">Edit Materi</h1>
            <p className="text-sm text-muted-foreground">Perbarui materi teks atau video untuk bab ini.</p>
          </div>

          <Card>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <Label>Judul</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul materi" autoComplete="off"/>
              </div>

              {/* Type picker */}
              <div className="space-y-2">
                <Label>Tipe Materi</Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {typeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setType(opt.value)}
                      aria-pressed={type === opt.value}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                        type === opt.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border bg-background hover:border-primary/40 hover:bg-muted/50"
                      )}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <opt.icon className="h-5 w-5 text-primary" />
                      </span>
                      <span>
                        <span className="block font-medium">{opt.label}</span>
                        <span className="block text-xs text-muted-foreground">{opt.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {type === "text" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Konten</Label>
                    <Button variant="outline" size="sm" type="button" onClick={() => setImportOpen(true)}>
                      <FileText className="mr-1 h-4 w-4" /> Import dari Word
                    </Button>
                  </div>
                  {loaded ? (
                    <TiptapEditor content={content} onChange={setContent} tempFolder="materials" onUploadingChange={setEditorUploading} />
                  ) : (
                    <div className="min-h-[300px] animate-pulse rounded-md bg-muted" />
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>YouTube URL</Label>
                  <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=abc123"
                  autoComplete="off"/>
                  {videoUrl && isValidYoutubeUrl(videoUrl) ? (
                    <div className="overflow-hidden rounded-2xl border">
                      <iframe
                        className="aspect-video w-full"
                        src={`https://www.youtube.com/embed/${extractYoutubeId(videoUrl)}?rel=0&modestbranding=1`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : videoUrl ? (
                    <p className="text-sm text-muted-foreground">
                      Masukkan URL YouTube yang valid, contoh: youtube.com/watch?v=abc123
                    </p>
                  ) : null}
                </div>
              )}

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors hover:bg-muted/50">
                <Checkbox checked={isFree} onCheckedChange={(v) => setIsFree(v === true)} />
                <span>
                  <span className="block font-medium">Materi gratis</span>
                  <span className="block text-xs text-muted-foreground">
                    {isFree ? "Bisa diakses semua user tanpa berlangganan" : "Hanya untuk murid yang berlangganan"}
                  </span>
                </span>
              </label>
            </CardContent>
            <CardFooter className="justify-end gap-3 border-t">
              <Link to="/teacher/chapters/$chapterId/materials" params={{ chapterId }}>
                <Button variant="outline" type="button">Batal</Button>
              </Link>
              <Button onClick={save} disabled={!title || isPending || editorUploading || (type === "video" && !videoUrl)}>
                {isPending && <Spinner />}
                {editorUploading ? "Mengupload gambar..." : "Simpan"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* import docx dialog */}
      <DocxImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={(html) => setContent(html)}
      />

      {/* draft dialog */}
      <AlertDialog open={showDraftDialog && !restored} onOpenChange={(o) => { if (!o) { discard(); setShowDraftDialog(false) } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Draft ditemukan</AlertDialogTitle>
            <AlertDialogDescription>
              Ada draft perubahan yang belum disimpan. Lanjutkan atau mulai dari data terakhir tersimpan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mulai dari Server</AlertDialogCancel>
            <AlertDialogAction onClick={restoreDraft}>Lanjutkan Draft</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const Route = createFileRoute("/_dashboard/teacher/chapters/$chapterId/materials/$materialId/edit")({
  component: EditMaterial,
});
