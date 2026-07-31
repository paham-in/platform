import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import {
  getAdminChaptersOptions,
  getAdminClassesOptions,
  getSubjectsOptions,
  postAdminMaterialsMutation,
  getAdminMaterialsQueryKey,
} from "@/lib/api/@tanstack/react-query.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Type, Video, Upload, Youtube } from "lucide-react";
import { toast } from "sonner";
import { useDraft } from "@/lib/use-draft";
import { cn } from "@/lib/utils";

function NewMaterial() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: subjects = [] } = useQuery(getSubjectsOptions());
  const { data: allChapters = [] } = useQuery(getAdminChaptersOptions());
  const { data: classes = [] } = useQuery(getAdminClassesOptions());

  const { draft, hasDraft, restored, debouncedSave, clear, restore, discard } = useDraft();

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("text");
  const [videoSource, setVideoSource] = useState("youtube");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [showDraftDialog, setShowDraftDialog] = useState(hasDraft && !restored);

  // autosave on change
  useEffect(() => {
    if (!title && !content && !videoUrl) return;
    debouncedSave({ title, content, classId, subjectId, chapterId, type, videoSource, videoUrl });
  }, [title, content, classId, subjectId, chapterId, type, videoSource, videoUrl, debouncedSave]);

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

  const availableSubjects = classId
    ? subjects.filter((s) => (s.class_ids ?? []).includes(Number(classId)))
    : [];
  const availableChapters = subjectId
    ? allChapters.filter((c) => String(c.subject_id) === subjectId)
    : [];

  const { mutate: create, isPending } = useMutation({
    ...postAdminMaterialsMutation(),
    onSuccess: async (data) => {
      // if video source is minio, upload file first
      if (type === "video" && videoSource === "minio" && videoFile) {
        setUploading(true)
        const form = new FormData()
        form.append("video", videoFile)
        try {
          const res = await fetch(`http://localhost:8080/admin/materials/${data.id}/video`, {
            method: "POST",
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            body: form,
          })
          if (!res.ok) {
            const err = await res.json()
            toast.error(err?.error || "Gagal upload video")
            return
          }
        } catch {
          toast.error("Gagal upload video")
          return
        } finally {
          setUploading(false)
        }
      }
      clear();
      qc.invalidateQueries({ queryKey: getAdminMaterialsQueryKey() });
      toast.success("Materi berhasil dibuat");
      navigate({ to: "/teacher/materials" });
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
        video_url: type === "video" && videoSource === "youtube" ? videoUrl : "",
        video_source: type === "video" ? videoSource : "youtube",
        type,
        chapter_id: Number(chapterId),
        status: "draft",
      },
    });
  };

  return (
    <>
      <main className="p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <Link to="/teacher/materials" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Kelas</Label>
              <Select
                value={classId}
                onValueChange={(v) => { setClassId(v ?? ""); setSubjectId(""); setChapterId(""); }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kelas">
                    {classes.find((c) => String(c.id) === classId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subjek</Label>
              <Select
                value={subjectId}
                onValueChange={(v) => { setSubjectId(v ?? ""); setChapterId(""); }}
                disabled={!classId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={classId ? "Pilih subjek" : "Pilih kelas dulu"}>
                    {availableSubjects.find((s) => String(s.id) === subjectId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chapter</Label>
              <Select
                value={chapterId}
                onValueChange={(v) => setChapterId(v ?? "")}
                disabled={!subjectId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={subjectId ? "Pilih chapter" : "Pilih subjek dulu"}>
                    {availableChapters.find((c) => String(c.id) === chapterId)?.title}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableChapters.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Judul</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul materi" />
          </div>

          {/* Type picker */}
          <div className="space-y-2">
            <Label>Tipe Materi</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("text")}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50",
                  type === "text" && "border-primary bg-primary/5 ring-1 ring-primary"
                )}
              >
                <Type className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Teks</p>
                  <p className="text-xs text-muted-foreground">Tulis materi dengan editor teks</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setType("video")}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50",
                  type === "video" && "border-primary bg-primary/5 ring-1 ring-primary"
                )}
              >
                <Video className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Video</p>
                  <p className="text-xs text-muted-foreground">Video pembelajaran</p>
                </div>
              </button>
            </div>
          </div>

          {type === "text" ? (
            <div className="space-y-2">
              <Label>Konten</Label>
              <TiptapEditor content={content} onChange={setContent} />
            </div>
          ) : (
            <div className="space-y-4">
              {/* video source picker */}
              <div className="space-y-2">
                <Label>Sumber Video</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVideoSource("youtube")}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                      videoSource === "youtube" && "border-primary bg-primary/5 ring-1 ring-primary"
                    )}
                  >
                    <Youtube className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">YouTube</p>
                      <p className="text-xs text-muted-foreground">Tautkan video dari YouTube</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSource("minio")}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                      videoSource === "minio" && "border-primary bg-primary/5 ring-1 ring-primary"
                    )}
                  >
                    <Upload className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Upload Server</p>
                      <p className="text-xs text-muted-foreground">Unggah video ke server platform</p>
                    </div>
                  </button>
                </div>
              </div>

              {videoSource === "youtube" ? (
                <div className="space-y-2">
                  <Label>YouTube URL</Label>
                  <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=abc123"
                  />
                  {videoUrl && (
                    <div className="overflow-hidden rounded-lg border">
                      <iframe
                        className="aspect-video w-full"
                        src={`https://www.youtube.com/embed/${extractYoutubeId(videoUrl)}?rel=0&modestbranding=1`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>File Video</Label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    className="hidden"
                    onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-sm text-muted-foreground hover:bg-muted/50"
                  >
                    <Upload className="h-5 w-5" />
                    {videoFile ? videoFile.name : "Klik untuk pilih video (mp4, webm, ogg, mov — maks 200MB)"}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Link to="/teacher/materials"><Button variant="outline" type="button">Batal</Button></Link>
            <Button onClick={save} disabled={!title || !chapterId || isPending || uploading || (type === "video" && videoSource === "youtube" && !videoUrl) || (type === "video" && videoSource === "minio" && !videoFile)}>
              {(isPending || uploading) && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {uploading ? "Mengunggah video..." : "Simpan"}
            </Button>
          </div>
        </div>
      </main>

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
            <Button variant="outline" onClick={() => { discard(); setShowDraftDialog(false) }}>Mulai Baru</Button>
            <Button onClick={() => { restore(); if (draft) { setTitle(draft.title); setContent(draft.content); setClassId(draft.classId); setSubjectId(draft.subjectId); setChapterId(draft.chapterId); setType(draft.type || "text"); setVideoSource(draft.videoSource || "youtube"); setVideoUrl(draft.videoUrl || "") } setShowDraftDialog(false) }}>Lanjutkan</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function extractYoutubeId(url: string): string {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m?.[1] || url
}

export const Route = createFileRoute("/_dashboard/teacher/materials/new")({
  component: NewMaterial,
});
