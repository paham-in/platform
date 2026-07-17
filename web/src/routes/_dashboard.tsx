import { Button } from "@/components/ui/button";
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
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/components/theme-provider";

const sidebarLinks = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard", roles: ["student", "teacher", "admin"] },
  { label: "Mata Pelajaran", icon: BookMarked, to: "/subjects", roles: ["student", "teacher"] },
  { label: "Pertanyaan Saya", icon: Home, to: "/forum", roles: ["student"] },
  { label: "Materi Saya", icon: BookMarked, to: "/materials", roles: ["teacher"] },
  { label: "Tanya Jawab", icon: Home, to: "/forum", roles: ["teacher"] },
  { label: "Kelola User", icon: Users, to: "/admin/users", roles: ["admin"] },
  { label: "Kelas", icon: GraduationCap, to: "/admin/classes", roles: ["admin"] },
  { label: "Mata Pelajaran", icon: BookMarked, to: "/admin/subjects", roles: ["admin"] },
  { label: "Chapter", icon: BookOpen, to: "/admin/chapters", roles: ["admin"] },
  { label: "Materi", icon: FileText, to: "/admin/materials", roles: ["admin"] },
];

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: user, isLoading } = useQuery(getMeOptions());
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = useMutation({
    ...postLogoutMutation(),
    onSuccess: () => {
      localStorage.removeItem("token");
      qc.setQueryData(["me"], null);
      navigate({ to: "/login" });
    },
  });
  const { theme, setTheme } = useTheme();
  const handleLogout = () => logout.mutate({});

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

  const filteredLinks = sidebarLinks.filter((l) => l.roles.includes(user.role ?? ""));

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 flex-col border-r bg-card p-4 transition-transform md:static md:flex md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              B
            </div>
            <span className="text-lg font-bold">Bimbel</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="mt-8 flex-1 space-y-1">
          {filteredLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{
                className:
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground bg-muted",
              }}
              onClick={() => setMobileOpen(false)}
            >
              <l.icon className="h-4 w-4" /> {l.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-1 border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            <LogOut className="h-4 w-4" /> {logout.isPending ? "..." : "Keluar"}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <span className="text-sm text-muted-foreground">{user?.name}</span>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
