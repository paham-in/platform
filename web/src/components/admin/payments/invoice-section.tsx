import { useEffect, useState } from "react"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { MoreVertical, CheckCircle2, XCircle, Trash2, Receipt } from "lucide-react"
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
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { DeleteInvoiceDialog } from "./delete-invoice-dialog"
import { ToggleInvoiceDialog } from "./toggle-invoice-dialog"
import type { InvoiceInvoiceResponse } from "@/lib/api/types.gen"

// Hapus: hanya invoice langganan manual (tanpa booking) yang masih pending.
function canDelete(inv: InvoiceInvoiceResponse) {
  return !inv.booking_id && inv.status === "pending"
}

function invoiceBadge(status?: string) {
  if (status === "paid") {
    return <Badge variant="secondary" className="bg-green-100 text-green-700">Lunas</Badge>
  }
  if (status === "batal") {
    return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Batal</Badge>
  }
  return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Pending</Badge>
}

function periodLabel(inv: InvoiceInvoiceResponse) {
  if (!inv.start_date || !inv.end_date) return "—"
  const f = (d: string) => format(parseISO(d), "EEEE, d MMMM yyyy", { locale: id })
  return `${f(inv.start_date)} - ${f(inv.end_date)}`
}

const fmtRp = (n?: number) => `Rp ${(n ?? 0).toLocaleString("id-ID")}`

function rowMenuItems(
  inv: InvoiceInvoiceResponse,
  onToggle: () => void,
  onDelete: () => void,
) {
  return (
    <>
      {(inv.status === "paid" || inv.status === "pending") ? (
        <DropdownMenuItem onClick={onToggle}>
          {inv.status === "paid" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {inv.status === "paid" ? "Pending" : "Lunas"}
        </DropdownMenuItem>
      ) : null}
      {canDelete(inv) ? (
        <DropdownMenuItem onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" /> Hapus
        </DropdownMenuItem>
      ) : null}
    </>
  )
}

interface InvoiceSectionProps {
  title: string
  invoices: InvoiceInvoiceResponse[]
  isLoading?: boolean
  modal?: string
  openModal: (name: string) => void
  closeModal: () => void
}

export function InvoiceSection({ title, invoices, isLoading, modal, openModal, closeModal }: InvoiceSectionProps) {
  const [toggleTarget, setToggleTarget] = useState<{ invoices: InvoiceInvoiceResponse[]; status: "paid" | "pending" } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InvoiceInvoiceResponse[] | null>(null)

  useEffect(() => {
    if (modal !== "toggle-invoice") setToggleTarget(null)
    if (modal !== "delete-invoice") setDeleteTarget(null)
  }, [modal])

  const pick = (inv: InvoiceInvoiceResponse, name: "toggle-invoice" | "delete-invoice") => {
    if (name === "toggle-invoice") setToggleTarget({ invoices: [inv], status: inv.status === "paid" ? "pending" : "paid" })
    if (name === "delete-invoice") setDeleteTarget([inv])
    openModal(name)
  }

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>

      {/* Desktop table */}
      <Card className="hidden gap-0 pt-0 pb-0 md:block">
        <CardContent className="p-0">
          <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Periode</TableHead>
                  <TableHead>Tagihan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead className="pr-6 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="pl-6"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="pr-6 text-right"><Skeleton className="ml-auto h-8 w-8 rounded" /></TableCell>
                    </TableRow>
                  ))
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                    <Empty className="border-0 p-8">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><Receipt /></EmptyMedia>
                        <EmptyTitle>Belum ada tagihan</EmptyTitle>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="pl-6 font-medium">{periodLabel(inv)}</TableCell>
                    <TableCell className="font-semibold tabular-nums">{fmtRp(inv.amount)}</TableCell>
                    <TableCell>{invoiceBadge(inv.status)}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">{inv.note || "-"}</TableCell>
                    <TableCell className="pr-6 text-right">
                      {inv.status === "paid" || inv.status === "pending" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {rowMenuItems(inv, () => pick(inv, "toggle-invoice"), () => pick(inv, "delete-invoice"))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile card list */}
      <Card className="gap-0 py-0 md:hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="space-y-2 p-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <Empty className="p-8">
              <EmptyHeader>
                <EmptyMedia variant="icon"><Receipt /></EmptyMedia>
                <EmptyTitle>Belum ada tagihan</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="divide-y">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{periodLabel(inv)}</p>
                    <div className="mt-1">{invoiceBadge(inv.status)}</div>
                      <div className="mt-2 space-y-1 text-sm tabular-nums">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">Tagihan</span>
                          <span className="font-semibold">{fmtRp(inv.amount)}</span>
                        </div>
                      </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{inv.note || "—"}</p>
                  </div>
                  {inv.status === "paid" || inv.status === "pending" ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="shrink-0" />}>
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {rowMenuItems(inv, () => pick(inv, "toggle-invoice"), () => pick(inv, "delete-invoice"))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {modal === "toggle-invoice" && toggleTarget && (
        <ToggleInvoiceDialog invoices={toggleTarget.invoices} targetStatus={toggleTarget.status} onClose={closeModal} />
      )}
      {modal === "delete-invoice" && deleteTarget && (
        <DeleteInvoiceDialog invoices={deleteTarget} onClose={closeModal} />
      )}
    </div>
  )
}
