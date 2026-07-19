import { useEffect, useRef, useState } from "react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { getSubjectsOptions } from "@/lib/api/@tanstack/react-query.gen"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"

type GalleryImage = { id: number; url: string }

export function GalleryPicker({
  open,
  onOpenChange,
  onInsert,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onInsert: (url: string) => void
}) {
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const [subjectId, setSubjectId] = useState("")
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    if (subjectId) loadImages(subjectId)
  }, [open])

  const loadImages = async (sid: string) => {
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:8080/admin/subjects/${sid}/images`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (res.ok) setImages(await res.json())
      else setImages([])
    } catch { setImages([]) }
    setLoading(false)
  }

  const uploadFiles = async (files: FileList | null) => {
    if (!files || !subjectId) return
    setUploading(true)
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} terlalu besar (maks 5MB)`)
        continue
      }
      const form = new FormData()
      form.append("image", file)
      const res = await fetch(`http://localhost:8080/admin/subjects/${subjectId}/images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: form,
      })
      if (res.ok) toast.success(`${file.name} berhasil diupload`)
      else toast.error(`Gagal upload ${file.name}`)
    }
    setUploading(false)
    loadImages(subjectId)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={(e) => e.target === e.currentTarget && onOpenChange(false)}>
      <div className="w-full max-w-2xl rounded-4xl bg-popover p-6 text-sm text-popover-foreground ring-1 ring-foreground/5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-base font-medium mb-4">Galeri Gambar</h2>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Label>Mata Pelajaran</Label>
            <Select value={subjectId} onValueChange={(v) => { setSubjectId(v ?? ""); loadImages(v ?? "") }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih subjek" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            className="hidden"
            onChange={(e) => uploadFiles(e.target.files)}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={!subjectId || uploading}>
            {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
            Upload
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : images.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">{subjectId ? "Belum ada gambar" : "Pilih subjek dulu"}</p>
        ) : (
          <div className="grid max-h-80 grid-cols-3 gap-3 overflow-y-auto">
            {images.map((img) => (
              <button
                key={img.id}
                type="button"
                className="overflow-hidden rounded-lg border transition-opacity hover:opacity-80"
                onClick={() => { onInsert(img.url); onOpenChange(false) }}
              >
                <img src={img.url} alt="" className="h-28 w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
