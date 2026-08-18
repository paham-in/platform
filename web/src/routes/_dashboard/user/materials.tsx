import { Card, CardContent } from "@/components/ui/card"
import {
  getMaterialsOptions,
  getChaptersOptions,
  getSubjectsOptions,
  getClassesOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Loader2, BookOpen, FileText } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { usePageTitle } from "@/components/page-title"

function UserMaterials() {
  usePageTitle("Materi Gratis")
  const navigate = useNavigate()
  const { data: materials = [], isLoading } = useQuery(getMaterialsOptions())
  const { data: allChapters = [] } = useQuery(getChaptersOptions())
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const { data: classes = [] } = useQuery(getClassesOptions())

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const subjectName = (id: number | undefined) => subjects.find((s) => s.id === id)?.name ?? "-"
  const className = (id: number | undefined) => classes.find((c) => c.id === id)?.name ?? "-"

  return (
    <main className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="hidden md:block text-2xl font-bold tracking-tight">Materi Gratis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Materi berikut bisa kamu akses tanpa berlangganan.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {materials.length === 0 && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><FileText /></EmptyMedia>
              <EmptyTitle>Belum ada materi gratis</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
        {materials.map((m) => {
          const chapter = allChapters.find((c) => c.id === m.chapter_id)
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => navigate({ to: "/user/materials/$materialId", params: { materialId: String(m.id!) } })}
              className="w-full text-left"
            >
              <Card className="cursor-pointer overflow-hidden transition-colors hover:bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-medium">{m.title}</h3>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {chapter ? `${className(chapter.class_id)} • ${subjectName(chapter.subject_id)}` : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>

      <div className="mt-8 rounded-xl border bg-muted/30 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Ingin akses semua materi?</p>
            <p className="text-sm text-muted-foreground">Berlangganan sekarang untuk membuka konten premium.</p>
          </div>
          <button type="button" onClick={() => navigate({ to: "/user/subscribe" })} className="ml-auto">
            <span className="text-sm font-medium text-primary hover:underline">Berlangganan</span>
          </button>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/user/materials")({
  component: UserMaterials,
})
