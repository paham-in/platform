import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminQuestionPackagesQueryKey, postAdminQuestionPackagesByIdQuestionsMutation } from "@/lib/api/@tanstack/react-query.gen";
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

function NewQuestion() {
  const { collectionId, packageId } = useParams({ from: "/_dashboard/teacher/packs/$collectionId/$packageId/questions/new" })
  const qc = useQueryClient()
  const navigate = useNavigate()

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    mode: "onTouched",
    defaultValues: {
      question: "",
      answers: [
        { content: "", is_correct: false },
        { content: "", is_correct: false },
        { content: "", is_correct: false },
        { content: "", is_correct: false },
      ],
      explanation: "",
    },
  })
  const { fields, append } = useFieldArray({ control: form.control, name: "answers" })
  const answersError = form.formState.errors.answers?.message
  const [uploadingEditors, setUploadingEditors] = useState(0)

  const { mutate: createQuestion, isPending } = useMutation({
    ...postAdminQuestionPackagesByIdQuestionsMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionPackagesQueryKey() })
      toast.success("Soal berhasil ditambahkan")
      navigate({ to: "/teacher/packs/$collectionId/$packageId", params: { collectionId, packageId } })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menambah soal"),
  })

  const save = (v: QuestionFormValues) => {
    createQuestion({
      path: { id: Number(packageId) },
      body: {
        question: v.question,
        answers: v.answers.filter((a) => !isEmptyContent(a.content)),
        explanation: v.explanation,
      },
    })
  }

  return (
    <main className="p-4 md:p-6">
      <div className="mx-auto max-w-3xl space-y-4 md:space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Tambah Soal</h1>

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
          <Button variant="outline" onClick={() => navigate({ to: "/teacher/packs/$collectionId/$packageId", params: { collectionId, packageId } })}>Batal</Button>
          <Button
            onClick={form.handleSubmit(save)}
            disabled={isPending || uploadingEditors > 0}
          >
            {isPending && <Spinner />}
            {uploadingEditors > 0 ? "Mengupload gambar..." : "Simpan"}
          </Button>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/packs/$collectionId/$packageId/questions/new")({
  component: NewQuestion,
})
