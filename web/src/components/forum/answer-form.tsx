import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { TiptapEditor } from "@/components/ui/tiptap-editor"
import { YoutubeEmbed } from "@/components/ui/youtube-embed"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  postQuestionsByQuestionIdAnswersMutation,
  getQuestionsByQuestionIdAnswersQueryKey,
  getMeOptions,
} from "@/lib/api/@tanstack/react-query.gen"

interface AnswerFormProps {
  questionId: number
}

export function AnswerForm({ questionId }: AnswerFormProps) {
  const qc = useQueryClient()
  const { data: me, isLoading } = useQuery(getMeOptions())
  const isTeacher = (me?.roles as string[] | undefined)?.includes("teacher") ?? false
  const [mode, setMode] = useState<"text" | "video">("text")
  const [content, setContent] = useState("")
  const [videoUrl, setVideoUrl] = useState("")

  const { mutate: submitAnswer, isPending } = useMutation({
    ...postQuestionsByQuestionIdAnswersMutation(),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: getQuestionsByQuestionIdAnswersQueryKey({ path: { question_id: questionId } }),
      })
      setContent("")
      setVideoUrl("")
      setMode("text")
      toast.success("Jawaban berhasil dikirim")
    },
    onError: (err: any) => {
      toast.error(err?.error || err?.message || "Gagal mengirim jawaban")
    },
  })

  // hanya guru yang boleh menjawab — admin/student read-only
  if (isLoading) return null
  if (!isTeacher) {
    return (
      <section className="mt-6">
        <p className="text-sm text-muted-foreground">Jawaban hanya bisa diberikan oleh guru.</p>
      </section>
    )
  }

  const activeContent = mode === "text" ? content.trim() : videoUrl.trim()
  const canSubmit = !!activeContent && !isPending
  const submit = () => {
    if (!canSubmit) return
    submitAnswer({
      path: { question_id: questionId },
      body: { content: mode === "text" ? content : "", video_url: mode === "video" ? videoUrl : "" },
    })
  }

  return (
    <section className="mt-6 space-y-3">
      <h3 className="text-sm font-semibold">Tulis Jawaban</h3>
      <Tabs value={mode} onValueChange={(v) => setMode((v as "text" | "video") ?? "text")}>
        <TabsList>
          <TabsTrigger value="text">Teks</TabsTrigger>
          <TabsTrigger value="video">Video YouTube</TabsTrigger>
        </TabsList>
        <TabsContent value="text">
          <TiptapEditor content={content} onChange={setContent} allowImages={false} />
        </TabsContent>
        <TabsContent value="video">
          <div className="space-y-2">
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=abc123"
            />
            {videoUrl && <YoutubeEmbed url={videoUrl} className="mt-2" />}
          </div>
        </TabsContent>
      </Tabs>
      <div className="flex justify-end">
        <Button onClick={submit} disabled={!canSubmit}>
          {isPending ? <Spinner /> : <Send className="mr-1 h-4 w-4" />}
          Kirim Jawaban
        </Button>
      </div>
    </section>
  )
}
