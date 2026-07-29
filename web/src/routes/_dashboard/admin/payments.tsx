import { createFileRoute, Outlet } from "@tanstack/react-router"

function PaymentsLayout() {
  return <Outlet />
}

export const Route = createFileRoute("/_dashboard/admin/payments")({
  component: PaymentsLayout,
})
