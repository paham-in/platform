import { useEffect } from "react"
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router"
import { client } from "@/lib/api/client.gen"
import { Loader2 } from "lucide-react"

function AuthCallback() {
  const navigate = useNavigate()
  const { token } = useSearch({ from: "/auth/callback" })

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token)
      client.setConfig({ auth: () => `Bearer ${token}` })
      navigate({ to: "/dashboard" })
    } else {
      navigate({ to: "/login" })
    }
  }, [token, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
  validateSearch: (search: Record<string, string | undefined>) => ({
    token: search.token as string | undefined,
  }),
})
