import { addDays, addWeeks, format, isSameDay, parseISO, startOfWeek } from "date-fns"
import { id } from "date-fns/locale"
import { useEffect, useState } from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export type CalendarEvent = {
  id: number
  date: string // "YYYY-MM-DD"
  start: string // "HH:mm"
  end: string // "HH:mm"
  title: string // nama pihak lain (murid utk guru, guru utk murid)
  subtitle?: string // mode: "Private" / "Semi Private"
  note?: string
  status?: string // scheduled/done/cancelled | confirmed/pending/...
}

const HOUR_START = 6
const HOUR_END = 22
const HOURS = HOUR_END - HOUR_START
const PX_PER_HOUR = 48

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function statusMeta(status?: string) {
  switch (status) {
    case "done":
      return { label: "Selesai", className: "border-zinc-600 bg-zinc-500 text-white" }
    case "cancelled":
      return { label: "Dibatalkan", className: "border-zinc-500 bg-zinc-400 text-white" }
    case "pending":
      return { label: "Menunggu", className: "border-amber-600 bg-amber-500 text-white" }
    case "confirmed":
      return { label: "Disetujui", className: "border-green-700 bg-green-600 text-white" }
    default: // scheduled
      return { label: "Terjadwal", className: "border-primary bg-primary text-primary-foreground" }
  }
}

export function CalendarWeek({
  events,
  weekStart,
  onWeekStartChange,
}: {
  events: CalendarEvent[]
  weekStart: Date
  onWeekStartChange: (date: Date) => void
}) {
  const [selected, setSelected] = useState<CalendarEvent | null>(null)
  const [now, setNow] = useState(() => new Date())

  // garis "sekarang" maju tiap menit
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = days[6]
  const today = new Date()
  const rangeLabel = `${format(weekStart, "d MMM")} – ${format(weekEnd, "d MMM yyyy", { locale: id })}`

  const inViewWeek = weekStart <= today && today <= weekEnd
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nowVisible = inViewWeek && nowMin >= HOUR_START * 60 && nowMin <= HOUR_END * 60

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon-sm" aria-label="Minggu sebelumnya" onClick={() => onWeekStartChange(addWeeks(weekStart, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onWeekStartChange(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Hari Ini
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Minggu berikutnya" onClick={() => onWeekStartChange(addWeeks(weekStart, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-sm font-medium">{rangeLabel}</span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <div className="min-w-[720px]">
          {/* header hari */}
          <div className="flex border-b bg-muted/30">
            <div className="w-14 shrink-0" />
            {days.map((day) => (
              <div key={day.toISOString()} className={cn("flex-1 border-l py-2 text-center", isSameDay(day, today) && "bg-primary/5")}>
                <p className={cn("text-xs font-medium", isSameDay(day, today) ? "text-primary" : "text-muted-foreground")}>
                  {format(day, "EEE", { locale: id })}
                </p>
                <p className={cn("text-sm font-bold", isSameDay(day, today) && "text-primary")}>{format(day, "d")}</p>
              </div>
            ))}
          </div>

          {/* body grid */}
          <div className="flex">
            <div className="relative w-14 shrink-0">
              {Array.from({ length: HOURS }, (_, i) => (
                <span key={i} className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-muted-foreground" style={{ top: i * PX_PER_HOUR }}>
                  {format(new Date(2000, 0, 1, HOUR_START + i), "HH:mm")}
                </span>
              ))}
            </div>
            {days.map((day) => {
              const iso = format(day, "yyyy-MM-dd")
              const dayEvents = events.filter((ev) => ev.date === iso)
              return (
                <div key={iso} className={cn("relative flex-1 border-l", isSameDay(day, today) && "bg-primary/[0.04]")}>
                  {Array.from({ length: HOURS }, (_, i) => (
                    <div key={i} className="h-12 border-t border-border/60" />
                  ))}
                  <div className="pointer-events-none absolute inset-0" />
                  {nowVisible && isSameDay(day, today) && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-red-500"
                      style={{ top: (nowMin - HOUR_START * 60) * (PX_PER_HOUR / 60) }}
                    >
                      <span className="absolute -top-1 -left-1 size-2 rounded-full bg-red-500" />
                    </div>
                  )}
                  {dayEvents.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => setSelected(ev)}
                      className={cn(
                        "absolute inset-x-1 z-10 cursor-pointer overflow-hidden rounded-md border px-4 py-1.5 text-left text-xs leading-tight transition-colors hover:brightness-95",
                        statusMeta(ev.status).className,
                        ev.subtitle === "Semi Private" && "border-l-[3px] border-l-blue-500",
                      )}
                      style={{
                        top: (toMinutes(ev.start) - HOUR_START * 60) * (PX_PER_HOUR / 60),
                        height: Math.max((toMinutes(ev.end) - toMinutes(ev.start)) * (PX_PER_HOUR / 60), 22),
                      }}
                    >
                      <p className="truncate font-semibold">{ev.title}</p>
                      <p className="truncate tabular-nums">
                        {ev.start} – {ev.end}
                      </p>
                      {ev.subtitle && <p className="truncate">{ev.subtitle}</p>}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            {selected?.subtitle && <DialogDescription>{selected.subtitle}</DialogDescription>}
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="h-4 w-4 shrink-0" />
                <span className="capitalize">{format(parseISO(selected.date), "EEEE, dd MMMM yyyy", { locale: id })}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span className="tabular-nums">
                  {selected.start} – {selected.end}
                </span>
              </div>
              {selected.status && (
                <div>
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", statusMeta(selected.status).className)}>
                    {statusMeta(selected.status).label}
                  </span>
                </div>
              )}
              {selected.note && (
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="mb-0.5 text-xs font-medium text-muted-foreground">Catatan</p>
                  <p className="whitespace-pre-wrap">{selected.note}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelected(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
