package models

import "gorm.io/gorm"

// TutoringSession mewakili satu pertemuan dari booking les privat.
// Booking dengan SessionCount=N menghasilkan N sesi mingguan.
type TutoringSession struct {
	gorm.Model
	BookingID uint     `gorm:"not null;index" json:"booking_id"`
	Booking   *Booking `gorm:"foreignKey:BookingID" json:"booking,omitempty"`
	Date      string   `gorm:"size:10;not null" json:"date"`       // "YYYY-MM-DD"
	StartTime string   `gorm:"size:5;not null" json:"start_time"` // "HH:mm"
	EndTime   string   `gorm:"size:5;not null" json:"end_time"`   // "HH:mm"
	Status    string   `gorm:"size:20;default:scheduled" json:"status"` // scheduled/done/cancelled
}
