package models

import "gorm.io/gorm"

type ForumAnswer struct {
	gorm.Model
	PublicID     string        `gorm:"size:36;uniqueIndex;not null" json:"public_id"`
	QuestionID   uint          `gorm:"not null;index" json:"question_id"`
	UserID       uint          `gorm:"not null;index" json:"user_id"`
	Content      string        `gorm:"type:text;not null" json:"content"`
	PlainContent string        `gorm:"type:text;not null" json:"plain_content"`
	VideoURL     string        `gorm:"size:500" json:"video_url"`
	User         User          `gorm:"foreignKey:UserID" json:"-"`
	Question     ForumQuestion `gorm:"foreignKey:QuestionID" json:"-"`
}

func (a *ForumAnswer) BeforeCreate(tx *gorm.DB) error {
	if a.PublicID == "" {
		a.PublicID = NewPublicID()
	}
	return nil
}

// TableName menimpa nama tabel GORM default (answers)
// menjadi forum_answers.
func (ForumAnswer) TableName() string { return "forum_answers" }
