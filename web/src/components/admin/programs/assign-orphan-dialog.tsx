import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { postAdminProgramsByIdClassesMutation, getAdminProgramsQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import type { ProgramProgramResponse, ClassClassResponse } from "@/lib/api/types.gen"

interface AssignOrphanDialogProps {
  classItem: ClassClassResponse
  programs: ProgramProgramResponse[]
  onClose: () => void
}

export function AssignOrphanDialog({ classItem, programs, onClose }: AssignOrphanDialogProps) {
  const qc = useQueryClient()
  const programOptions = programs.map((p) => ({ label: p.name ?? "", value: String(p.id) }))
  const form = useForm<{ program_id: string }>({
    resolver: zodResolver(z.object({ program_id: z.string().min(1, "Pilih program tujuan dulu") })),
    mode: "onTouched",
    defaultValues: { program_id: "" },
  })
  const { mutate: assign, isPending } = useMutation({
    ...postAdminProgramsByIdClassesMutation(),
    onSuccess: () => {
      toast.success(`${classItem.name} dimasukkan ke program`)
      qc.invalidateQueries({ queryKey: getAdminProgramsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal memasukkan kelas"),
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Masukkan {classItem.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Controller
            name="program_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="orphan-program">Program tujuan</FieldLabel>
                <Select items={programOptions} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="orphan-program" className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Pilih program..." />
                  </SelectTrigger>
                  <SelectContent>
                    {programOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button
              onClick={form.handleSubmit((v) => assign({ path: { id: Number(v.program_id) }, body: { class_id: classItem.id! } }))}
              disabled={isPending}
            >
              {isPending && <Spinner />}
              Masukkan
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
