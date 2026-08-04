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
import {
  getSubjectsOptions,
  getAdminSubjectsBySubjectIdImagesQueryKey,
  deleteAdminSubjectsBySubjectIdImagesByIdMutation,
  postAdminSubjectsBySubjectIdImagesMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getAdminSubjectsBySubjectIdImages } from "@/lib/api/sdk.gen"
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
  const qc = useQueryClient()
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const [subjectId, setSubjectId] = useState("")
  const [search, setSearch] = useState("")

  const subjectOptions = subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }))

  const queryKey = subjectId
    ? getAdminSubjectsBySubjectIdImagesQueryKey({ path: { subject_id: Number(subjectId) }, query: { q: search || undefined } })
    : [] as any

  const { data: rawImages = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!subjectId) return []
      const res = await getAdminSubjectsBySubjectIdImages({ path: { subject_id: Number(subjectId) }, query: { q: search || undefined } })
      return res.data ?? []
    },
    enabled: !!subjectId,
  } as any)
  const images = rawImages as unknown as GalleryImage[]

  const { mutate: deleteImage, isPending: deleting } = useMutation({
    ...deleteAdminSubjectsBySubjectIdImagesByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey })
      toast.success("Gambar berhasil dihapus")
    },
    onError: () => toast.error("Gagal menghapus gambar"),
  })

  useEffect(() => { if (!open) setSearch("") }, [open])

  const handleSubjectChange = (v: string) => {
    setSubjectId(v ?? "")
    setSearch("")
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
            <Select items={subjectOptions} value={subjectId} onValueChange={(v) => handleSubjectChange(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih subjek" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
                    onKeyDown={(e) => { if (e.key === "Enter") qc.invalidateQueries({ queryKey }) }}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey })}>Cari</Button>
              </div>

              <UploadDialog subjectId={subjectId} onDone={() => qc.invalidateQueries({ queryKey })} />
            </>
          )}

          {isLoading ? (
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
                          <AlertDialogDescription>Yakin ingin menghapus gambar ini?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            disabled={deleting}
                            onClick={() => deleteImage({ path: { subject_id: Number(subjectId), id: img.id! } })}
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

  const { mutate: doUpload, isPending: uploading } = useMutation({
    ...postAdminSubjectsBySubjectIdImagesMutation(),
    onSuccess: () => { toast.success("Gambar berhasil diupload"); setOpen(false); setTitle(""); setFiles(null); onDone() },
    onError: () => toast.error("Gagal upload"),
  })

  const submit = () => {
    if (!files?.length) return
    const t = title.trim() || files[0].name
    for (const file of files) {
      doUpload({ body: { image: file, title: t } as any, path: { subject_id: Number(subjectId) } })
    }
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
              <Input placeholder="Masukkan judul" value={title} onChange={(e) => setTitle(e.target.value)} />
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
            <Button onClick={submit} disabled={!files?.length || uploading}>
              {uploading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
