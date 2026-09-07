import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  postAdminClassesMutation,
  patchAdminClassesByIdMutation,
  getAdminClassesQueryKey,
  getAdminProgramsQueryKey,
  postAdminProgramsByIdClassesMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import type { ClassClassResponse } from "@/lib/api/types.gen"

interface ClassFormDialogProps {
  class?: ClassClassResponse
  /** Jika diisi, kelas baru otomatis masuk program ini setelah dibuat. */
  programId?: number
  onClose: () => void
}

export function ClassFormDialog({ class: cls, programId, onClose }: ClassFormDialogProps) {
  const qc = useQueryClient()
  const isEditing = Boolean(cls)
  const form = useForm<{ name: string }>({
    resolver: zodResolver(z.object({ name: z.string().trim().min(1, "Isi nama kelas dulu") })),
    mode: "onTouched",
    defaultValues: { name: cls?.name ?? "" },
  })

  const { mutate: assign, isPending: assigning } = useMutation({
    ...postAdminProgramsByIdClassesMutation(),
    onSuccess: () => {
      toast.success("Kelas berhasil ditambahkan ke program")
      qc.invalidateQueries({ queryKey: getAdminClassesQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminProgramsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal menambahkan kelas ke program"),
  })

  const { mutate: createClass, isPending: creating } = useMutation({
    ...postAdminClassesMutation(),
    onSuccess: (data) => {
      if (programId && data?.id) {
        assign({ path: { id: programId }, body: { class_id: data.id } })
      } else {
        toast.success("Kelas berhasil ditambahkan")
        qc.invalidateQueries({ queryKey: getAdminClassesQueryKey() })
        onClose()
      }
    },
    onError: (err: any) => toast.error(err.error || "Gagal menambahkan kelas"),
  })

  const { mutate: updateClass, isPending: updating } = useMutation({
    ...patchAdminClassesByIdMutation(),
    onSuccess: () => {
      toast.success("Kelas berhasil diubah")
      qc.invalidateQueries({ queryKey: getAdminClassesQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal mengubah kelas"),
  })

  const isPending = creating || updating || assigning

  const save = (v: { name: string }) => {
    if (isEditing && cls) {
      updateClass({ path: { id: cls.id! }, body: { name: v.name } })
    } else {
      createClass({ body: { name: v.name } })
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Kelas" : "Tambah Kelas"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="name">Nama</FieldLabel>
                <Input
                  id="name"
                  {...field}
                  placeholder="Nama kelas (cth: Kelas 10 IPA)"
                  aria-invalid={fieldState.invalid}
                autoComplete="off"/>
                <FieldDescription>
                  Harga kelas diatur di Pengaturan → Harga per Kelas.
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={form.handleSubmit(save)} disabled={isPending}>
              {isPending && <Spinner />}
              {isEditing ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
