import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { RichContent } from "@/components/ui/rich-content";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminChaptersOptions, getAdminQuestionsBankOptions, getAdminQuestionsBankQueryKey, patchAdminQuestionsBankByIdMutation, deleteAdminQuestionsBankByIdMutation } from "@/lib/api/@tanstack/react-query.gen";
import type { QuestionbankQuestionResponse } from "@/lib/api/types.gen";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MoreVertical, Pencil, Plus, Trash2, ChevronLeft, ChevronRight, UploadCloud, Search, Eye } from "lucide-react";
import { toast } from "sonner";

const OPTION_LABELS = ["A", "B", "C", "D", "E"]

const questionBankSearchSchema = z.object({
  chapter: z.coerce.number().optional(),
  search: z.string().optional(),
})

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html")
  return (doc.body.textContent || "").trim()
}

function TeacherQuestionBank() {
  const qc = useQueryClient()
  const navigate = useNavigate({ from: Route.fullPath })
  const { chapter: chapterParam, search: searchParam } = Route.useSearch()
  const { data: questions = [], isLoading } = useQuery(getAdminQuestionsBankOptions())
  const { data: chapters = [] } = useQuery(getAdminChaptersOptions())

  const chapterFilter = chapterParam // number | undefined
  const [searchInput, setSearchInput] = useState(searchParam ?? "")
  const [page, setPage] = useState(1)
  const perPage = 10
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<QuestionbankQuestionResponse | null>(null)
  const [previewTarget, setPreviewTarget] = useState<QuestionbankQuestionResponse | null>(null)
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

  const filtered = questions.filter((q) => {
    const matchChapter = chapterFilter === undefined || q.chapter_id === chapterFilter
    const matchSearch = !searchParam || (stripHtml(q.question ?? "")).toLowerCase().includes(searchParam.toLowerCase())
    return matchChapter && matchSearch
  })
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

  // Sync URL → local state when search changes externally
  useEffect(() => { setSearchInput(searchParam ?? "") }, [searchParam])

  // Debounce search → navigate to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({
        search: (prev) => ({ ...prev, search: searchInput || undefined }),
        replace: true,
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  return (
    <>
      <main className="p-6">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Bank Soal</h1>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari soal..."
                className="pl-9"
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setPage(1) }}
              />
            </div>
            <Select
              items={chapterOptions}
              value={chapterFilter === undefined ? "all" : String(chapterFilter)}
              onValueChange={(v) => {
                if (v) {
                  navigate({
                    search: (prev) => ({ ...prev, chapter: v === "all" ? undefined : Number(v) }),
                    replace: true,
                  })
                  setPage(1)
                }
              }}
            >
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filter Chapter" /></SelectTrigger>
              <SelectContent>
                {chapterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/teacher/question-bank/import">
              <Button variant="outline"><UploadCloud className="mr-1 h-4 w-4" /> Import dari Word</Button>
            </Link>
            <Link to="/teacher/question-bank/new">
              <Button><Plus className="mr-1 h-4 w-4" /> Tambah Soal</Button>
            </Link>
          </div>
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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="pl-6"><Skeleton className="h-4 w-56" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paged.length === 0 ? (
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
                          <DropdownMenuItem onClick={() => setPreviewTarget(q)}>
                            <Eye className="h-4 w-4" /> Preview
                          </DropdownMenuItem>
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

      {/* preview dialog */}
      {previewTarget && (
        <Dialog open onOpenChange={(o) => !o && setPreviewTarget(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Preview Soal</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Chapter</Label>
                <p className="text-sm">{previewTarget.chapter_title || "-"}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Pertanyaan</Label>
                <div className="rounded-md border bg-muted/30 p-3">
                  <RichContent html={previewTarget.question ?? ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Opsi Jawaban</Label>
                <div className="grid gap-1.5">
                  {(previewTarget.options ?? []).map((opt, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                      <span className="shrink-0 rounded bg-muted px-1.5 text-xs font-semibold text-muted-foreground">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <div className="flex-1"><RichContent html={opt} /></div>
                      {i === previewTarget.correct_index && (
                        <span className="ml-auto shrink-0 text-xs font-medium text-green-700">✓ Benar</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {previewTarget.explanation && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Pembahasan</Label>
                  <div className="rounded-md border bg-muted/30 p-3 text-muted-foreground">
                    <RichContent html={previewTarget.explanation} />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewTarget(null)}>Tutup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
  validateSearch: questionBankSearchSchema,
})
