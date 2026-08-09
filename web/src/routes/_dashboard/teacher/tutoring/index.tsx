import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_dashboard/teacher/tutoring/")({
  beforeLoad: () => {
    throw redirect({ to: "/teacher/tutoring/requests" })
  },
})
