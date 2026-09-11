import { useState, useEffect } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"
import { client } from "@/lib/api/client.gen"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  deleteAdminDevTablesByTableMutation,
  getAdminDevTablesOptions,
  getAdminDevTablesQueryKey,
  postAdminDevCronCancelledBookingCleanupMutation,
  postAdminDevCronEvidenceCleanupMutation,
  postAdminDevCronNotificationCleanupMutation,
  postAdminDevCronSessionCleanupMutation,
  postAdminDevCronTempImageCleanupMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import type { DevresetTableInfo } from "@/lib/api/types.gen"

const devResetSearchSchema = z.object({
  modal: z.string().optional(),
})

interface ServerTime {
  server_time?: string;
  server_zone?: string;
  db_time?: string;
  db_timezone?: string;
}

function fmtClock(iso?: string) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "medium" })
}

function DevReset() {
  const qc = useQueryClient()
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()
  const { data, isLoading } = useQuery(getAdminDevTablesOptions())
  const [confirmTable, setConfirmTable] = useState<DevresetTableInfo | null>(null)

  // Jam backend + database (manual: generator SDK rusak di TS7).
  // Refetch otomatis saat tab kembali fokus.
  const { data: clock } = useQuery({
    queryKey: ["admin", "dev-time"],
    queryFn: async ({ signal }) => {
      const { data } = await client.get({
        security: [{ name: "Authorization", type: "apiKey" }],
        url: "/admin/dev/time",
        signal,
        throwOnError: true,
      })
      return data as ServerTime
    },
  })

  useEffect(() => {
    if (modal !== "reset") setConfirmTable(null)
  }, [modal])

  const enabled = data?.enabled ?? false
  const tables = data?.tables ?? []

  const reset = useMutation({
    ...deleteAdminDevTablesByTableMutation(),
    onSuccess: (data) => {
      toast.success(data.message || `Data ${data.table ?? "tabel"} dihapus`)
      qc.invalidateQueries({ queryKey: getAdminDevTablesQueryKey() })
      setConfirmTable(null)
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menghapus data"),
  })

  const handleReset = () => {
    if (!confirmTable?.name) return
    reset.mutate({ path: { table: confirmTable.name } })
  }

  const runSessionCleanup = useMutation({
    ...postAdminDevCronSessionCleanupMutation(),
    onSuccess: (data) => {
      toast.success(data.message || "Pembersihan sesi selesai")
      qc.invalidateQueries({ queryKey: getAdminDevTablesQueryKey() })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menjalankan job"),
  })

  const runEvidenceCleanup = useMutation({
    ...postAdminDevCronEvidenceCleanupMutation(),
    onSuccess: (data) => {
      toast.success(data.message || "Pembersihan bukti selesai")
      qc.invalidateQueries({ queryKey: getAdminDevTablesQueryKey() })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menjalankan job"),
  })

  const runTempImageCleanup = useMutation({
    ...postAdminDevCronTempImageCleanupMutation(),
    onSuccess: (data) => {
      toast.success(data.message || "Pembersihan gambar temp selesai")
      qc.invalidateQueries({ queryKey: getAdminDevTablesQueryKey() })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menjalankan job"),
  })

  const runNotificationCleanup = useMutation({
    ...postAdminDevCronNotificationCleanupMutation(),
    onSuccess: (data) => {
      toast.success(data.message || "Pembersihan notifikasi selesai")
      qc.invalidateQueries({ queryKey: getAdminDevTablesQueryKey() })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menjalankan job"),
  })

  const runCancelledBookingCleanup = useMutation({
    ...postAdminDevCronCancelledBookingCleanupMutation(),
    onSuccess: (data) => {
      toast.success(data.message || "Pembersihan riwayat booking selesai")
      qc.invalidateQueries({ queryKey: getAdminDevTablesQueryKey() })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menjalankan job"),
  })

  return (
    <main className="flex flex-col gap-4 p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dev Tools</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Utilitas development: trigger cron manual dan hapus data per tabel untuk pengujian E2E.
        </p>
      </div>

      {clock && (
        <Card>
          <CardHeader>
            <CardTitle>Jam Server</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Backend (Go)</p>
              <p className="mt-0.5 font-medium tabular-nums">{fmtClock(clock.server_time)}</p>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant="secondary">{clock.server_zone || "?"}</Badge>
                <code>{clock.server_time}</code>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Database</p>
              <p className="mt-0.5 font-medium tabular-nums">{fmtClock(clock.db_time)}</p>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant="secondary">{clock.db_timezone || "?"}</Badge>
                <code>{clock.db_time}</code>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !enabled && (
        <Card className="border-destructive/50">
          <CardContent className="py-6 text-sm text-muted-foreground">
            Fitur reset data sedang nonaktif di server. Set <code>DEV_RESET_ENABLED=true</code> di{" "}
            <code>backend/.env</code> lalu restart backend untuk mengaktifkannya.
          </CardContent>
        </Card>
      )}

      {enabled && (
      <Card>
        <CardHeader>
          <CardTitle>Cron / Pekerjaan Background</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium">Bersihkan Sesi Kedaluwarsa</p>
                <p className="text-xs text-muted-foreground">
                  Hapus sesi login yang sudah lewat masa berlaku. Berjalan otomatis tiap 1 jam.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runSessionCleanup.mutate({})}
                disabled={runSessionCleanup.isPending}
              >
                {runSessionCleanup.isPending && <Spinner />}
                Jalankan Sekarang
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium">Bersihkan Bukti Kehadiran Lama</p>
                <p className="text-xs text-muted-foreground">
                  Hapus bukti kehadiran approved yang melewati masa simpan dari storage. Berjalan otomatis tiap 24 jam.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runEvidenceCleanup.mutate({})}
                disabled={runEvidenceCleanup.isPending}
              >
                {runEvidenceCleanup.isPending && <Spinner />}
                Jalankan Sekarang
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium">Bersihkan Gambar Temp</p>
                <p className="text-xs text-muted-foreground">
                  Hapus gambar temp (upload yang tidak di-submit) yang berumur lebih dari 24 jam. Berjalan otomatis tiap 24 jam.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runTempImageCleanup.mutate({})}
                disabled={runTempImageCleanup.isPending}
              >
                {runTempImageCleanup.isPending && <Spinner />}
                Jalankan Sekarang
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium">Bersihkan Notifikasi Lama</p>
                <p className="text-xs text-muted-foreground">
                  Hapus notifikasi yang sudah dibaca dan berumur lebih dari 7 hari. Berjalan otomatis tiap 24 jam.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runNotificationCleanup.mutate({})}
                disabled={runNotificationCleanup.isPending}
              >
                {runNotificationCleanup.isPending && <Spinner />}
                Jalankan Sekarang
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium">Bersihkan Riwayat Booking Batal</p>
                <p className="text-xs text-muted-foreground">
                  Hapus permanen booking cancelled/rejected yang berumur lebih dari 7 hari beserta sesi & invoice terkait. Berjalan otomatis tiap 24 jam.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runCancelledBookingCleanup.mutate({})}
                disabled={runCancelledBookingCleanup.isPending}
              >
                {runCancelledBookingCleanup.isPending && <Spinner />}
                Jalankan Sekarang
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {enabled && (
      <Card>
        <CardHeader>
          <CardTitle>Daftar Tabel</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-(--card-spacing)">Tabel</TableHead>
                <TableHead>Jumlah Row</TableHead>
                <TableHead className="pr-(--card-spacing)">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="pl-(--card-spacing)"><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="pr-(--card-spacing)"><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : (
                tables.map((t) => (
                  <TableRow key={t.name}>
                    <TableCell className="pl-(--card-spacing)">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{t.label}</span>
                          {t.protected && <Badge variant="secondary">Dilindungi</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                        <code className="text-xs text-muted-foreground/70">{t.name}</code>
                      </div>
                    </TableCell>
                    <TableCell>{t.rows ?? 0}</TableCell>
                    <TableCell className="pr-(--card-spacing)">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={t.protected || reset.isPending}
                        onClick={() => { setConfirmTable(t); openModal("reset") }}
                      >
                        Hapus
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      )}
      </div>

      {modal === "reset" && confirmTable && (
      <AlertDialog open onOpenChange={(o) => !o && closeModal()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data tabel ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus semua row di tabel <strong>{confirmTable.name}</strong> (
              {confirmTable.rows ?? 0} row)? Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleReset} disabled={reset.isPending}>
              {reset.isPending && <Spinner />}
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      )}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/dev-reset")({
  component: DevReset,
  validateSearch: devResetSearchSchema,
})
