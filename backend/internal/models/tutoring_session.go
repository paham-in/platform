package models

import "gorm.io/gorm"

// TutoringSession mewakili satu pertemuan dari booking les privat.
// Booking dengan SessionCount=N menghasilkan N sesi mingguan.
type TutoringSession struct {
	gorm.Model
	PublicID    string   `gorm:"size:36;uniqueIndex;not null" json:"public_id"`
	BookingID  uint     `gorm:"not null;index" json:"booking_id"`
	Booking    *Booking `gorm:"foreignKey:BookingID" json:"booking,omitempty"`
	Date       string   `gorm:"size:10;not null" json:"date"`                    // "YYYY-MM-DD"
	StartTime  string   `gorm:"size:5;not null" json:"start_time"`               // "HH:mm"
	EndTime    string   `gorm:"size:5;not null" json:"end_time"`                 // "HH:mm"
	Status     string   `gorm:"size:20;default:scheduled" json:"status"`         // scheduled/review/done/cancelled
	EvidenceURL string  `gorm:"size:500" json:"evidence_url"`                    // foto bukti kehadiran
	ActualEndTime string `gorm:"size:5" json:"actual_end_time"`                  // jam selesai aktual laporan guru ("HH:mm")
	OvertimeMinutes int  `gorm:"default:0" json:"overtime_minutes"`              // kelebihan menit vs jadwal
	ExtraSessions int    `gorm:"default:0" json:"extra_sessions"`                // blok 90-menit tambahan utk fee & tagihan
	FeePaid    bool     `gorm:"default:false" json:"fee_paid"`                   // fee guru sudah dibayar?
	FeeTaken   bool     `gorm:"default:false" json:"fee_taken"`                  // fee sudah diambil guru?
}

func (t *TutoringSession) BeforeCreate(tx *gorm.DB) error {
	if t.PublicID == "" {
		t.PublicID = NewPublicID()
	}
	return nil
}
