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
import { getAdminQuestionPackagesQueryKey, getSubjectsOptions, postAdminQuestionPackagesMutation } from "@/lib/api/@tanstack/react-query.gen"

const createPackageSchema = z.object({
  name: z.string().trim().min(1, "Isi nama paket dulu"),
  subject_id: z.string().min(1, "Pilih mata pelajaran dulu"),
  description: z.string(),
})

type CreatePackageValues = z.infer<typeof createPackageSchema>

interface CreatePackageDialogProps {
  onClose: () => void
  collectionId: number
  collectionName: string
}

export function CreatePackageDialog({ onClose, collectionId, collectionName }: CreatePackageDialogProps) {
  const qc = useQueryClient()
  const { data: subjects = [] } = useQuery(getSubjectsOptions())
  const form = useForm<CreatePackageValues>({
    resolver: zodResolver(createPackageSchema),
    mode: "onTouched",
    defaultValues: { name: "", subject_id: "", description: "" },
  })

  const subjectOptions = subjects.map((s) => ({ label: s.name ?? "", value: String(s.id) }))

  const { mutate: createPackage, isPending } = useMutation({
    ...postAdminQuestionPackagesMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionPackagesQueryKey() })
      toast.success("Paket soal berhasil ditambahkan")
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menambah paket"),
  })

  const save = (v: CreatePackageValues) => {
    // paket baru dibuat draft dulu; dipublish dari daftar saat sudah siap
    createPackage({ body: { name: v.name, description: v.description, subject_id: Number(v.subject_id), collection_id: collectionId, status: "draft" } })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tambah Paket Soal</DialogTitle>
          <p className="text-sm text-muted-foreground">Koleksi: {collectionName}</p>
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
