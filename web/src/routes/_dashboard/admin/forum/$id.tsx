import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RichContent } from "@/components/ui/rich-content"
import { TiptapEditor } from "@/components/ui/tiptap-editor"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import "katex/dist/katex.min.css"
import {
  getQuestionsByIdOptions,
  getQuestionsByQuestionIdAnswersOptions,
  getQuestionsByQuestionIdAnswersQueryKey,
  postQuestionsByQuestionIdAnswersMutation,
  deleteQuestionsByQuestionIdAnswersByIdMutation,
  getQuestionsByQuestionIdImagesOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { createFileRoute, Link, useParams } from "@tanstack/react-router"
import { toast } from "sonner"
import { Loader2, ArrowLeft, Send, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

function ForumDetail() {
  const qc = useQueryClient()
  const { id } = useParams({ from: "/_dashboard/admin/forum/$id" })
  const questionId = Number(id)

  const { data: question, isLoading } = useQuery(getQuestionsByIdOptions({ path: { id: questionId } }))
  const { data: answers = [] } = useQuery(
    getQuestionsByQuestionIdAnswersOptions({ path: { question_id: questionId } })
  )
  const [answerContent, setAnswerContent] = useState("")
  const { data: images = [] } = useQuery(
    getQuestionsByQuestionIdImagesOptions({ path: { question_id: questionId } })
  )

  const { mutate: submitAnswer, isPending } = useMutation({
    ...postQuestionsByQuestionIdAnswersMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getQuestionsByQuestionIdAnswersQueryKey({ path: { question_id: questionId } }) })
      setAnswerContent("")
      toast.success("Jawaban berhasil dikirim")
    },
    onError: (err: any) => {
      toast.error(err?.error || err?.message || "Gagal mengirim jawaban")
    },
  })

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

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!question) {
    return (
      <main className="p-6">
        <p className="text-muted-foreground">Pertanyaan tidak ditemukan</p>
      </main>
    )
  }

  const isOwner = question.is_owner

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <Link
        to="/admin/forum"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          question.status === "open" ? "bg-green-100 text-green-700" :
          question.status === "answered" ? "bg-blue-100 text-blue-700" :
          "bg-gray-100 text-gray-700"
        }`}>
          {question.status === "open" ? "Terbuka" : question.status === "answered" ? "Terjawab" : "Tertutup"}
        </span>
        {question.subject_name && (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {question.subject_name}
          </span>
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

      {/* Images */}
      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img) => (
            <a key={img.id} href={img.url} target="_blank" rel="noreferrer">
              <img
                src={img.url}
                alt=""
                className="h-40 w-full rounded-lg border object-cover transition-opacity hover:opacity-80"
              />
            </a>
          ))}
        </div>
      )}

      {/* Answers */}
      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold">Jawaban ({answers.length})</h2>

        {answers.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada jawaban.</p>
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
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" />}>
                      <Trash2 className="h-4 w-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent size="sm">
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
                          onClick={() => deleteAnswer({ path: { question_id: questionId, id: a.id! } })}
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
            <RichContent html={a.content ?? ""} />
          </div>
        ))}
      </section>

      {/* Answer form — hide if owner */}
      {!isOwner && (
        <section className="mt-6 space-y-3 rounded-lg border p-4">
          <h3 className="text-sm font-semibold">Tulis Jawaban</h3>
          <TiptapEditor content={answerContent} onChange={setAnswerContent} allowImages={false} />
          <div className="flex justify-end">
            <Button
              onClick={() => submitAnswer({ path: { question_id: questionId }, body: { content: answerContent } })}
              disabled={!answerContent || isPending}
            >
              {isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              <Send className="mr-1 h-4 w-4" /> Kirim Jawaban
            </Button>
          </div>
        </section>
      )}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/forum/$id")({
  component: ForumDetail,
})
