import { createFileRoute, Outlet, Link, useRouter } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"

function StudentTutoringLayout() {
  const router = useRouter()
  const path = router.state.location.pathname
  const isDetail = path.includes("/student/tutoring/") && path !== "/student/tutoring"

  return (
    <main className="p-6">
      <div className="mb-6">
        {isDetail && (
          <Link to="/student/tutoring" className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Kembali
          </Link>
        )}
        <h1 className="text-2xl font-bold tracking-tight">Les Privat</h1>
        <p className="text-sm text-muted-foreground">Booking jadwal les dengan guru</p>
      </div>
      <Outlet />
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/tutoring")({
  component: StudentTutoringLayout,
})
