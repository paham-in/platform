import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminQuestionPackagesByIdOptions, getAdminQuestionPackagesByIdQuestionsOptions, getAdminQuestionPackagesQueryKey, patchAdminQuestionPackagesByIdQuestionsByQidMutation } from "@/lib/api/@tanstack/react-query.gen";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const OPTION_LABELS = ["A", "B", "C", "D", "E"]

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html")
  return (doc.body.textContent || "").trim()
}

function EditQuestion() {
  const { collectionId, packageId, questionId } = useParams({ from: "/_dashboard/teacher/packs/$collectionId/$packageId/questions/$questionId/edit" })
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: questions = [], isLoading } = useQuery(getAdminQuestionPackagesByIdQuestionsOptions({ path: { id: Number(packageId) } }))
  const { data: pkg } = useQuery(getAdminQuestionPackagesByIdOptions({ path: { id: Number(packageId) } }))

  const question = questions.find((q) => q.id === Number(questionId))
  const subjectId = pkg?.subject_id
  const [questionText, setQuestionText] = useState(question?.question ?? "")
  const [answers, setAnswers] = useState<{ content: string; is_correct: boolean }[]>(
    [...(question?.answers ?? []).map((a) => ({ content: a.content ?? "", is_correct: a.is_correct ?? false })), { content: "", is_correct: false }, { content: "", is_correct: false }, { content: "", is_correct: false }, { content: "", is_correct: false }].slice(0, 4)
  )
  const [explanation, setExplanation] = useState(question?.explanation ?? "")

  const { mutate: updateQuestion, isPending } = useMutation({
    ...patchAdminQuestionPackagesByIdQuestionsByQidMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionPackagesQueryKey() })
      toast.success("Soal berhasil diubah")
      navigate({ to: "/teacher/packs/$collectionId/$packageId", params: { collectionId, packageId } })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal mengubah soal"),
  })

  if (isLoading) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </main>
    )
  }

  if (!question) {
    return (
      <main className="p-6">
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-muted-foreground">Soal tidak ditemukan</p>
          <Link to="/teacher/packs/$collectionId/$packageId" params={{ collectionId, packageId }}>
            <Button variant="outline">Kembali</Button>
          </Link>
        </div>
      </main>
    )
  }

  const save = () => {
    const validAnswers = answers.filter((a) => stripHtml(a.content) !== "")
    updateQuestion({
      path: { id: Number(packageId), qid: Number(questionId) },
      body: {
        question: questionText,
        answers: validAnswers,
        explanation,
      },
    })
  }

  const toggleCorrect = (i: number) => {
    setAnswers((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], is_correct: !next[i].is_correct }
      return next
    })
  }

  const validCount = answers.filter((a) => stripHtml(a.content) !== "").length

  return (
    <main className="p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link to="/teacher/packs/$collectionId/$packageId" params={{ collectionId, packageId }} className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">Edit Soal</h1>

        <div className="space-y-2">
          <Label>Pertanyaan</Label>
          <TiptapEditor content={questionText} onChange={setQuestionText} subjectId={subjectId} galleryFolder="questions" />
        </div>

        <div className="space-y-3">
          <Label>Opsi Jawaban</Label>
          {answers.map((ans, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium">{OPTION_LABELS[i]}</span>
              <div className="flex-1 rounded-md border">
                <TiptapEditor
                  content={ans.content}
                  onChange={(html) => {
                    const next = [...answers]
                    next[i] = { ...next[i], content: html }
                    setAnswers(next)
                  }}
                  subjectId={subjectId}
                  galleryFolder="questions"
                />
              </div>
              <label className="mt-1 flex items-center gap-1.5 text-sm">
                <Checkbox
                  checked={ans.is_correct}
                  onCheckedChange={() => toggleCorrect(i)}
                />
                Benar
              </label>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (answers.length < 5) setAnswers([...answers, { content: "", is_correct: false }])
            }}
            disabled={answers.length >= 5}
          >
            + Tambah Opsi
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Pembahasan (opsional)</Label>
          <TiptapEditor content={explanation} onChange={setExplanation} subjectId={subjectId} galleryFolder="questions" />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link to="/teacher/packs/$collectionId/$packageId" params={{ collectionId, packageId }}><Button variant="outline">Batal</Button></Link>
          <Button
            onClick={save}
            disabled={!questionText || validCount < 2 || isPending}
          >
            {isPending && <Spinner />}
            Simpan
          </Button>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/packs/$collectionId/$packageId/questions/$questionId/edit")({
  component: EditQuestion,
})
