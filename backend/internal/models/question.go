package models

import "gorm.io/gorm"

type ForumQuestion struct {
	gorm.Model
	UserID       uint          `gorm:"not null;index" json:"user_id"`
	SubjectID    *uint         `gorm:"index" json:"subject_id"`
	Content      string        `gorm:"type:text;not null" json:"content"`
	PlainContent string        `gorm:"type:text;not null" json:"plain_content"`
	Status       string        `gorm:"size:20;default:open" json:"status"`
	User         User          `gorm:"foreignKey:UserID" json:"-"`
	Subject      Subject       `gorm:"foreignKey:SubjectID" json:"-"`
	Answers      []ForumAnswer `gorm:"foreignKey:QuestionID" json:"-"`
}

// TableName menimpa nama tabel GORM default (questions)
// menjadi forum_questions.
func (ForumQuestion) TableName() string { return "forum_questions" }
