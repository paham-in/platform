package models

import "gorm.io/gorm"

type QuestionbankQuestion struct {
	gorm.Model
	UserID      uint                `gorm:"not null;index" json:"user_id"`
	User        User                `gorm:"foreignKey:UserID" json:"-"`
	ChapterID   uint                `gorm:"not null;index" json:"chapter_id"`
	Chapter     Chapter             `gorm:"foreignKey:ChapterID" json:"-"`
	Question    string              `gorm:"type:text;not null" json:"question"`
	Explanation string              `gorm:"type:text" json:"explanation"`
	Answers     []QuestionbankAnswer `gorm:"foreignKey:QuestionID" json:"answers"`
}

// TableName menimpa nama tabel GORM default (question_banks)
// menjadi questionbank_questions.
func (QuestionbankQuestion) TableName() string { return "questionbank_questions" }
