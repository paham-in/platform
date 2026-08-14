import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RichContent } from "@/components/ui/rich-content"
import { toast } from "sonner"
import {
  getQuestionPackagesByIdWorkQuestionsOptions,
  postQuestionPackagesByIdWorkSubmitMutation,
  getQuestionPackagesByIdWorkProgressOptions,
  getQuestionPackagesByIdWorkProgressQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { QuestionpackageSubmitAnswerResponse } from "@/lib/api/types.gen"
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, ChevronLeft, FileQuestion } from "lucide-react"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

function WorkPage() {
  const { collectionId, packageId } = useParams({ from: "/_dashboard/student/packages/$collectionId/$packageId/work/" })
  const navigate = useNavigate({ from: Route.fullPath })
  const qc = useQueryClient()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [explanation, setExplanation] = useState("")
  const [isCorrect, setIsCorrect] = useState(false)
  const [correctAnswerIds, setCorrectAnswerIds] = useState<Set<number>>(new Set())

  const { data: questions = [], isLoading: questionsLoading } = useQuery(
    getQuestionPackagesByIdWorkQuestionsOptions({ path: { id: Number(packageId) } })
  )

  const { data: progress } = useQuery(
    getQuestionPackagesByIdWorkProgressOptions({ path: { id: Number(packageId) } })
  )

  const submitMutation = useMutation({
    ...postQuestionPackagesByIdWorkSubmitMutation(),
    onSuccess: (data: QuestionpackageSubmitAnswerResponse) => {
      setRevealed(true)
      setIsCorrect(data.is_correct ?? false)
      setExplanation(data.explanation ?? "")
      setCorrectAnswerIds(new Set(data.correct_answer_ids ?? []))
      qc.invalidateQueries({ queryKey: getQuestionPackagesByIdWorkProgressQueryKey({ path: { id: Number(packageId) } }) })
      if (data.is_correct) {
        toast.success("Jawaban benar!")
      } else {
        toast.error("Jawaban salah")
      }
    },
    onError: (err: any) => {
      toast.error(err?.error || "Gagal menyimpan jawaban")
    },
  })

  const currentQuestion = questions[currentIndex]
  const total = questions.length
  const completedCount = progress?.completed_count ?? 0
  const completedIds = new Set(progress?.completed_ids ?? [])
  const selectedAnswers = progress?.selected_answers ?? {}
  const explanations = progress?.explanations ?? {}
  const isCorrectMap = progress?.is_correct ?? {}

  // Sync currentIndex with URL search params
  const search = Route.useSearch()
  const q = typeof search?.q === "number" ? search.q : undefined

  useEffect(() => {
    if (typeof q === "number" && q >= 0 && q < total) {
      setCurrentIndex(q)
    }
  }, [])

  useEffect(() => {
    navigate({ search: (prev) => ({ ...prev, q: currentIndex }), replace: true })
  }, [currentIndex])

  // Restore from progress API when navigating to an already-answered question
  useEffect(() => {
    const questionId = currentQuestion?.id
    if (questionId && selectedAnswers[questionId] != null) {
      setSelectedAnswerId(selectedAnswers[questionId])
      setRevealed(true)
      setIsCorrect(isCorrectMap[questionId] ?? false)
      setExplanation(explanations[questionId] ?? "")
      setCorrectAnswerIds(new Set(progress?.correct_answer_ids?.[questionId] ?? []))
    } else {
      setSelectedAnswerId(null)
      setRevealed(false)
      setExplanation("")
      setCorrectAnswerIds(new Set())
    }
  }, [currentIndex, currentQuestion?.id, selectedAnswers, explanations, isCorrectMap, progress?.correct_answer_ids])

  const handleSelectAnswer = (answerId: number) => {
    if (revealed) return
    setSelectedAnswerId(answerId)
  }

  const handleSubmit = () => {
    if (selectedAnswerId === null || !currentQuestion) return
    submitMutation.mutate({
      path: { id: Number(packageId) },
      body: { question_id: currentQuestion.id, answer_id: selectedAnswerId },
    })
  }

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < total) {
      setCurrentIndex(index)
    }
  }

  if (questionsLoading) {
    return (
      <main className="p-6">
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="mb-6 h-2 w-full" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="mb-4 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-3/4" />
            <Skeleton className="mb-6 h-4 w-1/2" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="mb-2 h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </main>
    )
  }

  if (total === 0) {
    return (
      <main className="p-6">
        <Empty className="py-20">
          <EmptyHeader>
            <EmptyMedia variant="icon"><FileQuestion /></EmptyMedia>
            <EmptyTitle>Belum ada soal</EmptyTitle>
            <EmptyDescription>Soal di paket ini belum ditambahkan.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    )
  }

  return (
    <main className="flex flex-col gap-6 p-6 lg:flex-row">
      {/* Left column: question content */}
      <div className="flex-1 min-w-0">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/student/packages/$collectionId/$packageId", params: { collectionId, packageId } })}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Kembali ke paket</span>
        </div>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Soal {currentIndex + 1} dari {total}</span>
            <span className="text-sm text-muted-foreground">{completedCount} / {total} selesai</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(completedCount / total) * 100}%` }}
            />
          </div>
        </div>

        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="mb-6">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {currentIndex + 1}
              </span>
              <div className="mt-3">
                {currentQuestion.question ? (
                  <RichContent html={currentQuestion.question} className="prose-sm" />
                ) : (
                  <span className="text-muted-foreground">(kosong)</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {(currentQuestion.answers ?? []).map((answer, idx) => {
                const isSelected = selectedAnswerId === answer.id
                const isCorrectAnswer = revealed && correctAnswerIds.has(answer.id!)
                const isWrongSelected = revealed && isSelected && !isCorrectAnswer
                return (
                  <button
                    key={answer.id}
                    onClick={() => handleSelectAnswer(answer.id!)}
                    disabled={revealed}
                    className={`flex w-full items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    } ${
                      isCorrectAnswer ? "border-green-500 bg-green-50 dark:bg-green-950" : ""
                    } ${
                      isWrongSelected ? "border-red-500 bg-red-50 dark:bg-red-950" : ""
                    } ${revealed ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <div className="flex-1">
                      <RichContent html={answer.content ?? ""} className="prose-sm" />
                    </div>
                    {isCorrectAnswer && <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />}
                    {isWrongSelected && <XCircle className="h-5 w-5 shrink-0 text-red-600" />}
                  </button>
                )
              })}
            </div>

            {revealed && explanation && (
              <div className={`mt-6 rounded-lg border p-4 ${isCorrect ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-red-500 bg-red-50 dark:bg-red-950"}`}>
                <p className="mb-2 text-sm font-semibold">Pembahasan</p>
                <RichContent html={explanation} className="prose-sm" />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => goToQuestion(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Sebelumnya
          </Button>

          {!revealed ? (
            <Button onClick={handleSubmit} disabled={selectedAnswerId === null || submitMutation.isPending}>
              {submitMutation.isPending ? "Menyimpan..." : "Kirim Jawaban"}
            </Button>
          ) : (
            <Button onClick={() => goToQuestion(currentIndex + 1)} disabled={currentIndex === total - 1}>
              Selanjutnya <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Right column: question navigator */}
      <aside className="w-full shrink-0 lg:w-64">
        <div className="lg:sticky lg:top-6">
          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                {completedCount} / {total} selesai
              </p>
              <div className="flex flex-wrap gap-2">
                {questions.map((q, idx) => {
                  const isCompleted = completedIds.has(q.id!)
                  const isCurrent = idx === currentIndex
                  let buttonVariant: "default" | "outline" = "outline"
                  if (isCurrent) {
                    buttonVariant = "default"
                  } else if (isCompleted) {
                    buttonVariant = "outline"
                  }
                  return (
                    <Button
                      key={q.id}
                      variant={buttonVariant}
                      size="icon"
                      onClick={() => goToQuestion(idx)}
                      className={`h-9 w-9 text-sm ${
                        isCompleted && !isCurrent
                          ? "border-green-500 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
                          : ""
                      }`}
                    >
                      {idx + 1}
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </aside>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/packages/$collectionId/$packageId/work/")({
  component: WorkPage,
  validateSearch: z.object({ q: z.number().optional() }),
})
