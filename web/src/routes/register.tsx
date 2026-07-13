import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, createRoute } from "@tanstack/react-router";
import { Route as RootRoute } from "./__root";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postRegisterMutation } from "@/lib/api/@tanstack/react-query.gen";
import { client } from "@/lib/api/client.gen";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const registerSchema = z
  .object({
    name: z.string().min(3, "Nama minimal 3 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string(),
    role: z.enum(["student", "teacher"]),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Password tidak sama",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const reg = useMutation({
    ...postRegisterMutation(),
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem("token", data.token);
        client.setConfig({ auth: () => `Bearer ${data.token}` });
      }
      qc.setQueryData(["me"], data.user);
      navigate({ to: "/dashboard" });
    },
  });
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterForm) => {
    reg.mutate({
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword,
        role: data.role,
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto flex w-fit items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              B
            </div>
            <span className="text-xl font-bold">Bimbel</span>
          </Link>
          <CardTitle className="mt-4">Daftar</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Masuk
            </Link>
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                placeholder="Nama lengkap"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Daftar Sebagai</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Murid</SelectItem>
                      <SelectItem value="teacher">Guru</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <p className="text-xs text-destructive">
                  {errors.role.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ulangi password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            {reg.error && (
              <p className="text-xs text-destructive">
                {reg.error.error || "Terjadi kesalahan"}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={reg.isPending}>
              {reg.isPending ? "Memproses..." : "Daftar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/register",
  component: RegisterPage,
});
