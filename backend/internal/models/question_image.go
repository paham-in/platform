package models

import "gorm.io/gorm"

type QuestionImage struct {
	gorm.Model
	QuestionID uint   `gorm:"not null;index" json:"question_id"`
	FileName   string `gorm:"size:255;not null" json:"file_name"`
	URL        string `gorm:"size:500;not null" json:"url"`
	Question   Question `gorm:"foreignKey:QuestionID" json:"-"`
}
