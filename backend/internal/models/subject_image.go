package models

import "gorm.io/gorm"

type SubjectImage struct {
	gorm.Model
	SubjectID    uint    `gorm:"not null;index" json:"subject_id"`
	FileName     string  `gorm:"size:255;not null" json:"file_name"`
	OriginalName string  `gorm:"size:255" json:"original_name"`
	Subject      Subject `gorm:"foreignKey:SubjectID" json:"-"`
}
