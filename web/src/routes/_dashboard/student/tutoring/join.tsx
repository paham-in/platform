import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getTutoringGroupsByTokenOptions, postTutoringBookingsMutation, getTutoringBookingsQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import { CalendarIcon, Clock, Loader2, Users } from "lucide-react"
import { toast } from "sonner"

const joinSearchSchema = z.object({
  token: z.string().min(1),
})

function JoinGroup() {
  const { token } = Route.useSearch()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: group, isLoading, isError } = useQuery(getTutoringGroupsByTokenOptions({ path: { token } }))
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

  const { mutate: join, isPending } = useMutation({
    ...postTutoringBookingsMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getTutoringBookingsQueryKey() })
      toast.success("Berhasil bergabung ke grup")
      navigate({ to: "/student/tutoring" })
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal bergabung"),
  })

  const joinGroup = () => {
    if (!group) return
    join({
      body: {
        group_token: token,
        teacher_id: group.teacher_id,
        date: group.date,
        start_time: group.start_time,
        end_time: group.end_time,
      },
    })
  }

  if (isLoading) return <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

  if (isError || !group) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <Users className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground">Grup tidak ditemukan atau link tidak valid.</p>
        <Link to="/student/tutoring"><Button variant="outline">Kembali ke Les Privat</Button></Link>
      </div>
    )
  }

  const weekday = group.date ? new Date(group.date + "T00:00:00").getDay() : 0
  const remaining = (group.max_slots ?? 5) - (group.participants ?? 0)
  const full = remaining <= 0

  return (
    <div className="mx-auto max-w-md space-y-6 py-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <Users className="h-7 w-7 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold">Gabung Les Kelompok</h2>
        <p className="text-sm text-muted-foreground">
          Kamu diundang bergabung ke grup belajar {group.teacher_name ? `dengan ${group.teacher_name}` : "— guru akan ditentukan admin"}.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Guru</span>
            <span className="font-medium">{group.teacher_name || "Menunggu admin"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Jumlah Pertemuan</span>
            <span className="font-medium">{group.session_count}×</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Hari</span>
            <span className="font-medium flex items-center gap-1"><CalendarIcon className="h-4 w-4 text-primary" />{dayNames[weekday]}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Jam</span>
            <span className="font-medium flex items-center gap-1"><Clock className="h-4 w-4 text-primary" />{group.start_time} - {group.end_time}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Mulai</span>
            <span className="font-medium">{group.date}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm text-muted-foreground">Peserta</span>
            <span className={`font-medium ${full ? "text-red-600" : "text-green-600"}`}>{group.participants}/{group.max_slots} {full ? "(penuh)" : `(sisa ${remaining})`}</span>
          </div>
        </CardContent>
      </Card>

      {full ? (
        <p className="text-center text-sm text-red-600">Grup sudah penuh. Kamu tidak bisa bergabung.</p>
      ) : (
        <Button className="w-full" size="lg" onClick={joinGroup} disabled={isPending}>
          {isPending ? <Spinner /> : "Gabung Sekarang"}
        </Button>
      )}
      <p className="text-center text-xs text-muted-foreground">
        Setelah guru menyetujui, kamu akan mendapat invoice untuk pembayaran. Pembayaran dikonfirmasi admin sebelum jadwal pertemuan aktif.
      </p>
    </div>
  )
}

export const Route = createFileRoute("/_dashboard/student/tutoring/join")({
  component: JoinGroup,
  validateSearch: joinSearchSchema,
})
