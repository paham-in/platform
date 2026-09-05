import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getTutoringBookingsOptions,
  getTutoringSessionsOptions,
  getTutoringSessionsQueryKey,
  patchTutoringSessionsByIdMutation,
  patchTutoringSessionsByIdOvertimeMutation,
  postTutoringSessionsByIdCancelMutation,
  postTutoringSessionsByIdEvidenceMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { History, UserRound, Users, MoreVertical, Eye, Upload, CalendarClock, XCircle, Timer } from "lucide-react"
import type { TutoringListBookingsResponse, TutoringListSessionsResponse } from "@/lib/api/types.gen"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { useRef, useState } from "react"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"

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

function modeBadge(mode?: string) {
  if (mode === "group") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"><Users className="h-3 w-3" /> Kelompok</span>
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700"><UserRound className="h-3 w-3" /> Private</span>
}

function overtimeSummary(sessions: TutoringListSessionsResponse[]): string | null {
  const ot = sessions.filter((s) => (s.overtime_minutes ?? 0) > 0)
  if (ot.length === 0) return null
  const extra = ot.reduce((sum, s) => sum + (s.extra_sessions ?? 0), 0)
  return `+${extra} sesi`
}

function groupBookings(bookings: TutoringListBookingsResponse[]): TutoringListBookingsResponse[][] {  const groups: TutoringListBookingsResponse[][] = []
  const index = new Map<string, number>()
  for (const b of bookings) {
    if (b.mode === "group" && b.group_token) {
      const key = b.group_token
      const existing = index.get(key)
      if (existing !== undefined) {
        groups[existing].push(b)
      } else {
        index.set(key, groups.length)
        groups.push([b])
      }
    } else {
      groups.push([b])
    }
  }
  return groups
}

