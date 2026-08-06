import { useEffect } from "react"
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router"
import { client } from "@/lib/api/client.gen"
import { getMeOptions } from "@/lib/api/@tanstack/react-query.gen"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

const dashLink = (roles?: string[]) => {
  if (!roles || roles.length === 0) return "/login"
  if (roles.includes("admin")) return "/admin/dashboard"
  if (roles.includes("teacher")) return "/teacher/dashboard"
  if (roles.includes("student")) return "/student/dashboard"
  return "/login"
}

function AuthCallback() {
  const navigate = useNavigate()
  const { token } = useSearch({ from: "/auth/callback" })

  // set config immediately so the query works
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token)
      client.setConfig({ auth: () => `Bearer ${token}` })
    }
  }, [token])

  const { data: user } = useQuery({
    ...getMeOptions(),
    enabled: !!token,
  })

  useEffect(() => {
    if (!token) {
      navigate({ to: "/login" })
    } else if (user) {
      navigate({ to: dashLink(user.roles as string[]) })
    }
  }, [token, user, navigate])

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
