import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError } from "@/components/ui/field"
import { patchAdminUsersByIdEmailMutation, getAdminUsersQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import type { UserAdminListUsersResponse } from "@/lib/api/types.gen"

interface EditEmailDialogProps {
  user: UserAdminListUsersResponse
  onClose: () => void
}

export function EditEmailDialog({ user, onClose }: EditEmailDialogProps) {
  const qc = useQueryClient()
  const form = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: z.string().trim().min(1, "Isi email dulu").email("Format email tidak valid") })),
    mode: "onTouched",
    defaultValues: { email: user.email ?? "" },
  })

  const { mutate: updateEmail, isPending } = useMutation({
    ...patchAdminUsersByIdEmailMutation(),
    onSuccess: () => {
      toast.success("Email berhasil diubah")
      qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal mengubah email"),
  })

  const save = (v: { email: string }) => {
    if (v.email === user.email) {
      toast.info("Tidak ada perubahan")
      return
    }
    updateEmail({ path: { id: user.id! }, body: { email: v.email } })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Ubah Email User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">Email lama: {user.email}</p>
          </div>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Input type="email" {...field} placeholder="email@contoh.com" aria-invalid={fieldState.invalid} autoComplete="off"/>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <FieldDescription>
            Set email dummy = email Google murid supaya login berikutnya otomatis ter-link. Kalau murid sudah punya akun Google di sistem, gunakan "Hubungkan ke Akun Google" di menu aksi.
          </FieldDescription>
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
