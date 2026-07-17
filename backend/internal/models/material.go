package models

import "gorm.io/gorm"

type Material struct {
	gorm.Model
	ChapterID   uint    `gorm:"not null;index" json:"chapter_id"`
	AuthorID    uint    `gorm:"not null;index" json:"author_id"`
	Title       string  `gorm:"size:200;not null" json:"title"`
	Slug        string  `gorm:"size:200;uniqueIndex;not null" json:"slug"`
	Description string  `gorm:"size:500" json:"description"`
	Content     string  `gorm:"type:text" json:"content"`
	Status      string  `gorm:"size:20;default:draft" json:"status"`
	Order       int     `gorm:"default:0" json:"order"`
	Chapter     Chapter `gorm:"foreignKey:ChapterID" json:"-"`
}
