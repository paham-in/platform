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
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePageTitle } from "@/components/page-title"
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

type TutoringPrices = Record<number, { private: string; group: string }>

function AdminSettings() {
  usePageTitle("Tarif Produk")
  const qc = useQueryClient()
  const { data: settings, isLoading: settingsLoading } = useQuery(getAdminSettingsOptions())
  const { data: classes = [], isLoading: classesLoading } = useQuery(getAdminClassesOptions())

  const [fee, setFee] = useState("")
  const [settingsInitialized, setSettingsInitialized] = useState(false)
  // harga les privat per kelas, keyed by class id
  const [tutoringPrices, setTutoringPrices] = useState<TutoringPrices>({})
  // harga konten per kelas, keyed by class id
  const [contentPrices, setContentPrices] = useState<Record<number, string>>({})
  // allow tutoring per kelas, keyed by class id
  const [allowTutoring, setAllowTutoring] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (settings && !settingsInitialized) {
      setFee(settings.teacher_fee_percent ?? "")
      setSettingsInitialized(true)
    }
  }, [settings, settingsInitialized])

  useEffect(() => {
    if (classes.length === 0) return
    setTutoringPrices((prev) => {
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

  useEffect(() => {
    if (classes.length === 0) return
    setContentPrices((prev) => {
      const next = { ...prev }
      for (const c of classes) {
        if (c.id !== undefined && !(c.id in next)) {
          next[c.id] = priceStr(c.content_price)
        }
      }
      return next
    })
    setAllowTutoring((prev) => {
      const next = { ...prev }
      for (const c of classes) {
        if (c.id !== undefined && !(c.id in next)) {
          next[c.id] = c.allow_tutoring !== false
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

  const saveTutoring = useMutation({
    ...patchAdminClassesByIdMutation(),
  })

  const saveContent = useMutation({
    ...patchAdminClassesByIdMutation(),
  })

  // kelas yang harganya beda dari nilai server → yang perlu disimpan (hanya kelas yang allow tutoring)
  const dirtyTutoringClasses = classes.filter((c) => {
    if (allowTutoring[c.id!] === false) return false
    const row = tutoringPrices[c.id!]
    if (!row) return false
    return priceNorm(row.private) !== priceStr(c.price_per_session) || priceNorm(row.group) !== priceStr(c.group_price)
  })

  const dirtyContentClasses = classes.filter((c) => {
    const v = contentPrices[c.id!]
    if (v === undefined) return false
    return priceNorm(v) !== priceStr(c.content_price)
  })

  const hasInvalidTutoringPrice = dirtyTutoringClasses.some((c) => {
    const row = tutoringPrices[c.id!]
    return priceNum(row?.private ?? "") === null || priceNum(row?.group ?? "") === null
  })

  // kelas yang allow_tutoring-nya berubah dari nilai server
  const dirtyAllowTutoringClasses = classes.filter((c) => {
    const local = allowTutoring[c.id!]
    if (local === undefined) return false
    return local !== (c.allow_tutoring !== false)
  })

  const hasInvalidContentPrice = dirtyContentClasses.some((c) => {
    const v = contentPrices[c.id!]
    return v !== undefined && priceNum(v) === null
  })

  const handleSaveTutoring = async () => {
    // kumpulkan semua kelas yang perlu di-update (harga ATAU allow_tutoring berubah)
    const toUpdate = classes.filter((c) => {
      const priceDirty = allowTutoring[c.id!] !== false && (() => {
        const row = tutoringPrices[c.id!]
        if (!row) return false
        return priceNorm(row.private) !== priceStr(c.price_per_session) || priceNorm(row.group) !== priceStr(c.group_price)
      })()
      const allowDirty = allowTutoring[c.id!] !== undefined && allowTutoring[c.id!] !== (c.allow_tutoring !== false)
      return priceDirty || allowDirty
    })
    if (toUpdate.length === 0) return
    try {
      await Promise.all(
        toUpdate.map((cls) => {
          const body: Record<string, unknown> = { name: cls.name }
          // allow_tutoring berubah → sertakan
          if (allowTutoring[cls.id!] !== undefined && allowTutoring[cls.id!] !== (cls.allow_tutoring !== false)) {
            body.allow_tutoring = allowTutoring[cls.id!]
          }
          // harga berubah (hanya jika allow_tutoring masih true) → sertakan
          if (allowTutoring[cls.id!] !== false) {
            const row = tutoringPrices[cls.id!]
            if (row) {
              const pvDirty = priceNorm(row.private) !== priceStr(cls.price_per_session)
              const gvDirty = priceNorm(row.group) !== priceStr(cls.group_price)
              if (pvDirty) body.price_per_session = priceNum(row.private)!
              if (gvDirty) body.group_price = priceNum(row.group)!
            }
          }
          return saveTutoring.mutateAsync({ path: { id: cls.id! }, body })
        })
      )
      toast.success("Pengaturan les diperbarui")
      qc.invalidateQueries({ queryKey: getAdminClassesQueryKey() })
    } catch (err: any) {
      toast.error(err?.error || "Gagal mengubah pengaturan les")
    }
  }

  const handleSaveContent = async () => {
    if (dirtyContentClasses.length === 0) return
    try {
      await Promise.all(
        dirtyContentClasses.map((cls) => {
          const v = contentPrices[cls.id!]
          return saveContent.mutateAsync({
            path: { id: cls.id! },
            body: { name: cls.name, content_price: priceNum(v)! },
          })
        })
      )
      toast.success("Harga konten diperbarui")
      qc.invalidateQueries({ queryKey: getAdminClassesQueryKey() })
    } catch (err: any) {
      toast.error(err?.error || "Gagal mengubah harga konten")
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

  const emptyState = (colSpan: number) => (
    <TableRow>
      <TableCell colSpan={colSpan}>
        <Empty className="border-0 p-8">
          <EmptyHeader>
            <EmptyMedia variant="icon"><School /></EmptyMedia>
            <EmptyTitle>Belum ada kelas</EmptyTitle>
          </EmptyHeader>
        </Empty>
      </TableCell>
    </TableRow>
  )

  return (
    <main className="p-4 md:p-6">
      <h1 className="hidden md:block mb-1 text-2xl font-bold tracking-tight">Tarif Produk</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Konfigurasi harga per kelas untuk les privat dan konten (materi + paket soal + forum).
      </p>

      <div className="flex max-w-2xl flex-col gap-4 md:gap-6">
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
                  autoComplete="off"/>
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

        {/* Harga Les Privat */}
        <Card>
          <CardHeader>
            <CardTitle>Harga Les Privat</CardTitle>
            <CardDescription>Biaya per pertemuan, dipakai saat murid booking les.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-(--card-spacing)">Kelas</TableHead>
                  <TableHead className="w-20">Les</TableHead>
                  <TableHead>Private (Rp)</TableHead>
                  <TableHead className="pr-(--card-spacing)">Kelompok (Rp)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="pl-(--card-spacing)"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                      <TableCell className="pr-(--card-spacing)"><Skeleton className="h-8 w-28" /></TableCell>
                    </TableRow>
                  ))
                ) : classes.length === 0 ? (
                  emptyState(4)
                ) : (
                  classes.map((cls) => {
                    const allowed = allowTutoring[cls.id!] ?? (cls.allow_tutoring !== false)
                    const row = tutoringPrices[cls.id!]
                    const pv = row?.private ?? ""
                    const gv = row?.group ?? ""
                    const pvValid = priceNum(pv) !== null
                    const gvValid = priceNum(gv) !== null
                    return (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium pl-(--card-spacing)">{cls.name}</TableCell>
                        <TableCell>
                          <Switch
                            checked={allowTutoring[cls.id!] ?? allowed}
                            onCheckedChange={(checked) =>
                              setAllowTutoring((prev) => ({ ...prev, [cls.id!]: checked }))
                            }
                          />
                        </TableCell>
                        {allowed ? (
                          <>
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
                                    setTutoringPrices((prev) => ({
                                      ...prev,
                                      [cls.id!]: { private: e.target.value, group: prev[cls.id!]?.group ?? "" },
                                    }))
                                  }
                                autoComplete="off"/>
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
                                    setTutoringPrices((prev) => ({
                                      ...prev,
                                      [cls.id!]: { private: prev[cls.id!]?.private ?? "", group: e.target.value },
                                    }))
                                  }
                                autoComplete="off"/>
                                {gvValid && Number(gv) > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    Fee guru: {fmtRp(teacherFee(gv))}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell colSpan={2} className="pr-(--card-spacing) text-sm text-muted-foreground">
                              Tanpa les
                            </TableCell>
                          </>
                        )}
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
                onClick={handleSaveTutoring}
                disabled={saveTutoring.isPending || (dirtyTutoringClasses.length === 0 && dirtyAllowTutoringClasses.length === 0) || hasInvalidTutoringPrice}
              >
                {saveTutoring.isPending && <Spinner />}
                Simpan{dirtyTutoringClasses.length + dirtyAllowTutoringClasses.length > 0 ? ` (${dirtyTutoringClasses.length + dirtyAllowTutoringClasses.length})` : ""}
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Harga Konten */}
        <Card>
          <CardHeader>
            <CardTitle>Harga Konten</CardTitle>
            <CardDescription>
              Langganan materi + paket soal + forum per kelas (tanpa les privat).
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-(--card-spacing)">Kelas</TableHead>
                  <TableHead className="pr-(--card-spacing)">Konten (Rp)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="pl-(--card-spacing)"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="pr-(--card-spacing)"><Skeleton className="h-8 w-28" /></TableCell>
                    </TableRow>
                  ))
                ) : classes.length === 0 ? (
                  emptyState(2)
                ) : (
                  classes.map((cls) => {
                    const v = contentPrices[cls.id!] ?? ""
                    const valid = priceNum(v) !== null
                    return (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium pl-(--card-spacing)">{cls.name}</TableCell>
                        <TableCell className="pr-(--card-spacing)">
                          <Input
                            type="number"
                            min="0"
                            className="h-8 w-32"
                            value={v}
                            aria-label={`Harga konten ${cls.name}`}
                            aria-invalid={!valid}
                            onChange={(e) =>
                              setContentPrices((prev) => ({ ...prev, [cls.id!]: e.target.value }))
                            }
                          autoComplete="off"/>
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
                onClick={handleSaveContent}
                disabled={saveContent.isPending || dirtyContentClasses.length === 0 || hasInvalidContentPrice}
              >
                {saveContent.isPending && <Spinner />}
                Simpan{dirtyContentClasses.length > 0 ? ` (${dirtyContentClasses.length})` : ""}
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
