import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminQuestionPackagesQueryKey,
  postAdminQuestionPackagesMutation,
} from "@/lib/api/@tanstack/react-query.gen";
import { toast } from "sonner";

function NewPackage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { mutate: createPackage, isPending } = useMutation({
    ...postAdminQuestionPackagesMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionPackagesQueryKey() });
      toast.success("Paket soal berhasil ditambahkan");
      navigate({ to: "/teacher/packs" });
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menambah paket"),
  });

  const save = () => {
    if (!name.trim()) return;
    createPackage({ body: { name, description } });
  };

  return (
    <main className="p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Tambah Paket Soal</h1>

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
          <Link to="/teacher/packs"><Button variant="outline">Batal</Button></Link>
          <Button onClick={save} disabled={!name.trim() || isPending}>
            {isPending && <Spinner />}
            Simpan
          </Button>
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/_dashboard/teacher/packs/new")({
  component: NewPackage,
});
