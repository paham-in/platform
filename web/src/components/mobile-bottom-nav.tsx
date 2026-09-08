import { useQuery } from "@tanstack/react-query"
import { Link, useRouterState } from "@tanstack/react-router"
import { getMeOptions } from "@/lib/api/@tanstack/react-query.gen"
import { useIsStandalone } from "@/lib/hooks/use-standalone"
import { mobileTabs } from "@/lib/sidebar"
import { cn } from "@/lib/utils"

// Bottom navigation mobile (md:hidden): hanya tampil di 4 halaman tab utama
// per role. Di halaman detail return null (navigasi balik via tombol Back).
// Desktop tidak tersentuh; drawer sidebar tetap jadi jalan cadangan.
export function MobileBottomNav() {
  const { data: user } = useQuery(getMeOptions())
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  // PWA terpasang (tanpa Back browser): pindah tab menimpa riwayat supaya
  // Back tidak berputar antar tab. Browser biasa: push normal agar Back
  // browser bisa kembali ke tab sebelumnya.
  const standalone = useIsStandalone()
  const userRoles = (user?.roles as string[]) ?? []
  const role = ["admin", "teacher", "student"].find((r) => userRoles.includes(r))
  const tabs = (role ? mobileTabs[role] : undefined) ?? mobileTabs.student

  const path = pathname.replace(/\/+$/, "")
  if (!tabs.some((t) => t.to === path)) return null

  return (
    <>
      {/* spacer supaya konten terakhir tak tertutup bar */}
      <div aria-hidden className="h-24 shrink-0 md:hidden" />
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-40 md:hidden"
      >
      <div className="grid grid-cols-4 gap-1 rounded-full bg-card p-1.5 shadow-lg ring-1 ring-foreground/10">
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to as never}
            replace={standalone}
            activeProps={{ className: "text-primary" }}
            inactiveProps={{ className: "text-muted-foreground" }}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-full px-1 py-2 text-[10px] font-medium transition-colors",
              "hover:bg-muted/60"
            )}
          >
            <tab.icon className="h-5 w-5" />
            <span className="leading-none">{tab.label}</span>
          </Link>
        ))}
      </div>
      </nav>
    </>
  )
}
