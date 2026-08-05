package models

import "gorm.io/gorm"

type QuestionBank struct {
	gorm.Model
	UserID       uint     `gorm:"not null;index" json:"user_id"`
	User         User     `gorm:"foreignKey:UserID" json:"-"`
	ChapterID    uint     `gorm:"not null;index" json:"chapter_id"`
	Chapter      Chapter  `gorm:"foreignKey:ChapterID" json:"-"`
	Question     string   `gorm:"type:text;not null" json:"question"`
	Options      []string `gorm:"serializer:json" json:"options"`
	CorrectIndex int      `gorm:"not null" json:"correct_index"`
	Explanation  string   `gorm:"type:text" json:"explanation"`
}
