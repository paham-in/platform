import { useEffect, useState } from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format, addDays, addMonths, parseISO, differenceInCalendarDays } from "date-fns"
import { BookMarked, GraduationCap, School } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  getClassesOptions,
  getInvoicesQueryKey,
  getStudentClassesOptions,
  postSubscribeMutation,
} from "@/lib/api/@tanstack/react-query.gen"

const DURATIONS = [
  { label: "1 bulan", value: "1" },
  { label: "3 bulan", value: "3" },
  { label: "6 bulan", value: "6" },
  { label: "12 bulan", value: "12" },
]

const fmtRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

function StudentSubscribe() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: classes = [], isLoading: classesLoading } = useQuery(getClassesOptions())
  const { data: myClasses = [] } = useQuery(getStudentClassesOptions())

  const [classId, setClassId] = useState("")
  const [duration, setDuration] = useState("1")

  // default kelas: yang sudah diakses student (kalau ada), else kelas pertama
  useEffect(() => {
    if (classId || classes.length === 0) return
    const preferred = myClasses
      .map((c) => String(c.class_id))
      .find((id) => classes.some((c) => String(c.id) === id))
    setClassId(preferred ?? String(classes[0].id ?? ""))
  }, [classId, classes, myClasses])

  const cls = classes.find((c) => String(c.id) === classId)
  const months = Number(duration)
  const contentPrice = cls?.content_price ?? 0
  const privatePrice = cls?.price_per_session ?? 0
  const groupPrice = cls?.group_price ?? 0

  // Tanggal masa aktif baru (sebelum memperhitungkan perpanjangan dari akses lama)
  const today = new Date()
  const end = addDays(addMonths(today, months), -1)
  const todayStr = format(today, "yyyy-MM-dd")
  const endStr = format(end, "yyyy-MM-dd")

  // Perpanjangan: kalau akses kelas ini masih aktif, expiry baru = expiry lama
  // + durasi invoice (mirror logika backend invoice.ToggleStatus).
  const myClass = myClasses.find((c) => String(c.class_id) === classId)
  const currentExpiry = myClass?.expiry
  const hasActiveAccess = !!currentExpiry && currentExpiry >= todayStr
  const durationDays = differenceInCalendarDays(end, today)
  const resultExpiry = hasActiveAccess
    ? format(addDays(parseISO(currentExpiry), durationDays), "yyyy-MM-dd")
    : endStr

  const subscribe = useMutation({
    ...postSubscribeMutation(),
    onSuccess: () => {
      toast.success("Permintaan langganan konten terkirim. Menunggu verifikasi admin.")
      qc.invalidateQueries({ queryKey: getInvoicesQueryKey() })
      navigate({ to: "/student/payments" })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal mengirim permintaan langganan"),
  })

  const handleSubscribe = () => {
    if (!cls || contentPrice <= 0) return
    subscribe.mutate({
      body: {
        amount: contentPrice * months,
        start_date: todayStr,
        end_date: endStr,
        note: `Langganan konten ${cls.name} — ${months} bulan`,
        class_id: cls.id,
      },
    })
  }

  return (
    <main className="p-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Langganan</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Pilih kelas & produk. Setelah pembayaran diverifikasi admin, akses kelas kamu aktif.
      </p>

      {classesLoading ? (
        <Skeleton className="h-48 w-full max-w-3xl" />
      ) : classes.length === 0 ? (
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon"><School /></EmptyMedia>
            <EmptyTitle>Belum ada kelas</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex max-w-3xl flex-col gap-6">
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="subscribe-class">Kelas</Label>
            <Select
              items={classes.map((c) => ({ label: c.name, value: String(c.id) }))}
              value={classId}
              onValueChange={(v) => setClassId(v ?? "")}
            >
              <SelectTrigger id="subscribe-class" className="w-full" size="sm">
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Konten */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookMarked className="h-5 w-5" /> Konten</CardTitle>
                <CardDescription>Materi, paket soal & forum — tanpa les privat.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contentPrice > 0 ? (
                  <>
                    <div>
                      <p className="text-3xl font-bold">{fmtRp(contentPrice)}</p>
                      <p className="text-sm text-muted-foreground">/ bulan</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="subscribe-duration">Durasi</Label>
                      <Select items={DURATIONS} value={duration} onValueChange={(v) => setDuration(v ?? "1")}>
                        <SelectTrigger id="subscribe-duration" className="w-full" size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATIONS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Akses berlaku s.d.{" "}
                      <span className="font-medium text-foreground">{format(parseISO(resultExpiry), "dd MMM yyyy")}</span>
                      {hasActiveAccess && " (perpanjangan dari akses saat ini)"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Harga untuk kelas ini belum ditentukan.</p>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{contentPrice > 0 ? fmtRp(contentPrice * months) : "—"}</p>
                </div>
                <Button onClick={handleSubscribe} disabled={contentPrice <= 0 || subscribe.isPending}>
                  {subscribe.isPending ? <Spinner /> : "Langganan"}
                </Button>
              </CardFooter>
            </Card>

            {/* Les Privat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Les Privat</CardTitle>
                <CardDescription>Belajar 1-on-1 / kelompok dengan guru. Harga per pertemuan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {privatePrice > 0 || groupPrice > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Private</span>
                      <span className="font-medium">{privatePrice > 0 ? `${fmtRp(privatePrice)} / pertemuan` : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Kelompok</span>
                      <span className="font-medium">{groupPrice > 0 ? `${fmtRp(groupPrice)} / pertemuan` : "—"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Invoice dibuat otomatis saat booking disetujui — lanjutkan lewat alur Les Privat.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Harga untuk kelas ini belum ditentukan.</p>
                )}
              </CardContent>
              <CardFooter>
                <Link to="/student/tutoring/new" className="w-full">
                  <Button className="w-full" variant="outline">Booking Les Privat</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/student/subscribe")({
  component: StudentSubscribe,
})
