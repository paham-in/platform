import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { ChevronRight, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  getAdminDevTablesOptions,
  getMeOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"
import { roleLabel } from "@/lib/role"
import { mobileTabs, sidebarGroups } from "@/lib/sidebar"

// Halaman "Akun Saya": profil + menu sisa yang tidak jadi tab bottom-nav.
// Satu halaman shared untuk semua role; daftar menu ikut role user
// (sumber sama dengan sidebar: sidebarGroups). Dialog logout milik layout
// sehingga bisa dipicu dari sini via ?modal=logout.
function AccountPage() {
  const { data: user } = useQuery(getMeOptions())
  const navigate = useNavigate()
  const { openModal } = useDialogBack()
  const userRoles = (user?.roles as string[]) ?? []
  const isAdmin = userRoles.includes("admin")
  const { data: devReset } = useQuery({
    ...getAdminDevTablesOptions(),
    enabled: isAdmin,
  })
  const devResetEnabled = devReset?.enabled ?? false

  const tabPaths = new Set(
    Object.values(mobileTabs).flatMap((tabs) => tabs.map((t) => t.to))
  )
  const groups = sidebarGroups
    .map((g) => ({
      ...g,
      items: g.roles.some((r) => userRoles.includes(r))
        ? g.items.filter(
            (l) =>
              !("devOnly" in l && l.devOnly && !devResetEnabled) &&
              !(l.to && tabPaths.has(l.to))
          )
        : [],
    }))
    .filter((g) => g.items.length > 0)

  return (
    <main className="mx-auto w-full max-w-2xl space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-3 px-1 py-2">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="" className="size-12 shrink-0 rounded-full" />
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {user?.name?.[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{user?.name ?? "…"}</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email ?? ""}</p>
          {userRoles.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {userRoles.map(roleLabel).join(", ")}
            </p>
          )}
        </div>
      </div>

      {groups.map((group) => (
        <section key={group.label}>
          <h2 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </h2>
          <Card className="gap-0 py-0">
            <CardContent className="divide-y p-0">
              {group.items.flatMap((item) =>
                item.items?.length
                  ? item.items.map((sub) => (
                      <button
                        key={sub.label}
                        type="button"
                        onClick={() => navigate({ to: sub.to as never })}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                      >
                        <item.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 text-sm font-medium">{sub.label}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    ))
                  : [
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => navigate({ to: item.to as never })}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                      >
                        <item.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 text-sm font-medium">{item.label}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>,
                    ]
              )}
            </CardContent>
          </Card>
        </section>
      ))}

      <Button
        variant="outline"
        className="w-full text-destructive hover:text-destructive"
        onClick={() => openModal("logout")}
      >
        <LogOut className="mr-2 h-4 w-4" /> Keluar
      </Button>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/account")({
  component: AccountPage,
  validateSearch: z.object({ modal: z.string().optional() }),
})
