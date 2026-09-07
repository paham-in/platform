import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  postAdminUsersByIdMergeMutation,
  getAdminUsersQueryKey,
  getAdminUsersOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import type { UserAdminListUsersResponse } from "@/lib/api/types.gen"

interface ConnectGoogleDialogProps {
  user: UserAdminListUsersResponse
  onClose: () => void
}

export function ConnectGoogleDialog({ user, onClose }: ConnectGoogleDialogProps) {
  const qc = useQueryClient()
  const { data: users = [] } = useQuery(getAdminUsersOptions())

  // kandidat target: akun Google ber-role student, bukan dummy itu sendiri
  const candidates = users.filter(
    (u) => u.id !== user.id && u.has_google && (u.roles ?? []).includes("student"),
  )
  const form = useForm<{ target_id: string }>({
    resolver: zodResolver(z.object({ target_id: z.string().min(1, "Pilih akun Google tujuan dulu") })),
    mode: "onTouched",
    defaultValues: { target_id: "" },
  })

  const { mutate: merge, isPending } = useMutation({
    ...postAdminUsersByIdMergeMutation(),
    onSuccess: () => {
      toast.success("Akun berhasil dihubungkan")
      qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal menghubungkan akun"),
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Hubungkan Akun Dummy ke Akun Google</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">Akun dummy: {user.email}</p>
          </div>

          <Controller
            name="target_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Pilih akun Google tujuan</FieldLabel>
                {candidates.length === 0 ? (
                  <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                    Tidak ada akun Google ber-role murid. Minta murid login Google dulu.
                  </p>
                ) : (
                  <Combobox
                    autoHighlight
                    items={candidates}
                    value={candidates.find((u) => String(u.id) === field.value)}
                    onValueChange={(v) => field.onChange(v?.id ? String(v.id) : "")}
                    itemToStringLabel={(t) => (t ? `${t.name}, ${t.email}` : "")}
                  >
                    <ComboboxInput placeholder="Pilih akun Google..." />
                    <ComboboxContent>
                      <ComboboxEmpty>Tidak ada akun ditemukan</ComboboxEmpty>
                      <ComboboxList>
                        {(u: UserAdminListUsersResponse) => (
                          <ComboboxItem key={u.id} value={u}>
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate">{u.name}</span>
                              <span className="truncate text-xs text-muted-foreground">{u.email}</span>
                            </span>
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                )}
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            variant="destructive"
            onClick={form.handleSubmit((v) => merge({ path: { id: user.id! }, body: { target_id: Number(v.target_id) } }))}
            disabled={isPending}
          >
            {isPending && <Spinner />}
            Hubungkan & Hapus Dummy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
