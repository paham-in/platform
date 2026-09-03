import { createFileRoute } from "@tanstack/react-router"
import { BookingList } from "@/components/teacher/tutoring/booking-list"
import { usePageTitle } from "@/components/page-title"

function TeacherBookingsPage() {
  usePageTitle("Booking Les")
  return (
    <main className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Booking Les</h1>
        <p className="text-sm text-muted-foreground">Daftar booking les kamu</p>
      </div>
      <BookingList />
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/bookings")({
  component: TeacherBookingsPage,
})
