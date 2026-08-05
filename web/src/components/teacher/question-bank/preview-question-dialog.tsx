import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RichContent } from "@/components/ui/rich-content"
import type { QuestionbankQuestionResponse } from "@/lib/api/types.gen"

interface PreviewQuestionDialogProps {
  question: QuestionbankQuestionResponse
  onClose: () => void
}

export function PreviewQuestionDialog({ question, onClose }: PreviewQuestionDialogProps) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Preview Soal</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Chapter</Label>
            <p className="text-sm">{question.chapter_title || "-"}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Pertanyaan</Label>
            <div className="rounded-md border bg-muted/30 p-3">
              <RichContent html={question.question ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Opsi Jawaban</Label>
            <div className="grid gap-1.5">
              {(question.options ?? []).map((opt, i) => (
                <div key={i} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                  <span className="shrink-0 rounded bg-muted px-1.5 text-xs font-semibold text-muted-foreground">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <div className="flex-1"><RichContent html={opt} /></div>
                  {i === question.correct_index && (
                    <span className="ml-auto shrink-0 text-xs font-medium text-green-700">✓ Benar</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          {question.explanation && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Pembahasan</Label>
              <div className="rounded-md border bg-muted/30 p-3 text-muted-foreground">
                <RichContent html={question.explanation} />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
