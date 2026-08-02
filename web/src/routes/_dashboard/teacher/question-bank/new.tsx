import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminChaptersOptions, getAdminQuestionsBankQueryKey, postAdminQuestionsBankMutation } from "@/lib/api/@tanstack/react-query.gen";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

const OPTION_LABELS = ["A", "B", "C", "D", "E"]

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html")
  return (doc.body.textContent || "").trim()
}

function NewQuestion() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: chapters = [] } = useQuery(getAdminChaptersOptions())

  const [chapterId, setChapterId] = useState("")
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState<string[]>(["", "", "", ""])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [explanation, setExplanation] = useState("")

  const { mutate: createQuestion, isPending } = useMutation({
    ...postAdminQuestionsBankMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionsBankQueryKey() })
      toast.success("Soal berhasil ditambahkan")
      navigate({ to: "/teacher/question-bank" })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menambah soal"),
  })

  const save = () => {
    const validOptions = options.filter((o) => stripHtml(o) !== "")
    createQuestion({
      body: {
        chapter_id: Number(chapterId),
        question,
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

        <h1 className="text-2xl font-bold tracking-tight">Tambah Soal</h1>

        <div className="space-y-2">
          <Label>Chapter</Label>
          <Select value={chapterId} onValueChange={(v) => setChapterId(v ?? "")}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Pilih chapter" /></SelectTrigger>
            <SelectContent>
              {chapters.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Pertanyaan</Label>
          <TiptapEditor content={question} onChange={setQuestion} />
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
            disabled={!chapterId || !question || options.filter((o) => stripHtml(o) !== "").length < 2 || isPending}
          >
            {isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Simpan
          </Button>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/question-bank/new")({
  component: NewQuestion,
})
