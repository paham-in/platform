import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider"
import { RouterProvider } from "@tanstack/react-router"
import { client } from "@/lib/api/client.gen"
import { queryClient, router } from "./router"
import "./index.css"

const token = localStorage.getItem("token")
client.setConfig({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:8080/",
  ...(token ? { auth: () => `Bearer ${token}` } : {}),
})

client.interceptors.error.use((error, response) => {
  if (response) (error as { status?: number }).status = response.status
  return error
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)