import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, Shield, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  getMeOptions,
  getSubjectsOptions,
  getAdminSubjectsBySubjectIdImagesUsageQueryKey,
  getAdminSubjectsBySubjectIdImagesUsageOptions,
  deleteAdminSubjectsBySubjectIdImagesByIdMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import { Link } from "@tanstack/react-router"
import { homeForRoles } from "@/lib/role"

type UsageImage = {
  id?: number
  url?: string
  object_name?: string
  title?: string
  usage_count?: number
  used_in?: { id?: number; title?: string }[]
  is_owner?: boolean
}

function GalleryPage() {
  const qc = useQueryClient()
  const { data: user, isLoading: loadingUser } = useQuery(getMeOptions())
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const [subjectId, setSubjectId] = useState("")
  const [expanded, setExpanded] = useState<number | null>(null)

  const userRoles = (user?.roles as string[]) ?? []
  const isStaff = userRoles.includes("admin") || userRoles.includes("teacher")

  const subjectOptions = subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }))

  const queryKey = subjectId
    ? getAdminSubjectsBySubjectIdImagesUsageQueryKey({ path: { subject_id: Number(subjectId) } })
    : []

  const { data: images = [], isLoading } = useQuery({
    ...getAdminSubjectsBySubjectIdImagesUsageOptions({
      path: { subject_id: Number(subjectId) },
    }),
    enabled: !!subjectId && isStaff,
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

  if (loadingUser) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (!isStaff) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Akses Ditolak</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Halaman ini khusus untuk Admin dan Guru.
          </p>
        </div>
        <Link to={homeForRoles(userRoles)}>
          <Button>Kembali ke Dashboard</Button>
        </Link>
      </main>
    )
  }

  const handleDelete = (img: UsageImage) => {
    if (!img.id || !subjectId) return
    if ((img.usage_count ?? 0) > 0) {
      toast.error(`Gambar dipakai di ${img.usage_count} materi — hapus dulu referensinya.`)
      return
    }
    deleteImage({ path: { subject_id: Number(subjectId), id: img.id } })
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Galeri Gambar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pantau pemakaian gambar di materi. Gambar yang dipakai tidak bisa dihapus.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Mata Pelajaran</Label>
          <Select items={subjectOptions} value={subjectId} onValueChange={(v) => { setSubjectId(v ?? ""); setExpanded(null) }}>
            <SelectTrigger className="w-full sm:max-w-xs">
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
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : usageImages.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada gambar di subject ini.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {usageImages.map((img) => (
                  <div key={img.id} className="overflow-hidden rounded-2xl border">
                    <button
                      type="button"
                      className="block w-full text-left"
                      onClick={() => setExpanded(expanded === img.id ? null : (img.id ?? null))}
                    >
                      <img src={img.url} alt={img.title} className="h-32 w-full object-cover" />
                      <div className="space-y-1 p-3">
                        <p className="truncate text-sm font-medium">{img.title || "Tanpa judul"}</p>
                        <p className={`text-xs ${(img.usage_count ?? 0) > 0 ? "text-primary" : "text-muted-foreground"}`}>
                          Dipakai di {img.usage_count ?? 0} materi
                        </p>
                      </div>
                    </button>

                    {expanded === img.id && (
                      <div className="border-t bg-muted/30 px-3 py-2">
                        {(img.used_in ?? []).length > 0 ? (
                          <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
                            {(img.used_in ?? []).map((m) => (
                              <li key={m.id}>{m.title}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground">Tidak dipakai di materi mana pun.</p>
                        )}
                        <div className="mt-2 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            disabled={deleting || (img.usage_count ?? 0) > 0}
                            onClick={() => handleDelete(img)}
                          >
                            {deleting && <Spinner className="h-3 w-3" />}
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/gallery")({
  component: GalleryPage,
})
