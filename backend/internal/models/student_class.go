package models

import "gorm.io/gorm"

// StudentClassEnrollment mewakili hak akses premium student ke 1 kelas selama masa berlaku.
// Dibuat manual admin, atau otomatis saat invoice lunas yang punya class_id.
type StudentClassEnrollment struct {
	gorm.Model
	UserID  uint   `gorm:"not null;index" json:"user_id"`
	ClassID uint   `gorm:"not null;index" json:"class_id"`
	Expiry  string `gorm:"size:10;not null" json:"expiry"` // "YYYY-MM-DD"
}

func (e *StudentClassEnrollment) BeforeCreate(tx *gorm.DB) error {
	return nil
}

func (StudentClassEnrollment) TableName() string { return "student_class_enrollments" }
