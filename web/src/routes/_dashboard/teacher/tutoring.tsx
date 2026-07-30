import { createFileRoute, Outlet, Link, useRouter } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft } from "lucide-react"

function TeacherTutoringLayout() {
  const router = useRouter()
  const path = router.state.location.pathname
  const isAvailability = path === "/teacher/tutoring/availability"

  return (
    <main className="p-6">
      {isAvailability && (
        <Link to="/teacher/tutoring" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Kembali
        </Link>
      )}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Les Privat</h1>
          <p className="text-sm text-muted-foreground">Atur jadwal dan kelola permintaan les</p>
        </div>
        {!isAvailability && (
          <Link to="/teacher/tutoring/availability">
            <Button><Calendar className="h-4 w-4" /> Atur Jadwal</Button>
          </Link>
        )}
      </div>
      <Outlet />
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/tutoring")({
  component: TeacherTutoringLayout,
})
