import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import type { UserAdminListUsersResponse } from "@/lib/api/types.gen"
import {
  postAdminStudentClassEnrollmentsMutation,
  getAdminStudentClassEnrollmentsQueryKey,
  getAdminStudentsOptions,
  getAdminProgramsOptions,
} from "@/lib/api/@tanstack/react-query.gen"

interface GrantClassDialogProps {
  onClose: () => void
}

export function GrantClassDialog({ onClose }: GrantClassDialogProps) {
  const qc = useQueryClient()
  const { data: users = [] } = useQuery(getAdminStudentsOptions())
  const { data: programs = [] } = useQuery(getAdminProgramsOptions())
  const [dateOpen, setDateOpen] = useState(false)
  const form = useForm<{ user_id: string; class_id: string; expiry: string }>({
    resolver: zodResolver(z.object({
      user_id: z.string().min(1, "Pilih murid dulu"),
      class_id: z.string().min(1, "Pilih kelas dulu"),
      expiry: z.string().min(1, "Pilih tanggal kadaluarsa dulu"),
    })),
    mode: "onTouched",
    defaultValues: { user_id: "", class_id: "", expiry: "" },
  })
  const classOptions = programs.flatMap((p) =>
    (p.classes ?? []).map((c) => ({
      label: `${p.name ?? ""}, ${c.name ?? ""}`,
      value: String(c.id),
    }))
  )

  const { mutate: grant, isPending } = useMutation({
    ...postAdminStudentClassEnrollmentsMutation(),
    onSuccess: () => {
      toast.success("Akses berhasil diberikan")
      qc.invalidateQueries({ queryKey: getAdminStudentClassEnrollmentsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal memberikan akses"),
  })

  const save = (v: { user_id: string; class_id: string; expiry: string }) => {
    grant({
      body: {
        user_id: Number(v.user_id),
        class_id: Number(v.class_id),
        expiry: v.expiry,
      },
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Berikan Hak Akses</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Controller
            name="user_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Murid</FieldLabel>
                <Combobox
                  autoHighlight
                  items={users}
                  value={users.find((u) => String(u.id) === field.value)}
                  onValueChange={(v) => field.onChange(v?.id ? String(v.id) : "")}
                  itemToStringLabel={(u) => (u ? `${u.name}, ${u.email}` : "")}
                >
                  <ComboboxInput placeholder={users.length ? "Pilih murid..." : "Tidak ada murid"} />
                  <ComboboxContent>
                    <ComboboxEmpty>Tidak ada murid ditemukan</ComboboxEmpty>
                    <ComboboxList>
                      {(u: UserAdminListUsersResponse) => (
                        <ComboboxItem key={u.id} value={u}>
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate">{u.name}</span>
                            <span className="truncate text-xs text-muted-foreground">{u.email}</span>
                          </span>
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="class_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="class-select">Kelas</FieldLabel>
                <Select
                  items={classOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="class-select" className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder={classOptions.length ? "Pilih kelas..." : "Tidak ada kelas"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="expiry"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Kadaluarsa</FieldLabel>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        data-empty={!field.value}
                        aria-invalid={fieldState.invalid}
                        className="w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                      />
                    }
                  >
                    <CalendarIcon />
                    {field.value ? format(new Date(field.value + "T00:00:00"), "dd MMM yyyy") : <span>Pilih tanggal</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value + "T00:00:00") : undefined}
                      onSelect={(d) => { field.onChange(d ? format(d, "yyyy-MM-dd") : ""); if (d) setDateOpen(false) }}
                    />
                  </PopoverContent>
                </Popover>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={form.handleSubmit(save)} disabled={isPending}>
              {isPending && <Spinner />}
              Berikan Akses
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
