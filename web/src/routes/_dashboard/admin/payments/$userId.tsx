import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { useQuery } from "@tanstack/react-query"
import {
  getAdminUsersOptions,
  getAdminInvoicesOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import { Plus, MoreVertical, CheckCircle2, XCircle, Search, Trash2, Receipt, Funnel, X } from "lucide-react"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { CreateInvoiceDialog, DeleteInvoiceDialog, ToggleInvoiceDialog } from "@/components/admin/payments"
import { usePageTitle } from "@/components/page-title"
import type { InvoiceInvoiceResponse } from "@/lib/api/types.gen"

const paymentsDetailSearchSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", "paid", "pending"]).optional(),
})

function PaymentsDetail() {
  const { userId } = Route.useParams()
  const navigate = useNavigate({ from: Route.fullPath })
  const { search: searchParam, status: statusParam } = Route.useSearch()
  const [searchInput, setSearchInput] = useState(searchParam ?? "")

  useEffect(() => { setSearchInput(searchParam ?? "") }, [searchParam])

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({
        search: (prev) => ({ ...prev, search: searchInput || undefined }),
        replace: true,
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const statusFilter = statusParam ?? "all"

  const { data: users = [], isLoading: usersLoading } = useQuery(getAdminUsersOptions())
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery(getAdminInvoicesOptions({
    query: {
      user_id: Number(userId),
      status: statusFilter === "all" ? undefined : statusFilter,
      search: searchParam || undefined,
    },
  }))
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<InvoiceInvoiceResponse[] | null>(null)
  const [toggleTarget, setToggleTarget] = useState<{ invoices: InvoiceInvoiceResponse[]; status: "paid" | "pending" } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const statusOptions = [
    { label: "Semua", value: "all" },
    { label: "Lunas", value: "paid" },
    { label: "Pending", value: "pending" },
  ]

  const user = users.find((u) => u.id === Number(userId))
  usePageTitle(user?.name ?? "Pengguna")
  const isLoading = usersLoading || invoicesLoading

  const allSelected = invoices.length > 0 && selectedIds.size === invoices.length
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(invoices.map((inv) => inv.id!)))
  }
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!isLoading && !user) {
    return (
      <main className="p-4 md:p-6">
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-muted-foreground">User tidak ditemukan</p>
        </div>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-6">
      <div className="mb-4">
        <div>
          {isLoading || !user ? (
            <>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="mt-2 h-4 w-56" />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari periode atau catatan..." className="pl-9" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} autoComplete="off"/>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />} aria-label="Filter status">
            <Funnel className="h-4 w-4" />
            Filter
            {statusFilter !== "all" && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                1
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52">
            <DropdownMenuRadioGroup
              value={statusFilter}
              onValueChange={(v) => {
                if (v) {
                  navigate({ search: (prev) => ({ ...prev, status: v === "all" ? undefined : v as "paid" | "pending" }), replace: true })
                  setSelectedIds(new Set())
                }
              }}
            >
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              {statusOptions.map((opt) => (
                <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {selectedIds.size > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline">Aksi</Button>} />
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setToggleTarget({ invoices: invoices.filter((i) => selectedIds.has(i.id!)).filter((i) => i.status === "pending"), status: "paid" })}>
                <CheckCircle2 className="h-4 w-4" /> Lunas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setToggleTarget({ invoices: invoices.filter((i) => selectedIds.has(i.id!)).filter((i) => i.status === "paid"), status: "pending" })}>
                <XCircle className="h-4 w-4" /> Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeleteTarget(invoices.filter((i) => selectedIds.has(i.id!)))}>
                <Trash2 className="h-4 w-4 text-destructive" /> Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button className="ml-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Buat Invoice
        </Button>
      </div>

      <Card className="pt-0 gap-0 pb-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-10 pl-4">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="pl-0">Periode</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead>Tanggal Buat</TableHead>
                <TableHead className="pr-6 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="w-10 pl-4"><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell className="pl-0"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Empty className="border-0 p-8">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><Receipt /></EmptyMedia>
                        <EmptyTitle>Belum ada invoice</EmptyTitle>
                      </EmptyHeader>
                      {(searchParam || statusFilter !== "all") && (
                        <EmptyContent>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigate({ search: (prev) => ({ ...prev, search: undefined, status: undefined }), replace: true })
                              setSearchInput("")
                            }}
                          >
                            <X className="mr-1 h-4 w-4" /> Bersihkan filter
                          </Button>
                        </EmptyContent>
                      )}
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="w-10 pl-4">
                      <Checkbox checked={selectedIds.has(inv.id!)} onCheckedChange={() => toggleSelect(inv.id!)} />
                    </TableCell>
                    <TableCell className="pl-0 font-medium">
                      {inv.start_date && inv.end_date ? `${format(parseISO(inv.start_date), "dd MMM yyyy", { locale: id })} — ${format(parseISO(inv.end_date), "dd MMM yyyy", { locale: id })}` : "—"}
                    </TableCell>
                    <TableCell>Rp {inv.amount?.toLocaleString("id-ID")}</TableCell>
                    <TableCell>
                      {inv.status === "paid" ? (
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          Lunas
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                          Pending
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {inv.note || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{inv.created_at}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setToggleTarget({ invoices: [inv], status: inv.status === "paid" ? "pending" : "paid" })}>
                            {inv.status === "paid" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            {inv.status === "paid" ? "Pending" : "Lunas"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget([inv])}>
                            <Trash2 className="h-4 w-4 text-destructive" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {selectedIds.size > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">
                    {selectedIds.size} dipilih
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>

      {user && createOpen && (
        <CreateInvoiceDialog user={user} onClose={() => setCreateOpen(false)} />
      )}

      {deleteTarget && (
        <DeleteInvoiceDialog invoices={deleteTarget} onClose={() => { setDeleteTarget(null); setSelectedIds(new Set()) }} />
      )}

      {toggleTarget && (
        <ToggleInvoiceDialog
          invoices={toggleTarget.invoices}
          targetStatus={toggleTarget.status}
          onClose={() => {
            setSelectedIds(new Set())
            setToggleTarget(null)
          }}
        />
      )}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/payments/$userId")({
  component: PaymentsDetail,
  validateSearch: paymentsDetailSearchSchema,
})
