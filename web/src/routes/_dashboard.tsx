import { Button } from "@/components/ui/button";
import { postLogoutMutation } from "@/lib/api/@tanstack/react-query.gen";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { BookMarked, LayoutDashboard, LogOut, Users } from "lucide-react";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const logout = useMutation({
    ...postLogoutMutation(),
    onSuccess: () => {
      localStorage.removeItem("token");
      qc.setQueryData(["me"], null);
      navigate({ to: "/login" });
    },
  });
  const handleLogout = () => logout.mutate({});

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card p-4 md:flex">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            B
          </div>
          <span className="text-lg font-bold">Bimbel</span>
        </Link>

        <nav className="flex-1 space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            activeProps={{
              className:
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground bg-muted",
            }}
          >
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link
            to="/admin/users"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            activeProps={{
              className:
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground bg-muted",
            }}
          >
            <Users className="h-4 w-4" /> Kelola User
          </Link>
          <Link
            to="/admin/subjects"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            activeProps={{
              className:
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground bg-muted",
            }}
          >
            <BookMarked className="h-4 w-4" /> Mata Pelajaran
          </Link>
        </nav>

        <div className="mt-auto border-t pt-4">
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

      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
