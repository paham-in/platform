import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getTutoringBookingsOptions,
  getTutoringEarningsOptions,
  getTutoringEarningsQueryKey,
  getTutoringSessionsOptions,
  getTutoringSessionsQueryKey,
  patchTutoringEarningsTakenMutation,
  patchTutoringSessionsByIdMutation,
  patchTutoringSessionsByIdOvertimeMutation,
  postTutoringSessionsByIdCancelMutation,
  postTutoringSessionsByIdEvidenceMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import type { TutoringListSessionsResponse } from "@/lib/api/types.gen"
import { CalendarX2, Users, UserRound, Upload, Timer, CalendarClock, XCircle, RefreshCw, MoreVertical, CheckCheck, RotateCcw } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { usePageTitle } from "@/components/page-title"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"

const teacherBookingDetailSearchSchema = z.object({
  modal: z.string().optional(),
})

function statusBadge(s: string) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-700",
  }
  const labels: Record<string, string> = {
    pending: "Menunggu", confirmed: "Disetujui", rejected: "Ditolak", cancelled: "Dibatalkan",
  }
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[s] || ""}`}>{labels[s] || s}</span>
}

function sessionStatusBadge(s?: string) {
  const styles: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-700",
    review: "bg-amber-100 text-amber-700",
  }
  const labels: Record<string, string> = {
    scheduled: "Terjadwal", done: "Selesai", cancelled: "Dibatalkan", review: "Menunggu Validasi",
  }
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[s || ""] || ""}`}>{labels[s || ""] || s}</span>
}

const fmtRp = (n?: number) => `Rp ${(n ?? 0).toLocaleString("id-ID")}`

function feeBadge(paid?: boolean) {
  if (paid) return <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Sudah Dibayar</span>
  return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Belum Dibayar</span>
}

function takenBadge(taken?: boolean) {
  if (taken) return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Sudah Diambil</span>
  return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">Belum Diambil</span>
}

