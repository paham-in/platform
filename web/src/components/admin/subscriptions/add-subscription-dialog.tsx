import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { addDays, format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  getAdminInvoicesQueryKey,
  getAdminStudentClassEnrollmentsQueryKey,
  getClassesOptions,
  postAdminInvoicesMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import type { UserAdminListUsersResponse } from "@/lib/api/types.gen"

const fmtRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `${i + 1} bulan`,
  value: String(i + 1),
}))

const addSubscriptionSchema = z.object({
  class_id: z.string().min(1, "Pilih kelas dulu"),
  months: z.coerce.number().min(1).max(12),
  note: z.string(),
})

type AddSubscriptionValues = z.input<typeof addSubscriptionSchema>

export function AddSubscriptionDialog({ user, onClose }: { user: UserAdminListUsersResponse; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: classes = [] } = useQuery(getClassesOptions())
  const form = useForm<AddSubscriptionValues>({
    resolver: zodResolver(addSubscriptionSchema),
    mode: "onTouched",
    defaultValues: { class_id: "", months: 1, note: "" },
  })
  const classId = form.watch("class_id")
  const monthCount = Math.min(12, Math.max(1, Number(form.watch("months")) || 1))
  const selectedClass = classes.find((c) => String(c.id) === classId)
  const pricePerMonth = selectedClass?.content_price ?? 0
  const total = pricePerMonth * monthCount
  const today = new Date()
  const startDate = format(today, "yyyy-MM-dd")
  const endDate = format(addDays(today, 30 * monthCount), "yyyy-MM-dd")
  const defaultNote = selectedClass ? `Langganan ${selectedClass.name} ${monthCount} bulan` : ""

  const { mutate: create, isPending } = useMutation({
    ...postAdminInvoicesMutation(),
    onSuccess: () => {
      toast.success("Invoice langganan dibuat, lunasi untuk mengaktifkan akses")
      qc.invalidateQueries({ queryKey: getAdminInvoicesQueryKey() })
      qc.invalidateQueries({ queryKey: getAdminStudentClassEnrollmentsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal membuat invoice"),
  })

  const handleSave = (v: AddSubscriptionValues) => {
    create({
      body: {
        user_id: user.id!,
        amount: total,
        start_date: startDate,
        end_date: endDate,
        class_id: Number(v.class_id),
        note: v.note.trim() || defaultNote,
      },
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Tambah Langganan</DialogTitle>
          <DialogDescription>{user.name} · akses aktif otomatis setelah invoice lunas.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Controller
            name="class_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Kelas</FieldLabel>
                <Select
                  items={classes.map((c) => ({ label: c.name ?? "", value: String(c.id) }))}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder={classes.length ? "Pilih kelas" : "Tidak ada kelas"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="months"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Durasi</FieldLabel>
                <Select items={monthOptions} value={String(field.value)} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih durasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Controller
            name="note"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Catatan</FieldLabel>
                <Input
                  {...field}
                  placeholder={defaultNote || "Catatan invoice..."}
                  autoComplete="off" />
              </Field>
            )}
          />
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg bg-muted/50 px-4 py-3">
            <div className="text-sm">
              <p className="font-medium">{fmtRp(pricePerMonth)} / bulan × {monthCount} bulan</p>
              <p className="text-xs text-muted-foreground">
                {format(today, "d MMM yyyy", { locale: localeId })} – {format(addDays(today, 30 * monthCount), "d MMM yyyy", { locale: localeId })}
              </p>
            </div>
            <p className="text-lg font-bold tabular-nums">{fmtRp(total)}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={form.handleSubmit(handleSave)} disabled={isPending}>
            {isPending && <Spinner />}
            Buat Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
