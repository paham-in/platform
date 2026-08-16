import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { getMeOptions, getClassesOptions } from "@/lib/api/@tanstack/react-query.gen"
import { homeForRoles } from "@/lib/role"
import Navbar from "@/sections/Navbar"
import Footer from "@/sections/Footer"
import {
  ArrowRight,
  BookOpen,
  BookMarked,
  MessageSquare,
  GraduationCap,
  Video,
  Users,
  BarChart3,
  Shield,
  UserPlus,
  Award,
} from "lucide-react"

const features = [
  { icon: BookOpen, title: "Materi Interaktif", desc: "Konten belajar dengan editor WYSIWIG yang kaya akan format, gambar, dan tabel." },
  { icon: Video, title: "Video Pembelajaran", desc: "Embed video YouTube langsung di materi. Belajar lewat video tanpa ganti platform." },
  { icon: MessageSquare, title: "Forum", desc: "Fiturnya kayak Brainly! Siswa tanya, guru jawab. Dapatkan penjelasan lengkap." },
  { icon: Users, title: "Multi Role", desc: "Tiga peran: Murid, Guru, dan Admin. Masing-masing punya akses sesuai kebutuhan." },
  { icon: BarChart3, title: "Dashboard Personal", desc: "Pantau progress belajar, materi yang sudah dibaca, dan aktivitas terbaru." },
  { icon: Shield, title: "Moderasi Aktif", desc: "Konten terjaga kualitasnya dengan moderasi dari guru dan admin." },
]

const steps = [
  { icon: UserPlus, title: "Daftar Akun", desc: "Buat akun gratis sebagai Murid atau Guru. Hanya perlu email dan nama.", step: "1" },
  { icon: BookOpen, title: "Pilih Materi", desc: "Jelajahi mata pelajaran yang tersedia. Mulai belajar dari materi dan video.", step: "2" },
  { icon: MessageSquare, title: "Forum", desc: "Ada soal sulit? Ajukan pertanyaan di forum, guru kami siap membantu.", step: "3" },
  { icon: Award, title: "Raih Prestasi", desc: "Pantau progress-mu di dashboard. Capai target belajar setiap minggu.", step: "4" },
]

const testimonials = [
  { quote: "Aku jadi paham Matematika berkat penjelasan guru-guru di sini. Forum tanya-jawabnya juga super helpful!", name: "Siti Aisyah", role: "Siswa SMA" },
  { quote: "Sebagai guru, platform ini memudahkan saya membagikan materi dan menjawab pertanyaan siswa secara terstruktur.", name: "Bambang Supriyadi", role: "Guru Matematika" },
  { quote: "Anak saya semangat belajar sejak pakai paham.in. Nilainya naik drastis dalam 2 bulan!", name: "Rina Wijaya", role: "Orang Tua Siswa" },
]

const heroFeatures = [
  { icon: BookOpen, label: "Materi Terstruktur", desc: "Belajar dengan materi yang rapi dan mudah dipahami" },
  { icon: MessageSquare, label: "Forum", desc: "Tanya langsung ke guru, dapatkan jawaban cepat" },
  { icon: GraduationCap, label: "Guru Berpengalaman", desc: "Diajar oleh guru-guru terbaik di bidangnya" },
]

const stats = [
  { label: "Siswa Aktif", value: "10.000+" },
  { label: "Materi Pelajaran", value: "500+" },
  { label: "Guru Berkualitas", value: "200+" },
  { label: "Pertanyaan Terjawab", value: "5.000+" },
]

const fmtRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

// PriceRow: satu baris harga layanan (konten / les privat / les kelompok)
// di dalam kartu kelas. Harga 0/kosong dianggap belum ditentukan.
function PriceRow({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: typeof BookMarked
  label: string
  value?: number
  suffix: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span className="font-medium">
        {value && value > 0 ? `${fmtRp(value)} ${suffix}` : "—"}
      </span>
    </div>
  )
}

// Reveal: satu IntersectionObserver per elemen, sembunyikan hanya saat JS aktif,
// hormati prefers-reduced-motion (lihat CSS). Konten default visible kalau IO tak ada.
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!("IntersectionObserver" in window)) {
      el.dataset.reveal = "shown"
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.reveal = "shown"
          io.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -48px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-reveal="hidden"
      className={className}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

// CountUp: angka statistik naik dari 0 ke nilai target saat masuk viewport.
// Focal moment halaman — bukti "pertumbuhan" yang layak dapat perhatian.
function CountUp({ value }: { value: string }) {
  const [display, setDisplay] = useState("0")
  const ref = useRef<HTMLDivElement>(null)
  const target = Number(value.replace(/\./g, "").replace("+", ""))
  const suffix = value.includes("+") ? "+" : ""

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(target.toLocaleString("id-ID"))
      return
    }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const duration = 1200
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(2, -10 * p) // easeOutExpo
          setDisplay(Math.round(target * eased).toLocaleString("id-ID"))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.5 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [target])

  return (
    <div ref={ref} className="font-heading text-3xl font-bold sm:text-4xl">
      {display}
      {suffix}
    </div>
  )
}

