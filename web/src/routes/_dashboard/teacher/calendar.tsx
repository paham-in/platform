import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { startOfWeek, parseISO, isValid, format } from "date-fns"
import { CalendarWeek } from "@/components/tutoring/calendar-week"
import { getTutoringSessionsOptions } from "@/lib/api/@tanstack/react-query.gen"
import { Loader2 } from "lucide-react"
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
  const navigate = useNavigate({ from: Route.fullPath })
  const { week } = Route.useSearch()
  const { data: sessions = [], isLoading } = useQuery(getTutoringSessionsOptions())

  if (isLoading) return <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

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
    subtitle: s.mode === "semi_private" ? "Semi Private" : "Private",
    note: s.note,
    status: s.status,
  }))

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Kalender</h1>
        <p className="text-sm text-muted-foreground">Jadwal pertemuan les privat kamu</p>
      </div>
      <CalendarWeek events={events} weekStart={weekStart} onWeekStartChange={handleWeekStartChange} />
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/calendar")({
  component: TeacherCalendarPage,
  validateSearch: calendarSearchSchema,
})
