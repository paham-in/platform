import { useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import {
  postAdminSubjectsMutation,
  patchAdminSubjectsByIdMutation,
  getSubjectsQueryKey,
  getAdminProgramsOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import type { SubjectListSubjectsResponse, ClassClassResponse } from "@/lib/api/types.gen"

type ClassOption = Pick<ClassClassResponse, "id" | "name">

interface SubjectFormDialogProps {
  subject?: SubjectListSubjectsResponse
  onClose: () => void
}

const subjectFormSchema = z.object({
  name: z.string().trim().min(1, "Isi nama mata pelajaran dulu"),
  program_id: z.string().min(1, "Pilih program dulu"),
})

type SubjectFormValues = z.infer<typeof subjectFormSchema>

export function SubjectFormDialog({ subject, onClose }: SubjectFormDialogProps) {
  const qc = useQueryClient()
  const comboboxAnchor = useComboboxAnchor()
  const { data: programs = [] } = useQuery(getAdminProgramsOptions())
  const isEditing = Boolean(subject)
  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema),
    mode: "onTouched",
    defaultValues: {
      name: subject?.name ?? "",
      program_id: subject?.program_id ? String(subject.program_id) : "",
    },
  })
  const programId = Number(form.watch("program_id")) || undefined
  const program = programs.find((p) => p.id === programId)
  const classOptions: ClassOption[] = (program?.classes ?? []).map((c) => ({ id: c.id!, name: c.name ?? "" }))
  const [selected, setSelected] = useState<ClassOption[]>([])
  const selectedInitRef = useRef(false)

  // preselect kelas subjek begitu data program selesai dimuat (fetch async)
  useEffect(() => {
    if (!isEditing || selectedInitRef.current || !programs.length) return
    const p = programs.find((x) => x.id === subject?.program_id)
    if (!p) return
    const ids = new Set(subject?.class_ids ?? [])
    setSelected(
      (p.classes ?? [])
        .filter((c) => c.id !== undefined && ids.has(c.id))
        .map((c) => ({ id: c.id!, name: c.name ?? "" })),
    )
    selectedInitRef.current = true
  }, [programs, isEditing, subject])

  const { mutate: createSubject, isPending: creating } = useMutation({
    ...postAdminSubjectsMutation(),
    onSuccess: () => {
      toast.success("Mata pelajaran berhasil ditambahkan")
      qc.invalidateQueries({ queryKey: getSubjectsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal menambahkan mata pelajaran"),
  })

  const { mutate: updateSubject, isPending: updating } = useMutation({
    ...patchAdminSubjectsByIdMutation(),
    onSuccess: () => {
      toast.success("Mata pelajaran berhasil diubah")
      qc.invalidateQueries({ queryKey: getSubjectsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal mengubah mata pelajaran"),
  })

  const isPending = creating || updating
  const programOptions = programs.map((p) => ({ label: p.name ?? "", value: String(p.id) }))

  const save = (v: SubjectFormValues) => {
    const classIds = selected.map((c) => c.id!).filter((id) => id !== undefined)
    if (isEditing && subject) {
      updateSubject({
        path: { id: subject.id! },
        body: { name: v.name || undefined, program_id: Number(v.program_id), class_ids: classIds },
      })
    } else {
      createSubject({ body: { name: v.name || undefined, program_id: Number(v.program_id), class_ids: classIds } })
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}</DialogTitle>
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
                  placeholder="Nama mata pelajaran"
                  aria-invalid={fieldState.invalid}
                autoComplete="off"/>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="program_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="subject-program">Program</FieldLabel>
                <Select items={programOptions} value={field.value} onValueChange={(v) => { field.onChange(v ?? ""); setSelected([]) }}>
                  <SelectTrigger id="subject-program" className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder={programs.length ? "Pilih program..." : "Tidak ada program"} />
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
          <div className="space-y-2">
            <Label>Kelas</Label>
            <Combobox
              multiple
              autoHighlight
              items={classOptions}
              value={selected}
              onValueChange={(next) => setSelected(next ?? [])}
              itemToStringLabel={(c: ClassOption) => c.name ?? ""}
              // items dibuat ulang tiap render (objek baru), jadi default Object.is
              // menganggap item belum terpilih → duplikat. Bandingkan by id.
              isItemEqualToValue={(a, b) => a?.id === b?.id}
              disabled={!programId}
            >
              <ComboboxChips ref={comboboxAnchor} className="w-full">
                <ComboboxValue>
                  {(values: ClassOption[]) => (
                    <>
                      {values.map((c) => (
                        <ComboboxChip key={c.id}>{c.name}</ComboboxChip>
                      ))}
                      <ComboboxChipsInput
                        placeholder={programId ? (classOptions.length ? "Pilih kelas..." : "Belum ada kelas di program ini") : "Pilih program dulu"}
                      />
                    </>
                  )}
                </ComboboxValue>
              </ComboboxChips>
              <ComboboxContent anchor={comboboxAnchor}>
                <ComboboxEmpty>Kelas tidak ditemukan</ComboboxEmpty>
                <ComboboxList>
                  {(c: ClassOption) => (
                    <ComboboxItem key={c.id} value={c}>
                      {c.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
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
