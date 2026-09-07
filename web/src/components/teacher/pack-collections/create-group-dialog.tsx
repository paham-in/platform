import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAdminClassesOptions, getAdminQuestionPackageCollectionsQueryKey, postAdminQuestionPackageCollectionsMutation } from "@/lib/api/@tanstack/react-query.gen"

const collectionFormSchema = z.object({
  name: z.string().trim().min(1, "Isi nama koleksi dulu"),
  class_id: z.string().min(1, "Pilih kelas dulu"),
  description: z.string(),
  is_free: z.boolean(),
})

type CollectionFormValues = z.infer<typeof collectionFormSchema>

interface CreateCollectionDialogProps {
  onClose: () => void
}

export function CreateCollectionDialog({ onClose }: CreateCollectionDialogProps) {
  const qc = useQueryClient()
  const { data: classes = [] } = useQuery(getAdminClassesOptions())
  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    mode: "onTouched",
    defaultValues: { name: "", class_id: "", description: "", is_free: false },
  })

  const classOptions = classes.map((c) => ({ label: c.name ?? "", value: String(c.id) }))

  const { mutate: createCollection, isPending } = useMutation({
    ...postAdminQuestionPackageCollectionsMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getAdminQuestionPackageCollectionsQueryKey() })
      toast.success("Koleksi paket soal berhasil ditambahkan")
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menambah koleksi"),
  })

  const save = (v: CollectionFormValues) => {
    createCollection({ body: { name: v.name, description: v.description, class_id: Number(v.class_id), is_free: v.is_free } })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tambah Koleksi Paket Soal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="name">Nama Koleksi</FieldLabel>
                <Input
                  id="name"
                  {...field}
                  placeholder="Contoh: UTS 1"
                  autoFocus
                  aria-invalid={fieldState.invalid}
                autoComplete="off"/>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="class_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="class">Kelas</FieldLabel>
                <Select items={classOptions} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="class" className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((opt) => (
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
                  placeholder="Deskripsi koleksi..."
                  className="min-h-[80px]"
                autoComplete="off"/>
              </Field>
            )}
          />

          <Controller
            name="is_free"
            control={form.control}
            render={({ field }) => (
              <label className="flex items-center gap-3 rounded-lg border p-4">
                <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                <div>
                  <p className="font-medium">Koleksi gratis</p>
                  <p className="text-xs text-muted-foreground">
                    {field.value ? "Bisa diakses semua user tanpa berlangganan" : "Hanya untuk murid yang berlangganan kelas ini"}
                  </p>
                </div>
              </label>
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
