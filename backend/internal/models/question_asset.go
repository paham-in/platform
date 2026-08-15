package models

import "gorm.io/gorm"

type ForumQuestionAsset struct {
	gorm.Model
	QuestionID uint          `gorm:"not null;index" json:"question_id"`
	ObjectName string        `gorm:"size:255;not null" json:"object_name"`
	Question   ForumQuestion `gorm:"foreignKey:QuestionID" json:"-"`
}

// TableName menimpa nama tabel GORM default (question_assets)
// menjadi forum_question_assets.
func (ForumQuestionAsset) TableName() string { return "forum_question_assets" }