export function BookingList() {
  const qc = useQueryClient()
  const { data: bookings = [], isLoading } = useQuery(getTutoringBookingsOptions())
  const { data: sessions = [] } = useQuery(getTutoringSessionsOptions())

  const groups = groupBookings(bookings)

  const invalidate = () => qc.invalidateQueries({ queryKey: getTutoringSessionsQueryKey() })

  const upload = useMutation({
    ...postTutoringSessionsByIdEvidenceMutation(),
    onSuccess: () => { toast.success("Bukti terunggah, menunggu validasi admin"); invalidate() },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal upload bukti"),
  })
  const overtime = useMutation({
    ...patchTutoringSessionsByIdOvertimeMutation(),
    onSuccess: () => { toast.success("Overtime tercatat, charge diterapkan saat admin approve"); invalidate(); setOvertimeSession(null) },
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

  const [detailBooking, setDetailBooking] = useState<TutoringListBookingsResponse | null>(null)
  const [rescheduleSession, setRescheduleSession] = useState<TutoringListSessionsResponse | null>(null)
  const [reschedDate, setReschedDate] = useState("")
  const [reschedStart, setReschedStart] = useState("")
  const [reschedEnd, setReschedEnd] = useState("")
  const [cancelSession, setCancelSession] = useState<TutoringListSessionsResponse | null>(null)
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingUploadSessionId, setPendingUploadSessionId] = useState<number | null>(null)
  const [overtimeSession, setOvertimeSession] = useState<TutoringListSessionsResponse | null>(null)
  const [overtimeEnd, setOvertimeEnd] = useState("")
  const openOvertime = (s: TutoringListSessionsResponse) => { setOvertimeSession(s); setOvertimeEnd(s.actual_end_time ?? s.end_time ?? "") }

  const sessionsFor = (bookingId: number) => sessions.filter((s) => s.booking_id === bookingId)
  const nextScheduled = (bookingId: number) => sessionsFor(bookingId).find((s) => s.status === "scheduled")

  const detailSessions = detailBooking ? sessionsFor(detailBooking.id!) : []

  return (
    <>
      {/* Desktop table */}
      <Card className="hidden gap-0 pt-0 pb-0 md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6">Murid</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead className="pr-6 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Empty className="border-0 p-8">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><History /></EmptyMedia>
                        <EmptyTitle>Belum ada booking</EmptyTitle>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : groups.map((group) => (
                <TableRow key={group[0].id}>
                  <TableCell className="pl-6">
                    <div className="font-medium">{group.map((b) => b.student_name).join(", ")}</div>
                    {group.length > 1 && <div className="text-xs text-muted-foreground">{group.length} murid</div>}
                  </TableCell>
                  <TableCell>{modeBadge(group[0].mode)}</TableCell>
                  <TableCell>{group[0].date}</TableCell>
                  <TableCell>{group[0].start_time} - {group[0].end_time}</TableCell>
                  <TableCell>{statusBadge(group[0].status!)}</TableCell>
                  <TableCell>
                    {(() => {
                      const label = overtimeSummary(group.flatMap((b) => sessionsFor(b.id!)))
                      return label
                        ? <span className="font-medium tabular-nums text-amber-600">{label}</span>
                        : <span className="text-muted-foreground">—</span>
                    })()}
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="outline" size="icon" aria-label="Aksi booking" />}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setDetailBooking(group[0])}>
                            <Eye className="h-4 w-4" /> Detail
                          </DropdownMenuItem>
                          {group[0].status === "confirmed" && (() => {
                            const ns = nextScheduled(group[0].id!)
                            if (!ns) return null
                            return (
                              <>
                                <DropdownMenuItem onClick={() => { setPendingUploadSessionId(ns.id!); fileInputRef.current?.click() }}>
                                  <Upload className="h-4 w-4" /> Upload Bukti
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { openOvertime(sessionsFor(group[0].id!).find((s) => s.status === "review") ?? ns) }}>
                                  <Timer className="h-4 w-4" /> Lapor Overtime
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setReschedDate(ns.date!)
                                  setReschedStart(ns.start_time!)
                                  setReschedEnd(ns.end_time!)
                                  setRescheduleSession(ns)
                                }}>
                                  <CalendarClock className="h-4 w-4" /> Reschedule
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" onClick={() => setCancelSession(ns)}>
                                  <XCircle className="h-4 w-4" /> Batalkan Sesi
                                </DropdownMenuItem>
                              </>
                            )
                          })()}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile card list */}
      <Card className="gap-0 py-0 md:hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <Empty className="p-8">
              <EmptyHeader>
                <EmptyMedia variant="icon"><History /></EmptyMedia>
                <EmptyTitle>Belum ada booking</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="divide-y">
              {groups.map((group) => (
                <div key={group[0].id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{group.map((b) => b.student_name).join(", ")}</p>
                      {group.length > 1 && <p className="mt-0.5 text-xs text-muted-foreground">{group.length} murid</p>}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {modeBadge(group[0].mode)}
                        {statusBadge(group[0].status!)}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{group[0].date} · {group[0].start_time} - {group[0].end_time}</p>
                      {(() => {
                        const label = overtimeSummary(group.flatMap((b) => sessionsFor(b.id!)))
                        return label ? <p className="mt-0.5 text-xs font-medium text-amber-600">Overtime {label}</p> : null
                      })()}
                      <p className="mt-0.5 text-xs text-muted-foreground">Dibuat {group[0].created_at}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Aksi booking" className="shrink-0" />}>
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setDetailBooking(group[0])}>
                          <Eye className="h-4 w-4" /> Detail
                        </DropdownMenuItem>
                        {group[0].status === "confirmed" && (() => {
                          const ns = nextScheduled(group[0].id!)
                          if (!ns) return null
                          return (
                            <>
                              <DropdownMenuItem onClick={() => { setPendingUploadSessionId(ns.id!); fileInputRef.current?.click() }}>
                                <Upload className="h-4 w-4" /> Upload Bukti
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { openOvertime(sessionsFor(group[0].id!).find((s) => s.status === "review") ?? ns) }}>
                                <Timer className="h-4 w-4" /> Lapor Overtime
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setReschedDate(ns.date!)
                                setReschedStart(ns.start_time!)
                                setReschedEnd(ns.end_time!)
                                setRescheduleSession(ns)
                              }}>
                                <CalendarClock className="h-4 w-4" /> Reschedule
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onClick={() => setCancelSession(ns)}>
                                <XCircle className="h-4 w-4" /> Batalkan Sesi
                              </DropdownMenuItem>
                            </>
                          )
                        })()}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden file input for evidence upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ""
          if (f && pendingUploadSessionId) {
            setUploadingId(pendingUploadSessionId)
            try {
              await upload.mutateAsync({ path: { id: pendingUploadSessionId }, body: { image: f } })
            } catch { /* toast handled */ }
            setUploadingId(null)
            setPendingUploadSessionId(null)
          }
        }}
      />

      {/* Overtime dialog (menu terpisah dari upload bukti) */}
      <Dialog open={!!overtimeSession} onOpenChange={(o) => { if (!o) setOvertimeSession(null) }}>
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
            <Button variant="outline" onClick={() => setOvertimeSession(null)}>Batal</Button>
            <Button
              disabled={!overtimeEnd || overtime.isPending}
              onClick={() => overtimeSession?.id && overtime.mutate({ path: { id: overtimeSession.id }, body: { actual_end_time: overtimeEnd } })}
            >
              {overtime.isPending && <Spinner />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail modal */}
      <Dialog open={!!detailBooking} onOpenChange={(o) => { if (!o) setDetailBooking(null) }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailBooking?.student_name}</DialogTitle>
            <DialogDescription>Detail booking & sesi les</DialogDescription>
          </DialogHeader>
          {detailBooking && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Mapel</p>
                  <p>{detailBooking.subject_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Mode</p>
                  <p>{detailBooking.mode === "group" ? "Kelompok" : "Private"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Tanggal</p>
                  <p>{detailBooking.date}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Jam</p>
                  <p>{detailBooking.start_time} - {detailBooking.end_time}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Jumlah Sesi</p>
                  <p>{detailBooking.session_count || 1}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Status</p>
                  <p>{statusBadge(detailBooking.status!)}</p>
                </div>
              </div>
              {detailBooking.note && (
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="mb-0.5 text-xs font-medium text-muted-foreground">Catatan</p>
                  <p className="whitespace-pre-wrap">{detailBooking.note}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="mb-3 font-medium">Sesi Pertemuan</p>
                {detailSessions.length === 0 ? (
                  <p className="text-muted-foreground">Belum ada sesi terjadwal.</p>
                ) : (
                  <div className="space-y-2">
                    {detailSessions.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                        <div className="min-w-0">
                          <p className="font-medium">
                            {s.date && format(parseISO(s.date), "EEE, dd MMM yyyy", { locale: id })}
                            {" · "}
                            {s.start_time} - {s.end_time}
                          </p>
                          <div className="mt-1">{sessionStatusBadge(s.status)}</div>
                          {(s.overtime_minutes ?? 0) > 0 && (
                            <p className="mt-1 text-xs font-medium text-amber-600">
                              +{s.overtime_minutes} mnt (s.d. {s.actual_end_time}) · +{s.extra_sessions ?? 0} sesi
                            </p>
                          )}
                          {s.evidence_url && (
                            <a href={s.evidence_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-primary hover:underline">
                              Lihat bukti
                            </a>
                          )}
                        </div>
                        {s.status === "scheduled" && (
                          <div className="flex shrink-0 gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={uploadingId === s.id}
                              onClick={() => { setPendingUploadSessionId(s.id!); fileInputRef.current?.click() }}
                            >
                              {uploadingId === s.id ? <Spinner /> : <Upload className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReschedDate(s.date!)
                                setReschedStart(s.start_time!)
                                setReschedEnd(s.end_time!)
                                setRescheduleSession(s)
                              }}
                            >
                              <CalendarClock className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-600"
                              onClick={() => setCancelSession(s)}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailBooking(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule dialog */}
      <Dialog open={!!rescheduleSession} onOpenChange={(o) => { if (!o) setRescheduleSession(null) }}>
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
            <Button variant="outline" onClick={() => setRescheduleSession(null)}>Batal</Button>
            <Button
              disabled={!reschedDate || !reschedStart || !reschedEnd}
              onClick={() => {
                if (rescheduleSession) {
                  reschedule.mutate({ path: { id: rescheduleSession.id! }, body: { date: reschedDate, start_time: reschedStart, end_time: reschedEnd } })
                  setRescheduleSession(null)
                }
              }}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelSession} onOpenChange={(o) => { if (!o) setCancelSession(null) }}>
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
                  setCancelSession(null)
                }
              }}
            >
              Ya, batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
