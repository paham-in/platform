import { useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { School } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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

const fmtRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`
// 0 = belum ditentukan → tampil kosong
const priceStr = (n?: number) => (n ? n.toString() : "")
// "" → 0 (reset), angka valid → number, selainnya → null (invalid)
const priceNum = (s: string): number | null => {
  const t = s.trim()
  if (t === "") return 0
  const n = Number(t)
  return Number.isFinite(n) && n >= 0 ? n : null
}
// 0 (atau kosong) = belum ditentukan → kanonik "". Buat "0" setara server 0.
const priceNorm = (s: string) => (priceNum(s) === 0 ? "" : s)

function AdminSettings() {
  const qc = useQueryClient()
  const { data: settings, isLoading: settingsLoading } = useQuery(getAdminSettingsOptions())
  const { data: classes = [], isLoading: classesLoading } = useQuery(getAdminClassesOptions())

  const [fee, setFee] = useState("")
  const [settingsInitialized, setSettingsInitialized] = useState(false)
  // harga per kelas, keyed by class id
  const [classPrices, setClassPrices] = useState<Record<number, { private: string; group: string }>>({})

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
            private: priceStr(c.price_per_session),
            group: priceStr(c.group_price),
          }
        }
      }
      return next
    })
  }, [classes])

  const saveSettings = useMutation({
    ...patchAdminSettingsMutation(),
    onSuccess: () => {
      toast.success("Fee guru disimpan")
      qc.invalidateQueries({ queryKey: getAdminSettingsQueryKey() })
    },
    onError: (err: any) => toast.error(err?.error || "Gagal menyimpan fee guru"),
  })

  const saveClass = useMutation({
    ...patchAdminClassesByIdMutation(),
  })

  // kelas yang harganya beda dari nilai server → yang perlu disimpan
  const dirtyClasses = classes.filter((c) => {
    const row = classPrices[c.id!]
    if (!row) return false
    return priceNorm(row.private) !== priceStr(c.price_per_session) || priceNorm(row.group) !== priceStr(c.group_price)
  })

  const hasInvalidPrice = dirtyClasses.some((c) => {
    const row = classPrices[c.id!]
    return priceNum(row?.private ?? "") === null || priceNum(row?.group ?? "") === null
  })

  const handleSaveAll = async () => {
    if (dirtyClasses.length === 0) return
    try {
      await Promise.all(
        dirtyClasses.map((cls) => {
          const row = classPrices[cls.id!]
          return saveClass.mutateAsync({
            path: { id: cls.id! },
            body: {
              name: cls.name,
              price_per_session: priceNum(row.private)!,
              group_price: priceNum(row.group)!,
            },
          })
        })
      )
      toast.success("Harga kelas diperbarui")
      qc.invalidateQueries({ queryKey: getAdminClassesQueryKey() })
    } catch (err: any) {
      toast.error(err?.error || "Gagal mengubah harga kelas")
    }
  }

  const isLoading = settingsLoading

  const feeNum = Number(fee)
  const feeInvalid = fee.trim() === "" || !Number.isFinite(feeNum) || feeNum < 0 || feeNum > 100

  // fee guru utk 1 pertemuan: harga × persentase fee. Live dari state input
  // harga & persentase, jadi admin lihat preview sebelum simpan.
  const teacherFee = (price: string) => {
    const p = Number(price)
    if (!p || !feeNum) return 0
    return Math.round((p * feeNum) / 100)
  }

  return (
    <main className="p-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Tarif & Fee Guru</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Konfigurasi biaya les privat. Isi harga untuk tiap kelas — dipakai saat murid booking les.
      </p>

      <div className="flex max-w-2xl flex-col gap-6">
        {/* Fee Guru */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Guru</CardTitle>
            <CardDescription>Persentase dari harga kelas yang menjadi fee guru per pertemuan.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="max-w-xs space-y-2">
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
                    aria-invalid={feeInvalid}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                {feeInvalid && <p className="text-xs text-destructive">Masukkan angka 0–100.</p>}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <div className="flex w-full items-center justify-end">
              <Button
                onClick={() => saveSettings.mutate({ body: { teacher_fee_percent: fee } })}
                disabled={feeInvalid || saveSettings.isPending}
              >
                {saveSettings.isPending && <Spinner />}
                Simpan Fee
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Harga per Kelas */}
        <Card>
          <CardHeader>
            <CardTitle>Harga per Kelas</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-(--card-spacing)">Kelas</TableHead>
                  <TableHead>Private (Rp)</TableHead>
                  <TableHead className="pr-(--card-spacing)">Kelompok (Rp)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="pl-(--card-spacing)"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                      <TableCell className="pr-(--card-spacing)"><Skeleton className="h-8 w-28" /></TableCell>
                    </TableRow>
                  ))
                ) : classes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Empty className="border-0 p-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><School /></EmptyMedia>
                          <EmptyTitle>Belum ada kelas</EmptyTitle>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  classes.map((cls) => {
                    const row = classPrices[cls.id!]
                    const pv = row?.private ?? ""
                    const gv = row?.group ?? ""
                    const pvValid = priceNum(pv) !== null
                    const gvValid = priceNum(gv) !== null
                    return (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium pl-(--card-spacing)">{cls.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              min="0"
                              className="h-8 w-32"
                              value={pv}
                              aria-label={`Harga les privat ${cls.name}`}
                              aria-invalid={!pvValid}
                              onChange={(e) =>
                                setClassPrices((prev) => ({
                                  ...prev,
                                  [cls.id!]: { private: e.target.value, group: prev[cls.id!]?.group ?? "" },
                                }))
                              }
                            />
                            {pvValid && Number(pv) > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Fee guru: {fmtRp(teacherFee(pv))}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              min="0"
                              className="h-8 w-32"
                              value={gv}
                              aria-label={`Harga kelompok ${cls.name}`}
                              aria-invalid={!gvValid}
                              onChange={(e) =>
                                setClassPrices((prev) => ({
                                  ...prev,
                                  [cls.id!]: { private: prev[cls.id!]?.private ?? "", group: e.target.value },
                                }))
                              }
                            />
                            {gvValid && Number(gv) > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Fee guru: {fmtRp(teacherFee(gv))}
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="flex w-full items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Kosongkan untuk harga yang belum ditentukan.
              </p>
              <Button
                onClick={handleSaveAll}
                disabled={saveClass.isPending || dirtyClasses.length === 0 || hasInvalidPrice}
              >
                {saveClass.isPending && <Spinner />}
                Simpan{dirtyClasses.length > 0 ? ` (${dirtyClasses.length})` : ""}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/tutoring-fees")({
  component: AdminSettings,
})
