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
import { toast } from "sonner"
import { docxToHtml, type DocxImage } from "@/lib/docx-parser"
import { postContentTempImages } from "@/lib/api/sdk.gen"

// Content materi menyimpan objectName storage (`forum/<uuid>.jpg`), bukan URL.
// Backend rewrite objectName → presigned URL saat serve, jadi tidak perlu
// base URL publik di frontend.
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const SKIP_NOTE = "[Gambar dilewati, sisipkan manual]"

/** Gambar siap di-upload: blob sudah pasti ada (null disaring) + blobUrl untuk preview */
type PendingImage = Omit<DocxImage, "blob"> & { blob: Blob; blobUrl: string }

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
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState("")
  const [html, setHtml] = useState("") // preview (pakai blob URL)
  const [baseHtml, setBaseHtml] = useState("") // HTML dengan placeholder %%DOCX_IMG_n%%
  const [images, setImages] = useState<PendingImage[]>([])
  const [error, setError] = useState("")

  const releaseBlobs = () => {
    for (const img of images) URL.revokeObjectURL(img.blobUrl)
  }

  // reset state setiap dialog dibuka (blob sudah di-release saat close)
  useEffect(() => {
    if (open) {
      setParsing(false)
      setUploading(false)
      setFileName("")
      setHtml("")
      setBaseHtml("")
      setImages([])
      setError("")
    }
  }, [open])

  const handleFile = async (file: File) => {
    setParsing(true)
    setError("")
    setHtml("")
    setBaseHtml("")
    setImages([])
    setFileName(file.name)
    try {
      const { html: parsedHtml, images: parsedImages } = await docxToHtml(file)
      if (!parsedHtml.trim()) {
        setError("Tidak ada teks yang terdeteksi. Pastikan file .docx berisi teks.")
        return
      }
      // Preview: ganti placeholder → blob URL. Upload ditunda sampai commit
      // biar tidak ada gambar orphan kalau guru batal.
      const pending: PendingImage[] = []
      let preview = parsedHtml
      for (const img of parsedImages) {
        if (img.blob) {
          const blobUrl = URL.createObjectURL(img.blob)
          pending.push({ ...img, blobUrl, blob: img.blob })
          preview = preview.replace(img.placeholder, blobUrl)
        } else {
          preview = preview.replace(img.placeholder, SKIP_NOTE)
        }
      }
      setBaseHtml(parsedHtml)
      setImages(pending)
      setHtml(preview)
    } catch (err: any) {
      setError(err?.message || "Gagal membaca file. Pastikan file .docx valid.")
    } finally {
      setParsing(false)
    }
  }

  // Upload semua gambar ke storage temp (public/temp_materials/), rewrite src,
  // lalu onImport. Gambar dipindahkan ke lokasi permanen saat materi di-submit.
  // Dipanggil pas "Gunakan Konten Ini", kalau dibatalkan, tidak ada upload.
  const commitImport = async () => {
    if (!baseHtml || uploading) return
    setUploading(true)
    let finalHtml = baseHtml
    let uploaded = 0
    let skipped = 0

    const note = (img: PendingImage) => (finalHtml = finalHtml.replace(img.placeholder, SKIP_NOTE))

    for (const img of images) {
      const okMime = ALLOWED_MIME.includes(img.mime)
      const tooBig = img.blob.size > MAX_IMAGE_BYTES
      if (!okMime || tooBig) {
        note(img)
        skipped++
        continue
      }
      try {
        const { data } = await postContentTempImages({
          body: {
            image: new File([img.blob], img.originalName, { type: img.mime }),
            folder: "materials",
          } as any,
        })
        const url = data?.url
        if (!url) {
          note(img)
          skipped++
          continue
        }
        finalHtml = finalHtml.replace(img.placeholder, url)
        uploaded++
      } catch {
        note(img)
        skipped++
      }
    }

    setUploading(false)
    releaseBlobs()
    setImages([])
    setBaseHtml("")
    setHtml("")
    if (uploaded + skipped > 0) {
      toast.info(`${uploaded} gambar diimport${skipped ? `, ${skipped} dilewati` : ""}`)
    }
    onImport(finalHtml)
    onOpenChange(false)
  }

  // Tutup dialog → lepas blob URL. Selama upload berjalan, close diabaikan.
  const handleOpenChange = (v: boolean) => {
    if (v) {
      onOpenChange(v)
      return
    }
    if (uploading) return
    releaseBlobs()
    setImages([])
    setBaseHtml("")
    setHtml("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Materi dari Word</DialogTitle>
          <DialogDescription>
            Gambar dalam dokumen ikut diimport saat memakai konten ini.
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
          disabled={parsing || uploading}
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
        {uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Mengunggah gambar...
          </div>
        )}
        {fileName && !parsing && !uploading && !error && (
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
          <Button
            variant="outline"
            type="button"
            onClick={() => handleOpenChange(false)}
            disabled={uploading}
          >
            Batal
          </Button>
          <Button onClick={commitImport} disabled={!html || parsing || uploading}>
            {uploading && <Spinner />}
            Gunakan Konten Ini
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
