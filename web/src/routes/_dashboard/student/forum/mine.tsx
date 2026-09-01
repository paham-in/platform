import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import {
  getQuestionsOptions,
  getQuestionsQueryKey,
  deleteQuestionsByIdMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, MessageSquare } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { usePageTitle } from "@/components/page-title"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"
import { z } from "zod"

const mineSearchSchema = z.object({
  modal: z.string().optional(),
})

function MyQuestions() {
  usePageTitle("Pertanyaan Saya")
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: questions = [], isLoading } = useQuery(
    getQuestionsOptions({ query: { mine: true } })
  )
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()

  useEffect(() => {
    if (modal !== "delete") setDeleteId(null)
  }, [modal])

  const { mutate: deleteQuestion } = useMutation({
    ...deleteQuestionsByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getQuestionsQueryKey() })
      toast.success("Pertanyaan berhasil dihapus")
    },
    onError: (err: any) => {
      toast.error(err?.error || err?.message || "Gagal menghapus pertanyaan")
    },
  })

  const StatusBadge = ({ answerCount }: { answerCount?: number }) => {
    const answered = (answerCount ?? 0) > 0
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        answered ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
      }`}>
        {answered ? "Terjawab" : "Terbuka"}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <main className="p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="hidden md:block text-2xl font-bold tracking-tight">Pertanyaan Saya</h1>
        <Button onClick={() => navigate({ to: "/student/forum/new" })}>
            <Plus className="mr-1 h-4 w-4" /> Pertanyaan Baru
          </Button>
      </div>

      <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
        {questions.length === 0 && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><MessageSquare /></EmptyMedia>
              <EmptyTitle>Belum ada pertanyaan</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
        {questions.map((q) => (
          <Card
            key={q.id}
            onClick={() => navigate({ to: "/student/forum/$id", params: { id: String(q.id!) } })}
            className="cursor-pointer overflow-hidden transition-colors hover:bg-muted/50"
          >
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge answerCount={q.answer_count} />
                    {q.subject_name && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {q.subject_name}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-0.5 h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteId(q.id!)
                      openModal("delete")
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{q.plain_content}</p>

                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  {q.user_avatar ? (
                    <img src={q.user_avatar} alt="" className="h-4 w-4 rounded-full" />
                  ) : (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {q.user_name?.[0]}
                    </div>
                  )}
                  <span className="truncate">{q.user_name}</span>
                </div>
              </CardContent>
          </Card>
        ))}
      </div>

      {modal === "delete" && deleteId !== null && (
        <AlertDialog open onOpenChange={(o) => !o && closeModal()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Pertanyaan</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah kamu yakin ingin menghapus pertanyaan ini?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => {
                deleteQuestion({ path: { id: deleteId } })
                closeModal()
              }}>Hapus</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/forum/mine")({
  component: MyQuestions,
  validateSearch: mineSearchSchema,
})
