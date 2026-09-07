import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { postAdminUsersMutation, getAdminUsersQueryKey } from "@/lib/api/@tanstack/react-query.gen"

const EMAIL_DOMAIN = "pahamin.my.id"

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Isi nama dulu"),
  email: z.string().trim().min(1, "Isi email dulu").refine(
    (v) => !v.includes("@") || /.+@.+\..+/.test(v),
    "Format email tidak valid",
  ),
})

type CreateUserValues = z.infer<typeof createUserSchema>

interface CreateUserDialogProps {
  onClose: () => void
}

export function CreateUserDialog({ onClose }: CreateUserDialogProps) {
  const qc = useQueryClient()
  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "" },
  })

  const { mutate: createUser, isPending } = useMutation({
    ...postAdminUsersMutation(),
    onSuccess: () => {
      toast.success("User berhasil dibuat")
      qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal membuat user"),
  })

  const save = (v: CreateUserValues) => {
    const email = v.email.includes("@") ? v.email : `${v.email}@${EMAIL_DOMAIN}`
    createUser({ body: { name: v.name, email } })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Tambah User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="new-user-name">Nama</FieldLabel>
                <Input id="new-user-name" {...field} placeholder="Nama lengkap" aria-invalid={fieldState.invalid} autoComplete="off"/>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="new-user-email">Email</FieldLabel>
                <Input id="new-user-email" type="text" {...field} placeholder="nama" aria-invalid={fieldState.invalid} autoComplete="off"/>
                <FieldDescription>
                  Cukup isi nama, domain <span className="font-medium">@{EMAIL_DOMAIN}</span> ditambahkan otomatis.
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <p className="text-xs text-muted-foreground">
            Akses kelas diberikan terpisah, otomatis setelah invoice langganan/les lunas, atau manual lewat halaman Hak Akses Murid.
          </p>
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
