package models

import (
	"time"

	"gorm.io/gorm"
)

// PaymentProof adalah bukti transfer pembayaran yang diunggah student
// untuk sebuah invoice. Proof ini berlifecycle terpisah dari invoice —
// student bisa re-upload, dan cron job akan hard-delete proof yang sudah
// di-approve dan melewati retention period.
type PaymentProof struct {
	gorm.Model
	InvoiceID  uint           `gorm:"not null;index" json:"invoice_id"`
	// ObjectName di storage: private/payment_proofs/<uuid>.jpg
	// (private = butuh presigned URL utk akses)
	ObjectName string `gorm:"size:500;not null" json:"object_name"`
	// pending: student upload, belum diverifikasi
	// approved: admin verifikasi / invoice di-toggle paid
	// rejected: ada masalah, student harus re-upload
	Status     string `gorm:"size:20;default:pending;index" json:"status"`
	ApprovedAt *time.Time `json:"approved_at,omitempty"`
}
