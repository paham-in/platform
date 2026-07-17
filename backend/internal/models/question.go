package models

import "gorm.io/gorm"

type Question struct {
	gorm.Model
	UserID    uint   `gorm:"not null;index" json:"user_id"`
	SubjectID *uint  `gorm:"index" json:"subject_id"`
	Title     string `gorm:"size:200;not null" json:"title"`
	Content   string `gorm:"type:text;not null" json:"content"`
	Status    string `gorm:"size:20;default:open" json:"status"`
	Upvotes   int    `gorm:"default:0" json:"upvotes"`
	User      User   `gorm:"foreignKey:UserID" json:"-"`
	Subject   Subject `gorm:"foreignKey:SubjectID" json:"-"`
}
