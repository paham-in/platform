import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RichContent } from "@/components/ui/rich-content"
import type { QuestionbankQuestionResponse } from "@/lib/api/types.gen"

interface PreviewQuestionDialogProps {
  question: QuestionbankQuestionResponse
  onClose: () => void
}

export function PreviewQuestionDialog({ question, onClose }: PreviewQuestionDialogProps) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 sm:max-w-[600px]">
        <DialogHeader className="shrink-0">
          <DialogTitle>Preview Soal</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Dibuat oleh {question.user_name || "-"}
          </p>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto no-scrollbar py-4">
          <div className="space-y-4">
            <div>
              {question.question ? <RichContent html={question.question} /> : <span className="text-muted-foreground">(kosong)</span>}
            </div>

            {(question.answers ?? []).length > 0 && (
              <div className="grid gap-1 text-sm">
                {(question.answers ?? []).map((ans, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`shrink-0 rounded px-1.5 text-xs font-semibold ${
                      ans.is_correct ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <div className="flex-1"><RichContent html={ans.content ?? ""} /></div>
                  </div>
                ))}
              </div>
            )}

            {(question.answers ?? []).length === 0 && (
              <p className="text-xs text-amber-600">Soal tanpa opsi — periksa format.</p>
            )}
          </div>

          {question.explanation && (
            <div className="shrink-0">
              <span className="text-sm font-semibold text-muted-foreground">Pembahasan</span>
              <RichContent html={question.explanation} />
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
