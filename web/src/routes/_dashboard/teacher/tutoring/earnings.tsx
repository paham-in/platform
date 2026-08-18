import { createFileRoute } from "@tanstack/react-router"
import { Earnings } from "@/components/teacher/tutoring/earnings"
import { usePageTitle } from "@/components/page-title"

function TeacherTutoringEarningsPage() {
  usePageTitle("Pendapatan Les")
  return (
    <main className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="hidden md:block text-2xl font-bold tracking-tight">Pendapatan Les</h1>
        <p className="text-sm text-muted-foreground">Pantau pendapatan les dan status fee</p>
      </div>
      <Earnings />
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/tutoring/earnings")({
  component: TeacherTutoringEarningsPage,
})
