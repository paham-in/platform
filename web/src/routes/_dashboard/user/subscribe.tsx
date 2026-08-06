import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, addDays, addMonths } from "date-fns"
import { postSubscribeMutation } from "@/lib/api/@tanstack/react-query.gen"
import { Check, Sparkles } from "lucide-react"

const PLANS = [
  { id: "monthly", name: "Bulanan", price: 100000, label: "Rp 100.000 / bulan", desc: "Akses semua materi & paket soal selama 1 bulan." },
  { id: "yearly", name: "Tahunan", price: 1000000, label: "Rp 1.000.000 / tahun", desc: "Akses semua materi & paket soal selama 1 tahun. Hemat 2 bulan." },
]

function UserSubscribe() {
  const [plan, setPlan] = useState("monthly")

  const { mutate: subscribe, isPending } = useMutation({
    ...postSubscribeMutation(),
    onSuccess: () => {
      toast.success("Permintaan berlangganan terkirim. Admin akan memverifikasi pembayaran kamu.")
    },
    onError: (err: any) => toast.error(err.error || err.message || "Gagal mengirim permintaan"),
  })

  const handleSubscribe = () => {
    const today = new Date()
    const p = PLANS.find((x) => x.id === plan) ?? PLANS[0]
    const endDate = plan === "yearly" ? addMonths(today, 12) : addMonths(today, 1)
    subscribe({
      body: {
        amount: p.price,
        start_date: format(today, "yyyy-MM-dd"),
        end_date: format(addDays(endDate, -1), "yyyy-MM-dd"),
        note: `Berlangganan ${p.name}`,
      },
    })
  }

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <Link to="/user/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
        ← Kembali
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Berlangganan</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pilih paket untuk membuka semua materi & paket soal premium.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {PLANS.map((p) => (
          <Card
            key={p.id}
            className={`cursor-pointer transition-colors ${plan === p.id ? "border-primary ring-2 ring-primary/30" : "hover:bg-muted/50"}`}
            onClick={() => setPlan(p.id)}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{p.name}</p>
                {plan === p.id && <Check className="h-4 w-4 text-primary" />}
              </div>
              <p className="mt-2 text-xl font-bold">{p.label}</p>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Cara berlangganan</p>
            </div>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Kirim permintaan berlangganan di bawah.</li>
              <li>Bayar sesuai nominal ke admin.</li>
              <li>Admin verifikasi pembayaran → akun kamu aktif sebagai murid.</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSubscribe} disabled={isPending} className="mt-6 w-full">
        {isPending ? "Mengirim..." : "Kirim Permintaan Berlangganan"}
      </Button>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/user/subscribe")({
  component: UserSubscribe,
})
