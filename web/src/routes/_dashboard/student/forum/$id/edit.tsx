import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
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
  getQuestionsByIdOptions,
  getQuestionsByIdQueryKey,
  putQuestionsByIdMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { usePageTitle } from "@/components/page-title"

function EditQuestion() {
  usePageTitle("Edit Pertanyaan")
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { id } = useParams({ from: "/_dashboard/student/forum/$id/edit" })
  const questionId = id

  const { data: question, isLoading } = useQuery(getQuestionsByIdOptions({ path: { id: questionId } }))
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const [content, setContent] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [editorUploading, setEditorUploading] = useState(false)

  useEffect(() => {
    if (question?.subject_id != null && subjectId === "") {
      setSubjectId(String(question.subject_id))
    }
  }, [question, subjectId])

  const subjectOptions = subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }))

  const { mutate: updateQuestion, isPending } = useMutation({
    ...putQuestionsByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getQuestionsByIdQueryKey({ path: { id: questionId } }) })
      toast.success("Pertanyaan berhasil diperbarui")
navigate({ to: "/student/forum/$id", params: { id }, replace: true })
    },
    onError: (err: any) => {
      toast.error(err?.error || err?.message || "Gagal memperbarui pertanyaan")
    },
  })

  const submit = () => {
    updateQuestion({
      path: { id: questionId },
      body: { content, subject_id: subjectId ? Number(subjectId) : undefined },
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!question || !question.is_owner) {
    return (
      <main className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <p className="text-muted-foreground">Pertanyaan tidak ditemukan atau bukan milikmu</p>
        </div>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-6">
      <div className="mx-auto max-w-2xl space-y-4 md:space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Edit Pertanyaan</h1>

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
          <TiptapEditor content={question.content ?? ""} onChange={setContent} tempFolder="forum_questions" onUploadingChange={setEditorUploading} />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate({ to: "/student/forum/$id", params: { id }, replace: true })}>Batal</Button>
          <Button onClick={submit} disabled={!content || !subjectId || isPending || editorUploading}>
            {isPending && <Spinner />}
            {editorUploading ? "Mengupload gambar..." : "Simpan Perubahan"}
          </Button>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/forum/$id/edit")({
  component: EditQuestion,
})