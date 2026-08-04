import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getTutoringAvailabilityOptions, getTutoringAvailabilityQueryKey, postTutoringAvailabilityMutation, deleteTutoringAvailabilityByIdMutation } from "@/lib/api/@tanstack/react-query.gen"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

function TeacherAvailability() {
  const qc = useQueryClient()
  const { data: slots = [], isLoading } = useQuery(getTutoringAvailabilityOptions())
  const [addOpen, setAddOpen] = useState(false)
  const [dayOfWeek, setDayOfWeek] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  const dayOptions = dayNames.map((name, i) => ({ label: name, value: String(i) }))

  const grouped: Record<number, typeof slots> = {}
  slots.forEach((s) => {
    const d = s.day_of_week ?? 0
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(s)
  })

  const { mutate: createSlot, isPending } = useMutation({
    ...postTutoringAvailabilityMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getTutoringAvailabilityQueryKey() })
      setAddOpen(false); setDayOfWeek(""); setStartTime(""); setEndTime("")
      toast.success("Slot berhasil ditambahkan")
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal menambah slot"),
  })

  const { mutate: deleteSlot } = useMutation({
    ...deleteTutoringAvailabilityByIdMutation(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: getTutoringAvailabilityQueryKey() }); setDeleteId(null); toast.success("Slot berhasil dihapus") },
  })

  if (isLoading) return <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

  return (
    <>
      <h2 className="mb-4 text-xl font-semibold">Jadwal Saya</h2>
      <div className="mb-4">
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Tambah Slot</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {slots.length === 0 && <p className="col-span-full py-12 text-center text-muted-foreground">Belum ada jadwal.</p>}
        {[0, 1, 2, 3, 4, 5, 6].map((day) => {
          const daySlots = grouped[day]
          if (!daySlots) return null
          return (
            <Card key={day}>
              <CardHeader className="pb-2"><CardTitle>{dayNames[day]}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {daySlots.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <span>{s.start_time} - {s.end_time}</span>
                    <Button variant="ghost" size="icon-xs" onClick={() => setDeleteId(s.id!)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) setAddOpen(false) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Slot</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Hari</Label>
              <Select items={dayOptions} value={dayOfWeek} onValueChange={(v) => v && setDayOfWeek(v)}>
                <SelectTrigger><SelectValue placeholder="Pilih hari" /></SelectTrigger>
                <SelectContent>
                  {dayOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FieldGroup className="flex-row">
              <Field className="flex-1">
                <FieldLabel>Jam Mulai</FieldLabel>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none" />
              </Field>
              <Field className="flex-1">
                <FieldLabel>Jam Selesai</FieldLabel>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none" />
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button onClick={() => createSlot({ body: { day_of_week: Number(dayOfWeek), start_time: startTime, end_time: endTime } })} disabled={!dayOfWeek || !startTime || !endTime || isPending}>
              {isPending ? "..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deleteId && (
        <AlertDialog open onOpenChange={(o) => !o && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Hapus Slot</AlertDialogTitle><AlertDialogDescription>Yakin hapus slot ini?</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
              <Button variant="destructive" onClick={() => deleteSlot({ path: { id: deleteId } })}>Hapus</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/tutoring/availability")({
  component: TeacherAvailability,
})
