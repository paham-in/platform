package models

import "gorm.io/gorm"

type Invoice struct {
	gorm.Model
	UserID    uint    `gorm:"not null;index" json:"user_id"`
	User      *User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Amount    float64 `gorm:"not null" json:"amount"`
	StartDate string  `gorm:"size:10;not null" json:"start_date"`
	EndDate   string  `gorm:"size:10;not null" json:"end_date"`
	Status    string  `gorm:"size:20;default:pending" json:"status"`
	Note      string  `gorm:"size:500" json:"note"`
	ClassID   *uint   `gorm:"index" json:"class_id,omitempty"`
	BookingID *uint   `gorm:"index" json:"booking_id,omitempty"` // tautan invoice↔booking les privat
	// Bukti pembayaran yang di-upload student (bisa ada banyak, re-upload).
	Proofs []PaymentProof `gorm:"foreignKey:InvoiceID" json:"proofs,omitempty"`
}
