import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { TiptapEditor } from "@/components/ui/tiptap-editor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getSubjectsOptions,
  postQuestionsMutation,
  getQuestionsQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { ArrowLeft, Loader2, ImagePlus, X } from "lucide-react"

function NewQuestion() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const [content, setContent] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { mutate: createQuestion, isPending } = useMutation({
    ...postQuestionsMutation(),
    onSuccess: async (data) => {
      const questionId = data?.id
      if (!questionId) {
        qc.invalidateQueries({ queryKey: getQuestionsQueryKey() })
        toast.success("Pertanyaan berhasil dibuat")
        navigate({ to: "/forum" })
        return
      }

      // upload images
      if (images.length > 0) {
        setUploading(true)
        let ok = true
        for (const file of images) {
          const form = new FormData()
          form.append("image", file)
          const res = await fetch(`http://localhost:8080/questions/${questionId}/images`, {
            method: "POST",
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            body: form,
          })
          if (!res.ok) {
            ok = false
            toast.error(`Gagal upload ${file.name}`)
          }
        }
        setUploading(false)
        if (ok) toast.success("Semua gambar berhasil diupload")
      }

      qc.invalidateQueries({ queryKey: getQuestionsQueryKey() })
      navigate({ to: "/forum" })
    },
    onError: (err: any) => {
      toast.error(err?.error || err?.message || "Gagal membuat pertanyaan")
    },
  })

  const submit = () => {
    createQuestion({
      body: {
        content,
        subject_id: subjectId ? Number(subjectId) : undefined,
      },
    })
  }

  const addFiles = (files: FileList | null) => {
    if (!files) return
    setImages((prev) => [...prev, ...Array.from(files)])
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          to="/forum"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Forum
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">Pertanyaan Baru</h1>

        <div className="space-y-2">
          <Label>Subjek (opsional)</Label>
          <Select value={subjectId} onValueChange={(v) => setSubjectId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih subjek" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Isi Pertanyaan</Label>
          <TiptapEditor content={content} onChange={setContent} />
        </div>

        {/* Images */}
        <div className="space-y-2">
          <Label>Gambar Pendukung (opsional)</Label>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <div className="flex flex-wrap gap-2">
            {images.map((f, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border">
                <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-xs"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:bg-muted/50"
            >
              <ImagePlus className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/forum"><Button variant="outline">Batal</Button></Link>
          <Button onClick={submit} disabled={!content || isPending || uploading}>
            {(isPending || uploading) && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {uploading ? "Mengupload gambar..." : "Kirim"}
          </Button>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/forum/new")({
  component: NewQuestion,
})
