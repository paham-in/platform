package models

import "gorm.io/gorm"

type QuestionPackage struct {
	gorm.Model
	Name        string                 `gorm:"size:200;not null" json:"name"`
	Description string                 `gorm:"size:500" json:"description"`
	SubjectID   uint                   `gorm:"not null;default:0;index" json:"subject_id"`
	IsFree      bool                   `gorm:"default:true;not null" json:"is_free"`
	Questions   []QuestionbankQuestion `gorm:"foreignKey:PackageID" json:"questions"`
	Subject     Subject                `gorm:"foreignKey:SubjectID" json:"-"`
}
