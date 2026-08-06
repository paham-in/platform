import { createFileRoute, Link, useParams } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { PreviewQuestionDialog, DeleteQuestionDialog } from "@/components/teacher/packs"
import { useQuery } from "@tanstack/react-query"
import { getAdminQuestionPackagesByIdOptions, getAdminQuestionPackagesByIdQuestionsOptions } from "@/lib/api/@tanstack/react-query.gen"
import type { QuestionbankQuestionResponse } from "@/lib/api/types.gen"
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, MoreVertical, Pencil, Plus, Search, Trash2, UploadCloud } from "lucide-react"

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html")
  return (doc.body.textContent || "").trim()
}

function PackageQuestions() {
  const { packageId } = useParams({ from: "/_dashboard/teacher/packs/$packageId/" })
  const { data: pkg } = useQuery(getAdminQuestionPackagesByIdOptions({ path: { id: Number(packageId) } }))
  const { data: questions = [], isLoading } = useQuery(getAdminQuestionPackagesByIdQuestionsOptions({ path: { id: Number(packageId) } }))
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const perPage = 10
  const [previewTarget, setPreviewTarget] = useState<QuestionbankQuestionResponse | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<QuestionbankQuestionResponse | null>(null)

  const filtered = questions.filter((q) =>
    stripHtml(q.question ?? "").toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <>
      <main className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Link to="/teacher/packs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Paket Soal
          </Link>
          {pkg && (
            <>
              <span className="text-sm text-muted-foreground">/</span>
              <span className="text-sm font-medium">{pkg.name}</span>
            </>
          )}
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{pkg?.name ?? "Paket Soal"}</h1>
            {pkg && (
              <p className="text-sm text-muted-foreground">{pkg.description || "Tidak ada deskripsi"} · {pkg.questions?.length ?? 0} soal</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link to="/teacher/packs/$packageId/edit" params={{ packageId }}>
              <Button variant="outline"><Pencil className="mr-1 h-4 w-4" /> Edit Paket</Button>
            </Link>
            <Link to="/teacher/packs/$packageId/import" params={{ packageId }}>
              <Button variant="outline"><UploadCloud className="mr-1 h-4 w-4" /> Import dari Word</Button>
            </Link>
            <Link to="/teacher/packs/$packageId/questions/new" params={{ packageId }}>
              <Button><Plus className="mr-1 h-4 w-4" /> Tambah Soal</Button>
            </Link>
          </div>
        </div>

        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari soal..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>

        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Pertanyaan</TableHead>
                  <TableHead>Pembuat</TableHead>
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
                  <TableRow><TableCell colSpan={5} className="p-8 text-center text-muted-foreground">Belum ada soal di paket ini</TableCell></TableRow>
                ) : paged.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="pl-6 font-medium max-w-[400px] truncate">{stripHtml(q.question ?? "")}</TableCell>
                    <TableCell className="text-muted-foreground">{q.user_name || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{q.answers?.length ?? 0}</TableCell>
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
                          <Link to="/teacher/packs/$packageId/questions/$questionId/edit" params={{ packageId, questionId: String(q.id!) }}>
                            <DropdownMenuItem>
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          </Link>
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
            <CardFooter className="flex items-center justify-between border-t">
              <p className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </main>

      {previewTarget && (
        <PreviewQuestionDialog question={previewTarget} onClose={() => setPreviewTarget(null)} />
      )}

      {deleteConfirm && (
        <DeleteQuestionDialog question={deleteConfirm} onClose={() => setDeleteConfirm(null)} />
      )}
    </>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/packs/$packageId/")({
  component: PackageQuestions,
})
