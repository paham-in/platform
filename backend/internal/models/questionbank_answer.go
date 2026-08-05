package models

import "gorm.io/gorm"

type QuestionbankAnswer struct {
	gorm.Model
	QuestionID uint   `gorm:"not null;index" json:"question_id"`
	Content    string `gorm:"type:text;not null" json:"content"`
	IsCorrect  bool   `gorm:"not null;default:false" json:"is_correct"`
	SortOrder  int    `gorm:"not null;default:0" json:"sort_order"`
}

// TableName menimpa nama tabel GORM default (questionbank_answers)
// menjadi questionbank_answers.
func (QuestionbankAnswer) TableName() string { return "questionbank_answers" }
