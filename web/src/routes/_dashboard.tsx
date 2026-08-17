import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getMeOptions, getMeQueryKey, postLogoutMutation, getAdminDevTablesOptions } from "@/lib/api/@tanstack/react-query.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  ChevronRight,
  LogOut,
  Search,
  Settings,
  Shield,
} from "lucide-react";
import { useEffect, useState } from "react";
import { sidebarGroups, type SidebarGroup as SidebarGroupData } from "@/lib/sidebar";
import { CommandMenu } from "@/components/command-menu";
import { RouteTransition } from "@/components/route-transition";
import { ThemeToggle } from "@/components/theme-toggle";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function AccessDenied({ requiredRole, userRoles }: { requiredRole: string; userRoles: string[] }) {
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
      <Link to={homeForRoles(userRoles)}>
        <Button>Kembali ke Dashboard</Button>
      </Link>
    </main>
  );
}

function AppSidebar({
  groups,
  userName,
  logoutPending,
  onLogoutClick,
}: {
  groups: SidebarGroupData[];
  userName?: string;
  logoutPending: boolean;
  onLogoutClick: () => void;
}) {
  const { pathname } = useRouterState().location;
  const { setOpenMobile } = useSidebar();
  const isActive = (to?: string) => !!to && (pathname === to || pathname.startsWith(to + "/"));
  const closeMobile = () => setOpenMobile(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/" onClick={closeMobile} />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                p
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">paham.in</span>
                <span className="text-xs text-muted-foreground">{userName}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
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
                              render={<Link to={sub.to} onClick={closeMobile} />}
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
                      render={<Link to={item.to!} onClick={closeMobile} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
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

function DashboardLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: user, isLoading } = useQuery(getMeOptions());
  const routerState = useRouterState();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const logout = useMutation({
    ...postLogoutMutation(),
    onSuccess: () => {
      localStorage.removeItem("token");
      qc.setQueryData(getMeQueryKey(), null);
      qc.removeQueries({ queryKey: getMeQueryKey() });
      navigate({ to: "/login" });
    },
  });
  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    logout.mutate({});
  };

  const userRoles = (user?.roles as string[]) ?? [];
  const hasAccessRole = ["student", "teacher", "admin"].some((r) => userRoles.includes(r));
  const isAdmin = userRoles.includes("admin");

  // guard role: halaman di bawah /admin, /teacher, /student hanya boleh di-render
  // oleh role yang berhak. Role mismatch → tampil halaman "Akses Ditolak".
  const pathname = routerState.location.pathname;
  const requiredRole = requiredRoleForPath(pathname);
  const denied = !!requiredRole && !userRoles.includes(requiredRole);
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
      navigate({ to: "/login" });
      return;
    }
    if (hasAccessRole) return;
    // user tidak punya role akses → tendang ke login
    navigate({ to: "/login" });
  }, [isLoading, hasAccessRole, user, routerState.location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <div className="text-sm text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  if (!user) return null;

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
        userName={user.name}
        logoutPending={logout.isPending}
        onLogoutClick={() => setLogoutConfirmOpen(true)}
      />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 md:gap-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCommandOpen(true)}
            aria-label="Cari menu atau halaman"
          >
            <Search />
          </Button>
          <ThemeToggle compact />
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" className="h-8 w-8 rounded-full p-0" aria-label="Menu akun" />}
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-7 w-7 rounded-full" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{user?.name?.[0]}</div>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                  <Settings />
                  <span>Pengaturan</span>
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setLogoutConfirmOpen(true)}>
                  <LogOut />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="hidden text-sm text-muted-foreground md:inline">{user?.name}</span>
          </div>
        </header>
        <RouteTransition>
          {denied ? <AccessDenied requiredRole={requiredRole!} userRoles={userRoles} /> : <Outlet />}
        </RouteTransition>
      </SidebarInset>

      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
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
});
