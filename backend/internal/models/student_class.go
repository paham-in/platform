package models

import "gorm.io/gorm"

// StudentClass mewakili hak akses premium student ke 1 kelas selama masa berlaku.
// Dibuat manual admin, atau otomatis saat invoice lunas yang punya class_id.
type StudentClass struct {
	gorm.Model
	UserID  uint   `gorm:"not null;index" json:"user_id"`
	ClassID uint   `gorm:"not null;index" json:"class_id"`
	Expiry  string `gorm:"size:10;not null" json:"expiry"` // "YYYY-MM-DD"
}
