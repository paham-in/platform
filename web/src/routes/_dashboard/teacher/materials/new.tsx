import { useEffect, useState } from "react";
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
import { ArrowLeft, Loader2, Type, Video } from "lucide-react";
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
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [showDraftDialog, setShowDraftDialog] = useState(hasDraft && !restored);

  // autosave on change
  useEffect(() => {
    if (!title && !content && !videoUrl) return;
    debouncedSave({ title, content, classId, subjectId, chapterId, type, videoUrl });
  }, [title, content, classId, subjectId, chapterId, type, videoUrl, debouncedSave]);

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
  const classOptions = classes.map((c) => ({ label: c.name ?? "", value: String(c.id) }));
  const subjectOptions = availableSubjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }));
  const chapterOptions = availableChapters.map((c) => ({ label: c.title ?? "", value: String(c.id) }));

  const { mutate: create, isPending } = useMutation({
    ...postAdminMaterialsMutation(),
    onSuccess: () => {
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
        video_url: type === "video" ? videoUrl : "",
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
                items={classOptions}
                value={classId}
                onValueChange={(v) => { setClassId(v ?? ""); setSubjectId(""); setChapterId(""); }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kelas">
                    {classes.find((c) => String(c.id) === classId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {classOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subjek</Label>
              <Select
                items={subjectOptions}
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
                  {subjectOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chapter</Label>
              <Select
                items={chapterOptions}
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
                  {chapterOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
                  <p className="text-xs text-muted-foreground">Tautkan video YouTube</p>
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
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Link to="/teacher/materials"><Button variant="outline" type="button">Batal</Button></Link>
            <Button onClick={save} disabled={!title || !chapterId || isPending || (type === "video" && !videoUrl)}>
              {isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Simpan
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
            <Button onClick={() => { restore(); if (draft) { setTitle(draft.title); setContent(draft.content); setClassId(draft.classId); setSubjectId(draft.subjectId); setChapterId(draft.chapterId); setType(draft.type || "text"); setVideoUrl(draft.videoUrl || "") } setShowDraftDialog(false) }}>Lanjutkan</Button>
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
