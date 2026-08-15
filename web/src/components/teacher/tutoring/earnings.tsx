import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getTutoringEarningsOptions, getTutoringEarningsQueryKey, patchTutoringEarningsTakenMutation } from "@/lib/api/@tanstack/react-query.gen"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CheckCheck, Clock3, RotateCcw } from "lucide-react"
import { toast } from "sonner"

const fmtRp = (n?: number) => `Rp ${(n ?? 0).toLocaleString("id-ID")}`

function feeBadge(paid?: boolean) {
  if (paid) return <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Sudah Dibayar</span>
  return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Belum Dibayar</span>
}

function takenBadge(taken?: boolean) {
  if (taken) return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Sudah Diambil</span>
  return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">Belum Diambil</span>
}

function modeBadge(mode?: string) {
  if (mode === "group") {
    return <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">Kelompok</span>
  }
  return <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">Private</span>
}

export function Earnings() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery(getTutoringEarningsOptions())
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const { mutate: markTaken, isPending } = useMutation({
    ...patchTutoringEarningsTakenMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getTutoringEarningsQueryKey() })
      setSelected(new Set())
      toast.success("Status fee diperbarui")
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal memperbarui status"),
  })

  const sessions = data?.sessions ?? []
  const selectable = sessions.filter((s) => s.fee_paid)
  const allSelected = selectable.length > 0 && selectable.every((s) => selected.has(s.id!))

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(selectable.map((s) => s.id!)))
    }
  }

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const applyTaken = (taken: boolean) => {
    markTaken({ body: { session_ids: Array.from(selected), taken } })
  }

  const summary = [
    { label: "Total Sesi Selesai", value: String(data?.total_sessions ?? 0), className: "text-foreground" },
    { label: "Total Pendapatan", value: fmtRp(data?.total_fee), className: "text-green-600" },
    { label: "Sudah Dibayar", value: fmtRp(data?.fee_paid_total), className: "text-green-600" },
    { label: "Saldo Tersedia", value: fmtRp(data?.fee_available_total), className: "text-primary" },
    { label: "Sudah Diambil", value: fmtRp(data?.fee_taken_total), className: "text-muted-foreground" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {summary.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <span className={`text-2xl font-bold ${s.className}`}>{s.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="pt-0 gap-0 pb-0">
        <div className="flex flex-wrap items-center gap-2 border-b px-6 py-3">
          <p className="mr-auto text-sm text-muted-foreground">
            {selected.size > 0 ? `${selected.size} sesi dipilih` : "Centang sesi yang feenya sudah kamu ambil"}
          </p>
          {selected.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button size="sm" variant="outline" disabled={isPending} />}>
                {isPending && <Spinner />}
                Aksi ({selected.size})
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => applyTaken(true)}>
                  <CheckCheck className="h-4 w-4" /> Tandai Sudah Diambil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyTaken(false)}>
                  <RotateCcw className="h-4 w-4" /> Batalkan Tandai
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-12 pl-6">
                  {selectable.length > 0 && (
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} disabled={isPending} aria-label="Pilih semua" />
                  )}
                </TableHead>
                <TableHead>Murid</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead className="pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Empty className="border-0 p-8">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><Clock3 /></EmptyMedia>
                        <EmptyTitle>Belum ada sesi yang selesai</EmptyTitle>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="pl-6">
                    <Checkbox
                      checked={selected.has(s.id!)}
                      onCheckedChange={() => toggleOne(s.id!)}
                      disabled={!s.fee_paid || isPending}
                      aria-label={`Pilih sesi ${s.student_name ?? s.id}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{s.student_name ?? "—"}</TableCell>
                  <TableCell>{modeBadge(s.mode)}</TableCell>
                  <TableCell>{s.date}</TableCell>
                  <TableCell className="tabular-nums">{s.start_time} – {s.end_time}</TableCell>
                  <TableCell className="tabular-nums font-medium">{fmtRp(s.fee_amount)}</TableCell>
                  <TableCell className="pr-6">
                    <div className="flex flex-col items-start gap-1">
                      {feeBadge(s.fee_paid)}
                      {s.fee_paid && takenBadge(s.fee_taken)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}