import { createFileRoute, Outlet, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { getMeOptions } from "@/lib/api/@tanstack/react-query.gen"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

function TutoringLayout() {
  const { data: user } = useQuery(getMeOptions())
  const role = user?.role ?? "student"

  return (
    <main className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Les Privat</h1>
          <p className="text-sm text-muted-foreground">
            {role === "teacher" ? "Atur jadwal dan kelola permintaan les" : "Booking jadwal les dengan guru"}
          </p>
        </div>
        {role === "teacher" && (
          <Link to="/tutoring/availability">
            <Button><Calendar className="h-4 w-4" /> Atur Jadwal</Button>
          </Link>
        )}
      </div>
      <Outlet />
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/tutoring")({
  component: TutoringLayout,
})
