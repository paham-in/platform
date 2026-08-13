package models

import "gorm.io/gorm"

type QuizAnswer struct {
	gorm.Model
	QuestionID uint   `gorm:"not null;index" json:"question_id"`
	Content    string `gorm:"type:text;not null" json:"content"`
	IsCorrect  bool   `gorm:"not null;default:false" json:"is_correct"`
	SortOrder  int    `gorm:"not null;default:0" json:"sort_order"`
}

// TableName override supaya GORM pake quiz_answers.
func (QuizAnswer) TableName() string { return "quiz_answers" }
