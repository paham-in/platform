import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { usePageTitle } from "@/components/page-title";
import {
  getAdminMaterialsQueryKey,
  postAdminMaterialsMutation,
} from "@/lib/api/@tanstack/react-query.gen";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
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

function NewMaterial() {
  usePageTitle("Tambah Materi");
  const { chapterId } = useParams({ from: "/_dashboard/teacher/chapters/$chapterId/materials/new" });
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { draft, hasDraft, restored, debouncedSave, clear, restore, discard } = useDraft();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("text");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(hasDraft && !restored);
  const [editorUploading, setEditorUploading] = useState(false);

  // autosave on change
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

  const { mutate: create, isPending } = useMutation({
    ...postAdminMaterialsMutation(),
    onSuccess: () => {
      clear();
      qc.invalidateQueries({ queryKey: getAdminMaterialsQueryKey() });
      toast.success("Materi berhasil dibuat");
      navigate({ to: "/teacher/chapters/$chapterId/materials", params: { chapterId } });
    },
    onError: (err: any) => {
      toast.error(err?.error || err?.message || "Gagal membuat materi");
    },
  });

  const save = () => {
    create({
      body: {
        title,
        content: type === "text" ? content : "",
        video_url: type === "video" ? videoUrl : "",
        type,
        chapter_id: Number(chapterId),
        status: "draft",
        is_free: isFree,
      },
    });
  };

  const restoreDraft = () => {
    restore();
    if (draft) {
      setTitle(draft.title);
      setContent(draft.content);
      setType(draft.type || "text");
      setVideoUrl(draft.videoUrl || "");
      setIsFree(draft.isFree ?? true);
    }
    setShowDraftDialog(false);
  };

  return (
    <>
      <main className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-4 md:space-y-6">
          <div>
            <h1 className="hidden md:block mb-1 text-2xl font-bold tracking-tight">Tambah Materi</h1>
            <p className="text-sm text-muted-foreground">Buat materi teks atau video untuk bab ini.</p>
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
                  <TiptapEditor content={content} onChange={setContent} tempFolder="materials" onUploadingChange={setEditorUploading} />
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
              <Button variant="outline" type="button" onClick={() => navigate({ to: "/teacher/chapters/$chapterId/materials", params: { chapterId } })}>Batal</Button>
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
              Ada draft materi yang belum selesai. Lanjutkan atau mulai baru?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mulai Baru</AlertDialogCancel>
            <AlertDialogAction onClick={restoreDraft}>Lanjutkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const Route = createFileRoute("/_dashboard/teacher/chapters/$chapterId/materials/new")({
  component: NewMaterial,
});
