import { useEffect, useRef } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import {
  getMeOptions,
  getMeQueryKey,
  patchMeMutation,
} from "@/lib/api/@tanstack/react-query.gen"

// Form hanya menyimpan angka lokal (tanpa prefix); prefix +62 tetap di addon.
const toRest = (phone?: string) => {
  const t = (phone ?? "").trim()
  if (t.startsWith("+62")) return t.slice(3)
  if (t.startsWith("62")) return t.slice(2)
  if (t.startsWith("0")) return t.slice(1)
  return t
}

function ProfilePage() {
  const qc = useQueryClient()
  const { data: user, isLoading: userLoading } = useQuery(getMeOptions())
  const form = useForm<{ name: string; phone: string }>({
    resolver: zodResolver(z.object({
      name: z.string().trim().min(1, "Isi nama dulu"),
      phone: z.string().refine((v) => {
        const t = v.trim()
        if (t === "") return true
        return /^8\d{6,12}$/.test(t)
      }, "Nomor tidak valid (cth: 812...)"),
    })),
    mode: "onTouched",
    defaultValues: { name: "", phone: "" },
  })
  const initializedRef = useRef(false)
  useEffect(() => {
    if (user && !initializedRef.current) {
      form.reset({ name: user.name ?? "", phone: toRest(user.phone) })
      initializedRef.current = true
    }
  }, [user, form])

  const updateProfile = useMutation({
    ...patchMeMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getMeQueryKey() })
      toast.success("Profil berhasil disimpan")
    },
    onError: () => {
      toast.error("Gagal menyimpan profil")
    },
  })

  if (userLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  const handleSave = (v: { name: string; phone: string }) => {
    const rest = v.phone.trim()
    const body: { name?: string; phone?: string } = {}
    if (v.name !== user?.name) body.name = v.name
    if (rest !== toRest(user?.phone)) body.phone = rest === "" ? "" : `+62${rest}`
    if (Object.keys(body).length === 0) {
      toast.info("Tidak ada perubahan")
      return
    }
    updateProfile.mutate({ body })
  }

  return (
    <main className="p-4 md:p-6">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Profil</h1>
        <p className="mb-6 text-sm text-muted-foreground">Nama dan nomor WhatsApp yang dipakai admin untuk menghubungimu.</p>

        <div className="space-y-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="name">Nama</FieldLabel>
                <Input id="name" {...field} aria-invalid={fieldState.invalid} autoComplete="off"/>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="phone"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="phone">Nomor WhatsApp</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <InputGroupText>+62</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput id="phone" {...field} inputMode="tel" placeholder="812..." aria-invalid={fieldState.invalid} autoComplete="tel" />
                </InputGroup>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Button
            onClick={form.handleSubmit(handleSave)}
            disabled={updateProfile.isPending}
            className="w-full"
          >
            {updateProfile.isPending ? (
              <Spinner />
            ) : (
              <Save />
            )}
            Simpan
          </Button>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/settings/profile")({
  component: ProfilePage,
})
