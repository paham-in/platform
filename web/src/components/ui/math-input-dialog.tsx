import { useEffect, useRef, useState, createElement } from "react"
import "mathlive"
import type { MathfieldElement } from "mathlive"
import { Button } from "@/components/ui/button"

export function MathInputDialog({
  open,
  initialLatex = "",
  onOpenChange,
  onInsert,
}: {
  open: boolean
  initialLatex?: string
  onOpenChange: (open: boolean) => void
  onInsert: (latex: string) => void
}) {
  const [latex, setLatex] = useState(initialLatex)
  const mfRef = useRef<MathfieldElement>(null)

  useEffect(() => {
    if (open) {
      setLatex(initialLatex)
      setTimeout(() => mfRef.current?.focus(), 100)
    }
  }, [open, initialLatex])

  if (!open) return null

  const mathField = createElement("math-field", {
    ref: mfRef,
    className: "w-full rounded border p-3 text-lg",
    onInput: (evt: Event) => setLatex((evt.target as MathfieldElement).value ?? ""),
  }, latex)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={(e) => e.target === e.currentTarget && onOpenChange(false)}
    >
      <div
        className="w-full max-w-md rounded-4xl bg-popover p-6 text-sm text-popover-foreground ring-1 ring-foreground/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-base leading-none font-medium">
            Masukkan Rumus Matematika
          </h2>
        </div>
        <div className="flex justify-center py-4">
          {mathField}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={() => { onInsert(latex); onOpenChange(false) }} disabled={!latex}>
            Insert
          </Button>
        </div>
      </div>
    </div>
  )
}
