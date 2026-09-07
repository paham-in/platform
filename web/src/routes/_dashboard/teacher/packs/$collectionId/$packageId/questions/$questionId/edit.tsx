import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminQuestionPackagesByIdQuestionsOptions, getAdminQuestionPackagesQueryKey, patchAdminQuestionPackagesByIdQuestionsByQidMutation } from "@/lib/api/@tanstack/react-query.gen";
import type { QuestionbankQuestionResponse } from "@/lib/api/types.gen";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";

import { toast } from "sonner";
import { isEmptyContent } from "@/lib/html";

const OPTION_LABELS = ["A", "B", "C", "D", "E"]

const questionFormSchema = z.object({
  question: z.string(),
  answers: z.array(z.object({ content: z.string(), is_correct: z.boolean() })).min(2).max(5),
  explanation: z.string(),
}).superRefine((v, ctx) => {
  if (isEmptyContent(v.question)) {
    ctx.addIssue({ code: "custom", path: ["question"], message: "Isi pertanyaan dulu" })
  }
  if (v.answers.filter((a) => !isEmptyContent(a.content)).length < 2) {
    ctx.addIssue({ code: "custom", path: ["answers"], message: "Minimal 2 opsi jawaban yang terisi" })
  }
})

type QuestionFormValues = z.infer<typeof questionFormSchema>

function toFormDefaults(question: QuestionbankQuestionResponse): QuestionFormValues {
  return {
    question: question.question ?? "",
    answers: [...(question.answers ?? []).map((a) => ({ content: a.content ?? "", is_correct: a.is_correct ?? false })), { content: "", is_correct: false }, { content: "", is_correct: false }, { content: "", is_correct: false }, { content: "", is_correct: false }].slice(0, 4),
    explanation: question.explanation ?? "",
  }
}

function EditQuestionForm({ question, packageId, collectionId }: { question: QuestionbankQuestionResponse; packageId: string; collectionId: string }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    mode: "onTouched",
    defaultValues: toFormDefaults(question),
  })
  const { fields, append } = useFieldArray({ control: form.control, name: "answers" })
  const answersError = form.formState.errors.answers?.message
  const [uploadingEditors, setUploadingEditors] = useState(0)

  const { mutate: updateQuestion, isPending } = useMutation({
    ...patchAdminQuestionPackagesByIdQuestionsByQidMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionPackagesQueryKey() })
      toast.success("Soal berhasil diubah")
      navigate({ to: "/teacher/packs/$collectionId/$packageId", params: { collectionId, packageId }, replace: true })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal mengubah soal"),
  })

  const save = (v: QuestionFormValues) => {
    updateQuestion({
      path: { id: Number(packageId), qid: question.id! },
      body: {
        question: v.question,
        answers: v.answers.filter((a) => !isEmptyContent(a.content)),
        explanation: v.explanation,
      },
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 md:space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Edit Soal</h1>

      <Controller
        name="question"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Pertanyaan</FieldLabel>
            <TiptapEditor
              content={field.value}
              onChange={field.onChange}
              tempFolder="quiz_questions"
              onUploadingChange={(u) => setUploadingEditors((n) => n + (u ? 1 : -1))}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="space-y-3">
        <FieldLabel>Opsi Jawaban</FieldLabel>
        {fields.map((item, i) => (
          <div key={item.id} className="flex items-start gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium">{OPTION_LABELS[i]}</span>
            <div className="flex-1 rounded-md border">
              <Controller
                name={`answers.${i}.content` as const}
                control={form.control}
                render={({ field }) => (
                  <TiptapEditor
                    content={field.value}
                    onChange={field.onChange}
                    tempFolder="quiz_answers"
                    onUploadingChange={(u) => setUploadingEditors((n) => n + (u ? 1 : -1))}
                  />
                )}
              />
            </div>
            <Controller
              name={`answers.${i}.is_correct` as const}
              control={form.control}
              render={({ field }) => (
                <label className="mt-1 flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  Benar
                </label>
              )}
            />
          </div>
        ))}
        {typeof answersError === "string" && <FieldError errors={[{ message: answersError }]} />}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (fields.length < 5) append({ content: "", is_correct: false })
          }}
          disabled={fields.length >= 5}
        >
          + Tambah Opsi
        </Button>
      </div>

      <Controller
        name="explanation"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Pembahasan (opsional)</FieldLabel>
            <TiptapEditor
              content={field.value}
              onChange={field.onChange}
              tempFolder="quiz_questions"
              onUploadingChange={(u) => setUploadingEditors((n) => n + (u ? 1 : -1))}
            />
          </Field>
        )}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={() => navigate({ to: "/teacher/packs/$collectionId/$packageId", params: { collectionId, packageId }, replace: true })}>Batal</Button>
        <Button
          onClick={form.handleSubmit(save)}
          disabled={isPending || uploadingEditors > 0}
        >
          {isPending && <Spinner />}
          {uploadingEditors > 0 ? "Mengupload gambar..." : "Simpan"}
        </Button>
      </div>
    </div>
  )
}

function EditQuestion() {
  const { collectionId, packageId, questionId } = useParams({ from: "/_dashboard/teacher/packs/$collectionId/$packageId/questions/$questionId/edit" })
  const { data: questions = [], isLoading } = useQuery(getAdminQuestionPackagesByIdQuestionsOptions({ path: { id: Number(packageId) } }))

  const question = questions.find((q) => q.id === Number(questionId))

  if (isLoading) {
    return (
      <main className="p-4 md:p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </main>
    )
  }

  if (!question) {
    return (
      <main className="p-4 md:p-6">
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-muted-foreground">Soal tidak ditemukan</p>
        </div>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-6">
      <EditQuestionForm key={question.id} question={question} packageId={packageId} collectionId={collectionId} />
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/packs/$collectionId/$packageId/questions/$questionId/edit")({
  component: EditQuestion,
})
