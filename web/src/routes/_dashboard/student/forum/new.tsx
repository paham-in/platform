import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { TiptapEditor } from "@/components/ui/tiptap-editor"
import { useCanPostForum } from "@/hooks/use-can-post-forum"
import { usePageTitle } from "@/components/page-title"
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
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { Sparkles } from "lucide-react"

function NewQuestion() {
  usePageTitle("Pertanyaan Baru")
  const qc = useQueryClient()
  const navigate = useNavigate()
  const canPost = useCanPostForum()
  const locked = canPost === false
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const [content, setContent] = useState("")
  const [subjectId, setSubjectId] = useState("")

  const subjectOptions = subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }))
  const [editorUploading, setEditorUploading] = useState(false)

  const { mutate: createQuestion, isPending } = useMutation({
    ...postQuestionsMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getQuestionsQueryKey() })
      toast.success("Pertanyaan berhasil dibuat")
      navigate({ to: "/student/forum" })
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

  if (locked) {
    return (
      <main className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-4 md:space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h1 className="text-lg font-bold tracking-tight">Butuh langganan untuk bertanya</h1>
                <p className="text-sm text-muted-foreground">
                  Kamu tetap bisa membaca dan mencari pertanyaan tanpa berlangganan. Untuk mengajukan
                  pertanyaan baru, berlangganan konten atau les privat dulu yuk.
                </p>
              </div>
              <Button onClick={() => navigate({ to: "/student/subscribe" })}>
                <Sparkles className="mr-1 h-4 w-4" /> Lihat Langganan
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-6">
      <div className="mx-auto max-w-2xl space-y-4 md:space-y-6">
<h1 className="text-2xl font-bold tracking-tight">Pertanyaan Baru</h1>

        <div className="space-y-2">
          <Label>Subjek (wajib)</Label>
          <Select items={subjectOptions} value={subjectId} onValueChange={(v) => setSubjectId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih subjek" />
            </SelectTrigger>
            <SelectContent>
              {subjectOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Isi Pertanyaan</Label>
          <p className="text-xs text-muted-foreground">
            Tarik & lepas gambar ke editor untuk mengunggahnya langsung.
          </p>
          <TiptapEditor content={content} onChange={setContent} tempFolder="forum_questions" onUploadingChange={setEditorUploading} />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate({ to: "/student/forum" })}>Batal</Button>
          <Button onClick={submit} disabled={!content || !subjectId || isPending || editorUploading}>
            {(isPending || editorUploading) && <Spinner />}
            {editorUploading ? "Mengupload gambar..." : "Kirim"}
          </Button>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/forum/new")({
  component: NewQuestion,
})
