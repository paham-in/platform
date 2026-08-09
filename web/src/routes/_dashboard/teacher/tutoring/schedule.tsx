import { createFileRoute } from "@tanstack/react-router"
import { AvailabilitySchedule } from "@/components/teacher/tutoring/availability-schedule"

function TeacherTutoringSchedulePage() {
  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Jadwal Slot</h1>
        <p className="text-sm text-muted-foreground">Atur slot jadwal mengajar Anda</p>
      </div>
      <AvailabilitySchedule />
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/tutoring/schedule")({
  component: TeacherTutoringSchedulePage,
})
