export const ROLE_LABELS: Record<string, string> = { student: "Murid", teacher: "Guru", admin: "Admin" }
export const ROLE_STYLES: Record<string, string> = {
  student: "bg-green-100 text-green-700",
  teacher: "bg-blue-100 text-blue-700",
  admin: "bg-purple-100 text-purple-700",
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[role] || ""}`}>
      {ROLE_LABELS[role] || role}
    </span>
  )
}
