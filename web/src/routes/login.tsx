import { createRoute, Link, useNavigate } from "@tanstack/react-router"
import { Route as RootRoute } from "./__root"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { postLoginMutation } from "@/lib/api/@tanstack/react-query.gen"
import { client } from "@/lib/api/client.gen"

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

type LoginForm = z.infer<typeof loginSchema>

function LoginPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const login = useMutation({
    ...postLoginMutation(),
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem("token", data.token)
        client.setConfig({ auth: () => `Bearer ${data.token}` })
      }
      qc.setQueryData(["me"], data.user)
      navigate({ to: "/dashboard" })
    },
  })
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginForm) => {
    login.mutate({ body: data })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto flex w-fit items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">B</div>
            <span className="text-xl font-bold">Bimbel</span>
          </Link>
          <CardTitle className="mt-4">Masuk</CardTitle>
          <p className="text-sm text-muted-foreground">Belum punya akun? <Link to="/register" className="font-medium text-primary hover:underline">Daftar</Link></p>
        </CardHeader>

        <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="nama@email.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          {login.error && <p className="text-xs text-destructive">{login.error.error || "Terjadi kesalahan"}</p>}
          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? "Memproses..." : "Masuk"}
          </Button>
        </form>
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/login",
  component: LoginPage,
})