function TeacherBookingDetail() {
  const { bookingId } = Route.useParams()
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()
  const qc = useQueryClient()
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery(getTutoringBookingsOptions())
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery(getTutoringSessionsOptions())
  const { data: earnings, isLoading: earningsLoading } = useQuery(getTutoringEarningsOptions())
  const isLoading = bookingsLoading || sessionsLoading || earningsLoading

  const [rescheduleSession, setRescheduleSession] = useState<TutoringListSessionsResponse | null>(null)
  const [reschedDate, setReschedDate] = useState("")
  const [reschedStart, setReschedStart] = useState("")
  const [reschedEnd, setReschedEnd] = useState("")
  const [cancelSession, setCancelSession] = useState<TutoringListSessionsResponse | null>(null)
  const [uploadSession, setUploadSession] = useState<TutoringListSessionsResponse | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [overtimeSession, setOvertimeSession] = useState<TutoringListSessionsResponse | null>(null)
  const [overtimeEnd, setOvertimeEnd] = useState("")
  const openOvertime = (s: TutoringListSessionsResponse) => { setOvertimeSession(s); setOvertimeEnd(s.actual_end_time ?? s.end_time ?? ""); openModal("overtime") }

  useEffect(() => {
    if (modal !== "reschedule") setRescheduleSession(null)
    if (modal !== "cancel") setCancelSession(null)
    if (modal !== "overtime") setOvertimeSession(null)
    if (modal !== "upload") { setUploadSession(null); setUploadFile(null) }
  }, [modal])

  const invalidate = () => qc.invalidateQueries({ queryKey: getTutoringSessionsQueryKey() })

  const upload = useMutation({
    ...postTutoringSessionsByIdEvidenceMutation(),
    onSuccess: () => { toast.success("Bukti terunggah, menunggu validasi admin"); invalidate(); setUploadFile(null); closeModal() },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal upload bukti"),
  })
  const overtime = useMutation({
    ...patchTutoringSessionsByIdOvertimeMutation(),
    onSuccess: () => { toast.success("Overtime tercatat, charge diterapkan saat admin approve"); invalidate(); closeModal() },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal mencatat overtime"),
  })
  const reschedule = useMutation({
    ...patchTutoringSessionsByIdMutation(),
    onSuccess: () => { toast.success("Jadwal sesi diperbarui"); invalidate() },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal reschedule"),
  })
  const cancel = useMutation({
    ...postTutoringSessionsByIdCancelMutation(),
    onSuccess: () => { toast.success("Sesi dibatalkan"); invalidate() },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal membatalkan sesi"),
  })
  const markTaken = useMutation({
    ...patchTutoringEarningsTakenMutation(),
    onSuccess: () => { toast.success("Status fee diperbarui"); qc.invalidateQueries({ queryKey: getTutoringEarningsQueryKey() }) },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal memperbarui status"),
  })

  const booking = bookings.find((b) => b.id === Number(bookingId))
  usePageTitle(booking?.student_name ? `Les ${booking.student_name}` : "Detail Booking")

  if (!isLoading && !booking) {
    return (
      <main className="p-4 md:p-6">
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-muted-foreground">Booking tidak ditemukan</p>
        </div>
      </main>
    )
  }

  const bookingSessions = sessions.filter((s) => s.booking_id === Number(bookingId))

  const earningById = new Map<number, TutoringListSessionsResponse>((earnings?.sessions ?? []).map((s) => [s.id!, s]))
  const bookingEarnings = (earnings?.sessions ?? []).filter((s) => s.booking_id === Number(bookingId))
  const earnTotal = bookingEarnings.reduce((sum, s) => sum + (s.fee_amount ?? 0), 0)
  const earnPaid = bookingEarnings.filter((s) => s.fee_paid).reduce((sum, s) => sum + (s.fee_amount ?? 0), 0)
  const earnTaken = bookingEarnings.filter((s) => s.fee_paid && s.fee_taken).reduce((sum, s) => sum + (s.fee_amount ?? 0), 0)
  const earnAvailable = earnPaid - earnTaken

  const hasActions = (s: TutoringListSessionsResponse) =>
    s.status === "scheduled" || s.status === "review" || (s.status === "done" && !!earningById.get(s.id!)?.fee_paid)

  const sessionMenuItems = (s: TutoringListSessionsResponse) => (
    <>
      {s.status === "scheduled" ? (
        <DropdownMenuItem onClick={() => { setUploadSession(s); setUploadFile(null); openModal("upload") }}>
          <Upload className="h-4 w-4" /> Upload Bukti
        </DropdownMenuItem>
      ) : null}
      {s.status === "review" ? (
        <DropdownMenuItem onClick={() => { setUploadSession(s); setUploadFile(null); openModal("upload") }}>
          <RefreshCw className="h-4 w-4" /> Ganti Bukti
        </DropdownMenuItem>
      ) : null}
      <DropdownMenuItem onClick={() => openOvertime(s)}>
        <Timer className="h-4 w-4" /> Lapor Overtime
      </DropdownMenuItem>
      {s.status === "scheduled" ? (
        <DropdownMenuItem onClick={() => {
          setReschedDate(s.date!)
          setReschedStart(s.start_time!)
          setReschedEnd(s.end_time!)
          setRescheduleSession(s)
          openModal("reschedule")
        }}>
          <CalendarClock className="h-4 w-4" /> Reschedule
        </DropdownMenuItem>
      ) : null}
      {s.status === "scheduled" ? (
        <DropdownMenuItem variant="destructive" onClick={() => { setCancelSession(s); openModal("cancel") }}>
          <XCircle className="h-4 w-4" /> Batalkan Sesi
        </DropdownMenuItem>
      ) : null}
      {(() => {
        const e = earningById.get(s.id!)
        if (s.status !== "done" || !e?.fee_paid) return null
        return e.fee_taken ? (
          <DropdownMenuItem onClick={() => markTaken.mutate({ body: { session_ids: [s.id!], taken: false } })}>
            <RotateCcw className="h-4 w-4" /> Batalkan Tandai
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => markTaken.mutate({ body: { session_ids: [s.id!], taken: true } })}>
            <CheckCheck className="h-4 w-4" /> Tandai Sudah Diambil
          </DropdownMenuItem>
        )
      })()}
    </>
  )

  return (
    <main className="p-4 md:p-6">
      <div className="mb-4">
        {isLoading || !booking ? (
          <>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-56" />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight">{booking.student_name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              {booking.mode === "group"
                ? <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"><Users className="h-3 w-3" /> Kelompok</span>
                : <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700"><UserRound className="h-3 w-3" /> Private</span>}
              {statusBadge(booking.status!)}
              <span>{booking.subject_name ?? "—"} · {booking.date} {booking.start_time}–{booking.end_time} · {bookingSessions.length || booking.session_count || 1}×</span>
            </p>
          </>
        )}
      </div>

      {!isLoading && booking && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Total Fee", value: fmtRp(earnTotal), className: "text-foreground" },
            { label: "Sudah Dibayar", value: fmtRp(earnPaid), className: "text-green-600" },
            { label: "Saldo Tersedia", value: fmtRp(earnAvailable), className: "text-primary" },
            { label: "Sudah Diambil", value: fmtRp(earnTaken), className: "text-muted-foreground" },
          ].map((it) => (
            <Card key={it.label}>
              <CardContent className="flex flex-col gap-0.5 py-3">
                <span className="text-xs text-muted-foreground">{it.label}</span>
                <span className={`text-lg font-bold tabular-nums ${it.className}`}>{it.value}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-2 text-lg font-semibold">Sesi Pertemuan</h2>
      <Card className="hidden gap-0 pt-0 pb-0 md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6">Tanggal</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Bukti</TableHead>
                <TableHead className="pr-6 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-16" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-8 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : bookingSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Empty className="border-0 p-8">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><CalendarX2 /></EmptyMedia>
                        <EmptyTitle>Belum ada sesi terjadwal</EmptyTitle>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : bookingSessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="pl-6 tabular-nums">{s.date}</TableCell>
                  <TableCell className="tabular-nums">
                    {s.start_time} - {s.end_time}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {sessionStatusBadge(s.status)}
                      {s.is_substitute ? (
                        <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-medium text-cyan-700">Pengganti</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {(s.overtime_minutes ?? 0) > 0 ? (
                      <span className="font-medium text-amber-600">
                        +{s.overtime_minutes} mnt · +{s.extra_sessions ?? 0} sesi
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {(() => {
                      const e = earningById.get(s.id!)
                      if (!e) return <span className="text-muted-foreground">—</span>
                      return (
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-medium">{fmtRp(e.fee_amount)}</span>
                          {feeBadge(e.fee_paid)}
                          {e.fee_paid ? takenBadge(e.fee_taken) : null}
                        </div>
                      )
                    })()}
                  </TableCell>
                  <TableCell>
                    {s.evidence_url ? (
                      <a href={s.evidence_url} target="_blank" rel="noreferrer" className="inline-block overflow-hidden rounded-lg border">
                        <img src={s.evidence_url} alt="Bukti kehadiran" className="h-10 w-16 object-cover" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex items-center justify-end">
                      {hasActions(s) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Aksi sesi" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {sessionMenuItems(s)}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0 md:hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : bookingSessions.length === 0 ? (
            <Empty className="p-8">
              <EmptyHeader>
                <EmptyMedia variant="icon"><CalendarX2 /></EmptyMedia>
                <EmptyTitle>Belum ada sesi terjadwal</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="divide-y">
              {bookingSessions.map((s) => (
                <div key={s.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium tabular-nums">{s.date} · {s.start_time} - {s.end_time}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {sessionStatusBadge(s.status)}
                      {s.is_substitute ? (
                        <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-medium text-cyan-700">Pengganti</span>
                      ) : null}
                    </div>
                    {(s.overtime_minutes ?? 0) > 0 && (
                      <p className="mt-1 text-xs font-medium text-amber-600">
                        +{s.overtime_minutes} mnt · +{s.extra_sessions ?? 0} sesi
                      </p>
                    )}
                    {(() => {
                      const e = earningById.get(s.id!)
                      if (!e) return null
                      return (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-medium tabular-nums">{fmtRp(e.fee_amount)}</span>
                          {feeBadge(e.fee_paid)}
                          {e.fee_paid ? takenBadge(e.fee_taken) : null}
                        </div>
                      )
                    })()}
                    {s.evidence_url && (
                      <a href={s.evidence_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-primary hover:underline">
                        Lihat bukti
                      </a>
                    )}
                    </div>
                    {hasActions(s) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Aksi sesi" className="shrink-0" />}>
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {sessionMenuItems(s)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          </CardContent>
      </Card>

      {modal === "upload" && uploadSession && (
      <Dialog open onOpenChange={(o) => { if (!o) closeModal() }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{uploadSession?.evidence_url ? "Ganti Bukti" : "Upload Bukti"}</DialogTitle>
            <DialogDescription>
              Sesi {uploadSession?.date} · {uploadSession?.start_time} - {uploadSession?.end_time}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="evidence-file">Foto Bukti</Label>
            <Input
              id="evidence-file"
              type="file"
              accept="image/*"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Format jpg, png, gif, atau webp, maksimal 5MB.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => closeModal()}>Batal</Button>
            <Button
              disabled={!uploadFile || upload.isPending}
              onClick={() => uploadSession?.id && uploadFile && upload.mutate({ path: { id: uploadSession.id }, body: { image: uploadFile } })}
            >
              {upload.isPending && <Spinner />} Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {modal === "overtime" && overtimeSession && (
      <Dialog open onOpenChange={(o) => { if (!o) closeModal() }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Lapor Overtime</DialogTitle>
            <DialogDescription>
              Sesi {overtimeSession?.date} · {overtimeSession?.start_time} - {overtimeSession?.end_time}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="overtime-end">Jam Selesai Aktual</Label>
            <Input
              id="overtime-end"
              type="time"
              value={overtimeEnd}
              onChange={(e) => setOvertimeEnd(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Toleransi 15 menit, selebihnya dihitung tambahan sesi (90 menit) untuk fee & tagihan. Charge diterapkan saat admin approve.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => closeModal()}>Batal</Button>
            <Button
              disabled={!overtimeEnd || overtime.isPending}
              onClick={() => overtimeSession?.id && overtime.mutate({ path: { id: overtimeSession.id }, body: { actual_end_time: overtimeEnd } })}
            >
              {overtime.isPending && <Spinner />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {modal === "reschedule" && rescheduleSession && (
      <Dialog open onOpenChange={(o) => { if (!o) closeModal() }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reschedule Sesi</DialogTitle>
            <DialogDescription>Pindahkan ke jadwal lain. Sampaikan perubahan ke murid via WhatsApp.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 text-sm">
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tanggal</label>
              <Input type="date" value={reschedDate} min={format(new Date(), "yyyy-MM-dd")} onChange={(e) => setReschedDate(e.target.value)} autoComplete="off"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Mulai</label>
                <Input type="time" value={reschedStart} onChange={(e) => setReschedStart(e.target.value)} autoComplete="off"/>
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Selesai</label>
                <Input type="time" value={reschedEnd} onChange={(e) => setReschedEnd(e.target.value)} autoComplete="off"/>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => closeModal()}>Batal</Button>
            <Button
              disabled={!reschedDate || !reschedStart || !reschedEnd}
              onClick={() => {
                if (rescheduleSession) {
                  reschedule.mutate({ path: { id: rescheduleSession.id! }, body: { date: reschedDate, start_time: reschedStart, end_time: reschedEnd } })
                  closeModal()
                }
              }}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {modal === "cancel" && cancelSession && (
      <AlertDialog open onOpenChange={(o) => { if (!o) closeModal() }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan sesi ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Sesi {cancelSession?.date} {cancelSession?.start_time} – {cancelSession?.end_time} akan ditandai dibatalkan. Invoice tidak berubah. Beri tahu murid via WhatsApp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (cancelSession) {
                  cancel.mutate({ path: { id: cancelSession.id! } })
                  closeModal()
                }
              }}
            >
              Ya, batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      )}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/bookings/$bookingId")({
  component: TeacherBookingDetail,
  validateSearch: teacherBookingDetailSearchSchema,
})
