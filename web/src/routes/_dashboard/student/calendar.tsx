import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { CalendarWeek } from "@/components/tutoring/calendar-week"
import { getTutoringSessionsOptions } from "@/lib/api/@tanstack/react-query.gen"
import { Loader2 } from "lucide-react"

function StudentCalendarPage() {
  const { data: sessions = [], isLoading } = useQuery(getTutoringSessionsOptions())

  if (isLoading) return <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

  const events = sessions.map((s) => ({
    id: s.id!,
    date: s.date!,
    start: s.start_time!,
    end: s.end_time!,
    title: s.teacher_name ?? "Guru",
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
      <CalendarWeek events={events} />
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/calendar")({
  component: StudentCalendarPage,
})
