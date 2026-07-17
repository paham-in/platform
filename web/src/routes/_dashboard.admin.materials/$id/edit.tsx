import { useEffect, useState } from "react";
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
  getAdminMaterialsByIdOptions,
  getAdminMaterialsQueryKey,
  getSubjectsOptions,
  patchAdminMaterialsByIdMutation,
} from "@/lib/api/@tanstack/react-query.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

function EditMaterial() {
  const { id } = useParams({ from: "/_dashboard/admin/materials/$id/edit" });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: subjects = [] } = useQuery(getSubjectsOptions());
  const { data: allChapters = [] } = useQuery(getAdminChaptersOptions());
  const { data: classes = [] } = useQuery(getAdminClassesOptions());
  const { data: material, isLoading } = useQuery(getAdminMaterialsByIdOptions({ path: { id: Number(id) } }));

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (material) {
      const ch = allChapters.find((c) => c.id === material.chapter_id);
      setClassId(String(ch?.class_id ?? ""));
      setSubjectId(String(ch?.subject_id ?? ""));
      setChapterId(String(material.chapter_id ?? ""));
      setTitle(material.title ?? "");
      setContent(material.content ?? "");
      setLoaded(true);
    }
  }, [material, allChapters]);

  const availableSubjects = classId
    ? subjects.filter((s) => (s.class_ids ?? []).includes(Number(classId)))
    : [];
  const availableChapters = subjectId
    ? allChapters.filter((c) => String(c.subject_id) === subjectId)
    : [];

  const { mutate: update, isPending } = useMutation({
    ...patchAdminMaterialsByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminMaterialsQueryKey() });
      toast.success("Materi berhasil disimpan");
      navigate({ to: "/admin/materials" });
    },
    onError: (err: any) => {
      toast.error(err?.error || err?.message || "Gagal menyimpan materi");
    },
  });

  const save = () => {
    const body: Record<string, unknown> = {};
    if (title) body.title = title;
    if (content) body.content = content;
    if (chapterId) body.chapter_id = Number(chapterId);
    update({
      path: { id: Number(id) },
      body,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <header className="flex items-center gap-4 border-b bg-card px-6 py-3">
        <Link to="/admin/materials" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold">Edit Materi</h1>
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
            {loaded ? (
              <TiptapEditor content={content} onChange={setContent} />
            ) : (
              <div className="min-h-[300px] animate-pulse rounded-md bg-muted" />
            )}
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
    </>
  );
}

export const Route = createFileRoute("/_dashboard/admin/materials/$id/edit")({
  component: EditMaterial,
});
