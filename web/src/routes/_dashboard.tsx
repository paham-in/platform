import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getMeOptions, getMeQueryKey, postLogoutMutation, getAdminDevTablesOptions } from "@/lib/api/@tanstack/react-query.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Outlet,
  useNavigate,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { z } from "zod";
import {
  ArrowLeft,
  ChevronRight,
  LogOut,
  Menu,
  Search,
  Shield,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageTitleProvider, usePageHeaderActionValue } from "@/components/page-title";
import { sidebarGroups, type SidebarGroup as SidebarGroupData } from "@/lib/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { CommandMenu } from "@/components/command-menu";
import { getNavStack, resetNavStack, RouteTransition, setResetInProgress } from "@/components/route-transition";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { useDialogBack } from "@/lib/hooks/use-dialog-back";
import { useAutoSubscribeNotifications } from "@/lib/hooks/use-auto-subscribe";
import { homeForRoles, requiredRoleForPath, roleLabel } from "@/lib/role";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

function AccessDenied({ requiredRole, userRoles }: { requiredRole: string; userRoles: string[] }) {
  const navigate = useNavigate();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <Shield className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-xl font-bold tracking-tight">Akses Ditolak</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Halaman ini khusus untuk role {roleLabel(requiredRole)}. Akun kamu tidak punya akses ke sini.
        </p>
      </div>
      <Button onClick={() => navigate({ to: homeForRoles(userRoles) as never })}>
        Kembali ke Dashboard
      </Button>
    </main>
  );
}

