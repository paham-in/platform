import { createFileRoute, Link } from "@tanstack/react-router"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import Navbar from "@/sections/Navbar"
import Footer from "@/sections/Footer"
import { ArrowRight, BookOpen, MessageSquare, GraduationCap, Video, Users, BarChart3, Shield, UserPlus, Award } from "lucide-react"

const features = [
  { icon: BookOpen, title: "Materi Interaktif", desc: "Konten belajar dengan editor WYSIWIG yang kaya akan format, gambar, dan tabel." },
  { icon: Video, title: "Video Pembelajaran", desc: "Embed video YouTube langsung di materi. Belajar lewat video tanpa ganti platform." },
  { icon: MessageSquare, title: "Forum Tanya-Jawab", desc: "Fiturnya kayak Brainly! Siswa tanya, guru jawab. Dapatkan penjelasan lengkap." },
  { icon: Users, title: "Multi Role", desc: "Tiga peran: Murid, Guru, dan Admin. Masing-masing punya akses sesuai kebutuhan." },
  { icon: BarChart3, title: "Dashboard Personal", desc: "Pantau progress belajar, materi yang sudah dibaca, dan aktivitas terbaru." },
  { icon: Shield, title: "Moderasi Aktif", desc: "Konten terjaga kualitasnya dengan moderasi dari guru dan admin." },
]

const steps = [
  { icon: UserPlus, title: "Daftar Akun", desc: "Buat akun gratis sebagai Murid atau Guru. Hanya perlu email dan nama.", step: "1" },
  { icon: BookOpen, title: "Pilih Materi", desc: "Jelajahi mata pelajaran yang tersedia. Mulai belajar dari materi dan video.", step: "2" },
  { icon: MessageSquare, title: "Tanya & Jawab", desc: "Ada soal sulit? Ajukan pertanyaan di forum, guru kami siap membantu.", step: "3" },
  { icon: Award, title: "Raih Prestasi", desc: "Pantau progress-mu di dashboard. Capai target belajar setiap minggu.", step: "4" },
]

const testimonials = [
  { quote: "Aku jadi paham Matematika berkat penjelasan guru-guru di sini. Forum tanya-jawabnya juga super helpful!", name: "Siti Aisyah", role: "Siswa SMA" },
  { quote: "Sebagai guru, platform ini memudahkan saya membagikan materi dan menjawab pertanyaan siswa secara terstruktur.", name: "Bambang Supriyadi", role: "Guru Matematika" },
  { quote: "Anak saya semangat belajar sejak pakai Bimbel. Nilainya naik drastis dalam 2 bulan!", name: "Rina Wijaya", role: "Orang Tua Siswa" },
]

export const Route = createFileRoute("/")({
  component: () => (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">✨ Platform bimbingan belajar #1 di Indonesia</div>
              <h1 className="animate-fade-in text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Belajar Lebih Pintar,<br /><span className="text-primary">Bersama Bimbel</span></h1>
              <p className="mt-6 animate-fade-in text-lg text-muted-foreground [animation-delay:0.1s] md:text-xl">Platform belajar online dengan materi berkualitas, video interaktif, dan forum tanya-jawab bersama guru berpengalaman. Raih prestasi terbaikmu!</p>
              <div className="mt-8 flex animate-fade-in flex-col items-center justify-center gap-4 [animation-delay:0.2s] sm:flex-row">
                <Link to="/login" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>Mulai Belajar <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}>Lihat Fitur</Link>
              </div>
            </div>
            <div className="mt-16 grid gap-4 sm:grid-cols-3">
              {[{ icon: BookOpen, label: "Materi Terstruktur", desc: "Belajar dengan materi yang rapi dan mudah dipahami" },
                { icon: MessageSquare, label: "Tanya Jawab", desc: "Tanya langsung ke guru, dapatkan jawaban cepat" },
                { icon: GraduationCap, label: "Guru Berpengalaman", desc: "Diajar oleh guru-guru terbaik di bidangnya" }].map((item) => (
                <Card key={item.label} className="group transition-all hover:shadow-lg">
                  <CardContent className="p-(--card-spacing)">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><item.icon className="h-6 w-6" /></div>
                    <h3 className="mb-2 font-semibold">{item.label}</h3>
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
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Semua yang Kamu Butuhkan untuk Belajar</h2>
              <p className="mt-4 text-muted-foreground">Platform kami menyediakan berbagai fitur untuk mendukung perjalanan belajarmu.</p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <Card key={f.title} className="group transition-all hover:shadow-md">
                  <CardContent className="p-(--card-spacing)">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><f.icon className="h-5 w-5" /></div>
                    <h3 className="mb-2 font-semibold">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-t bg-primary py-16 text-primary-foreground">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[{ label: "Siswa Aktif", value: "10.000+" }, { label: "Materi Pelajaran", value: "500+" }, { label: "Guru Berkualitas", value: "200+" }, { label: "Pertanyaan Terjawab", value: "5.000+" }].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl font-bold sm:text-4xl">{s.value}</div>
                  <div className="mt-2 text-sm text-primary-foreground/80">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Cara Kerja</h2>
              <p className="mt-4 text-muted-foreground">Mulai belajar dalam 4 langkah mudah.</p>
            </div>
            <div className="relative mt-12 grid gap-8 md:grid-cols-4">
              {steps.map((s) => (
                <div key={s.title} className="relative text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><s.icon className="h-7 w-7" /></div>
                  <div className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{s.step}</div>
                  <h3 className="mb-2 font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-t bg-muted/30 py-20">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Apa Kata Mereka?</h2>
              <p className="mt-4 text-muted-foreground">Dengarkan pengalaman pengguna yang sudah belajar bersama kami.</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <Card key={t.name} className="group transition-all hover:shadow-md">
                  <CardContent className="p-(--card-spacing)">
                    <div className="mb-4 text-lg leading-relaxed text-muted-foreground">&ldquo;{t.quote}&rdquo;</div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{t.name.charAt(0)}</div>
                      <div><div className="text-sm font-semibold">{t.name}</div><div className="text-xs text-muted-foreground">{t.role}</div></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t py-20">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_hsl(var(--primary-foreground)/0.1),transparent_50%)]" />
              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Siap Meningkatkan Prestasi?</h2>
                <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">Gabung ribuan siswa lainnya. Mulai belajar gratis sekarang!</p>
                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link to="/login" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full sm:w-auto")}>Masuk Sekarang <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  ),
})
