package models

import "gorm.io/gorm"

type Answer struct {
	gorm.Model
	QuestionID   uint     `gorm:"not null;index" json:"question_id"`
	UserID       uint     `gorm:"not null;index" json:"user_id"`
	Content      string   `gorm:"type:text;not null" json:"content"`
	PlainContent string   `gorm:"type:text;not null" json:"plain_content"`
	VideoURL     string   `gorm:"size:500" json:"video_url"`
	User         User     `gorm:"foreignKey:UserID" json:"-"`
	Question     Question `gorm:"foreignKey:QuestionID" json:"-"`
}
