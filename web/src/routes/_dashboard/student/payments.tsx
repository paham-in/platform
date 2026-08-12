import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getInvoicesOptions,
  getInvoicesByInvoiceIdProofQueryKey,
  postInvoicesByInvoiceIdProofMutation,
} from "@/lib/api/@tanstack/react-query.gen"
import { getInvoicesByInvoiceIdProof } from "@/lib/api/sdk.gen"
import type { InvoiceInvoiceResponse } from "@/lib/api/types.gen"
import { CreditCard, CheckCircle2, Clock, ReceiptText, Loader2, FileImage } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// ProofCell: tombol upload (pending) atau preview (approved/pending ada proof).
// Fetch proof via getInvoicesByInvoiceIdProofOptions — query kecil per invoice.
function ProofCell({
  invoice,
  uploadingInvoice,
  onUpload,
  onPreview,
}: {
  invoice: InvoiceInvoiceResponse
  uploadingInvoice: number | null
  onUpload: (invId: number, file: File) => Promise<void>
  onPreview: () => void
}) {
  const { data: proofs } = useQuery({
    queryKey: getInvoicesByInvoiceIdProofQueryKey({ path: { invoice_id: invoice.id! } }),
    queryFn: async () => {
      const { data } = await getInvoicesByInvoiceIdProof({ path: { invoice_id: invoice.id! } })
      return data
    },
  })
  const approvedProof = proofs?.find((p) => p.status === "approved")
  const uploading = uploadingInvoice === invoice.id

  // invoice sudah lunas → tidak perlu proof UI
  if (invoice.status === "paid") {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  return (
    <div className="flex items-center gap-2">
      {approvedProof?.url && (
        <Button variant="link" size="sm" onClick={onPreview} className="p-0">
          <FileImage className="h-4 w-4" />
        </Button>
      )}
      <label className={`cursor-pointer text-xs underline ${uploading ? "opacity-50" : ""}`}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          disabled={uploading}
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (file && !uploading) {
              await onUpload(invoice.id!, file)
              e.target.value = ""
            }
          }}
        />
        {uploading ? "Mengunggah..." : "Upload Bukti"}
      </label>
    </div>
  )
}

function StudentPayments() {
  const { data: invoices = [], isLoading } = useQuery(getInvoicesOptions())

  const qc = useQueryClient()
  const [uploadingInvoice, setUploadingInvoice] = useState<number | null>(null)
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceInvoiceResponse | null>(null)

  const uploadMutation = useMutation({
    ...postInvoicesByInvoiceIdProofMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["getInvoices"] })
      toast.success("Bukti pembayaran terunggah. Admin akan memverifikasi.")
    },
    onError: (err: any) => toast.error(err?.error || "Gagal unggah bukti"),
  })

  const handleUpload = async (invId: number, file: File) => {
    setUploadingInvoice(invId)
    try {
      await uploadMutation.mutateAsync({ body: { image: file }, path: { invoice_id: invId } })
    } finally {
      setUploadingInvoice(null)
    }
  }

  const total = invoices.reduce((sum, inv) => sum + (inv.amount ?? 0), 0)
  const totalPaid = invoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + (inv.amount ?? 0), 0)
  const totalPending = invoices.filter((inv) => inv.status === "pending").reduce((sum, inv) => sum + (inv.amount ?? 0), 0)

  const stats = [
    { icon: CreditCard, label: "Total Tagihan", value: total, color: "text-blue-600 bg-blue-100" },
    { icon: CheckCircle2, label: "Total Lunas", value: totalPaid, color: "text-green-600 bg-green-100" },
    { icon: Clock, label: "Tagihan Pending", value: totalPending, color: "text-orange-600 bg-orange-100" },
    { icon: ReceiptText, label: "Jumlah Invoice", value: invoices.length, color: "text-purple-600 bg-purple-100" },
  ]

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    )
  }

  return (
    <main className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Riwayat Pembayaran</h2>
          <p className="text-muted-foreground">Daftar tagihan dan status pembayaran kamu.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}><CardContent className="flex flex-col gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div>
                <div className="text-2xl font-bold">
                  {s.label === "Jumlah Invoice" ? s.value : `Rp ${s.value.toLocaleString("id-ID")}`}
                </div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            </CardContent></Card>
          ))}
        </div>

        <Card className="pt-0 gap-0 pb-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Periode</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bukti</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead className="pr-6">Tgl Buat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-8 text-center text-muted-foreground">
                      Belum ada invoice
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv: InvoiceInvoiceResponse) => (
                    <TableRow key={inv.id}>
                      <TableCell className="pl-6 font-medium">
                        {inv.start_date} — {inv.end_date}
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
                      <TableCell>
                        <ProofCell
                          invoice={inv}
                          uploadingInvoice={uploadingInvoice}
                          onUpload={handleUpload}
                          onPreview={() => setPreviewInvoice(inv)}
                        />
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {inv.note || "-"}
                      </TableCell>
                      <TableCell className="pr-6 text-muted-foreground">{inv.created_at}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <ProofPreviewDialog invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} />
    </main>
  )
}

// ProofPreviewDialog: fetch proof presigned URL untuk invoice yang dipilih,
// display gambar approved di dialog.
function ProofPreviewDialog({
  invoice,
  onClose,
}: {
  invoice: InvoiceInvoiceResponse | null
  onClose: () => void
}) {
  const invoiceId = invoice?.id ?? 0
  const { data: proofs } = useQuery({
    queryKey: getInvoicesByInvoiceIdProofQueryKey({ path: { invoice_id: invoiceId } }),
    queryFn: async () => {
      if (!invoice) return []
      const { data } = await getInvoicesByInvoiceIdProof({ path: { invoice_id: invoice.id! } })
      return data
    },
    enabled: !!invoice,
  })
  const approved = proofs?.find((p) => p.status === "approved" && p.url)

  return (
    <Dialog open={!!invoice} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="p-0">
        <DialogHeader className="p-4">
          <DialogTitle>Bukti Pembayaran</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {approved?.url ? (
            <img src={approved.url} alt="Bukti pembayaran" className="max-h-[70vh] w-full object-contain rounded" />
          ) : (
            <p className="text-sm text-muted-foreground">Bukti belum tersedia atau belum disetujui.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const Route = createFileRoute("/_dashboard/student/payments")({
  component: StudentPayments,
})
