import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Trash2, ImageOff } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import {
  getAdminSubjectsBySubjectIdImagesUsageQueryKey,
  getAdminSubjectsBySubjectIdImagesUsageOptions,
  deleteAdminSubjectsBySubjectIdImagesByIdMutation,
} from "@/lib/api/@tanstack/react-query.gen"

type SubjectOption = { id?: number; name?: string }

type UsageImage = {
  id?: number
  url?: string
  object_name?: string
  title?: string
  usage_count?: number
  used_in?: { id?: number; title?: string; type?: string }[]
  is_owner?: boolean
}

function refLabel(ref: { title?: string; type?: string }): string {
  switch (ref.type) {
    case "materi": return `Materi: ${ref.title ?? ""}`
    case "soal": return `Soal: ${ref.title ?? ""}`
    case "jawaban": return `Jawaban: ${ref.title ?? ""}`
    default: return ref.title ?? ""
  }
}

// GalleryBrowser: grid pemakaian gambar per subject. Dipakai halaman admin
// (semua subject) dan teacher (cuma subject yang dia ajar). Pemanggil yang
// menentukan scope subject-nya; component tinggal render.
export function GalleryBrowser({
  subjects,
  heading = "Galeri Gambar",
  description = "Pantau pemakaian gambar di materi & paket soal. Gambar yang dipakai tidak bisa dihapus.",
}: {
  subjects: SubjectOption[]
  heading?: string
  description?: string
}) {
  const qc = useQueryClient()
  const [subjectId, setSubjectId] = useState("")
  const [expanded, setExpanded] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UsageImage | null>(null)

  const subjectOptions = subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }))

  const queryKey = subjectId
    ? getAdminSubjectsBySubjectIdImagesUsageQueryKey({ path: { subject_id: Number(subjectId) } })
    : []

  const { data: images = [], isLoading } = useQuery({
    ...getAdminSubjectsBySubjectIdImagesUsageOptions({
      path: { subject_id: Number(subjectId) },
    }),
    enabled: !!subjectId,
  } as any)
  const usageImages = images as unknown as UsageImage[]

  const { mutate: deleteImage, isPending: deleting } = useMutation({
    ...deleteAdminSubjectsBySubjectIdImagesByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey })
      toast.success("Gambar berhasil dihapus")
    },
    onError: () => toast.error("Gagal menghapus gambar"),
  })

  const requestDelete = (img: UsageImage) => {
    if ((img.usage_count ?? 0) > 0) {
      toast.error(`Gambar dipakai di ${img.usage_count} konten — hapus dulu referensinya.`)
      return
    }
    setDeleteTarget(img)
  }

  const confirmDelete = () => {
    if (!deleteTarget?.id || !subjectId) return
    deleteImage({ path: { subject_id: Number(subjectId), id: deleteTarget.id } })
    setDeleteTarget(null)
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="space-y-2">
          <Label>Mata Pelajaran</Label>
          <Select items={subjectOptions} value={subjectId} onValueChange={(v) => { setSubjectId(v ?? ""); setExpanded(null) }}>
            <SelectTrigger className="w-full sm:max-w-xs">
              <SelectValue placeholder={subjectOptions.length ? "Pilih subjek" : "Tidak ada subjek"} />
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
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : usageImages.length === 0 ? (
              <Empty className="py-10">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><ImageOff /></EmptyMedia>
                  <EmptyTitle>Tidak ada gambar di subject ini</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {usageImages.map((img) => (
                  <div key={img.id} className="overflow-hidden rounded-2xl border">
                    <div className="relative">
                      <button
                        type="button"
                        className="block w-full text-left"
                        onClick={() => setExpanded(expanded === img.id ? null : (img.id ?? null))}
                      >
                        <img src={img.url} alt={img.title} className="h-32 w-full object-cover" />
                      </button>
                      {img.is_owner && (
                        <Button
                          variant="outline"
                          size="sm"
                          title={(img.usage_count ?? 0) > 0 ? `Dipakai di ${img.usage_count} konten` : "Hapus gambar"}
                          className="absolute right-2 top-2 h-7 w-7 bg-background/80 p-0 text-destructive hover:bg-background"
                          disabled={deleting || (img.usage_count ?? 0) > 0}
                          onClick={() => requestDelete(img)}
                        >
                          {deleting && <Spinner className="h-3 w-3" />}
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1 p-3">
                      <p className="truncate text-sm font-medium">{img.title || "Tanpa judul"}</p>
                      <p className={`text-xs ${(img.usage_count ?? 0) > 0 ? "text-primary" : "text-muted-foreground"}`}>
                        Dipakai di {img.usage_count ?? 0} konten
                      </p>
                    </div>

                    {expanded === img.id && (
                      <div className="border-t bg-muted/30 px-3 py-2">
                        {(img.used_in ?? []).length > 0 ? (
                          <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
                            {(img.used_in ?? []).map((m) => (
                              <li key={m.id}>{refLabel(m)}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground">Tidak dipakai di konten mana pun.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Gambar</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus gambar{deleteTarget?.title ? ` “${deleteTarget.title}”` : " ini"}? Aksi ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting && <Spinner className="h-3 w-3" />}
              Hapus
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
