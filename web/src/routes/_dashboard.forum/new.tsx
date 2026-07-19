import { useState } from "react"
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
import { ArrowLeft, Loader2 } from "lucide-react"

function NewQuestion() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const [content, setContent] = useState("")
  const [subjectId, setSubjectId] = useState("")

  const { mutate: createQuestion, isPending } = useMutation({
    ...postQuestionsMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getQuestionsQueryKey() })
      toast.success("Pertanyaan berhasil dibuat")
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

        <div className="flex justify-end gap-3">
          <Link to="/forum"><Button variant="outline">Batal</Button></Link>
          <Button onClick={submit} disabled={!content || isPending}>
            {isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Kirim
          </Button>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/forum/new")({
  component: NewQuestion,
})
