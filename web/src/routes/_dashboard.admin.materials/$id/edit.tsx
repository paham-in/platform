import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import {
  getAdminChaptersOptions,
  getAdminClassesOptions,
  getAdminMaterialsByIdOptions,
  getAdminMaterialsQueryKey,
  patchAdminMaterialsByIdMutation,
} from "@/lib/api/@tanstack/react-query.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

function EditMaterial() {
  const { id } = useParams({ from: "/_dashboard/admin/materials/$id/edit" });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: allChapters = [] } = useQuery(getAdminChaptersOptions());
  const { data: classes = [] } = useQuery(getAdminClassesOptions());
  const { data: material, isLoading } = useQuery(getAdminMaterialsByIdOptions({ path: { id: Number(id) } }));

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (material) {
      const ch = allChapters.find((c) => c.id === material.chapter_id);
      setClassId(String(ch?.class_id ?? ""));
      setSubjectId(String(ch?.subject_id ?? ""));
      setChapterId(String(material.chapter_id ?? ""));
      setTitle(material.title ?? "");
      setContent(material.content ?? "");
    }
  }, [material, allChapters]);

  const { mutate: update, isPending } = useMutation({
    ...patchAdminMaterialsByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminMaterialsQueryKey() });
      navigate({ to: "/admin/materials" });
    },
  });

  const save = () => {
    update({
      path: { id: Number(id) },
      body: {
        title: title || undefined,
        content: content || undefined,
      },
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
              <Select value={classId} disabled>
                <SelectTrigger>
                  <SelectValue placeholder={classes.find((c) => String(c.id) === classId)?.name} />
                </SelectTrigger>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subjek</Label>
              <Select value={subjectId} disabled>
                <SelectTrigger>
                  <SelectValue placeholder={allChapters.find((c) => c.id === Number(chapterId))?.subject_name} />
                </SelectTrigger>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chapter</Label>
              <Select value={chapterId} disabled>
                <SelectTrigger>
                  <SelectValue placeholder={allChapters.find((c) => String(c.id) === chapterId)?.title} />
                </SelectTrigger>
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
            <Link to="/admin/materials" className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-muted">Batal</Link>
            <Button onClick={save} disabled={!title || isPending}>
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
