import { useQuery } from "@tanstack/react-query"
import { getQuestionsByIdOptions } from "@/lib/api/@tanstack/react-query.gen"
import { createFileRoute, Link, useParams } from "@tanstack/react-router"
import { Loader2, ArrowLeft, MessageSquare } from "lucide-react"

function ForumDetail() {
  const { id } = useParams({ from: "/_dashboard/forum/$id" })
  const { data: question, isLoading } = useQuery(getQuestionsByIdOptions({ path: { id: Number(id) } }))

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

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <Link
        to="/forum"
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

      <h1 className="text-2xl font-bold tracking-tight">{question.title}</h1>

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
        <span>•</span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {question.upvotes}
        </span>
      </div>

      {question.content && (
        <article
          className="prose prose-sm dark:prose-invert mt-6 max-w-none"
          dangerouslySetInnerHTML={{ __html: question.content }}
        />
      )}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/forum/$id")({
  component: ForumDetail,
})
