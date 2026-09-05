import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  deleteAdminStudentClassEnrollmentsByIdMutation,
  getAdminInvoicesOptions,
  getAdminStudentClassEnrollmentsOptions,
  getAdminStudentClassEnrollmentsQueryKey,
  getAdminUsersOptions,
} from "@/lib/api/@tanstack/react-query.gen"
import type { StudentclassStudentClassEnrollmentResponse, UserAdminListUsersResponse } from "@/lib/api/types.gen"
import { Plus, KeyRound, MoreVertical, Trash2, Gift, ArrowRight } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useState, useEffect } from "react"
import { format, parseISO, differenceInCalendarDays } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { GrantClassDialog } from "@/components/admin/student-class-enrollments"
import { AddSubscriptionDialog } from "@/components/admin/subscriptions"
import { usePageTitle } from "@/components/page-title"
import { useDialogBack } from "@/lib/hooks/use-dialog-back"

const subscriptionDetailSearchSchema = z.object({
  modal: z.string().optional(),
})

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function fmtDate(s?: string): string {
  if (!s) return "—"
  try {
    return format(parseISO(s), "dd MMM yyyy", { locale: localeId })
  } catch {
    return s
  }
}

function RevokeDialog({ access, onClose }: {
  access: StudentclassStudentClassEnrollmentResponse
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { mutate: revoke, isPending } = useMutation({
    ...deleteAdminStudentClassEnrollmentsByIdMutation(),
    onSuccess: () => {
      toast.success("Akses berhasil dicabut")
      qc.invalidateQueries({ queryKey: getAdminStudentClassEnrollmentsQueryKey() })
      onClose()
    },
    onError: (err: any) => toast.error(err.error || "Gagal mencabut akses"),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cabut Hak Akses</AlertDialogTitle>
          <AlertDialogDescription>
            Hapus akses <strong>{access.class?.name}</strong> untuk{" "}
            <strong>{access.user?.name}</strong>? Murid tidak lagi bisa mengakses konten kelas ini.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => revoke({ path: { id: access.id! } })} disabled={isPending}>
            {isPending && <Spinner />}
            Cabut
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function AdminSubscriptionDetail() {
  const { userId } = Route.useParams()
  const { modal } = Route.useSearch()
  const { openModal, closeModal } = useDialogBack()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data: items = [], isLoading } = useQuery(getAdminStudentClassEnrollmentsOptions({}))
  const { data: users = [] } = useQuery(getAdminUsersOptions())
  const { data: invoices = [] } = useQuery(getAdminInvoicesOptions({
    query: { user_id: Number(userId), status: "pending" },
  }))
  const [revokeTarget, setRevokeTarget] = useState<StudentclassStudentClassEnrollmentResponse | null>(null)
  const [subscribeUser, setSubscribeUser] = useState<UserAdminListUsersResponse | null>(null)

  useEffect(() => {
    if (modal !== "revoke") setRevokeTarget(null)
    if (modal !== "subscribe") setSubscribeUser(null)
  }, [modal])

  const uid = Number(userId)
  const user = users.find((u) => u.id === uid)
  const mine = items.filter((sp) => (sp.user_id ?? sp.user?.id) === uid)
  const studentName = user?.name ?? mine[0]?.user?.name ?? "—"
  usePageTitle(studentName)

  const today = todayStr()
  const active = mine.filter((sp) => sp.expiry && sp.expiry >= today).sort((a, b) => (a.expiry ?? "") < (b.expiry ?? "") ? -1 : 1)
  const expired = mine.filter((sp) => !sp.expiry || sp.expiry < today).sort((a, b) => (b.expiry ?? "") < (a.expiry ?? "") ? -1 : 1)

  const openSubscribe = () => {
    if (!user) return
    setSubscribeUser(user)
    openModal("subscribe")
  }

  const daysLeft = (expiry?: string) => {
    if (!expiry) return null
    try {
      return differenceInCalendarDays(parseISO(expiry), new Date())
    } catch {
      return null
    }
  }

  const renderRows = (list: StudentclassStudentClassEnrollmentResponse[], showRemaining: boolean) => list.map((sp) => {
    const left = showRemaining ? daysLeft(sp.expiry) : null
    return (
      <TableRow key={sp.id}>
        <TableCell className="pl-6 font-medium">{sp.class?.name ?? "—"}</TableCell>
        <TableCell className="text-muted-foreground">{sp.class?.program_name ?? "—"}</TableCell>
        <TableCell className="tabular-nums">
          {fmtDate(sp.expiry)}
          {left != null && (
            <span className={`mt-0.5 block text-xs ${left <= 7 ? "font-medium text-amber-600" : "text-muted-foreground"}`}>
              {left < 0 ? "Kedaluarsa" : left === 0 ? "Berakhir hari ini" : `${left} hari lagi`}
            </span>
          )}
        </TableCell>
        <TableCell className="pr-6 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="text-destructive" onClick={() => { setRevokeTarget(sp); openModal("revoke") }}>
                <Trash2 className="h-4 w-4" /> Cabut Akses
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )
  })

  const renderCards = (list: StudentclassStudentClassEnrollmentResponse[], showRemaining: boolean) => (
    <div className="divide-y">
      {list.map((sp) => {
        const left = showRemaining ? daysLeft(sp.expiry) : null
        return (
          <div key={sp.id} className="flex items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate font-medium">{sp.class?.name ?? "—"}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{sp.class?.program_name ?? "—"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                s.d. {fmtDate(sp.expiry)}
                {left != null && (
                  <span className={left <= 7 ? "font-medium text-amber-600" : ""}>
                    {" · "}{left < 0 ? "kedaluarsa" : left === 0 ? "berakhir hari ini" : `${left} hari lagi`}
                  </span>
                )}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="shrink-0" />}>
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem className="text-destructive" onClick={() => { setRevokeTarget(sp); openModal("revoke") }}>
                  <Trash2 className="h-4 w-4" /> Cabut Akses
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      })}
    </div>
  )

  return (
    <main className="p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isLoading ? <Skeleton className="h-8 w-48" /> : studentName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email ?? ""}</p>
        </div>
        <div className="hidden gap-2 md:inline-flex">
          <Button variant="outline" onClick={() => openModal("grant")}>
            <Gift className="mr-1 h-4 w-4" /> Beri Akses Langsung
          </Button>
          <Button onClick={openSubscribe} disabled={!user}>
            <Plus className="mr-1 h-4 w-4" /> Tambah Langganan
          </Button>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        {invoices.length > 0 && (
          <Button
            variant="outline"
            className="flex w-full items-center justify-between gap-3 px-4 py-6"
            onClick={() => navigate({ to: "/admin/payments/$userId", params: { userId: String(uid) } })}
          >
            <span className="text-sm">
              <span className="font-medium text-amber-600">{invoices.length} tagihan menunggu</span>
              <span className="text-muted-foreground"> · Rp {invoices.reduce((sum, inv) => sum + (inv.amount ?? 0), 0).toLocaleString("id-ID")}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        )}
        <div>
          <h2 className="mb-2 text-lg font-semibold">Aktif</h2>
          <Card className="hidden gap-0 pt-0 pb-0 md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="pl-6">Kelas</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Kadaluarsa</TableHead>
                    <TableHead className="pr-6 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="p-4"><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                  ) : active.length === 0 ? (
                    <TableRow><TableCell colSpan={4}>
                      <Empty className="border-0 p-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><KeyRound /></EmptyMedia>
                          <EmptyTitle>Tidak ada langganan aktif</EmptyTitle>
                        </EmptyHeader>
                      </Empty>
                    </TableCell></TableRow>
                  ) : renderRows(active, true)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="gap-0 py-0 md:hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-4"><Skeleton className="h-16 w-full" /></div>
              ) : active.length === 0 ? (
                <Empty className="p-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><KeyRound /></EmptyMedia>
                    <EmptyTitle>Tidak ada langganan aktif</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              ) : renderCards(active, true)}
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">Riwayat</h2>
          <Card className="hidden gap-0 pt-0 pb-0 md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="pl-6">Kelas</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Kadaluarsa</TableHead>
                    <TableHead className="pr-6 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="p-4"><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                  ) : expired.length === 0 ? (
                    <TableRow><TableCell colSpan={4}>
                      <Empty className="border-0 p-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><KeyRound /></EmptyMedia>
                          <EmptyTitle>Belum ada riwayat</EmptyTitle>
                        </EmptyHeader>
                      </Empty>
                    </TableCell></TableRow>
                  ) : renderRows(expired, false)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="gap-0 py-0 md:hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-4"><Skeleton className="h-16 w-full" /></div>
              ) : expired.length === 0 ? (
                <Empty className="p-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><KeyRound /></EmptyMedia>
                    <EmptyTitle>Belum ada riwayat</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              ) : renderCards(expired, false)}
            </CardContent>
          </Card>
        </div>
      </div>

      <Button
        onClick={openSubscribe}
        disabled={!user}
        size="icon"
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:hidden"
        aria-label="Tambah Langganan"
      >
        <Plus className="size-6" />
      </Button>

      {modal === "grant" && <GrantClassDialog onClose={closeModal} />}
      {modal === "subscribe" && subscribeUser && <AddSubscriptionDialog user={subscribeUser} onClose={closeModal} />}
      {modal === "revoke" && revokeTarget && <RevokeDialog access={revokeTarget} onClose={closeModal} />}
    </main>
  )
}

export const Route = createFileRoute("/_dashboard/admin/subscriptions/$userId")({
  component: AdminSubscriptionDetail,
  validateSearch: subscriptionDetailSearchSchema,
})
