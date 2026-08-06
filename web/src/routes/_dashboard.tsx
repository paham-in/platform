import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getMeOptions, postLogoutMutation } from "@/lib/api/@tanstack/react-query.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import {
  BookMarked,
  BookOpen,
  CreditCard,
  GraduationCap,
  Home,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Settings,
  Sun,
  Users,
  X,
  Calendar,
  Package,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

const sidebarGroups = [
  {
    label: "Umum",
    roles: ["student", "teacher", "admin"],
    links: [
      { label: "Pengaturan", icon: Settings, to: "/settings" },
    ],
  },
  {
    label: "Murid",
    roles: ["student"],
    links: [
      { label: "Dashboard", icon: LayoutDashboard, to: "/student/dashboard" },
      { label: "Materi", icon: BookMarked, to: "/student/materials" },
      { label: "Tanya Jawab", icon: Home, to: "/student/forum" },
      { label: "Les Privat", icon: Calendar, to: "/student/tutoring" },
      { label: "Pembayaran", icon: CreditCard, to: "/student/payments" },
    ],
  },
  {
    label: "Guru",
    roles: ["teacher"],
    links: [
      { label: "Dashboard", icon: LayoutDashboard, to: "/teacher/dashboard" },
      { label: "Materi", icon: BookOpen, to: "/teacher/chapters" },
      { label: "Bank Soal", icon: ListChecks, to: "/teacher/question-bank" },
      { label: "Paket Soal", icon: Package, to: "/teacher/packs" },
      { label: "Tanya Jawab", icon: MessageSquare, to: "/teacher/forum" },
      { label: "Les Privat", icon: Calendar, to: "/teacher/tutoring" },
    ],
  },
  {
    label: "Admin",
    roles: ["admin"],
    links: [
      { label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard" },
      { label: "Kelola User", icon: Users, to: "/admin/users" },
      { label: "Pembayaran", icon: CreditCard, to: "/admin/payments" },
      { label: "Kelas", icon: GraduationCap, to: "/admin/classes" },
      { label: "Mata Pelajaran", icon: BookMarked, to: "/admin/subjects" },
      { label: "Tanya Jawab", icon: MessageSquare, to: "/admin/forum" },
    ],
  },
];

function DashboardLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: user, isLoading } = useQuery(getMeOptions());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const logout = useMutation({
    ...postLogoutMutation(),
    onSuccess: () => {
      localStorage.removeItem("token");
      qc.setQueryData(["me"], null);
      navigate({ to: "/login" });
    },
  });
  const { theme, setTheme } = useTheme();
  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    logout.mutate({});
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <div className="text-sm text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    navigate({ to: "/login" });
    return null;
  }

  const userRoles = (user?.roles as string[]) ?? [];
  const filteredGroups = sidebarGroups
    .map((g) => ({
      ...g,
      links: g.roles.some((r) => userRoles.includes(r)) ? g.links : [],
    }))
    .filter((g) => g.links.length > 0);

  return (
    <div className="min-h-screen bg-muted/20">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 flex-col border-r bg-card p-4 transition-transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:flex`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">p</div>
              <span className="text-lg font-bold">paham.in</span>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="mt-8 flex-1 space-y-4 overflow-y-auto">
            {filteredGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.links.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      activeProps={{ className: "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground bg-muted" }}
                      onClick={() => setMobileOpen(false)}
                    >
                      <l.icon className="h-4 w-4" /> {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="space-y-1 border-t pt-4">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground" onClick={() => setLogoutConfirmOpen(true)} disabled={logout.isPending}>
              {logout.isPending ? <Spinner /> : <LogOut className="h-4 w-4" />} Keluar
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex flex-col md:ml-64 h-screen overflow-y-auto">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 shrink-0">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <div className="flex items-center gap-2">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-7 w-7 rounded-full" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{user?.name?.[0]}</div>
            )}
            <span className="text-sm text-muted-foreground">{user?.name}</span>
          </div>
        </header>
        <div className="flex-1">
          <Outlet />
        </div>
      </div>

      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yakin mau logout?</AlertDialogTitle>
            <AlertDialogDescription>
              Kamu akan keluar dari akun ini dan perlu login lagi untuk mengakses dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setLogoutConfirmOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={confirmLogout}>Logout</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
});
