import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { startOfWeek, parseISO, isValid, format } from "date-fns"
import { CalendarWeek } from "@/components/tutoring/calendar-week"
import { usePageTitle } from "@/components/page-title"
import { getTutoringSessionsOptions, getTutoringSessionsQueryKey, patchTutoringSessionsByIdMutation, postTutoringSessionsByIdCancelMutation, postTutoringSessionsByIdEvidenceMutation } from "@/lib/api/@tanstack/react-query.gen"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { z } from "zod"

const calendarSearchSchema = z.object({
  week: z.string().optional(), // "YYYY-MM-DD" (Monday minggu tsb)
})

function parseWeekStart(param?: string): Date {
  const fallback = startOfWeek(new Date(), { weekStartsOn: 1 })
  if (!param) return fallback
  const d = parseISO(param)
  return isValid(d) ? startOfWeek(d, { weekStartsOn: 1 }) : fallback
}

function TeacherCalendarPage() {
  usePageTitle("Kalender")
  const navigate = useNavigate({ from: Route.fullPath })
  const qc = useQueryClient()
  const { week } = Route.useSearch()
  const { data: sessions = [], isLoading } = useQuery(getTutoringSessionsOptions())

  const invalidate = () => qc.invalidateQueries({ queryKey: getTutoringSessionsQueryKey() })

  const reschedule = useMutation({
    ...patchTutoringSessionsByIdMutation(),
    onSuccess: () => {
      toast.success("Jadwal sesi diperbarui")
      invalidate()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal reschedule"),
  })

  const cancel = useMutation({
    ...postTutoringSessionsByIdCancelMutation(),
    onSuccess: () => {
      toast.success("Sesi dibatalkan")
      invalidate()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal membatalkan sesi"),
  })

  const upload = useMutation({
    ...postTutoringSessionsByIdEvidenceMutation(),
    onSuccess: () => {
      toast.success("Bukti terunggah, menunggu validasi admin")
      invalidate()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal upload bukti"),
  })

  if (isLoading) {
    return (
      <main className="p-4 md:p-6">
        <div className="mb-6">
          <Skeleton className="hidden md:block h-8 w-32" />
          <Skeleton className="mt-1 h-4 w-48" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-8" />
            </div>
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <div className="min-w-[720px]">
              <div className="flex border-b bg-muted/30">
                <div className="w-14 shrink-0" />
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex-1 border-l py-2 text-center">
                    <Skeleton className="mx-auto h-3 w-8" />
                    <Skeleton className="mx-auto mt-1 h-4 w-6" />
                  </div>
                ))}
              </div>
              <div className="flex">
                <div className="w-14 shrink-0 space-y-0 pt-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="ml-auto mr-2 mb-[36px] h-3 w-8" />
                  ))}
                </div>
                {Array.from({ length: 7 }).map((_, day) => (
                  <div key={day} className="flex-1 border-l p-1">
                    {day % 3 === 0 && <Skeleton className="mb-1 h-10 w-full rounded-md" />}
                    {day % 2 === 0 && <Skeleton className="h-8 w-full rounded-md" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const weekStart = parseWeekStart(week)

  const handleWeekStartChange = (d: Date) => {
    const thisWeek = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
    navigate({
      search: (prev) => ({ ...prev, week: format(d, "yyyy-MM-dd") === thisWeek ? undefined : format(d, "yyyy-MM-dd") }),
      replace: true,
    })
  }

  const events = sessions.map((s) => ({
    id: s.id!,
    date: s.date!,
    start: s.start_time!,
    end: s.end_time!,
    title: s.student_name ?? "Murid",
    subtitle: s.mode === "group" ? "Kelompok" : "Private",
    note: s.note,
    status: s.status,
    evidenceUrl: s.evidence_url,
  }))

  return (
    <main className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Kalender</h1>
        <p className="text-sm text-muted-foreground">Jadwal pertemuan les privat kamu</p>
      </div>
      <CalendarWeek
        events={events}
        weekStart={weekStart}
        onWeekStartChange={handleWeekStartChange}
        onUploadEvidence={(id, file) => upload.mutateAsync({ path: { id }, body: { image: file } })}
        onReschedule={(id, date, start, end) => reschedule.mutate({ path: { id }, body: { date, start_time: start, end_time: end } })}
        onCancelSession={(id) => cancel.mutate({ path: { id } })}
      />
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/calendar")({
  component: TeacherCalendarPage,
  validateSearch: calendarSearchSchema,
})
