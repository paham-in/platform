import { createRootRoute, Outlet } from "@tanstack/react-router"
import { Toaster } from "sonner"
import { NotFound } from "@/components/not-found"

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="bottom-right" />
    </>
  ),
  notFoundComponent: () => <NotFound />,
})
