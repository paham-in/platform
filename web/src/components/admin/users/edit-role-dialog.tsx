import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError } from "@/components/ui/field"
import { patchAdminUsersByIdRoleMutation, getAdminUsersQueryKey } from "@/lib/api/@tanstack/react-query.gen"
import type { UserAdminListUsersResponse } from "@/lib/api/types.gen"
import { RoleBadge, ROLE_LABELS } from "./role-badge"

const ROLE_OPTIONS = ["student", "teacher", "admin"]

interface EditRoleDialogProps {
  user: UserAdminListUsersResponse
  onClose: () => void
}

export function EditRoleDialog({ user, onClose }: EditRoleDialogProps) {
  const qc = useQueryClient()
  const form = useForm<{ roles: string[] }>({
    resolver: zodResolver(z.object({ roles: z.array(z.string()).min(1, "Minimal 1 role harus dipilih") })),
    mode: "onTouched",
    defaultValues: { roles: user.roles ?? [] },
  })

  const { mutate: updateRole, isPending } = useMutation({
    ...patchAdminUsersByIdRoleMutation(),
    onSuccess: () => {
      toast.success("Role berhasil diubah")
      qc.invalidateQueries({ queryKey: getAdminUsersQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal mengubah role"),
  })

  // role "student" tidak bisa digabung dengan role lain (hanya teacher/admin yang multi-role)
  const singleRoles = ["student"]

  const toggleRole = (prev: string[], role: string) => {
    // uncheck
    if (prev.includes(role)) return prev.filter((r) => r !== role)

    // klik role single-role (student): replace semua role → cuma role ini.
    if (singleRoles.includes(role)) return [role]

    // klik teacher/admin: gabung boleh, asal tidak ada student/user tercentang
    if (prev.some((r) => singleRoles.includes(r))) return prev
    return [...prev, role]
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit Role User</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {user.name}, {user.email}
          </p>
        </div>
        <Controller
          name="roles"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-3 pt-2">
              <p className="text-sm font-medium">Role (centang semua yang sesuai)</p>
              {ROLE_OPTIONS.map((role) => (
                <label key={role} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                  <Checkbox
                    checked={field.value.includes(role)}
                    onCheckedChange={() => field.onChange(toggleRole(field.value, role))}
                  />
                  <RoleBadge role={role} />
                  <span className="ml-auto text-sm text-muted-foreground">{ROLE_LABELS[role]}</span>
                </label>
              ))}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={form.handleSubmit((v) => updateRole({ path: { id: user.id! }, body: { roles: v.roles } }))} disabled={isPending}>
            {isPending && <Spinner />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
