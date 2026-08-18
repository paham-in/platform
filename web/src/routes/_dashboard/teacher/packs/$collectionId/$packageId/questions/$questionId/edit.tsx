import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminQuestionPackagesByIdQuestionsOptions, getAdminQuestionPackagesQueryKey, patchAdminQuestionPackagesByIdQuestionsByQidMutation } from "@/lib/api/@tanstack/react-query.gen";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { usePageTitle } from "@/components/page-title";

import { toast } from "sonner";

const OPTION_LABELS = ["A", "B", "C", "D", "E"]

// isEmptyContent: opsi dianggap kosong kalau tidak ada teks DAN tidak ada
// gambar/rumus (opsi berisi gambar doang tetap valid).
function isEmptyContent(html: string): boolean {
  const doc = new DOMParser().parseFromString(html, "text/html")
  const text = (doc.body.textContent || "").trim()
  return text === "" && !doc.body.querySelector("img, [data-type='inline-math'], [data-type='block-math']")
}

function EditQuestion() {
  usePageTitle("Edit Soal")
  const { collectionId, packageId, questionId } = useParams({ from: "/_dashboard/teacher/packs/$collectionId/$packageId/questions/$questionId/edit" })
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: questions = [], isLoading } = useQuery(getAdminQuestionPackagesByIdQuestionsOptions({ path: { id: Number(packageId) } }))

  const question = questions.find((q) => q.id === Number(questionId))
  const [questionText, setQuestionText] = useState(question?.question ?? "")
  const [answers, setAnswers] = useState<{ content: string; is_correct: boolean }[]>(
    [...(question?.answers ?? []).map((a) => ({ content: a.content ?? "", is_correct: a.is_correct ?? false })), { content: "", is_correct: false }, { content: "", is_correct: false }, { content: "", is_correct: false }, { content: "", is_correct: false }].slice(0, 4)
  )
  const [explanation, setExplanation] = useState(question?.explanation ?? "")
  const [uploadingEditors, setUploadingEditors] = useState(0)

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
      <main className="p-4 md:p-6">
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
      <main className="p-4 md:p-6">
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-muted-foreground">Soal tidak ditemukan</p>
        </div>
      </main>
    )
  }

  const save = () => {
    const validAnswers = answers.filter((a) => !isEmptyContent(a.content))
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

  const validCount = answers.filter((a) => !isEmptyContent(a.content)).length

  return (
    <main className="p-4 md:p-6">
      <div className="mx-auto max-w-3xl space-y-4 md:space-y-6">
        <h1 className="hidden md:block text-2xl font-bold tracking-tight">Edit Soal</h1>

        <div className="space-y-2">
          <Label>Pertanyaan</Label>
          <TiptapEditor
            content={questionText}
            onChange={setQuestionText}
            tempFolder="quiz_questions"
            onUploadingChange={(u) => setUploadingEditors((n) => n + (u ? 1 : -1))}
          />
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
                  tempFolder="quiz_answers"
                  onUploadingChange={(u) => setUploadingEditors((n) => n + (u ? 1 : -1))}
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
          <TiptapEditor
            content={explanation}
            onChange={setExplanation}
            tempFolder="quiz_questions"
            onUploadingChange={(u) => setUploadingEditors((n) => n + (u ? 1 : -1))}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => navigate({ to: "/teacher/packs/$collectionId/$packageId", params: { collectionId, packageId } })}>Batal</Button>
          <Button
            onClick={save}
            disabled={!questionText || validCount < 2 || isPending || uploadingEditors > 0}
          >
            {isPending && <Spinner />}
            {uploadingEditors > 0 ? "Mengupload gambar..." : "Simpan"}
          </Button>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/packs/$collectionId/$packageId/questions/$questionId/edit")({
  component: EditQuestion,
})
