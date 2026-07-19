import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { getSubjectsOptions } from "@/lib/api/@tanstack/react-query.gen"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, SearchIcon, Trash2, Upload, X } from "lucide-react"

type GalleryImage = { id: number; url: string; title: string; is_owner?: boolean }

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
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (subjectId) loadImages(subjectId)
  }, [open])

  const loadImages = async (sid: string, q?: string) => {
    setLoading(true)
    try {
      let url = `http://localhost:8080/admin/subjects/${sid}/images`
      if (q) url += `?q=${encodeURIComponent(q)}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (res.ok) setImages(await res.json())
      else setImages([])
    } catch { setImages([]) }
    setLoading(false)
  }

  const handleSubjectChange = (v: string) => {
    setSubjectId(v ?? "")
    setSearch("")
    loadImages(v ?? "")
  }

  const handleSearch = () => {
    if (subjectId) loadImages(subjectId, search)
  }

  const deleteImage = async () => {
    if (!deleteId || !subjectId) return
    setDeleting(true)
    const res = await fetch(`http://localhost:8080/admin/subjects/${subjectId}/images/${deleteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    setDeleting(false)
    setDeleteId(null)
    if (res.ok) toast.success("Gambar berhasil dihapus")
    else toast.error("Gagal menghapus gambar")
    loadImages(subjectId)
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-50 bg-black/40" />}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-popover p-6 text-sm text-popover-foreground shadow-xl transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-base font-medium">Galeri Gambar</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Mata Pelajaran</Label>
            <Select value={subjectId} onValueChange={(v) => handleSubjectChange(v ?? "")}>
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

          {subjectId && (
            <>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari judul..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handleSearch}>Cari</Button>
              </div>

              <UploadDialog
                subjectId={subjectId}
                onDone={() => loadImages(subjectId)}
              />
            </>
          )}

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : images.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {subjectId ? "Tidak ada gambar" : "Pilih subjek dulu"}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 340px)" }}>
              {images.map((img) => (
                <div key={img.id} className="group relative overflow-hidden rounded-lg border">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => { onInsert(img.url); onOpenChange(false) }}
                  >
                    <img src={img.url} alt={img.title} className="h-24 w-full object-cover" />
                    <p className="truncate px-2 py-1.5 text-xs text-muted-foreground">{img.title}</p>
                  </button>
                  {img.is_owner && (
                    <AlertDialog>
                      <AlertDialogTrigger render={
                        <button
                          type="button"
                          className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded bg-black/50 text-white group-hover:flex hover:bg-black/70"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      } />
                      <AlertDialogContent size="sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Gambar</AlertDialogTitle>
                          <AlertDialogDescription>
                            Yakin ingin menghapus gambar ini?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            disabled={deleting}
                            onClick={() => { setDeleteId(img.id); deleteImage() }}
                          >
                            {deleting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function UploadDialog({ subjectId, onDone }: { subjectId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [files, setFiles] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)

  const uploadFiles = async () => {
    if (!files?.length) return
    const t = title.trim() || files[0].name
    setUploading(true)
    let ok = true
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} terlalu besar (maks 5MB)`)
        ok = false
        continue
      }
      const form = new FormData()
      form.append("image", file)
      form.append("title", t)
      const res = await fetch(`http://localhost:8080/admin/subjects/${subjectId}/images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: form,
      })
      if (!res.ok) { ok = false; toast.error(`Gagal upload ${file.name}`) }
    }
    setUploading(false)
    if (ok) { toast.success(`"${t}" berhasil diupload`); setOpen(false); setTitle(""); setFiles(null); onDone() }
  }

  return (
    <>
      <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(true)}>
        <Upload className="mr-1 h-4 w-4" /> Upload Gambar Baru
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Gambar</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Judul Gambar</Label>
              <Input
                placeholder="Masukkan judul"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>File</Label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
                onChange={(e) => setFiles(e.target.files)}
                disabled={uploading}
              />
              {files?.length ? <p className="text-xs text-muted-foreground">{files.length} file dipilih</p> : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={uploadFiles} disabled={!files?.length || uploading}>
              {uploading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
