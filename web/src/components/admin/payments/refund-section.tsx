import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { CheckCircle2, MoreVertical, XCircle } from "lucide-react"
import {
  getAdminInvoicesQueryKey,
  getAdminTutoringReportQueryKey,
} from "@/lib/api/@tanstack/react-query.gen"
import {
  refundClaimsByBookingOptions,
  refundClaimsByBookingQueryKey,
  setClaimDoneMutation,
  type RefundClaim,
} from "@/lib/refund-claims"

interface RefundSectionProps {
  bookingId: number;
  modal?: string;
  openModal: (name: string) => void;
  closeModal: () => void;
}

const fmtRp = (n?: number) => `Rp ${(n ?? 0).toLocaleString("id-ID")}`

function ClaimStatusBadge({ done }: { done?: boolean }) {
  if (done) {
    return <Badge variant="outline" className="border-transparent bg-green-100 text-green-700">Sudah transfer</Badge>
  }
  return <Badge variant="outline" className="border-transparent bg-yellow-100 text-yellow-700">Belum transfer</Badge>
}

function ClaimRowCells({ c }: { c: RefundClaim }) {
  return (
    <>
      <TableCell className="whitespace-nowrap tabular-nums">
        {c.date ? `${c.date} ${c.start_time ?? ""}–${c.end_time ?? ""}` : (c.note || "—")}
      </TableCell>
      <TableCell className="font-medium tabular-nums text-amber-600">{fmtRp(c.amount)}</TableCell>
      <TableCell><ClaimStatusBadge done={c.done} /></TableCell>
    </>
  )
}

export function RefundSection({ bookingId, modal, openModal, closeModal }: RefundSectionProps) {
  const qc = useQueryClient()
  const { data: claims = [], isLoading } = useQuery(refundClaimsByBookingOptions(bookingId))
  const [confirm, setConfirm] = useState<RefundClaim | null>(null)

  useEffect(() => {
    if (modal !== "refund-claim") setConfirm(null)
  }, [modal])

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: refundClaimsByBookingQueryKey(bookingId) })
    qc.invalidateQueries({ queryKey: getAdminInvoicesQueryKey() })
    qc.invalidateQueries({ queryKey: getAdminTutoringReportQueryKey() })
  }

  const { mutate: setDone, isPending } = useMutation({
    ...setClaimDoneMutation(),
    onSuccess: (_, v) => {
      toast.success(v.done ? "Klaim ditandai sudah ditransfer" : "Tanda klaim dibatalkan")
      invalidate()
      closeModal()
    },
    onError: (err: any) => toast.error(err?.error || err?.message || "Gagal menyimpan status klaim"),
  })

  if (!isLoading && claims.length === 0) return null

  return (
    <div className="mb-6">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Refund</h2>
      </div>

      <Card className="hidden gap-0 pt-0 pb-0 md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6">Sesi Batal</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                    <TableCell className="pr-6 text-right"><Skeleton className="ml-auto h-8 w-20 rounded" /></TableCell>
                  </TableRow>
                ))
              ) : (
                claims.map((c) => (
                  <TableRow key={c.id}>
                    <ClaimRowCells c={c} />
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Aksi klaim refund" />}>
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => { setConfirm(c); openModal("refund-claim") }}>
                              {c.done ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                              {c.done ? "Batalkan Tanda" : "Tandai Sudah Ditransfer"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0 md:hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="space-y-2 p-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {claims.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium tabular-nums">
                      {c.date ? `${c.date} ${c.start_time ?? ""}–${c.end_time ?? ""}` : (c.note || "—")}
                    </p>
                    <p className="mt-0.5 text-sm font-medium tabular-nums text-amber-600">{fmtRp(c.amount)}</p>
                    <div className="mt-1"><ClaimStatusBadge done={c.done} /></div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Aksi klaim refund" className="shrink-0" />}>
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => { setConfirm(c); openModal("refund-claim") }}>
                        {c.done ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        {c.done ? "Batalkan Tanda" : "Tandai Sudah Ditransfer"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {modal === "refund-claim" && confirm && (
        <AlertDialog open onOpenChange={(open) => !open && closeModal()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirm.done ? "Batalkan tanda klaim?" : "Tandai sudah ditransfer?"}</AlertDialogTitle>
              <AlertDialogDescription>
                Refund {fmtRp(confirm.amount)} untuk sesi {confirm.date ?? ""} {confirm.start_time ?? ""}–{confirm.end_time ?? ""}
                {confirm.done ? " ditandai belum ditransfer." : ". Pastikan uang sudah ditransfer manual ke murid."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                disabled={isPending}
                onClick={() => confirm.id && setDone({ claimId: confirm.id, done: !confirm.done })}
              >
                {isPending && <Spinner />}
                {confirm.done ? "Batalkan Tanda" : "Sudah Ditransfer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