function LandingPage() {
  const navigate = useNavigate()
  const token = typeof window !== "undefined" && localStorage.getItem("token")
  const { data: user, isPending: mePending } = useQuery({ ...getMeOptions(), enabled: !!token, retry: false })
  const { data: classes = [], isLoading: classesLoading } = useQuery(getClassesOptions())
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true

  useEffect(() => {
    if (!isStandalone) return
    if (token && mePending) return
    navigate({ to: user ? homeForRoles(user.roles as string[]) : "/login" })
  }, [isStandalone, token, mePending, user, navigate])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_center,hsl(var(--primary)/0.08),transparent_55%)]"
          />
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <Badge className="animate-fade-up mb-6 rounded-full px-4 py-1.5 text-sm" variant="secondary">
                Platform bimbingan belajar #1 di Indonesia
              </Badge>
              <h1 className="animate-fade-up font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl [animation-delay:0.08s]">
                Belajar Lebih Pintar,
                <br />
                <span className="text-primary">Bersama paham.in</span>
              </h1>
              <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground [animation-delay:0.16s] md:text-xl">
                Platform belajar online dengan materi berkualitas, video interaktif, dan forum tanya-jawab bersama guru berpengalaman. Raih prestasi terbaikmu!
              </p>
              <div className="animate-fade-up mt-8 flex flex-col items-center justify-center gap-4 [animation-delay:0.24s] sm:flex-row">
                <Link to="/login" className={cn(buttonVariants({ size: "lg" }), "group w-full sm:w-auto")}>
                  Mulai Belajar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a href="#features" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "group w-full sm:w-auto")}>
                  Lihat Fitur <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
            <div className="animate-fade-up mt-16 grid gap-4 [animation-delay:0.32s] sm:grid-cols-3">
              {heroFeatures.map((item) => (
                <Card key={item.label} className="group transition-all hover:-translate-y-1 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-heading mb-2 font-semibold">{item.label}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t bg-muted/30 py-20">
          <div className="container mx-auto max-w-7xl px-4">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Semua yang Kamu Butuhkan untuk Belajar
              </h2>
              <p className="mt-4 text-muted-foreground">
                Platform kami menyediakan berbagai fitur untuk mendukung perjalanan belajarmu.
              </p>
            </Reveal>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <Reveal key={f.title} delay={i * 70}>
                  <Card className="group transition-all hover:-translate-y-1 hover:shadow-md">
                    <CardContent className="p-6">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <f.icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-heading mb-2 font-semibold">{f.title}</h3>
                      <p className="text-sm text-muted-foreground">{f.desc}</p>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Kelas & Harga */}
        <section id="classes" className="border-t py-20">
          <div className="container mx-auto max-w-7xl px-4">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Kelas & Harga
              </h2>
              <p className="mt-4 text-muted-foreground">
                Pilih kelas sesuai jenjangmu. Materi, paket soal, dan forum lengkap untuk tiap kelas.
              </p>
            </Reveal>
            {classesLoading ? (
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-2xl" />
                ))}
              </div>
            ) : classes.length > 0 ? (
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {classes.map((cls, i) => (
                  <Reveal key={cls.id ?? cls.slug ?? i} delay={i * 70}>
                    <Card className="group flex h-full flex-col transition-all hover:-translate-y-1 hover:shadow-lg">
                      <CardHeader>
                        <CardTitle className="font-heading text-xl">{cls.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 space-y-3 text-sm">
                        <PriceRow icon={BookMarked} label="Konten" value={cls.content_price} suffix="/ bulan" />
                        <PriceRow icon={GraduationCap} label="Les Privat" value={cls.price_per_session} suffix="/ pertemuan" />
                        <PriceRow icon={Users} label="Les Kelompok" value={cls.group_price} suffix="/ pertemuan" />
                      </CardContent>
                      <CardFooter>
                        <Link to="/login" className={cn(buttonVariants(), "group/cta w-full")}>
                          Mulai Belajar
                          <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" />
                        </Link>
                      </CardFooter>
                    </Card>
                  </Reveal>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {/* Stats */}
        <section className="border-t bg-primary py-16 text-primary-foreground">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((s, i) => (
                <Reveal key={s.label} delay={i * 90} className="text-center">
                  <CountUp value={s.value} />
                  <div className="mt-2 text-sm text-primary-foreground/80">{s.label}</div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20">
          <div className="container mx-auto max-w-7xl px-4">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">Cara Kerja</h2>
              <p className="mt-4 text-muted-foreground">Mulai belajar dalam 4 langkah mudah.</p>
            </Reveal>
            <div className="mt-12 grid gap-8 md:grid-cols-4">
              {steps.map((s, i) => (
                <Reveal key={s.title} delay={i * 70} className="relative text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <s.icon className="h-7 w-7" />
                  </div>
                  <div className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {s.step}
                  </div>
                  <h3 className="font-heading mb-2 font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-t bg-muted/30 py-20">
          <div className="container mx-auto max-w-7xl px-4">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">Apa Kata Mereka?</h2>
              <p className="mt-4 text-muted-foreground">Dengarkan pengalaman pengguna yang sudah belajar bersama kami.</p>
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <Reveal key={t.name} delay={i * 90}>
                  <Card className="group transition-all hover:-translate-y-1 hover:shadow-md">
                    <CardContent className="p-6">
                      <div className="mb-4 text-lg leading-relaxed text-muted-foreground">&ldquo;{t.quote}&rdquo;</div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{t.name}</div>
                          <div className="text-xs text-muted-foreground">{t.role}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t py-20">
          <div className="container mx-auto max-w-7xl px-4">
            <Reveal>
              <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary-foreground)/0.1),transparent_50%)]" />
                <div className="relative">
                  <h2 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                    Siap Meningkatkan Prestasi?
                  </h2>
                  <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">
                    Gabung ribuan siswa lainnya. Mulai belajar gratis sekarang!
                  </p>
                  <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link
                      to="/login"
                      className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "group w-full sm:w-auto")}
                    >
                      Masuk Sekarang <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export const Route = createFileRoute("/")({
  component: LandingPage,
})
