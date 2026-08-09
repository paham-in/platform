import { createFileRoute } from "@tanstack/react-router"
import { BookingRequests } from "@/components/teacher/tutoring/booking-requests"

function TeacherTutoringRequestsPage() {
  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Permintaan Les</h1>
        <p className="text-sm text-muted-foreground">Setujui atau tolak permintaan les dari murid</p>
      </div>
      <BookingRequests />
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/tutoring/requests")({
  component: TeacherTutoringRequestsPage,
})
