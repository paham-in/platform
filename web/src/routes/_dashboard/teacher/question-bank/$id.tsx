import { createFileRoute, Link, Outlet, useRouter } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RichContent } from "@/components/ui/rich-content"
import { useQuery } from "@tanstack/react-query"
import { getAdminQuestionsBankOptions } from "@/lib/api/@tanstack/react-query.gen"
import { ChevronLeft, Pencil } from "lucide-react"

function QuestionDetail() {
  const router = useRouter()
  const isEdit = router.state.matches.some(
    (m) => m.routeId === "/_dashboard/teacher/question-bank/$id/edit"
  )
  if (isEdit) return <Outlet />

  const { id } = Route.useParams()
  const { data: questions = [], isLoading } = useQuery(getAdminQuestionsBankOptions())
  const question = questions.find((q) => q.id === Number(id))

  if (isLoading) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </main>
    )
  }

  if (!question) {
    return (
      <main className="p-6">
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-muted-foreground">Soal tidak ditemukan</p>
          <Link to="/teacher/question-bank">
            <Button variant="outline">Kembali</Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/teacher/question-bank">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Detail Soal</h1>
            <p className="text-sm text-muted-foreground">{question.chapter_title || "-"}</p>
          </div>
          <Link to="/teacher/question-bank/$id/edit" params={{ id }}>
            <Button variant="outline">
              <Pencil className="mr-1 h-4 w-4" /> Edit
            </Button>
          </Link>
        </div>

        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-4">
            <RichContent html={question.question ?? ""} />
          </CardContent>
        </Card>

        <div className="space-y-2">
          {(question.options ?? []).map((opt, i) => (
            <Card key={i} className="pt-0 gap-0 pb-0">
              <CardContent className="flex items-start gap-2 p-3">
                <span className={`shrink-0 rounded px-1.5 text-xs font-semibold ${
                  i === question.correct_index ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <div className="flex-1"><RichContent html={opt} /></div>
                {i === question.correct_index && (
                  <span className="ml-auto shrink-0 text-xs font-medium text-green-700">✓ Benar</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {question.explanation && (
          <Card className="pt-0 gap-0 pb-0">
            <CardContent className="p-4">
              <p className="mb-1 text-sm font-semibold text-muted-foreground">Pembahasan</p>
              <RichContent html={question.explanation} />
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/question-bank/$id")({
  component: QuestionDetail,
})
