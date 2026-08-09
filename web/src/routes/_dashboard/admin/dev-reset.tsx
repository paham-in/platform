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

  return (
    <main className="p-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Reset Data</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Hapus semua row per tabel untuk pengujian E2E dari data bersih. Hanya untuk development.
      </p>

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
            <Button variant="outline" onClick={() => setConfirmTable(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleReset} disabled={reset.isPending}>
              {reset.isPending ? <Spinner /> : "Hapus Semua"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/dev-reset")({
  component: DevReset,
})
