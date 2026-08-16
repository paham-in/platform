package models

import "gorm.io/gorm"

type ForumAnswerAsset struct {
	gorm.Model
	AnswerID uint        `gorm:"not null;index" json:"answer_id"`
	ObjectName string    `gorm:"size:255;not null" json:"object_name"`
	Answer   ForumAnswer `gorm:"foreignKey:AnswerID" json:"-"`
}

// TableName menimpa nama tabel GORM default (answer_assets)
// menjadi forum_answer_assets.
func (ForumAnswerAsset) TableName() string { return "forum_answer_assets" }