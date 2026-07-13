import { createRoute, Link } from "@tanstack/react-router"
import { Route as RootRoute } from "./__root"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string(),
  role: z.enum(["student", "teacher"], { required_error: "Pilih role" }),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Password tidak sama",
  path: ["confirmPassword"],
})

type RegisterForm = z.infer<typeof registerSchema>

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/register",
  component: function RegisterPage() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
      resolver: zodResolver(registerSchema),
    })

    const onSubmit = (data: RegisterForm) => {
      console.log("register", data)
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
        <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm">
          <div className="text-center">
            <Link to="/" className="mx-auto flex w-fit items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">B</div>
              <span className="text-xl font-bold">Bimbel</span>
            </Link>
            <h1 className="mt-6 text-2xl font-bold tracking-tight">Daftar</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sudah punya akun? <Link to="/login" className="font-medium text-primary hover:underline">Masuk</Link></p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" placeholder="Nama lengkap" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="nama@email.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Daftar Sebagai</Label>
              <Select id="role" {...register("role")} defaultValue="">
                <option value="" disabled>Pilih role</option>
                <option value="student">Murid</option>
                <option value="teacher">Guru</option>
              </Select>
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Minimal 6 karakter" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <Input id="confirmPassword" type="password" placeholder="Ulangi password" {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Memproses..." : "Daftar"}
            </Button>
          </form>
        </div>
      </div>
    )
  },
})
