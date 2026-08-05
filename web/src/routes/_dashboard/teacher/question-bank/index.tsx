import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { PreviewQuestionDialog, DeleteQuestionDialog } from "@/components/teacher/question-bank";
import { useQuery } from "@tanstack/react-query";
import { getAdminChaptersOptions, getAdminQuestionsBankOptions } from "@/lib/api/@tanstack/react-query.gen";
import type { QuestionbankQuestionResponse } from "@/lib/api/types.gen";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MoreVertical, Pencil, Plus, Trash2, ChevronLeft, ChevronRight, UploadCloud, Search, Eye } from "lucide-react";

const questionBankSearchSchema = z.object({
  chapter: z.coerce.number().optional(),
  search: z.string().optional(),
  created_by: z.coerce.number().optional(),
})

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html")
  return (doc.body.textContent || "").trim()
}

function TeacherQuestionBank() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { chapter: chapterParam, search: searchParam, created_by: createdByParam } = Route.useSearch()
  const { data: questions = [], isLoading } = useQuery(getAdminQuestionsBankOptions({ query: { created_by: createdByParam } }))
  const { data: chapters = [] } = useQuery(getAdminChaptersOptions())

  const chapterFilter = chapterParam // number | undefined
  const createdByFilter = createdByParam // number | undefined
  const [searchInput, setSearchInput] = useState(searchParam ?? "")
  const [page, setPage] = useState(1)
  const perPage = 10
  const [previewTarget, setPreviewTarget] = useState<QuestionbankQuestionResponse | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<QuestionbankQuestionResponse[] | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const chapterOptions = [
    { label: "Semua Chapter", value: "all" },
    ...chapters.map((c) => ({ label: c.title ?? "", value: String(c.id) })),
  ]

  // Daftar guru pembuat unik dari data soal (untuk filter dropdown)
  const creatorMap = new Map<number, string>()
  questions.forEach((q) => {
    if (q.user_id != null && q.user_name) creatorMap.set(q.user_id, q.user_name)
  })
  const creatorOptions = [
    { label: "Semua Guru", value: "all" },
    ...Array.from(creatorMap.entries()).map(([id, name]) => ({ label: name, value: String(id) })),
  ]

  const filtered = questions.filter((q) => {
    const matchChapter = chapterFilter === undefined || q.chapter_id === chapterFilter
    const matchSearch = !searchParam || (stripHtml(q.question ?? "")).toLowerCase().includes(searchParam.toLowerCase())
    return matchChapter && matchSearch
  })
  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const allSelected = paged.length > 0 && selectedIds.size === paged.length
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(paged.map((q) => q.id!).filter((id) => id !== undefined)))
  }
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
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
            <Select
              items={creatorOptions}
              value={createdByFilter === undefined ? "all" : String(createdByFilter)}
              onValueChange={(v) => {
                if (v) {
                  navigate({
                    search: (prev) => ({ ...prev, created_by: v === "all" ? undefined : Number(v) }),
                    replace: true,
                  })
                  setPage(1)
                }
              }}
            >
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter Guru" /></SelectTrigger>
              <SelectContent>
                {creatorOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                onClick={() => setDeleteConfirm(questions.filter((q) => q.id != null && selectedIds.has(q.id)))}
              >
                <Trash2 className="mr-1 h-4 w-4" /> Hapus Terpilih ({selectedIds.size})
              </Button>
            )}
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
                  <TableHead className="w-10 pl-4">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead className="pl-0">Pertanyaan</TableHead>
                  <TableHead>Pembuat</TableHead>
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
                      <TableCell className="w-10 pl-4"><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell className="pl-0"><Skeleton className="h-4 w-56" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paged.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="p-8 text-center text-muted-foreground">Belum ada soal</TableCell></TableRow>
                ) : paged.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="w-10 pl-4">
                      <Checkbox
                        checked={selectedIds.has(q.id!)}
                        onCheckedChange={() => toggleSelect(q.id!)}
                      />
                    </TableCell>
                    <TableCell className="pl-0 font-medium max-w-[400px] truncate">{stripHtml(q.question ?? "")}</TableCell>
                    <TableCell className="text-muted-foreground">{q.user_name || "-"}</TableCell>
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
                          <DropdownMenuItem render={<Link to="/teacher/question-bank/$id/edit" params={{ id: String(q.id!) }} />}>
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteConfirm([q])}>
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

      {/* preview dialog */}
      {previewTarget && (
        <PreviewQuestionDialog question={previewTarget} onClose={() => setPreviewTarget(null)} />
      )}

      {deleteConfirm && (
        <DeleteQuestionDialog questions={deleteConfirm} onClose={() => { setDeleteConfirm(null); setSelectedIds(new Set()) }} />
      )}
    </>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/question-bank/")({
  component: TeacherQuestionBank,
  validateSearch: questionBankSearchSchema,
})
