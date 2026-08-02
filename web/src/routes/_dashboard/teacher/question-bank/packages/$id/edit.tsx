import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminQuestionsBankOptions,
  getAdminQuestionPackagesByIdOptions,
  getAdminQuestionPackagesQueryKey,
  patchAdminQuestionPackagesByIdMutation,
} from "@/lib/api/@tanstack/react-query.gen";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").trim();
}

function EditPackage() {
  const { id } = useParams({ from: "/_dashboard/teacher/question-bank/packages/$id/edit" });
  if (!id) return null;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: questionOptions = [] } = useQuery(getAdminQuestionsBankOptions());
  const { data: existing } = useQuery(getAdminQuestionPackagesByIdOptions({ path: { id: Number(id) } }));

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (existing) {
      setName(existing.name ?? "");
      setDescription(existing.description ?? "");
      setSelectedIds(new Set((existing.questions ?? []).map((q) => q.id!).filter(Boolean)));
    }
  }, [existing]);

  const { mutate: updatePackage, isPending } = useMutation({
    ...patchAdminQuestionPackagesByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionPackagesQueryKey() });
      toast.success("Paket soal berhasil diubah");
      navigate({ to: "/teacher/question-bank/packages" });
    },
    onError: (err: any) => toast.error(err?.error || "Gagal mengubah paket"),
  });

  const toggle = (qid: number) => {
    const next = new Set(selectedIds);
    if (next.has(qid)) next.delete(qid);
    else next.add(qid);
    setSelectedIds(next);
  };

  const save = () => {
    if (!name.trim()) return;
    updatePackage({
      path: { id: Number(id) },
      body: {
        name,
        description,
        question_ids: Array.from(selectedIds),
      },
    });
  };

  return (
    <main className="p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link to="/teacher/question-bank/packages" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          ← Kembali
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">Edit Paket Soal</h1>

        <div className="space-y-2">
          <Label>Nama Paket</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama paket soal" />
        </div>

        <div className="space-y-2">
          <Label>Deskripsi (opsional)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi paket..."
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label>Pilih Soal</Label>
          <p className="text-sm text-muted-foreground">{selectedIds.size} soal terpilih</p>
          <div className="rounded-md border">
            <div className="max-h-[400px] overflow-y-auto">
              {questionOptions.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">Belum ada soal di bank</div>
              ) : (
                questionOptions.map((q) => (
                  <div key={q.id} className="flex items-start gap-3 border-b p-3 last:border-0">
                    <Checkbox
                      checked={selectedIds.has(q.id!)}
                      onCheckedChange={() => toggle(q.id!)}
                    />
                    <div className="flex-1">
                      <p className="font-medium" dangerouslySetInnerHTML={{ __html: stripHtml(q.question ?? "") }} />
                      <p className="text-sm text-muted-foreground">
                        Opsi: {q.options?.length ?? 0} · Chapter: {q.chapter_title || "-"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link to="/teacher/question-bank/packages"><Button variant="outline">Batal</Button></Link>
          <Button onClick={save} disabled={!name.trim() || isPending}>
            Simpan
          </Button>
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/_dashboard/teacher/question-bank/packages/$id/edit")({
  component: EditPackage,
});
