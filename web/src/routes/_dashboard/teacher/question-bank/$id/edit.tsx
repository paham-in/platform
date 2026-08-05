import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminChaptersOptions, getAdminQuestionsBankOptions, getAdminQuestionsBankQueryKey, patchAdminQuestionsBankByIdMutation } from "@/lib/api/@tanstack/react-query.gen";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const OPTION_LABELS = ["A", "B", "C", "D", "E"]

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html")
  return (doc.body.textContent || "").trim()
}

function EditQuestion() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { id } = Route.useParams()
  const { data: chapters = [] } = useQuery(getAdminChaptersOptions())
  const { data: questions = [], isLoading } = useQuery(getAdminQuestionsBankOptions())

  const question = questions.find((q) => q.id === Number(id))
  const [chapterId, setChapterId] = useState(String(question?.chapter_id ?? ""))
  const [questionText, setQuestionText] = useState(question?.question ?? "")
  const [options, setOptions] = useState<string[]>([...(question?.options ?? []), "", "", "", ""].slice(0, 4))
  const [correctIndex, setCorrectIndex] = useState(question?.correct_index ?? 0)
  const [explanation, setExplanation] = useState(question?.explanation ?? "")

  const chapterOptions = chapters.map((c) => ({ label: c.title ?? "", value: String(c.id) }))

  const { mutate: updateQuestion, isPending } = useMutation({
    ...patchAdminQuestionsBankByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionsBankQueryKey() })
      toast.success("Soal berhasil diubah")
      navigate({ to: "/teacher/question-bank" })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal mengubah soal"),
  })

  if (isLoading) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-12 w-full" />
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
          <Link to="/teacher/question-bank">
            <Button variant="outline">Kembali</Button>
          </Link>
        </div>
      </main>
    )
  }

  const save = () => {
    const validOptions = options.filter((o) => stripHtml(o) !== "")
    updateQuestion({
      path: { id: Number(id) },
      body: {
        chapter_id: Number(chapterId),
        question: questionText,
        options: validOptions,
        correct_index: correctIndex,
        explanation,
      },
    })
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link to="/teacher/question-bank" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">Edit Soal</h1>

        <div className="space-y-2">
          <Label>Chapter</Label>
          <Select items={chapterOptions} value={chapterId} onValueChange={(v) => setChapterId(v ?? "")}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Pilih chapter" /></SelectTrigger>
            <SelectContent>
              {chapterOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Pertanyaan</Label>
          <TiptapEditor content={questionText} onChange={setQuestionText} />
        </div>

        <div className="space-y-3">
          <Label>Opsi Jawaban</Label>
          {options.map((opt, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium">{OPTION_LABELS[i]}</span>
              <div className="flex-1 rounded-md border">
                <TiptapEditor
                  content={opt}
                  onChange={(html) => {
                    const next = [...options]
                    next[i] = html
                    setOptions(next)
                  }}
                />
              </div>
              <Button
                type="button"
                variant={correctIndex === i ? "default" : "outline"}
                size="sm"
                className="mt-1"
                onClick={() => setCorrectIndex(i)}
              >
                {correctIndex === i ? "Benar" : "Jadikan"}
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (options.length < 5) setOptions([...options, ""])
            }}
            disabled={options.length >= 5}
          >
            + Tambah Opsi
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Pembahasan (opsional)</Label>
          <TiptapEditor content={explanation} onChange={setExplanation} />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link to="/teacher/question-bank"><Button variant="outline">Batal</Button></Link>
          <Button
            onClick={save}
            disabled={!chapterId || !questionText || options.filter((o) => stripHtml(o) !== "").length < 2 || isPending}
          >
            {isPending && <Spinner />}
            Simpan
          </Button>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/question-bank/$id/edit")({
  component: EditQuestion,
})
