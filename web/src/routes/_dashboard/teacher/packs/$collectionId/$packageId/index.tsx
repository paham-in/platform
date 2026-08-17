import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router"
import { z } from "zod"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { PreviewQuestionDialog, DeleteQuestionDialog, EditPackageDialog } from "@/components/teacher/packs"
import { useQuery } from "@tanstack/react-query"
import { getAdminQuestionPackagesByIdOptions, getAdminQuestionPackagesByIdQuestionsOptions, getMeOptions } from "@/lib/api/@tanstack/react-query.gen"
import type { QuestionbankQuestionResponse, QuestionpackagePackageResponse } from "@/lib/api/types.gen"
import { ChevronLeft, ChevronRight, Eye, MoreVertical, Pencil, Plus, Search, SearchX, Trash2, UploadCloud, X, FileQuestion } from "lucide-react"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html")
  return (doc.body.textContent || "").trim()
}

const packageQuestionsSearchSchema = z.object({
  search: z.string().optional(),
})

function PackageQuestions() {
  const { collectionId, packageId } = useParams({ from: "/_dashboard/teacher/packs/$collectionId/$packageId/" })
  const navigate = useNavigate({ from: Route.fullPath })
  const { search } = Route.useSearch()
  const { data: user } = useQuery(getMeOptions())
  const canManage = user?.roles?.includes("admin") || !!user?.can_manage_question_packages
  const { data: pkg } = useQuery(getAdminQuestionPackagesByIdOptions({ path: { id: Number(packageId) } }))
  // paket bisa dikelola kalau punya izin DAN (admin, paket sendiri, atau paket tanpa pemilik)
  const canEditPkg = !!pkg && (user?.roles?.includes("admin") || pkg.author_id === user?.id || !pkg.author_id)
  const { data: questions = [], isLoading } = useQuery(
    getAdminQuestionPackagesByIdQuestionsOptions({ path: { id: Number(packageId) }, query: { search: search || undefined } })
  )
  const [searchInput, setSearchInput] = useState(search ?? "")
  const [page, setPage] = useState(1)
  const perPage = 10
  const [previewTarget, setPreviewTarget] = useState<QuestionbankQuestionResponse | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<QuestionbankQuestionResponse | null>(null)
  const [editTarget, setEditTarget] = useState<QuestionpackagePackageResponse | null>(null)

  // sync URL → local search input
  useEffect(() => { setSearchInput(search ?? "") }, [search])

  // debounce search input → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, search: searchInput || undefined }), replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, navigate])

  const totalPages = Math.ceil(questions.length / perPage)
  const paged = questions.slice((page - 1) * perPage, page * perPage)

  return (
    <>
      <main className="p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{pkg?.name ?? "Paket Soal"}</h1>
              {pkg && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  pkg.status === "published"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                }`}>
                  {pkg.status === "published" ? "Tayang" : "Draf"}
                </span>
              )}
            </div>
            {pkg && (
              <p className="text-sm text-muted-foreground">{pkg.description || "Tidak ada deskripsi"} · {pkg.questions?.length ?? 0} soal</p>
            )}
          </div>
          {canManage && canEditPkg && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setEditTarget(pkg ?? null)}><Pencil className="mr-1 h-4 w-4" /> Edit Paket</Button>
              <Link to="/teacher/packs/$collectionId/$packageId/import" params={{ collectionId, packageId }}>
                <Button variant="outline"><UploadCloud className="mr-1 h-4 w-4" /> Import dari Word</Button>
              </Link>
              <Link to="/teacher/packs/$collectionId/$packageId/questions/new" params={{ collectionId, packageId }}>
                <Button><Plus className="mr-1 h-4 w-4" /> Tambah Soal</Button>
              </Link>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Cari soal"
              placeholder="Cari soal..."
              className="pl-9 pr-9"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1) }}
            autoComplete="off"/>
            {searchInput && (
              <button
                type="button"
                aria-label="Bersihkan pencarian"
                onClick={() => { setSearchInput(""); setPage(1) }}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
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
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Empty className="border-0 p-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">{search ? <SearchX /> : <FileQuestion />}</EmptyMedia>
                          <EmptyTitle>
                            {search ? "Tidak ada soal yang cocok" : "Belum ada soal di paket ini"}
                          </EmptyTitle>
                        </EmptyHeader>
                        {search && (
                          <EmptyContent>
                            <Button variant="outline" size="sm" onClick={() => { setSearchInput(""); setPage(1) }}>
                              <X className="mr-1 h-4 w-4" /> Bersihkan pencarian
                            </Button>
                          </EmptyContent>
                        )}
                      </Empty>
                    </TableCell>
                  </TableRow>
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
                          {canManage && canEditPkg && (
                            <>
                              <Link to="/teacher/packs/$collectionId/$packageId/questions/$questionId/edit" params={{ collectionId, packageId, questionId: String(q.id!) }}>
                                <DropdownMenuItem>
                                  <Pencil className="h-4 w-4" /> Edit
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem onClick={() => setDeleteConfirm(q)}>
                                <Trash2 className="h-4 w-4" /> Hapus
                              </DropdownMenuItem>
                            </>
                          )}
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

      {editTarget && (
        <EditPackageDialog pkg={editTarget} onClose={() => setEditTarget(null)} />
      )}
    </>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/packs/$collectionId/$packageId/")({
  component: PackageQuestions,
  validateSearch: packageQuestionsSearchSchema,
})
