package models

import "gorm.io/gorm"

// StudentProgram mewakili hak akses premium student ke 1 program selama masa berlaku.
// Dibuat manual admin, atau otomatis saat invoice lunas yang punya program_id.
type StudentProgram struct {
	gorm.Model
	UserID    uint   `gorm:"not null;index" json:"user_id"`
	ProgramID uint   `gorm:"not null;index" json:"program_id"`
	Expiry    string `gorm:"size:10;not null" json:"expiry"` // "YYYY-MM-DD"
}
