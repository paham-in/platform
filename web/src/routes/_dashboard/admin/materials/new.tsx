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
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useDraft } from "@/lib/use-draft";

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
  const [content, setContent] = useState("");
  const [showDraftDialog, setShowDraftDialog] = useState(hasDraft && !restored);

  // autosave on change
  useEffect(() => {
    if (!title && !content) return;
    debouncedSave({ title, content, classId, subjectId, chapterId });
  }, [title, content, classId, subjectId, chapterId, debouncedSave]);

  // warn on tab close
  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      if (title || content) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [title, content]);

  const availableSubjects = classId
    ? subjects.filter((s) => (s.class_ids ?? []).includes(Number(classId)))
    : [];
  const availableChapters = subjectId
    ? allChapters.filter((c) => String(c.subject_id) === subjectId)
    : [];

  const { mutate: create, isPending } = useMutation({
    ...postAdminMaterialsMutation(),
    onSuccess: () => {
      clear();
      qc.invalidateQueries({ queryKey: getAdminMaterialsQueryKey() });
      toast.success("Materi berhasil dibuat");
      navigate({ to: "/admin/materials" });
    },
    onError: (err: any) => {
      toast.error(err?.error || err?.message || "Gagal membuat materi");
    },
  });

  const save = () => {
    create({
      body: {
        title,
        content,
        chapter_id: Number(chapterId),
        status: "draft",
      },
    });
  };

  return (
    <>
      <main className="p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <Link to="/admin/materials" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
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

          <div className="space-y-2">
            <Label>Konten</Label>
            <TiptapEditor content={content} onChange={setContent} />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link to="/admin/materials"><Button variant="outline" type="button">Batal</Button></Link>
            <Button onClick={save} disabled={!title || !chapterId || isPending}>
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
            <Button onClick={() => { restore(); if (draft) { setTitle(draft.title); setContent(draft.content); setClassId(draft.classId); setSubjectId(draft.subjectId); setChapterId(draft.chapterId) } setShowDraftDialog(false) }}>Lanjutkan</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const Route = createFileRoute("/_dashboard/admin/materials/new")({
  component: NewMaterial,
});