function AppSidebar({
  groups,
  userName,
  avatarUrl,
  userRole,
  logoutPending,
  onLogoutClick,
}: {
  groups: SidebarGroupData[];
  userName?: string;
  avatarUrl?: string;
  userRole?: string;
  logoutPending: boolean;
  onLogoutClick: () => void;
}) {
  const { pathname } = useRouterState().location;
  const { setOpenMobile } = useSidebar();
  const router = useRouter();
  const isActive = (to?: string) => !!to && (pathname === to || pathname.startsWith(to + "/"));
  const closeMobile = () => setOpenMobile(false);

  const dashboardTo = groups
    .flatMap((g) => g.items)
    .map((i) => i.to)
    .find((t) => !!t && t.endsWith("/dashboard"));

  const goSection = (to: string) => {
    closeMobile();
    if (pathname === to) return;
    const stack = getNavStack();
    const dIdx = dashboardTo ? stack.indexOf(dashboardTo) : -1;
    const steps = dIdx >= 0 ? stack.length - 1 - dIdx : -1;
    setResetInProgress(true);
    const finish = () => {
      resetNavStack();
      const cleanup = router.subscribe("onResolved", () => {
        cleanup();
        setResetInProgress(false);
      });
      router.history.replace(to);
    };
    if (steps > 0) {
      const cleanup = router.subscribe("onResolved", () => {
        cleanup();
        finish();
      });
      router.history.go(-steps);
    } else {
      finish();
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex h-14 items-center gap-2 px-3">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                p
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Pahamin</span>
                <span className="text-xs text-muted-foreground">{userName}</span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.length === 0 ? (
          <div className="space-y-2 px-3 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        ) : (
          groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) =>
                item.items?.length ? (
                  <Collapsible
                    key={item.label}
                    defaultOpen={item.items.some((sub) => pathname.startsWith(sub.to))}
                    className="group/collapsible"
                    render={<SidebarMenuItem />}
                  >
                    <CollapsibleTrigger
                      render={<SidebarMenuButton tooltip={item.label} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((sub) => (
                          <SidebarMenuSubItem key={sub.label}>
                            <SidebarMenuSubButton
                              isActive={isActive(sub.to)}
                              onClick={() => goSection(sub.to)}
                            >
                              <span>{sub.label}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={isActive(item.to)}
                      onClick={() => goSection(item.to!)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroup>
          ))
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="size-8 rounded-full shrink-0" />
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {userName?.[0]}
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium">{userName}</span>
                {userRole ? <span className="truncate text-xs text-muted-foreground">{userRole}</span> : null}
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Keluar" onClick={onLogoutClick}>
              {logoutPending ? <Spinner /> : <LogOut />}
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

function MobileHeaderAction() {
  const action = usePageHeaderActionValue();
  if (action === null) return null;
  return <div className="md:hidden">{action}</div>;
}

const MAIN_PATHS = [
  ...sidebarGroups
    .flatMap((g) => g.items)
    .flatMap((i) => (i.to ? [i.to] : (i.items ?? []).map((s) => s.to))),
  "/user/dashboard",
  "/user/materials",
  "/user/subscribe",
];

function isMainPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "");
  return MAIN_PATHS.includes(p);
}

function sectionHomeFor(pathname: string): string | undefined {
  let best: string | undefined;
  for (const m of MAIN_PATHS) {
    if (pathname === m || pathname.startsWith(m + "/")) {
      if (!best || m.length > best.length) best = m;
    }
  }
  return best;
}

function HeaderNav() {
  const { isMobile, toggleSidebar } = useSidebar();
  const router = useRouter();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: user } = useQuery(getMeOptions());
  const userRoles = (user?.roles as string[]) ?? [];

  const goBack = () => {
    if (window.history.length > 1) {
      router.history.back();
    } else {
      navigate({ to: (sectionHomeFor(pathname) ?? homeForRoles(userRoles)) as never });
    }
  };

  if (isMobile && !isMainPath(pathname)) {
    return (
      <Button variant="ghost" size="icon" aria-label="Kembali" onClick={goBack}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
    );
  }
  if (isMobile) {
    return (
      <Button variant="ghost" size="icon" aria-label="Buka menu" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
      </Button>
    );
  }
  return <SidebarTrigger className="-ml-1" />;
}

function DashboardLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: user, isLoading } = useQuery(getMeOptions());
  const routerState = useRouterState();
  const { modal } = Route.useSearch();
  const { openModal, closeModal } = useDialogBack();
  const [commandOpen, setCommandOpen] = useState(false);

  useAutoSubscribeNotifications(user?.id as number | undefined);

  const logout = useMutation({
    ...postLogoutMutation(),
    onSuccess: () => {
      localStorage.removeItem("token");
      qc.setQueryData(getMeQueryKey(), null);
      qc.removeQueries({ queryKey: getMeQueryKey() });
      navigate({ to: "/login", replace: true });
    },
  });
  const confirmLogout = () => {
    logout.mutate({});
  };

  const userRoles = (user?.roles as string[]) ?? [];
  const hasAccessRole = ["student", "teacher", "admin"].some((r) => userRoles.includes(r));
  const isAdmin = userRoles.includes("admin");

  // guard role: halaman di bawah /admin, /teacher, /student hanya boleh di-render
  // oleh role yang berhak. Role mismatch → tampil halaman "Akses Ditolak".
  const pathname = routerState.location.pathname;
  const requiredRole = requiredRoleForPath(pathname);
  const denied = !!user && !!requiredRole && !userRoles.includes(requiredRole);
  // cek flag fitur reset dari backend; hanya dipanggil kalau admin,
  // dipakai buat nyembunyiin menu "Reset Data" kalau fitur mati.
  const { data: devReset } = useQuery({
    ...getAdminDevTablesOptions(),
    enabled: isAdmin,
  });
  const devResetEnabled = devReset?.enabled ?? false;

  // semua pendaftar otomatis student → semua yang login punya akses ke dashboard.
  // (role "user" sudah dihapus; tidak ada pembedaan gratis vs berbayar di routing.)
  // CATATAN: useEffect harus SEBELUM early-return supaya jumlah hook konsisten
  // di tiap render (kalau loading/user null, guard tetap di-register).
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (hasAccessRole) return;
    // user tidak punya role akses → tendang ke login
    navigate({ to: "/login", replace: true });
  }, [isLoading, hasAccessRole, user, routerState.location.pathname, navigate]);

  const filteredGroups = sidebarGroups
    .map((g) => ({
      ...g,
      items: g.roles.some((r) => userRoles.includes(r))
        ? g.items.filter((l) => !("devOnly" in l && l.devOnly && !devResetEnabled))
        : [],
    }))
    .filter((g) => g.items.length > 0);

  return (
    <SidebarProvider>
      <AppSidebar
        groups={filteredGroups}
        userName={user?.name}
        avatarUrl={user?.avatar_url}
        userRole={user ? userRoles.map(roleLabel).join(", ") : undefined}
        logoutPending={logout.isPending}
        onLogoutClick={() => openModal("logout")}
      />
      <SidebarInset className="overflow-x-clip">
        <PageTitleProvider>
          <header className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-[linear-gradient(to_bottom,var(--background),transparent)] px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] md:hidden">
            <div className="flex items-center rounded-full bg-card p-1 shadow-sm ring-1 ring-foreground/5">
              <HeaderNav />
            </div>
            <div className="flex items-center gap-0.5 rounded-full bg-card p-1 shadow-sm ring-1 ring-foreground/5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCommandOpen(true)}
                aria-label="Cari menu atau halaman"
              >
                <Search />
              </Button>
              <NotificationBell />
              <MobileHeaderAction />
            </div>
          </header>
          <header className="sticky top-0 z-10 hidden h-14 shrink-0 items-center gap-2 border-b bg-background px-4 md:flex">
            <HeaderNav />
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCommandOpen(true)}
              aria-label="Cari menu atau halaman"
            >
              <Search />
            </Button>
            <NotificationBell />
            <ThemeToggle compact />
            <MobileHeaderAction />
          </header>
          <RouteTransition>
            {!user ? (
              <div className="flex flex-1 flex-col gap-4 p-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full max-w-md" />
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
            ) : denied ? <AccessDenied requiredRole={requiredRole!} userRoles={userRoles} /> : <Outlet />}
          </RouteTransition>
        </PageTitleProvider>
      </SidebarInset>

      {modal === "logout" && (
      <AlertDialog open onOpenChange={(o) => !o && closeModal()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yakin mau logout?</AlertDialogTitle>
            <AlertDialogDescription>
              Kamu akan keluar dari akun ini dan perlu login lagi untuk mengakses dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      )}

      <CommandMenu
        groups={filteredGroups}
        open={commandOpen}
        onOpenChange={setCommandOpen}
      />
    </SidebarProvider>
  );
}

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
  validateSearch: z.object({ modal: z.string().optional() }),
});
