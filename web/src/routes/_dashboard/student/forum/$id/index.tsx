import { Button } from "@/components/ui/button"
import { RichContent } from "@/components/ui/rich-content"
import { YoutubeEmbed } from "@/components/ui/youtube-embed"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import "katex/dist/katex.min.css"
import {
  getQuestionsByIdOptions,
  getQuestionsQueryKey,
  getQuestionsByQuestionIdAnswersOptions,
  getQuestionsByQuestionIdAnswersQueryKey,
  deleteQuestionsByIdMutation,
  deleteQuestionsByQuestionIdAnswersByIdMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router"
import { toast } from "sonner"
import { Loader2, Trash2, MessageCircle, Pencil } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { AnswerForm } from "@/components/forum"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { usePageTitle } from "@/components/page-title"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"
import type { AnswerAnswerResponse } from "@/lib/api/types.gen"
import { z } from "zod"

const forumDetailSearchSchema = z.object({
  modal: z.string().optional(),
})

function ForumDetail() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { id } = useParams({ from: "/_dashboard/student/forum/$id" })
  const questionId = id
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()
  const [deleteTarget, setDeleteTarget] = useState<AnswerAnswerResponse | null>(null)

  const { data: question, isLoading } = useQuery(getQuestionsByIdOptions({ path: { id: questionId } }))
  const { data: answers = [] } = useQuery(
    getQuestionsByQuestionIdAnswersOptions({ path: { question_id: questionId } })
  )

  usePageTitle(question?.plain_content ?? "Forum")

  const { mutate: deleteAnswer } = useMutation({
    ...deleteQuestionsByQuestionIdAnswersByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getQuestionsByQuestionIdAnswersQueryKey({ path: { question_id: questionId } }) })
      toast.success("Jawaban berhasil dihapus")
    },
    onError: (err: any) => {
      toast.error(err?.error || err?.message || "Gagal menghapus jawaban")
    },
  })

  const { mutate: deleteQuestion } = useMutation({
    ...deleteQuestionsByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getQuestionsQueryKey() })
      toast.success("Pertanyaan berhasil dihapus")
      navigate({ to: "/student/forum", replace: true })
    },
    onError: (err: any) => {
      toast.error(err?.error || err?.message || "Gagal menghapus pertanyaan")
    },
  })

  useEffect(() => {
    if (modal !== "delete") setDeleteTarget(null)
  }, [modal])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!question) {
    return (
      <main className="p-4 md:p-6">
        <p className="text-muted-foreground">Pertanyaan tidak ditemukan</p>
      </main>
    )
  }

  const isOwner = question.is_owner

  return (
    <main className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-2 flex items-center gap-2">
        {question.subject_name && (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {question.subject_name}
          </span>
        )}
        {isOwner && (
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigate({ to: "/student/forum/$id/edit", params: { id } })}
              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              type="button"
              onClick={() => openModal("delete-question")}
              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Hapus
            </button>
          </div>
        )}
      </div>

      <h1 className="text-2xl font-bold tracking-tight">{question.plain_content?.slice(0, 120)}</h1>

      <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
        {question.user_avatar ? (
          <img src={question.user_avatar} alt="" className="h-5 w-5 rounded-full" />
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {question.user_name?.[0]}
          </div>
        )}
        <span>{question.user_name}</span>
        <span>•</span>
        <span>{question.created_at}</span>
      </div>

      {question.content && (
        <RichContent html={question.content} />
      )}

      {/* Answers */}
      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold">Jawaban ({answers.length})</h2>

        {answers.length === 0 && (
          <Empty className="border-0 p-6">
            <EmptyHeader>
              <EmptyMedia variant="icon"><MessageCircle /></EmptyMedia>
              <EmptyTitle className="text-sm">Belum ada jawaban</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}

        {answers.map((a) => (
          <div key={a.id} className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {a.user_avatar ? (
                <img src={a.user_avatar} alt="" className="h-5 w-5 rounded-full" />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {a.user_name?.[0]}
                </div>
              )}
              <span className="font-medium text-foreground">{a.user_name}</span>
              <span>•</span>
              <span>{a.created_at}</span>

              {a.is_owner && (
                <div className="ml-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      setDeleteTarget(a)
                      openModal("delete")
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {a.content && <RichContent html={a.content} />}
            {a.video_url && <YoutubeEmbed url={a.video_url} className="mt-3" />}
          </div>
        ))}
      </section>

      {/* Answer form, only teachers can answer (gated inside AnswerForm) */}
      {!isOwner && <AnswerForm questionId={questionId} />}

      {modal === "delete-question" && isOwner && (
        <AlertDialog open onOpenChange={(o) => !o && closeModal()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Pertanyaan</AlertDialogTitle>
              <AlertDialogDescription>
                Yakin ingin menghapus pertanyaan ini? Semua jawaban di dalamnya ikut terhapus dan tindakan ini tidak bisa dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  deleteQuestion({ path: { id: questionId } })
                  closeModal()
                }}
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {modal === "delete" && deleteTarget && (
        <AlertDialog open onOpenChange={(o) => !o && closeModal()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Jawaban</AlertDialogTitle>
              <AlertDialogDescription>
                Yakin ingin menghapus jawaban ini? Tindakan ini tidak bisa dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  deleteAnswer({ path: { question_id: questionId, id: deleteTarget.public_id! } })
                  closeModal()
                }}
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/forum/$id/")({
  component: ForumDetail,
  validateSearch: forumDetailSearchSchema,
})