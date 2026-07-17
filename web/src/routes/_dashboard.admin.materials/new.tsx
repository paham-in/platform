import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function NewMaterial() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: subjects = [] } = useQuery(getSubjectsOptions());
  const { data: allChapters = [] } = useQuery(getAdminChaptersOptions());
  const { data: classes = [] } = useQuery(getAdminClassesOptions());

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const availableSubjects = classId
    ? subjects.filter((s) => (s.class_ids ?? []).includes(Number(classId)))
    : [];
  const availableChapters = subjectId
    ? allChapters.filter((c) => String(c.subject_id) === subjectId)
    : [];

  const { mutate: create, isPending } = useMutation({
    ...postAdminMaterialsMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminMaterialsQueryKey() });
      navigate({ to: "/admin/materials" });
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
      <header className="flex items-center gap-4 border-b bg-card px-6 py-3">
        <Link to="/admin/materials" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold">Tambah Materi</h1>
      </header>
      <main className="p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Kelas</Label>
              <Select
                value={classId}
                onValueChange={(v) => { setClassId(v ?? ""); setSubjectId(""); setChapterId(""); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
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
                <SelectTrigger>
                  <SelectValue placeholder={classId ? "Pilih subjek" : "Pilih kelas dulu"} />
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
                <SelectTrigger>
                  <SelectValue placeholder={subjectId ? "Pilih chapter" : "Pilih subjek dulu"} />
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
            <TiptapEditor content="" onChange={setContent} />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link to="/admin/materials" className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-muted">Batal</Link>
            <Button onClick={save} disabled={!title || !chapterId || isPending}>
              {isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}

export const Route = createFileRoute("/_dashboard/admin/materials/new")({
  component: NewMaterial,
});
