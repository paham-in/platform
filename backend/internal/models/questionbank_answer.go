package models

import "gorm.io/gorm"

type QuizAnswer struct {
	gorm.Model
	PublicID   string `gorm:"size:36;uniqueIndex;not null" json:"public_id"`
	QuestionID uint   `gorm:"not null;index" json:"question_id"`
	Content    string `gorm:"type:text;not null" json:"content"`
	IsCorrect  bool   `gorm:"not null;default:false" json:"is_correct"`
	SortOrder  int    `gorm:"not null;default:0" json:"sort_order"`
}

func (a *QuizAnswer) BeforeCreate(tx *gorm.DB) error {
	if a.PublicID == "" {
		a.PublicID = NewPublicID()
	}
	return nil
}

// TableName override supaya GORM pake quiz_answers.
func (QuizAnswer) TableName() string { return "quiz_answers" }
