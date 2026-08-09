import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { RichContent } from "@/components/ui/rich-content"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileText, UploadCloud, XCircle } from "lucide-react"
import { docxToHtml } from "@/lib/docx-parser"

export function DocxImportDialog({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (html: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsing, setParsing] = useState(false)
  const [fileName, setFileName] = useState("")
  const [html, setHtml] = useState("")
  const [error, setError] = useState("")

  // reset state setiap dialog dibuka
  useEffect(() => {
    if (open) {
      setParsing(false)
      setFileName("")
      setHtml("")
      setError("")
    }
  }, [open])

  const handleFile = async (file: File) => {
    setParsing(true)
    setError("")
    setHtml("")
    setFileName(file.name)
    try {
      const converted = await docxToHtml(file)
      if (!converted.trim()) {
        setError("Tidak ada teks yang terdeteksi. Pastikan file .docx berisi teks.")
      } else {
        setHtml(converted)
      }
    } catch (err: any) {
      setError(err?.message || "Gagal membaca file. Pastikan file .docx valid.")
    } finally {
      setParsing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Materi dari Word</DialogTitle>
          <DialogDescription>
            Konten diambil dari file .docx dan masuk ke editor. Gambar dilewati — sisipkan manual setelah import.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ""
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={parsing}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
        >
          <UploadCloud className="h-8 w-8" />
          <span className="text-sm font-medium">Klik untuk pilih file .docx</span>
          <span className="text-xs">Mendukung rumus Equation Editor (dikonversi ke LaTeX)</span>
        </button>

        {parsing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Memproses dokumen...
          </div>
        )}
        {fileName && !parsing && !error && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" /> {fileName}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <XCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {html && (
          <div className="max-h-80 overflow-y-auto rounded-md border p-4">
            <RichContent html={html} />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={() => {
              onImport(html)
              onOpenChange(false)
            }}
            disabled={!html}
          >
            Gunakan Konten Ini
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
