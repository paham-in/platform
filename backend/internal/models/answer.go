package models

import "gorm.io/gorm"

type ForumAnswer struct {
	gorm.Model
	QuestionID   uint          `gorm:"not null;index" json:"question_id"`
	UserID       uint          `gorm:"not null;index" json:"user_id"`
	Content      string        `gorm:"type:text;not null" json:"content"`
	PlainContent string        `gorm:"type:text;not null" json:"plain_content"`
	VideoURL     string        `gorm:"size:500" json:"video_url"`
	User         User          `gorm:"foreignKey:UserID" json:"-"`
	Question     ForumQuestion `gorm:"foreignKey:QuestionID" json:"-"`
}

// TableName menimpa nama tabel GORM default (answers)
// menjadi forum_answers.
func (ForumAnswer) TableName() string { return "forum_answers" }
