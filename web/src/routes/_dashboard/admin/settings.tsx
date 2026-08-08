import { useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  getAdminSettingsOptions,
  getAdminSettingsQueryKey,
  patchAdminSettingsMutation,
  getAdminClassesOptions,
  getAdminClassesQueryKey,
  patchAdminClassesByIdMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import type { ClassClassResponse } from "@/lib/api/types.gen"

const fmtRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

function AdminSettings() {
  const qc = useQueryClient()
  const { data: settings, isLoading: settingsLoading } = useQuery(getAdminSettingsOptions())
  const { data: classes = [], isLoading: classesLoading } = useQuery(getAdminClassesOptions())

  const [fee, setFee] = useState("")
  const [settingsInitialized, setSettingsInitialized] = useState(false)
  // harga per kelas, keyed by class id
  const [classPrices, setClassPrices] = useState<Record<number, { private: string; semi: string }>>({})

  useEffect(() => {
    if (settings && !settingsInitialized) {
      setFee(settings.teacher_fee_percent ?? "")
      setSettingsInitialized(true)
    }
  }, [settings, settingsInitialized])

  useEffect(() => {
    if (classes.length === 0) return
    setClassPrices((prev) => {
      const next = { ...prev }
      for (const c of classes) {
        if (c.id !== undefined && !(c.id in next)) {
          next[c.id] = {
            private: c.price_per_session?.toString() ?? "",
            semi: c.semi_private_price?.toString() ?? "",
          }
        }
      }
      return next
    })
  }, [classes])

  const saveSettings = useMutation({
    ...patchAdminSettingsMutation(),
    onSuccess: () => {
      toast.success("Pengaturan disimpan")
      qc.invalidateQueries({ queryKey: getAdminSettingsQueryKey() })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menyimpan pengaturan"),
  })

  const saveClass = useMutation({
    ...patchAdminClassesByIdMutation(),
    onSuccess: () => {
      toast.success("Harga kelas diperbarui")
      qc.invalidateQueries({ queryKey: getAdminClassesQueryKey() })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal mengubah harga kelas"),
  })

  const handleSaveClass = (cls: ClassClassResponse) => {
    const row = classPrices[cls.id!]
    if (!row) return
    saveClass.mutate({
      path: { id: cls.id! },
      body: {
        name: cls.name,
        price_per_session: row.private === "" ? undefined : Number(row.private),
        semi_private_price: row.semi === "" ? undefined : Number(row.semi),
      },
    })
  }

  const isLoading = settingsLoading

  // fee guru utk 1 pertemuan: harga × persentase fee. Live dari state input
  // harga & persentase, jadi admin lihat preview sebelum simpan.
  const feePct = Number(fee) || 0
  const teacherFee = (price: string) => {
    const p = Number(price)
    if (!p || !feePct) return 0
    return Math.round((p * feePct) / 100)
  }

  return (
    <main className="p-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Pengaturan</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Konfigurasi biaya les privat. Isi harga untuk tiap kelas — dipakai saat murid booking les.
      </p>

      <div className="flex max-w-2xl flex-col gap-6">
        {/* Fee Guru */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Guru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="flex items-end gap-3">
                <div className="space-y-2">
                  <Label htmlFor="fee">Persentase fee guru per sesi</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="fee"
                      type="number"
                      min="0"
                      max="100"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      className="w-28"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <Button onClick={() => saveSettings.mutate({ body: { teacher_fee_percent: fee } })} disabled={saveSettings.isPending}>
                  {saveSettings.isPending ? <Spinner /> : "Simpan"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Harga per Kelas */}
        <Card className="gap-0 pb-0 pt-0">
          <CardHeader>
            <CardTitle>Harga per Kelas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Kelas</TableHead>
                  <TableHead>Private (Rp)</TableHead>
                  <TableHead>Semi Private (Rp)</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="pl-6"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                      <TableCell className="pr-6 text-right"><Skeleton className="ml-auto h-8 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : classes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-8 text-center text-muted-foreground">
                      Belum ada kelas.
                    </TableCell>
                  </TableRow>
                ) : (
                  classes.map((cls) => {
                    const row = classPrices[cls.id!]
                    return (
                      <TableRow key={cls.id}>
                        <TableCell className="pl-6 font-medium">{cls.name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            className="h-8 w-32"
                            value={row?.private ?? ""}
                            onChange={(e) =>
                              setClassPrices((prev) => ({
                                ...prev,
                                [cls.id!]: { private: e.target.value, semi: prev[cls.id!]?.semi ?? "" },
                              }))
                            }
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            Fee guru: {fmtRp(teacherFee(row?.private ?? ""))}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            className="h-8 w-32"
                            value={row?.semi ?? ""}
                            onChange={(e) =>
                              setClassPrices((prev) => ({
                                ...prev,
                                [cls.id!]: { private: prev[cls.id!]?.private ?? "", semi: e.target.value },
                              }))
                            }
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            Fee guru: {fmtRp(teacherFee(row?.semi ?? ""))}
                          </p>
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveClass(cls)}
                            disabled={saveClass.isPending || !row}
                          >
                            Simpan
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
            <p className="p-4 text-xs text-muted-foreground">
              Kosongkan bila belum ditentukan.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/settings")({
  component: AdminSettings,
})
