package models

import "gorm.io/gorm"

// QuizStudentProgress mencatat jawaban student per soal.
// CreatedAt = saat jawaban pertama kali disubmit.
// DeletedAt soft-delete = reset progress (student mau ulang).
type QuizStudentProgress struct {
	gorm.Model
	UserID           uint `gorm:"not null;index" json:"user_id"`
	PackageID        uint `gorm:"not null;index" json:"package_id"`
	QuestionID       uint `gorm:"not null;index" json:"question_id"`
	IsCorrect        bool `gorm:"not null;default:false" json:"is_correct"`
	SelectedAnswerID uint `gorm:"not null;default:0" json:"selected_answer_id"`
}

// TableName override supaya GORM pake quiz_student_progresses.
func (QuizStudentProgress) TableName() string { return "quiz_student_progresses" }
