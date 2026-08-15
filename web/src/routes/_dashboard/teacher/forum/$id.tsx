import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { RichContent } from "@/components/ui/rich-content"
import { Skeleton } from "@/components/ui/skeleton"
import { YoutubeEmbed } from "@/components/ui/youtube-embed"
import { useQuery } from "@tanstack/react-query"
import "katex/dist/katex.min.css"
import {
  getQuestionsByIdOptions,
  getQuestionsByQuestionIdAnswersOptions,
  getQuestionsByQuestionIdImagesOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { createFileRoute, useParams } from "@tanstack/react-router"
import { Trash2, MessageCircle } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import type { AnswerAnswerResponse } from "@/lib/api/types.gen"
import { DeleteAnswerDialog } from "@/components/teacher/forum"
import { AnswerForm } from "@/components/forum"

function ForumDetail() {
  const { id } = useParams({ from: "/_dashboard/teacher/forum/$id" })
  const questionId = Number(id)

  const { data: question, isLoading } = useQuery(getQuestionsByIdOptions({ path: { id: questionId } }))
  const { data: answers = [] } = useQuery(
    getQuestionsByQuestionIdAnswersOptions({ path: { question_id: questionId } })
  )
  const { data: images = [] } = useQuery(
    getQuestionsByQuestionIdImagesOptions({ path: { question_id: questionId } })
  )

  const [deleting, setDeleting] = useState<AnswerAnswerResponse | null>(null)

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-8 w-2/3" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </main>
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
      <div className="mb-2 flex items-center gap-2">
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
        <RichContent html={question.content} className="mt-3" />
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
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><MessageCircle /></EmptyMedia>
              <EmptyTitle>Belum ada jawaban</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}

        {answers.map((a) => (
          <Card key={a.id}>
            <CardHeader className="flex flex-row items-center gap-3">
              {a.user_avatar ? (
                <img src={a.user_avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {a.user_name?.[0]}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{a.user_name}</p>
                <p className="text-xs text-muted-foreground">{a.created_at}</p>
              </div>
              {a.is_owner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleting(a)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {a.content && <RichContent html={a.content} />}
              {a.video_url && <YoutubeEmbed url={a.video_url} className="mt-3" />}
              {a.images && a.images.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {a.images.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer">
                      <img
                        src={url}
                        alt=""
                        className="h-40 w-full rounded-lg border object-cover transition-opacity hover:opacity-80"
                      />
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      {deleting && (
        <DeleteAnswerDialog
          answer={deleting}
          questionId={questionId}
          onClose={() => setDeleting(null)}
        />
      )}

      {/* Answer form — hide if owner */}
      {!isOwner && <AnswerForm questionId={questionId} />}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/forum/$id")({
  component: ForumDetail,
})
