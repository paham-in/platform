import {
  BookMarked,
  BookOpen,
  Calendar,
  CreditCard,
  DatabaseZap,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react"

export type SidebarItem = {
  label: string
  icon: LucideIcon
  to?: string
  devOnly?: boolean
  items?: { label: string; to: string }[]
}

export type SidebarGroup = {
  label: string
  roles: string[]
  items: SidebarItem[]
}

export const sidebarGroups: SidebarGroup[] = [
  {
    label: "Umum",
    roles: ["student", "teacher", "admin"],
    items: [
      { label: "Pengaturan", icon: Settings, to: "/settings" },
    ],
  },
  {
    label: "Murid",
    roles: ["student"],
    items: [
      { label: "Dashboard", icon: LayoutDashboard, to: "/student/dashboard" },
      { label: "Materi", icon: BookMarked, to: "/student/materials" },
      { label: "Paket Soal", icon: ListChecks, to: "/student/packages" },
      { label: "Kalender", icon: Calendar, to: "/student/calendar" },
      { label: "Forum", icon: MessageSquare, to: "/student/forum" },
      { label: "Les Privat", icon: Calendar, to: "/student/tutoring" },
      { label: "Langganan", icon: Sparkles, to: "/student/subscribe" },
      { label: "Pembayaran", icon: CreditCard, to: "/student/payments" },
    ],
  },
  {
    label: "Guru",
    roles: ["teacher"],
    items: [
      { label: "Dashboard", icon: LayoutDashboard, to: "/teacher/dashboard" },
      {
        label: "Kurikulum",
        icon: BookOpen,
        items: [
          { label: "Materi", to: "/teacher/chapters" },
          { label: "Paket Soal", to: "/teacher/packs" },
        ],
      },
      { label: "Kalender", icon: Calendar, to: "/teacher/calendar" },
      { label: "Forum", icon: MessageSquare, to: "/teacher/forum" },
      {
        label: "Les Privat",
        icon: Calendar,
        items: [
          { label: "Permintaan Booking", to: "/teacher/tutoring/requests" },
          { label: "Pendapatan Les", to: "/teacher/tutoring/earnings" },
        ],
      },
    ],
  },
  {
    label: "Admin",
    roles: ["admin"],
    items: [
      { label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard" },
      {
        label: "User & Akses",
        icon: Users,
        items: [
          { label: "Kelola User", to: "/admin/users" },
          { label: "Hak Akses Murid", to: "/admin/student-class-enrollments" },
          { label: "Hak Akses Guru", to: "/admin/teacher-permissions" },
        ],
      },
      {
        label: "Keuangan",
        icon: CreditCard,
        items: [
          { label: "Tarif Produk", to: "/admin/tutoring-fees" },
          { label: "Pembayaran Murid", to: "/admin/payments" },
          { label: "Validasi & Fee Guru", to: "/admin/attendance" },
        ],
      },
      {
        label: "Kurikulum",
        icon: BookMarked,
        items: [
          { label: "Program & Kelas", to: "/admin/programs" },
          { label: "Mata Pelajaran", to: "/admin/subjects" },
          { label: "Mata Pelajaran Guru", to: "/admin/teacher-subjects" },
        ],
      },
      { label: "Les Privat", icon: Calendar, to: "/admin/tutoring" },
      { label: "Forum", icon: MessageSquare, to: "/admin/forum" },
      { label: "Dev Tools", icon: DatabaseZap, to: "/admin/dev-reset", devOnly: true },
    ],
  },
]
