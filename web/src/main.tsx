import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import { client } from "@/lib/api/client.gen"
import { router } from "./router"
import "./index.css"

const token = localStorage.getItem("token")
if (token) {
  client.setConfig({ auth: () => `Bearer ${token}` })
}

const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
)
