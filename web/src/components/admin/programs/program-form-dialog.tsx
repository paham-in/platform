import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  postAdminProgramsMutation,
  patchAdminProgramsByIdMutation,
  getAdminProgramsQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import type { ProgramProgramResponse } from "@/lib/api/types.gen"

interface ProgramFormDialogProps {
  program?: ProgramProgramResponse
  onClose: () => void
}

export function ProgramFormDialog({ program, onClose }: ProgramFormDialogProps) {
  const qc = useQueryClient()
  const isEditing = Boolean(program)
  const form = useForm<{ name: string; description: string }>({
    resolver: zodResolver(z.object({
      name: z.string().trim().min(1, "Isi nama program dulu"),
      description: z.string(),
    })),
    mode: "onTouched",
    defaultValues: { name: program?.name ?? "", description: program?.description ?? "" },
  })

  const { mutate: createProgram, isPending: creating } = useMutation({
    ...postAdminProgramsMutation(),
    onSuccess: () => {
      toast.success("Program berhasil ditambahkan")
      qc.invalidateQueries({ queryKey: getAdminProgramsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal menambahkan program"),
  })

  const { mutate: updateProgram, isPending: updating } = useMutation({
    ...patchAdminProgramsByIdMutation(),
    onSuccess: () => {
      toast.success("Program berhasil diubah")
      qc.invalidateQueries({ queryKey: getAdminProgramsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal mengubah program"),
  })

  const isPending = creating || updating

  const save = (v: { name: string; description: string }) => {
    const body = { name: v.name, description: v.description.trim() || undefined }
    if (isEditing && program) {
      updateProgram({ path: { id: program.id! }, body })
    } else {
      createProgram({ body })
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Program" : "Tambah Program"}</DialogTitle>
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
                  placeholder="Nama program (cth: Sekolah, UTBK, Kedinasan)"
                  aria-invalid={fieldState.invalid}
                autoComplete="off"/>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="description"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="desc">Deskripsi</FieldLabel>
                <Input
                  id="desc"
                  {...field}
                  placeholder="Deskripsi singkat (opsional)"
                autoComplete="off"/>
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
