import { Outlet, createFileRoute } from "@tanstack/react-router"

function ForumDetailLayout() {
  return <Outlet />
}

export const Route = createFileRoute("/_dashboard/student/forum/$id")({
  component: ForumDetailLayout,
})