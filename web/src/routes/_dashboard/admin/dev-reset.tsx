import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
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
  postAdminDevCronEvidenceCleanupMutation,
  postAdminDevCronSessionCleanupMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import type { DevresetTableInfo } from "@/lib/api/types.gen"

function DevReset() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery(getAdminDevTablesOptions())
  const [confirmTable, setConfirmTable] = useState<DevresetTableInfo | null>(null)
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

  return (
    <main className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dev Tools</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Utilitas development: trigger cron manual dan hapus data per tabel untuk pengujian E2E.
        </p>
      </div>

      {!isLoading && !enabled && (
        <Card className="max-w-3xl border-destructive/50">
          <CardContent className="py-6 text-sm text-muted-foreground">
            Fitur reset data sedang nonaktif di server. Set <code>DEV_RESET_ENABLED=true</code> di{" "}
            <code>backend/.env</code> lalu restart backend untuk mengaktifkannya.
          </CardContent>
        </Card>
      )}

      {enabled && (
      <Card className="max-w-3xl">
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
          </div>
        </CardContent>
      </Card>
      )}

      {enabled && (
      <Card className="max-w-3xl">
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
                        onClick={() => setConfirmTable(t)}
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

      <AlertDialog open={!!confirmTable} onOpenChange={(open) => !open && setConfirmTable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data tabel ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus semua row di tabel <strong>{confirmTable?.name}</strong> (
              {confirmTable?.rows ?? 0} row)? Tindakan ini tidak bisa dibatalkan.
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
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/dev-reset")({
  component: DevReset,
})
