import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminQuestionPackagesByIdOptions, getAdminQuestionPackagesQueryKey, postAdminQuestionPackagesByIdQuestionsMutation } from "@/lib/api/@tanstack/react-query.gen";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const OPTION_LABELS = ["A", "B", "C", "D", "E"]

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html")
  return (doc.body.textContent || "").trim()
}

function NewQuestion() {
  const { packageId } = useParams({ from: "/_dashboard/teacher/packs/$packageId/questions/new" })
  const qc = useQueryClient()
  const navigate = useNavigate()

  // subject gallery = subject dari paket ini (buat GalleryPicker di editor).
  const { data: pkg } = useQuery(getAdminQuestionPackagesByIdOptions({ path: { id: Number(packageId) } }))
  const subjectId = pkg?.subject_id

  const [question, setQuestion] = useState("")
  const [answers, setAnswers] = useState<{ content: string; is_correct: boolean }[]>([
    { content: "", is_correct: false },
    { content: "", is_correct: false },
    { content: "", is_correct: false },
    { content: "", is_correct: false },
  ])
  const [explanation, setExplanation] = useState("")

  const { mutate: createQuestion, isPending } = useMutation({
    ...postAdminQuestionPackagesByIdQuestionsMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionPackagesQueryKey() })
      toast.success("Soal berhasil ditambahkan")
      navigate({ to: "/teacher/packs/$packageId", params: { packageId } })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menambah soal"),
  })

  const save = () => {
    const validAnswers = answers.filter((a) => stripHtml(a.content) !== "")
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

  const validCount = answers.filter((a) => stripHtml(a.content) !== "").length

  return (
    <main className="p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link to="/teacher/packs/$packageId" params={{ packageId }} className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">Tambah Soal</h1>

        <div className="space-y-2">
          <Label>Pertanyaan</Label>
          <TiptapEditor content={question} onChange={setQuestion} subjectId={subjectId} />
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
          <TiptapEditor content={explanation} onChange={setExplanation} subjectId={subjectId} />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link to="/teacher/packs/$packageId" params={{ packageId }}><Button variant="outline">Batal</Button></Link>
          <Button
            onClick={save}
            disabled={!question || validCount < 2 || isPending}
          >
            {isPending && <Spinner />}
            Simpan
          </Button>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/packs/$packageId/questions/new")({
  component: NewQuestion,
})
