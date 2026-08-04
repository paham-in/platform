import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminChaptersOptions, getAdminQuestionsBankOptions, getAdminQuestionsBankQueryKey, patchAdminQuestionsBankByIdMutation, deleteAdminQuestionsBankByIdMutation } from "@/lib/api/@tanstack/react-query.gen";
import type { QuestionbankQuestionResponse } from "@/lib/api/types.gen";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, MoreVertical, Pencil, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const OPTION_LABELS = ["A", "B", "C", "D", "E"]

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html")
  return (doc.body.textContent || "").trim()
}

function TeacherQuestionBank() {
  const qc = useQueryClient()
  const { data: questions = [], isLoading } = useQuery(getAdminQuestionsBankOptions())
  const { data: chapters = [] } = useQuery(getAdminChaptersOptions())

  const [chapterFilter, setChapterFilter] = useState("all")
  const [page, setPage] = useState(1)
  const perPage = 10
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<QuestionbankQuestionResponse | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<QuestionbankQuestionResponse | null>(null)

  const [form, setForm] = useState({
    chapter_id: "",
    question: "",
    options: ["", "", "", ""],
    correct_index: 0,
    explanation: "",
  })

  const chapterOptions = [
    { label: "Semua Chapter", value: "all" },
    ...chapters.map((c) => ({ label: c.title ?? "", value: String(c.id) })),
  ]
  const formChapterOptions = chapters.map((c) => ({ label: c.title ?? "", value: String(c.id) }))

  const { mutate: updateQuestion } = useMutation({
    ...patchAdminQuestionsBankByIdMutation(),
    onSuccess: () => {
      setDialogOpen(false)
      qc.invalidateQueries({ queryKey: getAdminQuestionsBankQueryKey() })
      toast.success("Soal berhasil diubah")
    },
    onError: (err: any) => toast.error(err?.error || "Gagal mengubah soal"),
  })

  const { mutate: deleteQuestion } = useMutation({
    ...deleteAdminQuestionsBankByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionsBankQueryKey() })
      setDeleteConfirm(null)
      toast.success("Soal berhasil dihapus")
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menghapus soal"),
  })

  const filtered = chapterFilter === "all"
    ? questions
    : questions.filter((q) => String(q.chapter_id) === chapterFilter)
  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const openEdit = (q: QuestionbankQuestionResponse) => {
    setEditing(q)
    setForm({
      chapter_id: String(q.chapter_id ?? ""),
      question: q.question ?? "",
      options: [...(q.options ?? []), "", "", "", ""].slice(0, 4),
      correct_index: q.correct_index ?? 0,
      explanation: q.explanation ?? "",
    })
    setDialogOpen(true)
  }
  const saveEdit = () => {
    const options = form.options.filter((o) => stripHtml(o) !== "")
    if (!editing) return
    updateQuestion({
      path: { id: editing.id! },
      body: {
        chapter_id: Number(form.chapter_id),
        question: form.question,
        options,
        correct_index: form.correct_index,
        explanation: form.explanation,
      },
    })
  }

  if (isLoading) return <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

  return (
    <>
      <main className="p-6">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Bank Soal</h1>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select items={chapterOptions} value={chapterFilter} onValueChange={(v) => { setChapterFilter(v ?? "all"); setPage(1) }}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filter Chapter" /></SelectTrigger>
              <SelectContent>
                {chapterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Link to="/teacher/question-bank/new">
            <Button><Plus className="mr-1 h-4 w-4" /> Tambah Soal</Button>
          </Link>
        </div>

        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Pertanyaan</TableHead>
                  <TableHead>Chapter</TableHead>
                  <TableHead>Jumlah Opsi</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="p-8 text-center text-muted-foreground">Belum ada soal</TableCell></TableRow>
                ) : paged.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="pl-6 font-medium max-w-[400px] truncate">{stripHtml(q.question ?? "")}</TableCell>
                    <TableCell className="text-muted-foreground">{q.chapter_title || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{q.options?.length ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground">{q.created_at}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => openEdit(q)}>
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteConfirm(q)}>
                            <Trash2 className="h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          {totalPages > 1 && (
            <CardContent className="flex items-center justify-between border-t px-6 py-3">
              <p className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          )}
        </Card>
      </main>

      {/* edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Soal</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Chapter</Label>
              <Select items={formChapterOptions} value={form.chapter_id} onValueChange={(v) => setForm({ ...form, chapter_id: v ?? "" })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Pilih chapter" /></SelectTrigger>
                <SelectContent>
                  {formChapterOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pertanyaan</Label>
              <TiptapEditor content={form.question} onChange={(html) => setForm({ ...form, question: html })} />
            </div>
            <div className="space-y-3">
              <Label>Opsi Jawaban</Label>
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium">{OPTION_LABELS[i]}</span>
                  <div className="flex-1 rounded-md border">
                    <TiptapEditor
                      content={opt}
                      onChange={(html) => {
                        const options = [...form.options]
                        options[i] = html
                        setForm({ ...form, options })
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant={form.correct_index === i ? "default" : "outline"}
                    size="sm"
                    className="mt-1"
                    onClick={() => setForm({ ...form, correct_index: i })}
                  >
                    {form.correct_index === i ? "Benar" : "Jadikan"}
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (form.options.length < 5) setForm({ ...form, options: [...form.options, ""] })
                }}
                disabled={form.options.length >= 5}
              >
                + Tambah Opsi
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Pembahasan (opsional)</Label>
              <TiptapEditor content={form.explanation} onChange={(html) => setForm({ ...form, explanation: html })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={saveEdit} disabled={!form.chapter_id || !form.question || form.options.filter((o) => stripHtml(o) !== "").length < 2}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deleteConfirm && (
        <AlertDialog open onOpenChange={(o) => !o && setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Soal</AlertDialogTitle>
              <AlertDialogDescription>Yakin ingin menghapus soal ini?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Batal</Button>
              <Button variant="destructive" onClick={() => deleteQuestion({ path: { id: deleteConfirm.id! } })}>Hapus</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/question-bank/")({
  component: TeacherQuestionBank,
})
