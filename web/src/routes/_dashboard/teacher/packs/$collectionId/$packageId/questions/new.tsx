import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminQuestionPackagesQueryKey, postAdminQuestionPackagesByIdQuestionsMutation } from "@/lib/api/@tanstack/react-query.gen";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";

import { toast } from "sonner";

const OPTION_LABELS = ["A", "B", "C", "D", "E"]

// isEmptyContent: opsi dianggap kosong kalau tidak ada teks DAN tidak ada
// gambar/rumus (opsi berisi gambar doang tetap valid).
function isEmptyContent(html: string): boolean {
  const doc = new DOMParser().parseFromString(html, "text/html")
  const text = (doc.body.textContent || "").trim()
  return text === "" && !doc.body.querySelector("img, [data-type='inline-math'], [data-type='block-math']")
}

function NewQuestion() {
  const { collectionId, packageId } = useParams({ from: "/_dashboard/teacher/packs/$collectionId/$packageId/questions/new" })
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [question, setQuestion] = useState("")
  const [answers, setAnswers] = useState<{ content: string; is_correct: boolean }[]>([
    { content: "", is_correct: false },
    { content: "", is_correct: false },
    { content: "", is_correct: false },
    { content: "", is_correct: false },
  ])
  const [explanation, setExplanation] = useState("")
  const [uploadingEditors, setUploadingEditors] = useState(0)

  const { mutate: createQuestion, isPending } = useMutation({
    ...postAdminQuestionPackagesByIdQuestionsMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionPackagesQueryKey() })
      toast.success("Soal berhasil ditambahkan")
      navigate({ to: "/teacher/packs/$collectionId/$packageId", params: { collectionId, packageId } })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menambah soal"),
  })

  const save = () => {
    const validAnswers = answers.filter((a) => !isEmptyContent(a.content))
    createQuestion({
      path: { id: Number(packageId) },
      body: {
        question,
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
    <main className="p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Tambah Soal</h1>

        <div className="space-y-2">
          <Label>Pertanyaan</Label>
          <TiptapEditor
            content={question}
            onChange={setQuestion}
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
          <Link to="/teacher/packs/$collectionId/$packageId" params={{ collectionId, packageId }}><Button variant="outline">Batal</Button></Link>
          <Button
            onClick={save}
            disabled={!question || validCount < 2 || isPending || uploadingEditors > 0}
          >
            {isPending && <Spinner />}
            {uploadingEditors > 0 ? "Mengupload gambar..." : "Simpan"}
          </Button>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/packs/$collectionId/$packageId/questions/new")({
  component: NewQuestion,
})
