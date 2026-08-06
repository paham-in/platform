import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { getMeOptions } from "@/lib/api/@tanstack/react-query.gen"

const navLinks = [
  { label: "Fitur", href: "#features" },
  { label: "Cara Kerja", href: "#how-it-works" },
]

const dashboardLink = (roles?: string[]) => {
  if (!roles || roles.length === 0) return "/login"
  if (roles.includes("admin")) return "/admin/dashboard"
  if (roles.includes("teacher")) return "/teacher/dashboard"
  return "/student/dashboard"
}

export default function Navbar() {
  const { data: user } = useQuery(getMeOptions())
  const token = typeof window !== "undefined" && localStorage.getItem("token")
  const dashTo = token && user ? dashboardLink(user.roles as string[]) : "/login"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            p
          </div>
          <span className="text-xl font-bold">paham.in</span>
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          {localStorage.getItem("token") ? (
            <Button size="sm" render={<Link to={dashTo} />}>Dashboard</Button>
          ) : (
            <Button size="sm" render={<Link to="/login" />}>Masuk</Button>
          )}
        </div>
      </div>
    </header>
  )
}
