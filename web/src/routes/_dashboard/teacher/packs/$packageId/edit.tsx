import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminQuestionPackagesByIdOptions,
  getAdminQuestionPackagesQueryKey,
  patchAdminQuestionPackagesByIdMutation,
} from "@/lib/api/@tanstack/react-query.gen";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

function EditPackage() {
  const { packageId } = useParams({ from: "/_dashboard/teacher/packs/$packageId/edit" });
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loaded, setLoaded] = useState(false);

  const { data: existing } = useQuery(getAdminQuestionPackagesByIdOptions({ path: { id: Number(packageId) } }));

  useEffect(() => {
    if (existing && !loaded) {
      setName(existing.name ?? "");
      setDescription(existing.description ?? "");
      setLoaded(true);
    }
  }, [existing, loaded]);

  const { mutate: updatePackage, isPending } = useMutation({
    ...patchAdminQuestionPackagesByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionPackagesQueryKey() });
      toast.success("Paket soal berhasil diubah");
      navigate({ to: "/teacher/packs/$packageId", params: { packageId } });
    },
    onError: (err: any) => toast.error(err?.error || "Gagal mengubah paket"),
  });

  const save = () => {
    if (!name.trim()) return;
    updatePackage({
      path: { id: Number(packageId) },
      body: { name, description },
    });
  };

  return (
    <main className="p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link to="/teacher/packs/$packageId" params={{ packageId }} className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Kembali
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

        <div className="flex justify-end gap-3 pt-4">
          <Link to="/teacher/packs/$packageId" params={{ packageId }}><Button variant="outline">Batal</Button></Link>
          <Button onClick={save} disabled={!name.trim() || isPending}>
            {isPending && <Spinner />}
            Simpan
          </Button>
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/_dashboard/teacher/packs/$packageId/edit")({
  component: EditPackage,
});
