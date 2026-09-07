import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { TiptapEditor } from "@/components/ui/tiptap-editor"
import { isEmptyContent } from "@/lib/html"
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
import type { ForumQuestionResponse } from "@/lib/api/types.gen"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router"
import { toast } from "sonner"

const forumQuestionSchema = z.object({
  content: z.string().refine((v) => !isEmptyContent(v), "Isi pertanyaan dulu"),
  subject_id: z.string().min(1, "Pilih subjek dulu"),
})

type ForumQuestionValues = z.infer<typeof forumQuestionSchema>

function EditQuestionForm({ question, id }: { question: ForumQuestionResponse; id: string }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const form = useForm<ForumQuestionValues>({
    resolver: zodResolver(forumQuestionSchema),
    mode: "onTouched",
    defaultValues: {
      content: question.content ?? "",
      subject_id: question.subject_id != null ? String(question.subject_id) : "",
    },
  })
  const [editorUploading, setEditorUploading] = useState(false)

  const subjectOptions = subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }))

  const { mutate: updateQuestion, isPending } = useMutation({
    ...putQuestionsByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getQuestionsByIdQueryKey({ path: { id } }) })
      toast.success("Pertanyaan berhasil diperbarui")
      navigate({ to: "/student/forum/$id", params: { id }, replace: true })
    },
    onError: (err: any) => {
      toast.error(err?.error || err?.message || "Gagal memperbarui pertanyaan")
    },
  })

  const submit = (v: ForumQuestionValues) => {
    updateQuestion({
      path: { id },
      body: { content: v.content, subject_id: v.subject_id ? Number(v.subject_id) : undefined },
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 md:space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Edit Pertanyaan</h1>

      <Controller
        name="subject_id"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Subjek (wajib)</FieldLabel>
            <Select items={subjectOptions} value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
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
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="content"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Isi Pertanyaan</FieldLabel>
            <FieldDescription>
              Tarik & lepas gambar ke editor untuk mengunggahnya langsung.
            </FieldDescription>
            <TiptapEditor content={field.value} onChange={field.onChange} tempFolder="forum_questions" onUploadingChange={setEditorUploading} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate({ to: "/student/forum/$id", params: { id }, replace: true })}>Batal</Button>
        <Button onClick={form.handleSubmit(submit)} disabled={isPending || editorUploading}>
          {isPending && <Spinner />}
          {editorUploading ? "Mengupload gambar..." : "Simpan Perubahan"}
        </Button>
      </div>
    </div>
  )
}

function EditQuestion() {
  const { id } = useParams({ from: "/_dashboard/student/forum/$id/edit" })
  const questionId = id

  const { data: question, isLoading } = useQuery(getQuestionsByIdOptions({ path: { id: questionId } }))

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
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
      <EditQuestionForm key={question.id} question={question} id={id} />
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/forum/$id/edit")({
  component: EditQuestion,
})
