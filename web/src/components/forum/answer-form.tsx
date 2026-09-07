import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { TiptapEditor } from "@/components/ui/tiptap-editor"
import { YoutubeEmbed } from "@/components/ui/youtube-embed"
import { isEmptyContent } from "@/lib/html"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  postQuestionsByQuestionIdAnswersMutation,
  getQuestionsByQuestionIdAnswersQueryKey,
  getMeOptions,
} from "@/lib/api/@tanstack/react-query.gen"

interface AnswerFormProps {
  questionId: string
}

export function AnswerForm({ questionId }: AnswerFormProps) {
  const qc = useQueryClient()
  const { data: me, isLoading } = useQuery(getMeOptions())
  const isTeacher = (me?.roles as string[] | undefined)?.includes("teacher") ?? false
  const form = useForm<{ mode: "text" | "video"; content: string; videoUrl: string }>({
    resolver: zodResolver(z.object({
      mode: z.enum(["text", "video"]),
      content: z.string(),
      videoUrl: z.string(),
    }).superRefine((v, ctx) => {
      if (v.mode === "text" && isEmptyContent(v.content)) {
        ctx.addIssue({ code: "custom", path: ["content"], message: "Tulis jawaban dulu" })
      }
      if (v.mode === "video" && !v.videoUrl.trim()) {
        ctx.addIssue({ code: "custom", path: ["videoUrl"], message: "Isi URL YouTube dulu" })
      }
    })),
    mode: "onTouched",
    defaultValues: { mode: "text", content: "", videoUrl: "" },
  })
  const videoUrl = form.watch("videoUrl")
  const contentError = form.formState.errors.content?.message
  const [editorUploading, setEditorUploading] = useState(false)

  const { mutate: submitAnswer, isPending } = useMutation({
    ...postQuestionsByQuestionIdAnswersMutation(),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: getQuestionsByQuestionIdAnswersQueryKey({ path: { question_id: questionId } }),
      })
      form.reset({ mode: "text", content: "", videoUrl: "" })
      toast.success("Jawaban berhasil dikirim")
    },
    onError: (err: any) => {
      toast.error(err?.error || err?.message || "Gagal mengirim jawaban")
    },
  })

  // hanya guru yang boleh menjawab, admin/student read-only
  if (isLoading) return null
  if (!isTeacher) {
    return (
      <section className="mt-6">
        <p className="text-sm text-muted-foreground">Jawaban hanya bisa diberikan oleh guru.</p>
      </section>
    )
  }

  const submit = (v: { mode: "text" | "video"; content: string; videoUrl: string }) => {
    submitAnswer({
      path: { question_id: questionId },
      body: { content: v.mode === "text" ? v.content : "", video_url: v.mode === "video" ? v.videoUrl : "" },
    })
  }

  return (
    <section className="mt-6 space-y-3">
      <h3 className="text-sm font-semibold">Tulis Jawaban</h3>
      <Controller
        name="mode"
        control={form.control}
        render={({ field }) => (
          <Tabs value={field.value} onValueChange={(v) => field.onChange((v as "text" | "video") ?? "text")}>
            <TabsList>
              <TabsTrigger value="text">Teks</TabsTrigger>
              <TabsTrigger value="video">Video YouTube</TabsTrigger>
            </TabsList>
            <TabsContent value="text">
              <p className="text-xs text-muted-foreground">
                Tarik & lepas gambar ke editor untuk mengunggahnya langsung.
              </p>
              <Controller
                name="content"
                control={form.control}
                render={({ field: contentField }) => (
                  <TiptapEditor
                    content={contentField.value}
                    onChange={contentField.onChange}
                    tempFolder="forum_answers"
                    onUploadingChange={setEditorUploading}
                  />
                )}
              />
              {typeof contentError === "string" && <FieldError errors={[{ message: contentError }]} />}
            </TabsContent>
            <TabsContent value="video">
              <div className="space-y-2">
                <Controller
                  name="videoUrl"
                  control={form.control}
                  render={({ field: urlField, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <Input
                        {...urlField}
                        placeholder="https://www.youtube.com/watch?v=abc123"
                        aria-invalid={fieldState.invalid}
                      autoComplete="off"/>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                {videoUrl && <YoutubeEmbed url={videoUrl} className="mt-2" />}
              </div>
            </TabsContent>
          </Tabs>
        )}
      />
      <div className="flex justify-end">
        <Button onClick={form.handleSubmit(submit)} disabled={isPending || editorUploading}>
          {isPending || editorUploading ? <Spinner /> : <Send className="mr-1 h-4 w-4" />}
          {editorUploading ? "Mengupload gambar..." : "Kirim Jawaban"}
        </Button>
      </div>
    </section>
  )
}