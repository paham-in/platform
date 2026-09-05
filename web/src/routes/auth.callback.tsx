import { useEffect } from "react"
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router"
import { client } from "@/lib/api/client.gen"
import { getMeOptions } from "@/lib/api/@tanstack/react-query.gen"
import { useQuery } from "@tanstack/react-query"
import { Spinner } from "@/components/ui/spinner"
import { homeForRoles } from "@/lib/role"

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
      navigate({ to: homeForRoles(user.roles as string[]) })
    }
  }, [token, user, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner />
    </div>
  )
}

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
  validateSearch: (search: Record<string, string | undefined>) => ({
    token: search.token as string | undefined,
  }),
})
