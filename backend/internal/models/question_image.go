package models

import "gorm.io/gorm"

type ForumQuestionImage struct {
	gorm.Model
	QuestionID uint          `gorm:"not null;index" json:"question_id"`
	FileName   string        `gorm:"size:255;not null" json:"file_name"`
	Question   ForumQuestion `gorm:"foreignKey:QuestionID" json:"-"`
}

// TableName menimpa nama tabel GORM default (question_images)
// menjadi forum_question_images.
func (ForumQuestionImage) TableName() string { return "forum_question_images" }
