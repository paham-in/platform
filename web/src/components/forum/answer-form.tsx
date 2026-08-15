import { useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ImagePlus, Send, X } from "lucide-react"
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
import { postQuestionsByQuestionIdAnswersByAnswerIdImages } from "@/lib/api/sdk.gen"

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
  const [images, setImages] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { mutate: submitAnswer, isPending } = useMutation({
    ...postQuestionsByQuestionIdAnswersMutation(),
    onSuccess: async (data) => {
      // upload gambar pendukung setelah jawaban terbuat (butuh answer_id)
      if (images.length > 0 && data?.id) {
        setUploading(true)
        for (const file of images) {
          try {
            await postQuestionsByQuestionIdAnswersByAnswerIdImages({
              path: { question_id: questionId, answer_id: data.id },
              body: { image: file },
            })
          } catch {
            toast.error(`Gagal upload ${file.name}`)
          }
        }
        setUploading(false)
      }
      qc.invalidateQueries({
        queryKey: getQuestionsByQuestionIdAnswersQueryKey({ path: { question_id: questionId } }),
      })
      setContent("")
      setVideoUrl("")
      setImages([])
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

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const maxSize = 5 * 1024 * 1024
    const valid: File[] = []
    for (const f of files) {
      if (f.size > maxSize) {
        toast.error(`${f.name} terlalu besar (maks 5MB)`)
      } else {
        valid.push(f)
      }
    }
    setImages((prev) => [...prev, ...valid])
  }

  const activeContent = mode === "text" ? content.trim() : videoUrl.trim()
  const canSubmit = !!activeContent && !isPending && !uploading
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

          {/* Gambar pendukung (opsional) */}
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              Gambar pendukung (opsional) — JPG, PNG, GIF, WebP. Maks 5MB per file.
            </p>
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
                disabled={uploading}
                className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
              >
                <ImagePlus className="h-6 w-6" />
              </button>
            </div>
          </div>
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
          {isPending || uploading ? <Spinner /> : <Send className="mr-1 h-4 w-4" />}
          {uploading ? "Mengupload gambar..." : "Kirim Jawaban"}
        </Button>
      </div>
    </section>
  )
}