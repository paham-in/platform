import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { DocxImportDialog } from "@/components/ui/docx-import-dialog";
import { usePageTitle } from "@/components/page-title";
import {
  getAdminMaterialsQueryKey,
  postAdminMaterialsMutation,
} from "@/lib/api/@tanstack/react-query.gen";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { z } from "zod";
import { FileText, Type, Video } from "lucide-react";
import { toast } from "sonner";
import { useDraft } from "@/lib/use-draft";
import { extractYoutubeId, isValidYoutubeUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import { useDialogBack } from "@/lib/hooks/use-dialog-back";

const newMaterialSearchSchema = z.object({
  modal: z.string().optional(),
});

const materialFormSchema = z.object({
  title: z.string().trim().min(1, "Isi judul dulu"),
  type: z.enum(["text", "video"]),
  content: z.string(),
  videoUrl: z.string(),
  isFree: z.boolean(),
}).superRefine((v, ctx) => {
  if (v.type === "video" && !v.videoUrl.trim()) {
    ctx.addIssue({ code: "custom", path: ["videoUrl"], message: "Isi URL YouTube dulu" })
  }
});

type MaterialFormValues = z.infer<typeof materialFormSchema>;

const typeOptions = [
  {
    value: "text",
    label: "Teks",
    description: "Tulis materi dengan editor teks",
    icon: Type,
  },
  {
    value: "video",
    label: "Video",
    description: "Tautkan video YouTube",
    icon: Video,
  },
] as const;

function NewMaterial() {
  usePageTitle("Tambah Materi");
  const { chapterId } = useParams({ from: "/_dashboard/teacher/chapters/$chapterId/materials/new" });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { modal } = Route.useSearch();
  const { openModal, closeModal } = useDialogBack();

  const { draft, hasDraft, restored, debouncedSave, clear, restore, discard } = useDraft();

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    mode: "onTouched",
    defaultValues: { title: "", type: "text", content: "", videoUrl: "", isFree: true },
  });
  const { setValue, reset, getValues } = form;
  const type = form.watch("type");
  const videoUrl = form.watch("videoUrl");
  const [editorUploading, setEditorUploading] = useState(false);

  // auto-buka dialog draft kalau ada draft tersimpan
  useEffect(() => {
    if (hasDraft && !restored && modal !== "draft") openModal("draft");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDraft, restored]);

  // autosave on change
  useEffect(() => {
    const sub = form.watch((v) => {
      if (!v.title && !v.content && !v.videoUrl) return;
      debouncedSave({ title: v.title ?? "", content: v.content ?? "", classId: "", subjectId: "", chapterId, type: v.type ?? "text", videoUrl: v.videoUrl ?? "", isFree: v.isFree ?? true });
    });
    return () => sub.unsubscribe();
  }, [form, chapterId, debouncedSave]);

  // warn on tab close
  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      const v = getValues();
      if (v.title || v.content || v.videoUrl) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [getValues]);

  const { mutate: create, isPending } = useMutation({
    ...postAdminMaterialsMutation(),
    onSuccess: () => {
      clear();
      qc.invalidateQueries({ queryKey: getAdminMaterialsQueryKey() });
      toast.success("Materi berhasil dibuat");
      navigate({ to: "/teacher/chapters/$chapterId/materials", params: { chapterId }, replace: true });
    },
    onError: (err: any) => {
      toast.error(err?.error || err?.message || "Gagal membuat materi");
    },
  });

  const save = (v: MaterialFormValues) => {
    create({
      body: {
        title: v.title,
        content: v.type === "text" ? v.content : "",
        video_url: v.type === "video" ? v.videoUrl : "",
        type: v.type,
        chapter_id: Number(chapterId),
        status: "draft",
        is_free: v.isFree,
      },
    });
  };

  const restoreDraft = () => {
    restore();
    if (draft) {
      reset({
        title: draft.title,
        content: draft.content,
        type: (draft.type || "text") as "text" | "video",
        videoUrl: draft.videoUrl || "",
        isFree: draft.isFree ?? true,
      });
    }
    closeModal();
  };

  return (
    <>
      <main className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-4 md:space-y-6">
          <div>
            <h1 className="mb-1 text-2xl font-bold tracking-tight">Tambah Materi</h1>
            <p className="text-sm text-muted-foreground">Buat materi teks atau video untuk bab ini.</p>
          </div>

          <div className="space-y-4 md:space-y-6">
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Judul</FieldLabel>
                    <Input {...field} placeholder="Judul materi" aria-invalid={fieldState.invalid} autoComplete="off"/>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Type picker */}
              <Controller
                name="type"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Tipe Materi</FieldLabel>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {typeOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          aria-pressed={field.value === opt.value}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                            field.value === opt.value
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border bg-background hover:border-primary/40 hover:bg-muted/50"
                          )}
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <opt.icon className="h-5 w-5 text-primary" />
                          </span>
                          <span>
                            <span className="block font-medium">{opt.label}</span>
                            <span className="block text-xs text-muted-foreground">{opt.description}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </Field>
                )}
              />

              <Controller
                name="isFree"
                control={form.control}
                render={({ field }) => (
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors hover:bg-muted/50">
                    <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                    <span>
                      <span className="block font-medium">Materi gratis</span>
                      <span className="block text-xs text-muted-foreground">
                        {field.value ? "Bisa diakses semua user tanpa berlangganan" : "Hanya untuk murid yang berlangganan"}
                      </span>
                    </span>
                  </label>
                )}
              />

              {type === "text" ? (
                <Controller
                  name="content"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <div className="flex items-center justify-between">
                        <FieldLabel>Konten</FieldLabel>
                        <Button variant="outline" size="sm" type="button" onClick={() => openModal("import")}>
                          <FileText className="mr-1 h-4 w-4" /> Import dari Word
                        </Button>
                      </div>
                      <TiptapEditor content={field.value} onChange={field.onChange} tempFolder="materials" onUploadingChange={setEditorUploading} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              ) : (
                <Controller
                  name="videoUrl"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>YouTube URL</FieldLabel>
                      <Input
                        {...field}
                        placeholder="https://www.youtube.com/watch?v=abc123"
                        aria-invalid={fieldState.invalid}
                      autoComplete="off"/>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      {!fieldState.invalid && videoUrl && isValidYoutubeUrl(videoUrl) ? (
                        <div className="overflow-hidden rounded-2xl border">
                          <iframe
                            className="aspect-video w-full"
                            src={`https://www.youtube.com/embed/${extractYoutubeId(videoUrl)}?rel=0&modestbranding=1`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : !fieldState.invalid && videoUrl ? (
                        <FieldDescription>
                          Masukkan URL YouTube yang valid, contoh: youtube.com/watch?v=abc123
                        </FieldDescription>
                      ) : null}
                    </Field>
                  )}
                />
              )}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" type="button" onClick={() => navigate({ to: "/teacher/chapters/$chapterId/materials", params: { chapterId }, replace: true })}>Batal</Button>
              <Button onClick={form.handleSubmit(save)} disabled={isPending || editorUploading}>
                {isPending && <Spinner />}
                {editorUploading ? "Mengupload gambar..." : "Simpan"}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* import docx dialog */}
      <DocxImportDialog
        open={modal === "import"}
        onOpenChange={(o) => !o && closeModal()}
        onImport={(html) => setValue("content", html)}
      />

      {/* draft dialog */}
      {modal === "draft" && (
        <AlertDialog open onOpenChange={(o) => { if (!o) { discard(); closeModal() } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Draft ditemukan</AlertDialogTitle>
              <AlertDialogDescription>
                Ada draft materi yang belum selesai. Lanjutkan atau mulai baru?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Mulai Baru</AlertDialogCancel>
              <AlertDialogAction onClick={restoreDraft}>Lanjutkan</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

export const Route = createFileRoute("/_dashboard/teacher/chapters/$chapterId/materials/new")({
  component: NewMaterial,
  validateSearch: newMaterialSearchSchema,
});
