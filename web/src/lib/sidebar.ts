import {
  BookMarked,
  BookOpen,
  Calendar,
  CircleUserRound,
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
      { label: "Booking Les", icon: Calendar, to: "/teacher/bookings" },
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
          { label: "Hak Akses Guru", to: "/admin/teacher-permissions" },
        ],
      },
      { label: "Tarif Produk", icon: CreditCard, to: "/admin/tutoring-fees" },
      {
        label: "Kurikulum",
        icon: BookMarked,
        items: [
          { label: "Program & Kelas", to: "/admin/programs" },
          { label: "Mata Pelajaran", to: "/admin/subjects" },
          { label: "Mata Pelajaran Guru", to: "/admin/teacher-subjects" },
        ],
      },
      { label: "Daftar Booking", icon: Calendar, to: "/admin/bookings" },
      { label: "Langganan Konten", icon: Sparkles, to: "/admin/subscriptions" },
      { label: "Forum", icon: MessageSquare, to: "/admin/forum" },
      { label: "Dev Tools", icon: DatabaseZap, to: "/admin/dev-reset", devOnly: true },
    ],
  },
]

// mobileTabs: 4 tab bottom-nav mobile per role (tab ke-4 selalu Akun).
// Halaman yang jadi tab disembunyikan dari daftar menu di halaman Akun.
export type MobileTab = {
  label: string
  icon: LucideIcon
  to: string
}

export const mobileTabs: Record<string, MobileTab[]> = {
  student: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/student/dashboard" },
    { label: "Materi", icon: BookMarked, to: "/student/materials" },
    { label: "Forum", icon: MessageSquare, to: "/student/forum" },
    { label: "Akun", icon: CircleUserRound, to: "/account" },
  ],
  teacher: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/teacher/dashboard" },
    { label: "Booking", icon: Calendar, to: "/teacher/bookings" },
    { label: "Forum", icon: MessageSquare, to: "/teacher/forum" },
    { label: "Akun", icon: CircleUserRound, to: "/account" },
  ],
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard" },
    { label: "Booking", icon: Calendar, to: "/admin/bookings" },
    { label: "Langganan", icon: Sparkles, to: "/admin/subscriptions" },
    { label: "Akun", icon: CircleUserRound, to: "/account" },
  ],
}
