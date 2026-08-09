// Helper role: satu sumber kebenaran untuk matriks akses frontend.
// Backend tetap pagar utama (RoleAllowed di main.go); ini cuma lapisan UX.

// homeForRoles: role → halaman dashboard sendiri
export function homeForRoles(roles: string[]): string {
  if (roles.includes("admin")) return "/admin/dashboard"
  if (roles.includes("teacher")) return "/teacher/dashboard"
  if (roles.includes("student")) return "/student/dashboard"
  return "/login"
}

// requiredRoleForPath: prefix URL → role wajib (undefined = shared, role apa pun)
export function requiredRoleForPath(pathname: string): string | undefined {
  if (pathname.startsWith("/admin/")) return "admin"
  if (pathname.startsWith("/teacher/")) return "teacher"
  if (pathname.startsWith("/student/")) return "student"
  return undefined
}

// roleLabel: nama role versi UI (untuk teks halaman 403)
export function roleLabel(role: string): string {
  return { admin: "Admin", teacher: "Guru", student: "Murid" }[role] ?? role
}
