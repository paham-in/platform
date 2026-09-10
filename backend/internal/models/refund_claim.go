package models

import "gorm.io/gorm"

// RefundClaim adalah satu baris utang platform → murid dari satu sesi batal
// pada invoice lunas. Pengganti kolom beku refund_amount/refund_done di
// invoices (bug K5: angka agregat ditimpa tanpa reset flag).
// Aturan: lahir sekali saat sesi dibatalkan (find-or-create per session_id),
// tak pernah ditimpa; lunas ditandai per klaim oleh admin.
type RefundClaim struct {
	gorm.Model
	PublicID  string           `gorm:"size:36;uniqueIndex;not null" json:"public_id"`
	InvoiceID uint             `gorm:"not null;index" json:"invoice_id"`
	Invoice   *Invoice         `gorm:"foreignKey:InvoiceID" json:"invoice,omitempty"`
	BookingID uint             `gorm:"not null;index" json:"booking_id"`
	Booking   *Booking         `gorm:"foreignKey:BookingID" json:"booking,omitempty"`
	SessionID *uint            `gorm:"index" json:"session_id"`
	Session   *TutoringSession `gorm:"foreignKey:SessionID" json:"session,omitempty"`
	Amount    float64          `gorm:"not null" json:"amount"` // snapshot harga saat klaim lahir
	Done      bool             `gorm:"default:false" json:"done"`
	Note      string           `gorm:"size:500" json:"note"`
}

func (c *RefundClaim) BeforeCreate(tx *gorm.DB) error {
	if c.PublicID == "" {
		c.PublicID = NewPublicID()
	}
	return nil
}
