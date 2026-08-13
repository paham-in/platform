package models

import "gorm.io/gorm"

// StudentQuestionProgress mencatat jawaban student per soal.
// CreatedAt = saat jawaban第一次 disubmit.
// DeletedAt soft-delete = reset progress (student mau ulang).
type StudentQuestionProgress struct {
	gorm.Model
	UserID     uint `gorm:"not null;index" json:"user_id"`
	PackageID  uint `gorm:"not null;index" json:"package_id"`
	QuestionID uint `gorm:"not null;index" json:"question_id"`
	IsCorrect  bool `gorm:"not null;default:false" json:"is_correct"`
}
