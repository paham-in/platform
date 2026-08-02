import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminChaptersOptions,
  getAdminQuestionPackagesByIdOptions,
  getAdminQuestionPackagesQueryKey,
  getAdminQuestionsBankPaginatedQueryKey,
  patchAdminQuestionPackagesByIdMutation,
} from "@/lib/api/@tanstack/react-query.gen";
import { getAdminQuestionsBankPaginated } from "@/lib/api/sdk.gen";
import type { QuestionbankPaginatedResponse, QuestionbankQuestionResponse } from "@/lib/api/types.gen";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").trim();
}

function EditPackage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { id } = Route.useParams();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<Map<number, QuestionbankQuestionResponse>>(new Map());

  const { data: existing } = useQuery(
    getAdminQuestionPackagesByIdOptions({ path: { id: Number(id) } })
  );

  useEffect(() => {
    if (existing) {
      setName(existing.name ?? "");
      setDescription(existing.description ?? "");
      const next = new Map<number, QuestionbankQuestionResponse>();
      (existing.questions ?? []).forEach((q) => {
        if (q.id != null) next.set(q.id, { id: q.id, question: q.question ?? "", options: q.options ?? [] });
      });
      setSelectedIds(next);
    }
  }, [existing]);

  const { mutate: updatePackage, isPending } = useMutation({
    ...patchAdminQuestionPackagesByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionPackagesQueryKey() });
      toast.success("Paket soal berhasil diubah");
      navigate({ to: "/teacher/packs" });
    },
    onError: (err: any) => toast.error(err?.error || "Gagal mengubah paket"),
  });

  /* ===== Dialog: pilih soal dari bank soal ===== */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chapterFilter, setChapterFilter] = useState<number | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const { data: chapters = [] } = useQuery(getAdminChaptersOptions());
  const { data: paged } = useQuery<QuestionbankPaginatedResponse>({
    queryKey: getAdminQuestionsBankPaginatedQueryKey({ query: { chapter_id: chapterFilter, page, per_page: 10 } }),
    queryFn: async () => {
      const res = await getAdminQuestionsBankPaginated({
        query: { chapter_id: chapterFilter, page, per_page: 10 },
        throwOnError: true,
      });
      return res.data;
    },
    enabled: dialogOpen,
    staleTime: 30_000,
  } as any);
  const questions: QuestionbankQuestionResponse[] = paged?.data ?? [];
  const meta = paged?.meta;
  const totalPages = meta?.total_pages ?? 0;

  const toggle = (q: QuestionbankQuestionResponse) => {
    const next = new Map(selectedIds);
    if (next.has(q.id!)) next.delete(q.id!);
    else next.set(q.id!, q);
    setSelectedIds(next);
  };

  const selectAll = () => {
    const allSelected = filtered.length > 0 && filtered.every((q) => selectedIds.has(q.id!));
    const next = new Map(selectedIds);
    if (allSelected) {
      filtered.forEach((q) => next.delete(q.id!));
    } else {
      filtered.forEach((q) => next.set(q.id!, q));
    }
    setSelectedIds(next);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setChapterFilter(undefined);
    setSearchTerm("");
    setPage(1);
  };

  const selectedItems = Array.from(selectedIds.values());

  const filtered = searchTerm
    ? questions.filter((q) => stripHtml(q.question ?? "").toLowerCase().includes(searchTerm.toLowerCase()))
    : questions;

  const save = () => {
    if (!name.trim()) return;
    updatePackage({
      path: { id: Number(id) },
      body: {
        name,
        description,
        question_ids: Array.from(selectedIds.keys()),
      },
    });
  };

  return (
    <main className="p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link to="/teacher/packs" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
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

        {/* soal yang dipilih */}
        <div className="space-y-2">
          <Label>Soal Terpilih</Label>
          <p className="text-sm text-muted-foreground">{selectedIds.size} soal terpilih</p>

          <Dialog open={dialogOpen} onOpenChange={(o) => (o ? setDialogOpen(true) : closeDialog())}>
            <DialogTrigger>
              <Button variant="outline">Pilih dari Bank Soal</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Pilih Soal dari Bank</DialogTitle>
              </DialogHeader>

              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Select
                    value={chapterFilter === undefined ? "all" : String(chapterFilter)}
                    onValueChange={(v) => {
                      setChapterFilter(v === "all" ? undefined : Number(v));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Filter Chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Chapter</SelectItem>
                      {chapters.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="relative w-[260px]">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                      placeholder="Cari soal..."
                      className="pl-8"
                    />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Halaman {meta?.page ?? 0} dari {totalPages}
                </p>
              </div>

              <Card className="flex-1 pt-0 gap-0 pb-0 overflow-hidden">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="pl-3 w-[40px]">
                          <Checkbox
                            checked={filtered.length > 0 && filtered.every((q) => selectedIds.has(q.id!))}
                            onCheckedChange={selectAll}
                          />
                        </TableHead>
                        <TableHead className="pl-6">Pertanyaan</TableHead>
                        <TableHead>Chapter</TableHead>
                        <TableHead>Opsi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="p-8 text-center text-muted-foreground">
                            Tidak ada soal
                          </TableCell>
                        </TableRow>
                      ) : (
                        filtered.map((q) => (
                          <TableRow key={q.id}>
                            <TableCell className="pl-3">
                              <Checkbox
                                checked={selectedIds.has(q.id!)}
                                onCheckedChange={() => toggle(q)}
                              />
                            </TableCell>
                            <TableCell className="pl-6 font-medium max-w-[400px] truncate">
                              {stripHtml(q.question ?? "")}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{q.chapter_title || "-"}</TableCell>
                            <TableCell className="text-muted-foreground">{q.options?.length ?? 0}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {totalPages > 1 && (
                <CardContent className="flex items-center justify-between border-t px-6 py-3">
                  <p className="text-sm text-muted-foreground">
                    Total: {meta?.total ?? 0} soal
                  </p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>
                  Selesai
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* daftar soal yang dipilih — card per soal seperti halaman lihat */}
          {selectedIds.size > 0 && (
            <div className="space-y-4">
              {selectedItems.map((q, i) => (
                <Card key={q.id} className="pt-0 gap-0 pb-0">
                  <CardContent className="p-4">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-muted-foreground">Soal {i + 1}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedIds((prev) => {
                          const next = new Map(prev);
                          next.delete(q.id!);
                          return next;
                        })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div
                      className="mt-1 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: q.question ?? "" }}
                    />
                    <div className="mt-3 space-y-1">
                      {(q.options ?? []).map((opt, oi) => (
                        <p key={oi} className="text-sm text-muted-foreground">
                          {String.fromCharCode(65 + oi)}. {opt}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link to="/teacher/packs"><Button variant="outline">Batal</Button></Link>
          <Button onClick={save} disabled={!name.trim() || isPending}>
            Simpan
          </Button>
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/_dashboard/teacher/packs/$id/edit")({
  component: EditPackage,
});
