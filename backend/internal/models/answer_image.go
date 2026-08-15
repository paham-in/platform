package models

import "gorm.io/gorm"

type ForumAnswerImage struct {
	gorm.Model
	AnswerID uint        `gorm:"not null;index" json:"answer_id"`
	FileName string      `gorm:"size:255;not null" json:"file_name"`
	Answer   ForumAnswer `gorm:"foreignKey:AnswerID" json:"-"`
}

// TableName menimpa nama tabel GORM default (answer_images)
// menjadi forum_answer_images.
func (ForumAnswerImage) TableName() string { return "forum_answer_images" }