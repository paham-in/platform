import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookingRequests } from "@/components/teacher/tutoring/booking-requests"
import { AvailabilitySchedule } from "@/components/teacher/tutoring/availability-schedule"
import { z } from "zod"

const tutoringSearchSchema = z.object({
  tab: z.enum(["requests", "schedule"]).optional(),
})

function TeacherTutoringPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { tab } = Route.useSearch()

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Les Privat</h1>
        <p className="text-sm text-muted-foreground">Atur jadwal dan kelola permintaan les</p>
      </div>
      <Tabs
        value={tab ?? "requests"}
        onValueChange={(v) => navigate({
          search: (prev) => ({ ...prev, tab: v === "requests" ? undefined : v as "requests" | "schedule" }),
          replace: true,
        })}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="requests">Permintaan</TabsTrigger>
          <TabsTrigger value="schedule">Jadwal Saya</TabsTrigger>
        </TabsList>
        <TabsContent value="requests"><BookingRequests /></TabsContent>
        <TabsContent value="schedule"><AvailabilitySchedule /></TabsContent>
      </Tabs>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/teacher/tutoring")({
  component: TeacherTutoringPage,
  validateSearch: tutoringSearchSchema,
})
