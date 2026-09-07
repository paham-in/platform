import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAdminQuestionPackageCollectionsOptions, getAdminQuestionPackagesQueryKey, getSubjectsOptions, patchAdminQuestionPackagesByIdMutation } from "@/lib/api/@tanstack/react-query.gen"
import type { QuestionpackagePackageResponse } from "@/lib/api/types.gen"

const editPackageSchema = z.object({
  name: z.string().trim().min(1, "Isi nama paket dulu"),
  collection_id: z.string().min(1, "Pilih koleksi dulu"),
  subject_id: z.string().min(1, "Pilih mata pelajaran dulu"),
  description: z.string(),
})

type EditPackageValues = z.infer<typeof editPackageSchema>

interface EditPackageDialogProps {
  pkg: QuestionpackagePackageResponse
  onClose: () => void
}

export function EditPackageDialog({ pkg, onClose }: EditPackageDialogProps) {
  const qc = useQueryClient()
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const { data: collections = [] } = useQuery(getAdminQuestionPackageCollectionsOptions())
  const form = useForm<EditPackageValues>({
    resolver: zodResolver(editPackageSchema),
    mode: "onTouched",
    defaultValues: {
      name: pkg.name ?? "",
      collection_id: pkg.collection_id ? String(pkg.collection_id) : "",
      subject_id: pkg.subject_id ? String(pkg.subject_id) : "",
      description: pkg.description ?? "",
    },
  })

  const subjectOptions = subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }))
  const collectionOptions = collections.map((g) => ({
    label: `${g.name ?? ""}, ${g.class_name ?? "?"}`,
    value: String(g.id),
  }))

  const { mutate: updatePackage, isPending } = useMutation({
    ...patchAdminQuestionPackagesByIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionPackagesQueryKey() })
      toast.success("Paket soal berhasil diubah")
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || "Gagal mengubah paket"),
  })

  const save = (v: EditPackageValues) => {
    updatePackage({
      path: { id: pkg.id! },
      body: { name: v.name, description: v.description, subject_id: Number(v.subject_id), collection_id: Number(v.collection_id) },
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Paket Soal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="name">Nama Paket</FieldLabel>
                <Input
                  id="name"
                  {...field}
                  placeholder="Nama paket soal"
                  autoFocus
                  aria-invalid={fieldState.invalid}
                autoComplete="off"/>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="collection_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="collection">Koleksi Paket Soal</FieldLabel>
                <Select items={collectionOptions} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="collection" className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Pilih koleksi (kelas)" />
                  </SelectTrigger>
                  <SelectContent>
                    {collectionOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="subject_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="subject">Mata Pelajaran</FieldLabel>
                <Select items={subjectOptions} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="subject" className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Pilih mata pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="description"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="desc">Deskripsi (opsional)</FieldLabel>
                <Textarea
                  id="desc"
                  {...field}
                  placeholder="Deskripsi paket..."
                  className="min-h-[80px]"
                autoComplete="off"/>
              </Field>
            )}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={form.handleSubmit(save)} disabled={isPending}>
            {isPending && <Spinner />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
