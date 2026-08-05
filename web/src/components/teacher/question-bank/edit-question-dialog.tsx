import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TiptapEditor } from "@/components/ui/tiptap-editor"
import { Spinner } from "@/components/ui/spinner"
import { patchAdminQuestionsBankByIdMutation, getAdminQuestionsBankQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import type { QuestionbankQuestionResponse } from "@/lib/api/types.gen"

const OPTION_LABELS = ["A", "B", "C", "D", "E"]

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html")
  return (doc.body.textContent || "").trim()
}

interface EditQuestionDialogProps {
  question: QuestionbankQuestionResponse
  chapters: { label: string; value: string }[]
  onClose: () => void
}

export function EditQuestionDialog({ question, chapters, onClose }: EditQuestionDialogProps) {
  const qc = useQueryClient()
  const [chapterId, setChapterId] = useState(String(question.chapter_id ?? ""))
  const [questionText, setQuestionText] = useState(question.question ?? "")
  const [options, setOptions] = useState<string[]>([...(question.options ?? []), "", "", "", ""].slice(0, 4))
  const [correctIndex, setCorrectIndex] = useState(question.correct_index ?? 0)
  const [explanation, setExplanation] = useState(question.explanation ?? "")

  const { mutate: updateQuestion, isPending } = useMutation({
    ...patchAdminQuestionsBankByIdMutation(),
    onSuccess: () => {
      toast.success("Soal berhasil diubah")
      qc.invalidateQueries({ queryKey: getAdminQuestionsBankQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || "Gagal mengubah soal"),
  })

  const save = () => {
    const validOptions = options.filter((o) => stripHtml(o) !== "")
    updateQuestion({
      path: { id: question.id! },
      body: {
        chapter_id: Number(chapterId),
        question: questionText,
        options: validOptions,
        correct_index: correctIndex,
        explanation,
      },
    })
  }

  const canSave = chapterId && questionText && options.filter((o) => stripHtml(o) !== "").length >= 2

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Soal</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Chapter</Label>
            <Select items={chapters} value={chapterId} onValueChange={(v) => setChapterId(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Pilih chapter" /></SelectTrigger>
              <SelectContent>
                {chapters.map((opt) => (
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
              onClick={() => { if (options.length < 5) setOptions([...options, ""]) }}
              disabled={options.length >= 5}
            >
              + Tambah Opsi
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Pembahasan (opsional)</Label>
            <TiptapEditor content={explanation} onChange={setExplanation} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={save} disabled={!canSave || isPending}>
            {isPending ? <Spinner /> : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
